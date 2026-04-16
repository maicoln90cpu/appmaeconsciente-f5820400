# 📝 Changelog — Mãe Consciente

Todas as mudanças notáveis do projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Não Lançado] — Abril 2026

### Adicionado
- Sistema de Monitoramento e Observabilidade completo (5 etapas)
  - Logs de erros, performance e uso de features persistidos
  - Request ID (tracing) em toda chamada frontend→backend
  - Auditoria de 13 ações administrativas sensíveis
  - Health check automático a cada 30min via pg_cron
  - Alertas de spike de erros (> 20/hora) com notificação admin
- Banner de saúde do sistema no painel Admin
- Documentação centralizada em `docs/`

### Alterado
- `cleanup_monitoring_logs()` agora inclui detecção de spike de erros
- `system-health-check` suporta execução via pg_cron (bypass auth)

---

## [1.18] — Março 2026

### Adicionado
- Consistência de código: Logger → named export, Toast → Sonner (63 arquivos)
- Scripts de enforcement: `lint:fix`, `format`, `format:check`
- Comentários padronizados em PT-BR (~50 arquivos)

---

## [1.17] — Março 2026

### Adicionado
- Responsividade e UI/UX (5 etapas)
  - Touch targets 44px em componentes user-facing
  - `prefers-reduced-motion` global
  - Loading states padronizados (`PageLoader`)
  - Empty states unificados (`EmptyState`)
  - Dark mode: cores hardcoded migradas para tokens semânticos

---

## [1.16] — Fevereiro 2026

### Adicionado
- Blog automatizado com geração IA (Gemini)
- Interface pública do blog com SEO (JSON-LD, sitemap dinâmico)
- Painel admin do blog (5 abas)
- Tracking de views com filtragem de bots
- Templates de imagem para posts

---

## [1.15] — Fevereiro 2026

### Adicionado
- Sistema de comunidade automatizado (bots com 30 personas)
- Auto-engajamento via pg_cron (posts, comentários, curtidas)
- Moderação automática por IA
- Geração de avatares por IA

---

## [1.14] — Janeiro 2026

### Adicionado
- Landing page redesenhada com lógica comercial dinâmica
- Tabela comparativa Free vs Premium sincronizada com produtos
- Calculadora de economia

---

## [1.13] — Janeiro 2026

### Adicionado
- Ferramentas premium: Diário de Crescimento, Planejador de Rotina
- Guia de Alimentação do Bebê, Álbum de Primeiras Vezes
- Wrapper architecture para features de alta complexidade

---

## [1.12] — Janeiro 2026

### Adicionado
- PWA completa com Service Worker
- Background Sync (13 tipos de dados)
- IndexedDB para cache e rascunhos
- Página offline com diagnóstico

---

## [1.11] — Janeiro 2026

### Adicionado
- Auto-save de formulários com IndexedDB
- Indicador visual de rascunho salvo
- Restauração automática de dados

---

## [1.10] — Janeiro 2026

### Adicionado
- Sentry error monitoring
- E2E tests com Playwright (20+ specs)
- QueryKeys padronizados

---

## [1.0] — Q4 2025

### Adicionado
- MVP completo
- 12 módulos principais (Enxoval, Amamentação, Sono, Vacinação, etc.)
- Autenticação com email + Google
- RLS em todas as tabelas
- Sistema de gamificação (badges, XP, streaks)
- Monetização via Hotmart
- Dashboard unificado do bebê
