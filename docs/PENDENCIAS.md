# 📋 PENDÊNCIAS - Mãe Consciente

**Última atualização:** Abril 2026  
**Status geral:** MVP Completo | Performance Otimizada | Auto-save | Blog Automatizado | Comunidade IA | Monitoramento Completo

---

## Índice

- [Pendências Críticas](#pendências-críticas-p0)
- [Pendências Altas](#pendências-altas-p1)
- [Pendências Médias](#pendências-médias-p2)
- [Pendências Baixas](#pendências-baixas-p3)
- [Débitos Técnicos](#débitos-técnicos)
- [Próximos Pacotes](#próximos-pacotes-de-implementação)
- [Histórico de Mudanças](#histórico-de-mudanças)

---

## 🔴 Pendências Críticas (P0)

| ID | Descrição | Módulo | Status | ETA |
|----|-----------|--------|--------|-----|
| - | Nenhuma pendência crítica | - | - | - |

**✅ Todas as pendências críticas foram resolvidas nos sprints anteriores.**

---

## 🟠 Pendências Altas (P1)

| ID | Descrição | Módulo | Status | ETA |
|----|-----------|--------|--------|-----|
| P1-001 | Push notifications nativas | Core | 📋 Planejado | Mar/2026 |
| P1-002 | Internacionalização (i18n) | Core | 📋 Sob demanda | - |
| P1-003 | Error monitoring (Sentry) | DevOps | ✅ Completo | Jan/2026 |
| P1-004 | E2E tests com Playwright | Quality | ✅ Completo | Jan/2026 |
| P1-005 | Onboarding guiado para novos usuários | UX | 📋 Planejado | Abr/2026 |
| P1-006 | Layout mobile responsivo | UX | ✅ Completo | Jan/2026 |
| P1-007 | QueryKeys padronizados | Performance | ✅ Completo | Jan/2026 |
| P1-008 | Error handler centralizado (Edge Functions) | Backend | 🔄 Em progresso (9/13) | Jan/2026 |
| P1-009 | Segurança: RLS + Leaked Password Protection | Security | 📋 Planejado | Fev/2026 |

---

## 🟡 Pendências Médias (P2)

| ID | Descrição | Módulo | Status | ETA |
|----|-----------|--------|--------|-----|
| P2-001 | Integração com calendário do dispositivo | Core | 📋 Planejado | Mai/2026 |
| P2-002 | Relatórios PDF avançados com gráficos | Reports | 📋 Planejado | Mai/2026 |
| P2-003 | Sistema de gamificação expandido | Community | 📋 Planejado | Jun/2026 |
| P2-004 | Compartilhamento em redes sociais | Social | 📋 Planejado | Jun/2026 |
| P2-005 | Performance monitoring dashboard | DevOps | 📋 Planejado | Abr/2026 |
| P2-006 | Background sync para mais formulários | PWA | ✅ Completo | Jan/2026 |
| P2-007 | Modo offline para comunidade | Community | 📋 Planejado | Mai/2026 |
| P2-008 | Auto-save de rascunhos (IndexedDB) | Forms | ✅ Completo | Jan/2026 |
| P2-009 | Índices de banco de dados (35+) | Database | ✅ Completo | Jan/2026 |

---

## 🟢 Pendências Baixas (P3)

| ID | Descrição | Módulo | Status | ETA |
|----|-----------|--------|--------|-----|
| P3-001 | Integração com wearables (sono) | Baby Sleep | 📋 Planejado | Q3/2026 |
| P3-002 | IA preditiva para marcos | Development | 📋 Planejado | Q4/2026 |
| P3-003 | Comparativo entre bebês | Analytics | 📋 Planejado | Q4/2026 |
| P3-004 | Modo escuro automático por horário | UX | 📋 Planejado | Q2/2026 |
| P3-005 | Animações de transição aprimoradas | UX | 📋 Planejado | Q2/2026 |
| P3-006 | Atalhos de teclado | Accessibility | 📋 Planejado | Q2/2026 |
| P3-007 | Cleanup automático de rascunhos antigos | PWA | 📋 Planejado | Fev/2026 |
| P3-008 | Auto-save em mais formulários | Forms | 📋 Planejado | Fev/2026 |

---

## 🔧 Débitos Técnicos

### Código
| ID | Descrição | Impacto | Esforço | Status |
|----|-----------|---------|---------|--------|
| DT-001 | Aumentar cobertura de testes para 60%+ | Alto | Alto | 📋 |
| DT-002 | Migrar mais hooks para createSupabaseCRUD | Médio | Médio | 📋 |
| DT-003 | Eliminar @ts-ignore restantes (~30) | Médio | Baixo | 📋 |
| DT-004 | Componentizar formulários repetitivos | Médio | Médio | 📋 |
| DT-005 | Refatorar hooks restantes para QueryKeys | Alto | Médio | 📋 |
| DT-006 | Migrar Edge Functions restantes (4) para error-handler | Médio | Baixo | 📋 |

### Infraestrutura
| ID | Descrição | Impacto | Esforço | Status |
|----|-----------|---------|---------|--------|
| DT-007 | Setup de staging environment | Alto | Médio | 📋 |
| DT-008 | Implementar database migrations CI | Alto | Médio | 📋 |
| DT-009 | Configurar Playwright para E2E | Alto | Alto | ✅ Completo |
| DT-010 | Setup de monitoramento APM | Médio | Médio | 📋 |
| DT-011 | Backup automatizado de dados | Alto | Baixo | 📋 |

---

## 📦 Próximos Pacotes de Implementação

### Pacote 12: Edge Functions (Finalização)
| Item | Descrição | Esforço |
|------|-----------|---------|
| check-exchange-alerts | Migrar para error-handler centralizado | Baixo |
| export-users-crm | Migrar para error-handler centralizado | Baixo |
| notify-ticket-created | Migrar para error-handler centralizado | Baixo |
| configure-auth-security | Migrar para error-handler centralizado | Baixo |

### Pacote 13: Segurança
| Item | Descrição | Esforço |
|------|-----------|---------|
| RLS policies | Corrigir warnings de RLS (USING true) | Médio |
| Leaked Password Protection | Ativar proteção | Baixo |
| Auth config | Revisar auto-confirm settings | Baixo |

### Pacote 14: Query Standardization (Finalização)
| Item | Descrição | Esforço |
|------|-----------|---------|
| useEnxovalItems | Migrar para QueryKeys padronizados | Médio |
| useDashboardBebe | Migrar para QueryKeys padronizados | Médio |
| useCrossModuleAnalytics | Migrar para QueryKeys padronizados | Médio |
| usePosts | Migrar para QueryKeys padronizados | Médio |

### Pacote 18: Automação IA v2
| Item | Descrição | Esforço |
|------|-----------|---------|
| Agendamento cron configurável | Permitir alterar frequência do cron pelo admin | Médio |
| Análise de sentimento | Filtrar posts negativos antes de responder | Médio |
| Auto-moderação | IA detectar e sinalizar conteúdo inadequado | Médio |

---

## 📜 Histórico de Mudanças

### Março 2026 (Pacote 17 - Automação IA Calibrada)
- ✅ 12 personas maternas distintas com estilos de escrita únicos
- ✅ Lista de frases proibidas anti-repetição nos prompts
- ✅ 24 temas ultra-específicos para posts automáticos
- ✅ Aba "Usuários Virtuais" no admin para gestão de bots
- ✅ Upload manual de avatares reais para bots (bucket `avatars`)
- ✅ Toggle ativo/inativo para cada bot
- ✅ Configuração persistente de automação (posts/respostas/curtidas por execução)
- ✅ Toggle "Horários Randômicos" com delay configurável
- ✅ Filtro de bots inativos na edge function
- ✅ Display names e avatares nos posts e comentários da comunidade

### Janeiro 2026 (Pacote 11 - Auto-save)
- ✅ Hook `useAutoSave` para formulários longos
- ✅ Componente `DraftIndicator` com status visual
- ✅ Auto-save no `ItemDialog` (Enxoval)
- ✅ Auto-save no `CreatePostDialog` (Comunidade)
- ✅ Auto-save no `RegistroSono` (Sono)
- ✅ Recuperação de rascunhos com dropdown
- ✅ Limpeza automática após envio bem-sucedido

### Janeiro 2026 (Pacote 10 - QueryKeys)
- ✅ 40+ QueryKeys padronizados em `query-config.ts`
- ✅ `useProfile` migrado para QueryKeys
- ✅ `useNotifications` migrado para QueryKeys
- ✅ `useSiteSettings` migrado para QueryKeys
- ✅ `useUserRole` migrado para QueryKeys
- ✅ `useTickets` migrado para React Query mutations
- ✅ `useVaccination` otimizado com cache estático
- ✅ Hooks de gamificação migrados (4 hooks)

### Janeiro 2026 (Pacotes 8-9 - Edge Functions + Indexes)
- ✅ 9 Edge Functions migradas para error-handler centralizado
- ✅ 35+ índices de banco de dados criados
- ✅ Queries otimizadas (posts, feeding, sleep, vaccinations)
- ✅ ANALYZE executado para atualizar estatísticas

### Janeiro 2026 (Pacote 7 - IndexedDB + Sync)
- ✅ IndexedDBManager com stores `cache` e `drafts`
- ✅ Cache com expiração automática
- ✅ Invalidação por tags
- ✅ 13 sync handlers registrados
- ✅ SyncQueueManager UI no header

### Janeiro 2026 (Sprint 5 - Mobile UX)
- ✅ Layout responsivo para badges (texto adaptativo)
- ✅ Botões com texto abreviado em mobile
- ✅ Tabs em grid responsivo (2 colunas em mobile)
- ✅ Tabelas convertidas em cards para mobile
- ✅ Legendas de gráficos ocultas em mobile
- ✅ CSS utilities globais (`.text-adaptive`, `.no-overflow-text`, `.btn-adaptive`)

### Janeiro 2026 (Sprint 4)
- ✅ Sentry error monitoring configurado
- ✅ Testes E2E expandidos (+20 specs)
- ✅ Migração de hooks para createSupabaseCRUD
- ✅ Bundle optimization com lazy loading avançado
- ✅ Testes unitários para UI components (Card, Alert, Tabs, Dialog, Input)
- ✅ Componentes otimizados (VirtualizedList, OptimizedSelect, OptimizedGrid)

### Abril 2026 (Pacote 18)
- ✅ Agendamento cron configurável pelo admin (1x-8x/dia)
- ✅ Análise de sentimento — bots evitam posts sensíveis (luto, emergência)
- ✅ Auto-moderação por IA — scanner de posts + fila de revisão humana
- ✅ Edge function `moderate-post` com tool calling estruturado
- ✅ Posts ocultos automaticamente filtrados do feed público
- ✅ Painel de auto-moderação com stats e histórico

### Janeiro 2026 (Sprint 3)
- ✅ Documentação técnica completa
- ✅ Refatoração de hooks com factories
- ✅ Testes unitários para utilitários
- ✅ React Router future flags
- ✅ Bundle optimization completo
- ✅ Componentização da Landing page

### Janeiro 2026 (Sprint 2)
- ✅ Bundle optimization (~60% redução)
- ✅ Loading states e empty states
- ✅ Dashboard unificado
- ✅ 15 índices de banco de dados
- ✅ N+1 queries corrigidas

### Janeiro 2026 (Sprint 1)
- ✅ RLS em baby_sleep_settings
- ✅ Leaked password protection
- ✅ 86 @ts-ignore removidos
- ✅ ARIA labels em 21 botões
- ✅ Error Boundaries implementados

### Dezembro 2025
- ✅ PWA completo com Service Worker
- ✅ Background sync para tickets
- ✅ Plausible analytics integrado
- ✅ Página offline implementada

### Novembro 2025
- ✅ Comunidade lançada
- ✅ Sistema de moderação
- ✅ Desafios comunitários

---

## Legenda

| Status | Descrição |
|--------|-----------|
| ✅ | Completo |
| 🔄 | Em progresso |
| 📋 | Planejado |
| ⏸️ | Pausado |
| ❌ | Cancelado |

| Prioridade | Descrição |
|------------|-----------|
| P0 | Crítico - Bloqueia produção |
| P1 | Alta - Necessário para próxima release |
| P2 | Média - Melhoria significativa |
| P3 | Baixa - Nice to have |

---

## Documentos Relacionados

- [README.md](README.md) - Setup e visão geral
- [PRD.md](PRD.md) - Requisitos do produto
- [ROADMAP.md](ROADMAP.md) - Fases e timeline
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura técnica
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) - System Design detalhado
- [SPRINT_REVIEW.md](SPRINT_REVIEW.md) - Histórico de sprints
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição

---

*Documento mantido por: Development Team*  
*Última atualização: Abril 2026 (Pacote 18 - Cron + Sentimento + Auto-Moderação)*
