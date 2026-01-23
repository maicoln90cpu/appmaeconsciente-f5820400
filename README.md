# 🍼 Maternidade Consciente

Uma plataforma PWA completa para auxiliar mães durante a gravidez, parto e pós-parto.

[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Lovable Cloud](https://img.shields.io/badge/Backend-Lovable_Cloud-purple)](https://lovable.dev)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-green?logo=vitest)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-orange?logo=playwright)](https://playwright.dev)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Stack Tecnológica](#stack-tecnológica)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Testes](#testes)
- [Performance](#performance)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🎯 Sobre o Projeto

Maternidade Consciente é uma aplicação web progressiva (PWA) que oferece ferramentas completas para gestantes e mães:

- **Planejamento de Enxoval** - Gestão completa de itens, orçamento e compartilhamento
- **Diário do Bebê** - Rastreamento de alimentação, sono e desenvolvimento
- **Guia Nutricional** - Planos alimentares, receitas e IA nutricional
- **Cartão de Vacinação** - Calendário e lembretes de vacinas
- **Recuperação Pós-Parto** - Monitoramento de sintomas e bem-estar
- **Comunidade** - Espaço para compartilhamento entre mães
- **Dashboard do Bebê** - Visão unificada de todas as métricas do bebê

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.3 | Biblioteca UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização |
| shadcn/ui | latest | Componentes UI |
| TanStack Query | 5.x | Gerenciamento de estado server |
| React Router | 6.x | Roteamento |
| React Hook Form | 7.x | Formulários |
| Zod | 3.x | Validação |
| Recharts | 2.x | Gráficos |

### Backend (Lovable Cloud)
| Serviço | Descrição |
|---------|-----------|
| PostgreSQL | Banco de dados com RLS + 35 índices otimizados |
| Auth | Autenticação e autorização |
| Edge Functions | Lógica serverless (28+ funções) |
| Storage | Armazenamento de arquivos |
| Realtime | Atualizações em tempo real |

### PWA & Offline
| Tecnologia | Descrição |
|------------|-----------|
| Service Worker | Cache e sincronização |
| IndexedDB | Armazenamento local (cache + drafts) |
| Background Sync | Sincronização em segundo plano |
| Auto-save | Rascunhos automáticos de formulários |

### Ferramentas de Desenvolvimento
| Ferramenta | Descrição |
|------------|-----------|
| Vitest | Testes unitários |
| Playwright | Testes E2E (20+ specs) |
| ESLint | Linting |
| Prettier | Formatação |
| Sentry | Error monitoring |
| PWA Plugin | Progressive Web App |

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ ou Bun
- npm, yarn ou bun

### Setup Local

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd maternidade-consciente

# Instale as dependências
npm install
# ou
bun install

# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

A aplicação estará disponível em `http://localhost:5173`

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build

# Testes
npm run test         # Executa testes unitários
npm run test:watch   # Testes em watch mode
npm run test:coverage # Testes com cobertura
npm run test:e2e     # Executa testes E2E

# Qualidade de Código
npm run lint         # Verifica código
npm run format       # Formata código
npm run typecheck    # Verifica tipos
```

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes base (shadcn) + responsivos
│   │   ├── draft-indicator.tsx  # Indicador de auto-save
│   │   ├── virtualized-list.tsx # Lista virtualizada
│   │   └── ...
│   ├── admin/           # Painel administrativo
│   ├── alimentacao/     # Módulo de nutrição
│   ├── alimentacao-bebe/# Alimentação do bebê
│   ├── amamentacao/     # Módulo de amamentação
│   ├── bebe/            # Ferramentas do bebê
│   ├── comunidade/      # Módulo de comunidade
│   ├── crescimento/     # Gráficos de crescimento
│   ├── dashboard-bebe/  # Dashboard unificado
│   ├── desenvolvimento/ # Desenvolvimento do bebê
│   ├── gamification/    # Sistema de conquistas
│   ├── gestacao/        # Ferramentas de gestação
│   ├── insights/        # Insights cross-module
│   ├── landing/         # Landing page
│   ├── mala-maternidade/# Mala da maternidade
│   ├── onboarding/      # Onboarding do usuário
│   ├── offline/         # Componentes offline
│   │   ├── SyncQueueManager.tsx # UI de fila de sync
│   │   └── ...
│   ├── pwa/             # Componentes PWA
│   ├── recuperacao/     # Recuperação pós-parto
│   ├── sono/            # Monitoramento de sono
│   └── vacinacao/       # Cartão de vacinação
├── hooks/               # Custom hooks
│   ├── factories/       # Factories de hooks (createSupabaseCRUD)
│   ├── postpartum/      # Hooks de pós-parto
│   ├── gamification/    # Hooks de gamificação
│   ├── useAutoSave.ts   # Auto-save de formulários
│   ├── useOfflineSync.ts# Sincronização offline
│   └── ...
├── pages/               # Páginas/rotas
├── contexts/            # Contextos React
├── lib/                 # Utilitários
│   ├── indexed-db.ts    # Manager IndexedDB
│   ├── offline-sync.ts  # Sync engine
│   ├── query-config.ts  # QueryKeys + cache config
│   └── validators/      # Schemas Zod
├── integrations/        # Integrações externas
│   └── supabase/        # Cliente Supabase
├── types/               # Tipos TypeScript
├── constants/           # Constantes da aplicação
└── test/                # Testes unitários
    ├── components/
    ├── hooks/
    └── lib/

supabase/
├── functions/           # Edge Functions (28+)
│   ├── _shared/         # Código compartilhado
│   │   ├── cors.ts
│   │   ├── error-handler.ts  # Handler centralizado
│   │   └── rate-limiter.ts
│   └── ...              # Funções individuais
└── config.toml          # Configuração

e2e/                     # Testes E2E Playwright
├── fixtures/            # Fixtures de autenticação
└── *.spec.ts            # Specs de teste (20+)
```

## ✨ Funcionalidades

### Módulos Principais

| Módulo | Descrição | Status |
|--------|-----------|--------|
| 🛒 Enxoval | Gestão de itens, orçamento, compartilhamento | ✅ Completo |
| 🍼 Amamentação | Registro de mamadas, ordenha, dashboard | ✅ Completo |
| 😴 Sono | Diário de sono, análises, IA insights | ✅ Completo |
| 💉 Vacinação | Calendário, lembretes, multi-bebês | ✅ Completo |
| 📈 Desenvolvimento | Marcos, alertas, relatórios | ✅ Completo |
| 🍎 Nutrição | Planos, receitas, IA nutricional | ✅ Completo |
| 💪 Recuperação | Sintomas, medicamentos, bem-estar | ✅ Completo |
| 👥 Comunidade | Posts, comentários, desafios | ✅ Completo |
| 📦 Mala Maternidade | Checklist, compartilhamento, PDF | ✅ Completo |
| 🎁 Materiais | Calculadora de fraldas, ferramentas | ✅ Completo |
| 👶 Dashboard Bebê | Visão unificada, timeline, alertas | ✅ Completo |
| 🏆 Gamificação | Conquistas, níveis, desafios | ✅ Completo |

### Recursos Técnicos

- ✅ **PWA** - Instalável, funciona offline
- ✅ **Background Sync** - Sincronização em segundo plano (13 tipos de dados)
- ✅ **Auto-save** - Rascunhos automáticos com IndexedDB
- ✅ **RLS** - Row Level Security em todas as tabelas
- ✅ **Lazy Loading** - Carregamento sob demanda com retry
- ✅ **Prefetch** - Pré-carregamento de rotas (hover + idle)
- ✅ **Dark Mode** - Tema escuro
- ✅ **Acessibilidade** - ARIA labels, skip links, focus management
- ✅ **Responsivo** - Mobile-first com layout adaptativo
- ✅ **Error Monitoring** - Sentry integrado
- ✅ **Virtualização** - Listas otimizadas para grandes volumes
- ✅ **35+ Índices DB** - Queries otimizadas

## 🧪 Testes

### Testes Unitários (Vitest)

```bash
npm run test           # Executa todos os testes
npm run test -- --watch # Watch mode
npm run test -- --coverage # Com cobertura
```

Cobertura atual:
- ✅ Utilitários (`src/lib/`)
- ✅ Validadores (`src/lib/validators/`)
- ✅ Componentes UI (`src/components/ui/`)
- ✅ Hooks principais (`src/hooks/`)
- ✅ Factories (`src/hooks/factories/`)

### Testes E2E (Playwright)

```bash
npm run test:e2e       # Executa testes E2E
npx playwright test --ui # Interface visual
```

Cobertura E2E:
- ✅ Autenticação
- ✅ Navegação
- ✅ Acessibilidade
- ✅ Todos os módulos principais (20+ specs)

## ⚡ Performance

### Otimizações Implementadas

| Otimização | Impacto |
|------------|---------|
| Code splitting | ~60% redução do bundle |
| Lazy loading com retry | Carregamento sob demanda |
| Prefetch on idle | Rotas pré-carregadas |
| Virtualização | Listas grandes otimizadas |
| Memoização avançada | Menos re-renders |
| Query optimization | N+1 queries eliminados |
| 35+ índices DB | Queries 2-10x mais rápidas |
| QueryKeys padronizados | Cache otimizado |
| Mobile-first CSS | Layout adaptativo |
| Auto-save IndexedDB | Dados não perdidos |

### Métricas Target

| Métrica | Meta |
|---------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle inicial | < 500KB |
| Lighthouse Performance | > 90 |

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Visão geral e setup |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitetura de componentes |
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | **System Design detalhado** |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guia de contribuição |
| [PRD.md](PRD.md) | Product Requirements Document |
| [ROADMAP.md](ROADMAP.md) | Fases e prioridades |
| [PENDENCIAS.md](PENDENCIAS.md) | Status e pendências |
| [SPRINT_REVIEW.md](SPRINT_REVIEW.md) | Histórico de sprints |

## 🤝 Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes completas.

```bash
# 1. Fork o repositório
# 2. Crie uma branch
git checkout -b feature/minha-feature

# 3. Faça suas alterações
# 4. Execute testes
npm run test
npm run lint

# 5. Commit
git commit -m "feat: adiciona nova feature"

# 6. Push e abra um PR
git push origin feature/minha-feature
```

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido com 💜 por Lovable**

*Última atualização: Janeiro 2026 (Pacote 11 - Auto-save)*
