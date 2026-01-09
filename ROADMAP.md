# 🗺️ ROADMAP - Maternidade Consciente

**Última atualização:** Janeiro 2026  
**Próxima revisão:** Abril 2026

---

## Visão Geral das Fases

```
┌─────────────────────────────────────────────────────────────────┐
│                         2025-2026                                │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│   Q4/2025    │   Q1/2026    │   Q2/2026    │      Q3-Q4/2026      │
│  Foundation  │     MVP      │   Growth     │      Scale           │
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

## ✅ Fase 2: MVP (Q1/2026) - COMPLETA

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
- [x] Testes E2E com Playwright (15+ specs)
- [x] Testes unitários expandidos
- [x] Code splitting avançado
- [x] Virtualização e memoização
- [x] Documentação técnica completa

### Resultados
| Métrica | Antes | Depois |
|---------|-------|--------|
| Bundle Size | ~1.2MB | ~400KB |
| @ts-ignore | 115+ | <30 |
| Test Coverage | 0% | Core + UI + E2E |
| A11y Coverage | Parcial | Completa |
| Error Monitoring | Nenhum | Sentry |
| E2E Tests | 0 | 15+ specs |

---

## 🔄 Fase 3: Growth (Q2/2026) - EM PROGRESSO

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
| E2E tests (Playwright) | 📋 Planejado | Março |
| Error monitoring (Sentry) | 📋 Planejado | Março |
| Performance monitoring | 📋 Planejado | Abril |
| Database optimization | 📋 Planejado | Abril |

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

---

## Próximos Passos Imediatos

### Semana 1-2 (Janeiro 2026)
1. ~~Finalizar documentação técnica~~
2. Revisar pendências críticas
3. Planejar sprint Q2

### Semana 3-4 (Janeiro 2026)
1. Setup error monitoring
2. Iniciar i18n
3. Prototipar push notifications

---

## Documentos Relacionados

- [README.md](README.md) - Setup e visão geral
- [PRD.md](PRD.md) - Requisitos do produto
- [PENDENCIAS.md](PENDENCIAS.md) - Lista de pendências
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura técnica
- [SPRINT_REVIEW.md](SPRINT_REVIEW.md) - Histórico de sprints

---

*Roadmap atualizado em: Janeiro 2026*  
*Responsável: Product Team*
