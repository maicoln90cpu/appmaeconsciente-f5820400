# ⚡ Edge Functions — Mãe Consciente

**Última atualização:** Abril 2026  
**Total:** 31 funções  
**Runtime:** Deno (Supabase Edge Functions)

---

## Índice

- [Shared / Infra](#shared--infra)
- [Catálogo Completo](#catálogo-completo)
- [Detalhes por Categoria](#detalhes-por-categoria)

---

## Shared / Infra

Código compartilhado em `supabase/functions/_shared/`:

| Arquivo | Descrição |
|---------|-----------|
| `cors.ts` | CORS headers, origin validation, preflight handler, security event logging |
| `rate-limiter.ts` | Rate limiter in-memory por usuário + identificador |
| `error-handler.ts` | `withErrorHandling()` wrapper, request ID, error response padronizada |

---

## Catálogo Completo

| # | Função | Auth | Rate Limit | Categoria |
|---|--------|------|------------|-----------|
| 1 | `apply-promotion` | Admin | — | Monetização |
| 2 | `auto-engage-community` | Service/Cron | — | Comunidade |
| 3 | `check-development-alerts` | Service/Cron | — | Bebê |
| 4 | `check-exchange-alerts` | Service/Cron | — | Enxoval |
| 5 | `cleanup-old-logs` | Service/Cron | — | Admin |
| 6 | `configure-auth-security` | Admin | — | Admin |
| 7 | `create-user-admin` | Admin | — | Admin |
| 8 | `delete-user-admin` | Admin | — | Admin |
| 9 | `delete-user-data` | JWT | — | LGPD |
| 10 | `export-user-data` | JWT | — | LGPD |
| 11 | `export-users-crm` | Admin | — | Admin |
| 12 | `generate-avatar` | Admin | — | Comunidade |
| 13 | `generate-blog-post` | Admin | — | Blog |
| 14 | `generate-comment` | Service/Cron | — | Comunidade |
| 15 | `generate-exercises` | JWT | 5/7d | Saúde |
| 16 | `generate-meal-plan` | JWT | 3/7d | Nutrição |
| 17 | `generate-nutrition-plan` | JWT | 3/7d | Nutrição |
| 18 | `generate-recipes` | JWT | 5/7d | Nutrição |
| 19 | `grant-trial-access` | Admin | — | Monetização |
| 20 | `hotmart-webhook` | HOTTOK | — | Monetização |
| 21 | `moderate-post` | JWT | — | Comunidade |
| 22 | `notify-ticket-created` | Service | — | Suporte |
| 23 | `nutrition-chat` | JWT | 10/24h | Nutrição |
| 24 | `resend-purchase-credentials` | Admin | — | Monetização |
| 25 | `seed-community` | Admin | — | Comunidade |
| 26 | `send-resend-email` | Service | — | Email |
| 27 | `send-weekly-recovery-email` | Service/Cron | — | Email |
| 28 | `sitemap-xml` | Público | — | SEO |
| 29 | `system-health-check` | Admin/Cron | — | Monitoramento |
| 30 | `track-blog-view` | Público | — | Blog |

---

## Detalhes por Categoria

### 🤖 IA / Geração de Conteúdo

| Função | Descrição | Modelo | Input | Output |
|--------|-----------|--------|-------|--------|
| `generate-meal-plan` | Plano alimentar personalizado | Gemini | trimestre, restrições | plano JSON |
| `generate-nutrition-plan` | Plano nutricional | Gemini | perfil, objetivos | plano JSON |
| `generate-recipes` | Receitas saudáveis | Gemini | ingredientes, restrições | receitas JSON |
| `generate-exercises` | Exercícios pós-parto | Gemini | semana, condições | exercícios JSON |
| `nutrition-chat` | Chat nutricional | Gemini | mensagem, histórico | resposta |
| `generate-blog-post` | Post de blog completo | Gemini | tópico, categoria | HTML + SEO |
| `generate-comment` | Comentário de bot | Gemini | post, persona | texto |
| `moderate-post` | Moderação automática | Gemini | conteúdo | aprovado/rejeitado |
| `generate-avatar` | Avatar de bot | Lovable AI | descrição | imagem URL |

### 💰 Monetização

| Função | Descrição | Input | Output |
|--------|-----------|-------|--------|
| `hotmart-webhook` | Recebe eventos Hotmart | webhook body + HOTTOK | ativa/desativa acesso |
| `apply-promotion` | Aplica promoção a produtos | promotion_id | produtos atualizados |
| `grant-trial-access` | Concede trial premium | user_id, days | acesso temporário |
| `resend-purchase-credentials` | Reenvia credenciais | user_id | email enviado |

### 👥 Comunidade

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `auto-engage-community` | Bots postam/comentam/curtem | pg_cron (3x/dia) |
| `seed-community` | Cria posts iniciais | Manual (admin) |

### 📧 Email

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `send-resend-email` | Envia email via Resend | Trigger de evento |
| `send-weekly-recovery-email` | Email semanal de recuperação | pg_cron (semanal) |

### 🔧 Admin / Sistema

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `create-user-admin` | Cria usuário (admin) | Manual |
| `delete-user-admin` | Exclui usuário (admin) | Manual |
| `configure-auth-security` | Configura segurança auth | Manual |
| `export-users-crm` | Exporta lista CRM | Manual |
| `cleanup-old-logs` | Limpa logs antigos | pg_cron |
| `system-health-check` | Health check do sistema | pg_cron (30min) |

### 🔔 Alertas

| Função | Descrição | Trigger |
|--------|-----------|---------|
| `check-development-alerts` | Verifica marcos de desenvolvimento | pg_cron |
| `check-exchange-alerts` | Verifica alertas de troca (enxoval) | pg_cron |
| `notify-ticket-created` | Notifica admin sobre ticket | Trigger |

### 📊 SEO / Analytics

| Função | Descrição | Auth |
|--------|-----------|------|
| `sitemap-xml` | Gera sitemap dinâmico | Público |
| `track-blog-view` | Rastreia views (bot filter) | Público |

### 🔐 LGPD

| Função | Descrição | Auth |
|--------|-----------|------|
| `export-user-data` | Exporta todos os dados do usuário | JWT |
| `delete-user-data` | Exclui todos os dados do usuário | JWT |
