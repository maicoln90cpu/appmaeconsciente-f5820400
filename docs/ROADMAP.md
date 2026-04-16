# 🗺️ ROADMAP - Mãe Consciente

**Última atualização:** Abril 2026  
**Próxima revisão:** Julho 2026

---

## Visão Geral das Fases

```
┌─────────────────────────────────────────────────────────────────┐
│                         2025-2026                                │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   Q4/2025    │   Q1/2026    │   Q2/2026    │      Q3-Q4/2026      │
│  Foundation  │  MVP + Perf  │   Growth     │      Scale           │
│      ✅      │      ✅      │     🔄       │        📋            │
└──────────────┴──────────────┴──────────────┴──────────────────────┘
```

---

## ✅ Fase 1: Foundation (Q4/2025) - COMPLETA

### Objetivos
- [x] Setup da stack tecnológica
- [x] Arquitetura base
- [x] Autenticação e autorização
- [x] Design system

### Entregas
| Entrega | Status |
|---------|--------|
| Projeto Vite + React + TypeScript | ✅ |
| Tailwind + shadcn/ui | ✅ |
| Lovable Cloud (Supabase) | ✅ |
| Sistema de autenticação | ✅ |
| Estrutura de rotas | ✅ |
| CI/CD básico | ✅ |

---

## ✅ Fase 2: MVP + Performance (Q1/2026) - COMPLETA

### Sprint 1: Core Features
- [x] Enxoval do Bebê
- [x] Amamentação
- [x] Sono do Bebê
- [x] Perfil do Usuário

### Sprint 2: Extended Features
- [x] Cartão de Vacinação
- [x] Monitor de Desenvolvimento
- [x] Guia de Alimentação
- [x] Recuperação Pós-Parto

### Sprint 3: Community & Quality
- [x] Comunidade
- [x] PWA completo
- [x] Performance optimization
- [x] Documentação técnica base

### Sprint 4: Quality & Testing
- [x] Sentry error monitoring
- [x] Testes E2E com Playwright (20+ specs)
- [x] Testes unitários expandidos
- [x] Code splitting avançado
- [x] Virtualização e memoização
- [x] Documentação técnica completa

### Sprint 5: Mobile UX Improvements
- [x] Layout responsivo para badges
- [x] Texto adaptativo em botões
- [x] Grids responsivos para tabs
- [x] Tabelas convertidas em cards mobile
- [x] Legendas de gráficos otimizadas
- [x] CSS utilities globais para responsividade

### Pacote 7: IndexedDB & Offline Sync
- [x] IndexedDBManager com stores cache/drafts
- [x] 13 sync handlers registrados
- [x] SyncQueueManager UI no header
- [x] Cache com expiração automática

### Pacote 8-9: Edge Functions + Database
- [x] 9 Edge Functions migradas para error-handler
- [x] 35+ índices de banco de dados
- [x] Queries otimizadas

### Pacote 10: QueryKeys Standardization
- [x] 40+ QueryKeys padronizados
- [x] 11 hooks migrados
- [x] Cache config por categoria

### Pacote 11: Auto-save System
- [x] Hook `useAutoSave` genérico
- [x] Componente `DraftIndicator`
- [x] Auto-save no ItemDialog (Enxoval)
- [x] Auto-save no CreatePostDialog (Comunidade)
- [x] Auto-save no RegistroSono (Sono)

### Resultados
| Métrica | Antes | Depois |
|---------|-------|--------|
| Bundle Size | ~1.2MB | ~400KB |
| @ts-ignore | 115+ | <30 |
| Test Coverage | 0% | Core + UI + E2E |
| A11y Coverage | Parcial | Completa |
| Error Monitoring | Nenhum | Sentry |
| E2E Tests | 0 | 20+ specs |
| Mobile UX | Básico | Otimizado |
| DB Indexes | 15 | 35+ |
| Edge Functions (error-handler) | 0 | 9/13 |
| QueryKeys padronizados | 0 | 40+ |
| Auto-save formulários | 0 | 3 forms |

---

## 🔄 Fase 3: Growth (Q2/2026) - EM PROGRESSO

### Próximos Pacotes Planejados

#### Pacote 12: Edge Functions (Finalização)
| Item | Status | ETA |
|------|--------|-----|
| check-exchange-alerts | 📋 | Fev |
| export-users-crm | 📋 | Fev |
| notify-ticket-created | 📋 | Fev |
| configure-auth-security | 📋 | Fev |

#### Pacote 13: Segurança
| Item | Status | ETA |
|------|--------|-----|
| RLS policies review | 📋 | Fev |
| Leaked Password Protection | 📋 | Fev |
| Auth config review | 📋 | Fev |

#### Pacote 14: Query Standardization (Finalização)
| Item | Status | ETA |
|------|--------|-----|
| useEnxovalItems | 📋 | Fev |
| useDashboardBebe | 📋 | Fev |
| useCrossModuleAnalytics | 📋 | Fev |
| usePosts | 📋 | Fev |

#### Pacote 15: Auto-save Extensão
| Item | Status | ETA |
|------|--------|-----|
| RegistroMamada | 📋 | Mar |
| ContractionDiary | 📋 | Mar |
| TicketForm | 📋 | Mar |
| ProfileSettings | 📋 | Mar |

### Prioridade Alta
| Feature | Status | ETA |
|---------|--------|-----|
| Push notifications | 📋 Planejado | Março |
| i18n (ES, EN) | 📋 Planejado | Março |
| Onboarding guiado | 📋 Planejado | Abril |
| Melhoria de analytics | 📋 Planejado | Abril |

### Prioridade Média
| Feature | Status | ETA |
|---------|--------|-----|
| Integração Calendário | 📋 Planejado | Maio |
| Relatórios PDF avançados | 📋 Planejado | Maio |
| Gamificação expandida | 📋 Planejado | Junho |
| Social sharing | 📋 Planejado | Junho |

### Melhorias Técnicas
| Item | Status | ETA |
|------|--------|-----|
| Performance monitoring | 📋 Planejado | Abril |
| Cleanup automático IndexedDB | 📋 Planejado | Abril |
| Test coverage expansion | 📋 Planejado | Maio |

---

## 📋 Fase 4: Scale (Q3-Q4/2026) - PLANEJADO

### Q3/2026: Platform
| Feature | Prioridade |
|---------|------------|
| App nativo (React Native) | Alta |
| API pública | Média |
| Webhooks | Média |
| Integração wearables | Baixa |

### Q4/2026: Ecosystem
| Feature | Prioridade |
|---------|------------|
| Marketplace de produtos | Alta |
| Parcerias com marcas | Alta |
| Telemedicina | Média |
| IA preditiva | Baixa |

---

## Legenda de Status

| Status | Descrição |
|--------|-----------|
| ✅ | Completo |
| 🔄 | Em progresso |
| 📋 | Planejado |
| ⏸️ | Pausado |
| ❌ | Cancelado |

---

## Critérios de Priorização

Utilizamos o framework **RICE** para priorização:

| Critério | Peso |
|----------|------|
| **R**each - Quantos usuários impactados | 25% |
| **I**mpact - Qual o impacto por usuário | 30% |
| **C**onfidence - Confiança na estimativa | 20% |
| **E**ffort - Esforço de desenvolvimento | 25% |

**Score = (Reach × Impact × Confidence) / Effort**

---

## Dependências Externas

| Dependência | Fase | Responsável |
|-------------|------|-------------|
| Apple Developer Account | Scale | Business |
| Google Play Account | Scale | Business |
| Parcerias com marcas | Scale | Business |
| Aprovação médica para conteúdo | All | Legal |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Mudanças no Supabase | Baixa | Alto | Abstrair client |
| Performance mobile | Média | Médio | Testing contínuo |
| Regulação de dados | Média | Alto | LGPD compliance |
| Competição | Alta | Médio | Diferenciação por UX |
| Perda de dados offline | Baixa | Alto | Auto-save + IndexedDB |

---

## Próximos Passos Imediatos

### Semana 1-2 (Fevereiro 2026)
1. Executar Pacote 12 (Edge Functions restantes)
2. Executar Pacote 13 (Segurança)
3. Revisar pendências críticas

### Semana 3-4 (Fevereiro 2026)
1. Executar Pacote 14 (QueryKeys restantes)
2. Iniciar Pacote 15 (Auto-save extensão)
3. Planejar sprint Q2

---

## Documentos Relacionados

- [README.md](README.md) - Setup e visão geral
- [PRD.md](PRD.md) - Requisitos do produto
- [PENDENCIAS.md](PENDENCIAS.md) - Lista de pendências
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura de componentes
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) - **System Design detalhado**
- [SPRINT_REVIEW.md](SPRINT_REVIEW.md) - Histórico de sprints
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição

---

*Roadmap atualizado em: Janeiro 2026 (Pacote 11 - Auto-save)*  
*Responsável: Product Team*
