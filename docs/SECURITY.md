# 🔒 Segurança — Mãe Consciente

**Última atualização:** Abril 2026

---

## Índice

- [Princípios](#princípios)
- [Autenticação](#autenticação)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Rate Limiting](#rate-limiting)
- [CORS](#cors)
- [Edge Functions](#edge-functions)
- [Auditoria](#auditoria)
- [LGPD](#lgpd)
- [Checklist de Segurança](#checklist-de-segurança)

---

## Princípios

1. **Defense in Depth**: Múltiplas camadas (auth → RLS → validação → rate limit)
2. **Least Privilege**: Cada role vê apenas seus dados
3. **Zero Trust Client**: Nunca confie em dados do frontend
4. **Audit Everything**: Ações sensíveis são logadas

---

## Autenticação

### Configuração

| Setting | Valor | Motivo |
|---------|-------|--------|
| Email confirmation | ✅ Obrigatório | Evita contas falsas |
| Leaked password protection | ✅ Ativo | Bloqueia senhas comprometidas |
| Auto-confirm | ❌ Desabilitado | Usuário deve verificar email |
| Anonymous signups | ❌ Proibido | Sem contas anônimas |
| Google OAuth | ✅ Disponível | Login social |

### Roles

Roles são armazenados em tabela separada (`user_roles`), NUNCA no perfil:

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
```

Verificação via `SECURITY DEFINER`:

```sql
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
) $$;
```

⚠️ **NUNCA** verificar admin via localStorage ou dados do cliente.

---

## Row Level Security (RLS)

### Padrão para tabelas de dados do usuário

```sql
-- SELECT: só os próprios dados
CREATE POLICY "Users can view own data" ON public.tabela
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT: só com o próprio ID
CREATE POLICY "Users can insert own data" ON public.tabela
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: só os próprios dados
CREATE POLICY "Users can update own data" ON public.tabela
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- DELETE: só os próprios dados
CREATE POLICY "Users can delete own data" ON public.tabela
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### Tabelas públicas (sem RLS de leitura)

- `vaccination_calendar` — Calendário oficial (referência)
- `development_milestone_types` — Marcos de desenvolvimento
- `baby_sleep_milestones` — Parâmetros de sono
- `blog_posts` (status = 'published') — Blog público
- `badges` — Catálogo de badges
- `challenges` — Desafios disponíveis
- `products` — Produtos/planos

### Tabelas admin-only

- `admin_audit_log` — `has_role(auth.uid(), 'admin')`
- `security_audit_logs` — `has_role(auth.uid(), 'admin')`
- `blog_settings` — `has_role(auth.uid(), 'admin')`
- `site_settings` — Leitura pública, escrita admin

---

## Rate Limiting

### Edge Functions (in-memory)

Implementado em `supabase/functions/_shared/rate-limiter.ts`:

```typescript
checkRateLimit(userId, identifier, { maxRequests, windowMs })
```

| Função | Limite | Janela |
|--------|--------|--------|
| nutrition-chat | 10 mensagens | 24h |
| generate-meal-plan | 3 planos | 7 dias |
| generate-nutrition-plan | 3 planos | 7 dias |
| generate-recipes | 5 receitas | 7 dias |
| generate-exercises | 5 planos | 7 dias |

### Banco de dados (triggers)

- Limpeza automática via `cleanup_monitoring_logs()` (pg_cron)
- Detecção de spike: > 20 erros/hora → notificação admin

---

## CORS

Configurado em `supabase/functions/_shared/cors.ts`:

```typescript
// Produção — qualquer subdomínio *.lovable.app
if (origin.endsWith('.lovable.app')) return origin;

// Dev
'http://localhost:5173'
'http://localhost:8080'
```

Headers:
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Max-Age: 86400` (24h cache)
- `x-hotmart-hottok` header permitido (webhook)

---

## Edge Functions

### Autenticação

| Padrão | Uso |
|--------|-----|
| JWT obrigatório | Funções de usuário (generate-*, nutrition-chat) |
| Service Role | Funções internas/cron (system-health-check, cleanup) |
| Hotmart HOTTOK | Webhook de pagamento |
| Admin check | Funções admin (create-user-admin, delete-user-admin) |

### Error Handling

Centralizado em `_shared/error-handler.ts`:
- `withErrorHandling(handler)` — Wrapper com try/catch + CORS + request ID
- `createErrorResponse(status, message, requestId)` — Resposta padronizada
- Log estruturado com request ID para correlação

---

## Auditoria

### admin_audit_log

Registra 13 ações administrativas:
- Exclusão de posts/comentários/denúncias
- Alterações de role
- Bloqueio/desbloqueio de usuários
- Grant de trial premium
- Moderação de conteúdo
- Criação/exclusão de usuários admin

### security_audit_logs

Eventos de segurança:
- Tentativas de acesso não autorizado
- Webhook recebidos (Hotmart)
- Falhas de autenticação

### Monitoramento

- `client_error_logs` — Erros do frontend (auto)
- `performance_logs` — Queries lentas > 2s (auto)
- `system_health_logs` — Health check a cada 30min (cron)

---

## LGPD

### Implementado

| Recurso | Status |
|---------|--------|
| Consentimento explícito | ✅ `user_consents` |
| Exportação de dados | ✅ Edge function `export-user-data` |
| Exclusão de dados | ✅ Edge function `delete-user-data` |
| Log de exclusão | ✅ `data_deletion_logs` |
| Política de privacidade | ✅ Página no app |

---

## Checklist de Segurança

### Para cada nova tabela

- [ ] RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies para SELECT, INSERT, UPDATE, DELETE
- [ ] `user_id` com referência indireta (não FK para auth.users)
- [ ] Validação de dados no frontend (Zod) E no banco (constraints)
- [ ] Índice em `user_id` e `created_at`

### Para cada nova Edge Function

- [ ] CORS headers via `_shared/cors.ts`
- [ ] Autenticação JWT ou service role
- [ ] Rate limiting se for IA/custo
- [ ] Error handling via `withErrorHandling()`
- [ ] Request ID propagado
- [ ] Log de segurança para ações sensíveis

### Para cada deploy

- [ ] Sem secrets hardcoded no código
- [ ] Sem `select('*')` — apenas colunas necessárias
- [ ] Sem dados sensíveis no localStorage
- [ ] RLS policies testadas
- [ ] Rate limits configurados
