# 📋 PENDÊNCIAS - Maternidade Consciente

**Última atualização:** Janeiro 2026  
**Status geral:** MVP Completo | Growth em planejamento

---

## Índice

- [Pendências Críticas](#pendências-críticas-p0)
- [Pendências Altas](#pendências-altas-p1)
- [Pendências Médias](#pendências-médias-p2)
- [Pendências Baixas](#pendências-baixas-p3)
- [Sugestões de Novas Features](#sugestões-de-novas-features)
- [Débitos Técnicos](#débitos-técnicos)
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

---

## 🟡 Pendências Médias (P2)

| ID | Descrição | Módulo | Status | ETA |
|----|-----------|--------|--------|-----|
| P2-001 | Integração com calendário do dispositivo | Core | 📋 Planejado | Mai/2026 |
| P2-002 | Relatórios PDF avançados com gráficos | Reports | 📋 Planejado | Mai/2026 |
| P2-003 | Sistema de gamificação expandido | Community | 📋 Planejado | Jun/2026 |
| P2-004 | Compartilhamento em redes sociais | Social | 📋 Planejado | Jun/2026 |
| P2-005 | Performance monitoring dashboard | DevOps | 📋 Planejado | Abr/2026 |
| P2-006 | Background sync para mais formulários | PWA | 📋 Planejado | Abr/2026 |
| P2-007 | Modo offline para comunidade | Community | 📋 Planejado | Mai/2026 |

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

---

## 💡 Sugestões de Novas Features

### Baseadas em Ferramentas Existentes

| Feature | Descrição | Módulo Base | Prioridade |
|---------|-----------|-------------|------------|
| **Calculadora de Mamadeira** | Calcular quantidade de leite por idade/peso | Amamentação | P2 |
| **Rastreador de Cólicas** | Registrar episódios e correlacionar com alimentação | Baby Care | P2 |
| **Diário de Introdução Alimentar** | Registrar novos alimentos e reações | Alimentação | P1 |
| **Timer de Medicamentos** | Alarmes para próxima dose | Recuperação | P2 |
| **Calculadora de Idade Gestacional** | Converter semanas/meses de gestação | Materiais | P3 |
| **Gráfico de Crescimento** | Curvas de peso/altura do bebê | Desenvolvimento | P1 |
| **Organizador de Consultas** | Agenda de pediatra/obstetra | Core | P2 |
| **Lista de Contatos de Emergência** | Pediatra, hospital, família | Core | P3 |
| **Rastreador de Fraldas** | Registrar trocas e padrões | Baby Care | P3 |
| **Álbum do Primeiro Ano** | Fotos mensais com marcos | Development | P2 |

### Novas Ferramentas Complementares

| Feature | Descrição | Justificativa | Prioridade |
|---------|-----------|---------------|------------|
| **Checklist de Consultas** | Perguntas para levar ao pediatra | Complementa Vacinação | P2 |
| **Banco de Leite Pessoal** | Gestão avançada de estoque | Complementa Ordenha | P2 |
| **Planner de Rotina** | Criar rotinas diárias do bebê | Complementa Sono | P2 |
| **Histórico de Crescimento** | Gráficos OMS integrados | Complementa Desenvolvimento | P1 |
| **Gestor de Babá/Cuidador** | Compartilhar info com cuidadores | Novo módulo | P2 |
| **Biblioteca de White Noise** | Sons para acalmar bebê | Complementa Sono | P3 |
| **Diário de Gratidão da Mãe** | Bem-estar emocional | Complementa Recuperação | P3 |
| **Simulador de Orçamento Bebê** | Projeção de gastos por ano | Complementa Enxoval | P2 |

---

## 🔧 Débitos Técnicos

### Código
| ID | Descrição | Impacto | Esforço | Status |
|----|-----------|---------|---------|--------|
| DT-001 | Aumentar cobertura de testes para 60%+ | Alto | Alto | 📋 |
| DT-002 | Migrar mais hooks para createSupabaseCRUD | Médio | Médio | 📋 |
| DT-003 | Eliminar @ts-ignore restantes (~30) | Médio | Baixo | 📋 |
| DT-004 | Componentizar formulários repetitivos | Médio | Médio | 📋 |
| DT-005 | Otimizar queries N+1 restantes | Alto | Médio | 📋 |

### Infraestrutura
| ID | Descrição | Impacto | Esforço | Status |
|----|-----------|---------|---------|--------|
| DT-006 | Setup de staging environment | Alto | Médio | 📋 |
| DT-007 | Implementar database migrations CI | Alto | Médio | 📋 |
| DT-008 | Configurar Playwright para E2E | Alto | Alto | 📋 |
| DT-009 | Setup de monitoramento APM | Médio | Médio | 📋 |
| DT-010 | Backup automatizado de dados | Alto | Baixo | 📋 |

---

## 📜 Histórico de Mudanças

### Janeiro 2026 (Sprint 4)
- ✅ Sentry error monitoring configurado
- ✅ Testes E2E expandidos (+15 specs)
- ✅ Migração de hooks para createSupabaseCRUD
- ✅ Bundle optimization com lazy loading avançado
- ✅ Testes unitários para UI components (Card, Alert, Tabs, Dialog, Input)
- ✅ Componentes otimizados (VirtualizedList, OptimizedSelect, OptimizedGrid)
- ✅ Hooks de memoização avançados (useMemoizedCallback)
- ✅ Code splitting no DashboardBebe (16 componentes)
- ✅ Prefetch durante idle time (requestIdleCallback)
- ✅ Documentação técnica completa (README, ARCHITECTURE, PRD, ROADMAP)

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
- [SPRINT_REVIEW.md](SPRINT_REVIEW.md) - Histórico de sprints
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição

---

*Documento mantido por: Development Team*  
*Última atualização: Janeiro 2026*
