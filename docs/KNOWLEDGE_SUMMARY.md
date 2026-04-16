# Knowledge Summary — Mãe Consciente (Abril 2026)

## Visão Geral
App React+Supabase para mães (gestantes e pós-parto). 21 ferramentas especializadas, comunidade com bots IA, blog SEO automatizado. Modelo freemium: R$27/mês (Clube) ou compra avulsa com 7 dias de trial.

## Stack
React 18 + Vite 5 + TypeScript 5 + Tailwind v3 + shadcn/ui. Backend: Supabase (Postgres, RLS, Edge Functions, Storage, Realtime). PWA com IndexedDB offline-first.

## Arquitetura
- 124 tabelas organizadas por módulo (Core, Bebê, Gestação, Gamificação, Comunidade, Blog, Admin, Monitoramento)
- 31 Edge Functions (Deno) com CORS centralizado, rate limiting, error handling padronizado e request ID tracing
- Automação: pg_cron (UTC) + pg_net para blog, comunidade e health checks
- Monitoramento: client_error_logs, performance_logs, feature_usage_logs, system_health_checks

## Regras Obrigatórias
1. Nunca usar `.select('*')` — sempre campos explícitos
2. Canais Realtime: `channel-name-${user.id}` (nunca genérico)
3. Ferramentas requerem registro na tabela `products` para visibilidade
4. Edge Functions: CORS via `_shared/cors.ts`, permitir `*.lovable.app`
5. pg_cron em UTC — converter para BRT nos agendamentos
6. Touch targets mínimo 44px em mobile
7. `is_virtual` flag filtra bots de analytics reais
8. Comentários em PT-BR, toast via Sonner, logger via named export
9. QueryKeys padronizados via `queryKeys` helper
10. Tokens semânticos Tailwind (nunca cores hardcoded), dark: variants obrigatórias

## UX/Design
- Persona: mães cansadas, pouca instrução técnica
- Tom: acolhedor, sem alarmismo. "Cada bebê tem seu tempo"
- Nunca usar termos médicos como "atraso"
- Navegação: 5 itens [Início, Ferramentas, +, Comunidade, Perfil] + FAB registro rápido
- Modo Simples: oculta gamificação e aba "Mais"
- Fase Maternidade: UI adapta entre Gestante e Pós-parto via `fase_maternidade`
- Imagens IA: estética "selfie maternal natural", fotografia amadora

## Ferramentas (21 total)
**Gratuitas:** Calculadora Gestação, Checklist Documentos, Checklist Quartinho, Timer Mamada, Calculadora Fraldas, Cartão Vacinação
**Premium/Wrapper:** Diário Crescimento OMS, Planejador Rotina, Guia Alimentar, Álbum Marcos
**Outras:** Mala Maternidade, Diário Sono, Amamentação, Recuperação Pós-Parto, Monitor Desenvolvimento (0-24m, 5 áreas), Gestação (DPP, Contrações, Kick Counter, Exames, Plano Parto), Monitor Icterícia, Diário da Mãe, Dentes, Estimulação, Alergias

## Comunidade
- 30 bots com personalidades diversas, avatares IA, toggle is_active
- Automação 100% autônoma: pg_cron + Gemini, 1-8x/dia, horários randômicos
- Auto-moderação: 8 categorias sensíveis, auto-ocultação de posts sinalizados
- Anti-repetição: regras para evitar padrões robóticos nos bots

## Blog
- SEO automatizado via Gemini, 50+ tópicos, público em /blog
- 3 estilos de imagem (Aquarela, Flat, Fotografia), auto-internal linking
- Tracking: filtragem bots, deduplicação IP, sitemap XML dinâmico
- Admin: TipTap editor, agendamento pg_cron, logs de custos/tokens

## Monetização
- PremiumUpgradeModal inline (sem redirecionamento externo)
- Landing page: tabela comparativa, calculador de economia, segmentação por fase
- Calculadora de Fraldas e Cartão de Vacinação permanentemente gratuitos

## Segurança
- RLS em todas as tabelas user-facing
- Roles via `has_role()` SECURITY DEFINER (nunca client-side)
- Rate limiting: IA (5 req/7 dias), auth (triggers no banco)
- Audit log: admin_audit_log para ações sensíveis
- LGPD: data_deletion_logs, exportação de dados, consent management

## Monitoramento (Completo)
- Logs: client_error_logs, performance_logs, feature_usage_logs
- Request ID: x-request-id injetado em todas as chamadas Supabase
- Health check: pg_cron a cada 30min, score de saúde do sistema
- Alertas: spike de erros (>20/hora), notificações para admins
- Cleanup automático: retenção de 30 dias

## Formato de Resposta Obrigatório
Para cada implementação informar: 1) antes vs depois, 2) melhorias, 3) vantagens/desvantagens, 4) checklist manual de validação, 5) pendências, 6) prevenção de regressão quando aplicável. Sugerir melhorias futuras apenas do implementado.
