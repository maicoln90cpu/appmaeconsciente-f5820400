# 🍼 Maternidade Consciente

Uma plataforma PWA completa para auxiliar mães durante a gravidez, parto e pós-parto.

[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Lovable Cloud](https://img.shields.io/badge/Backend-Lovable_Cloud-purple)](https://lovable.dev)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Stack Tecnológica](#stack-tecnológica)
- [Instalação](#instalação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
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
| PostgreSQL | Banco de dados com RLS |
| Auth | Autenticação e autorização |
| Edge Functions | Lógica serverless |
| Storage | Armazenamento de arquivos |

### Ferramentas de Desenvolvimento
| Ferramenta | Descrição |
|------------|-----------|
| Vitest | Testes unitários |
| ESLint | Linting |
| Prettier | Formatação |
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
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run test         # Executa testes
npm run lint         # Verifica código
npm run format       # Formata código
```

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes base (shadcn)
│   ├── admin/           # Painel administrativo
│   ├── alimentacao/     # Módulo de nutrição
│   ├── amamentacao/     # Módulo de amamentação
│   ├── comunidade/      # Módulo de comunidade
│   ├── desenvolvimento/ # Desenvolvimento do bebê
│   ├── recuperacao/     # Recuperação pós-parto
│   ├── sono/            # Monitoramento de sono
│   └── vacinacao/       # Cartão de vacinação
├── hooks/               # Custom hooks
│   ├── factories/       # Factories de hooks
│   └── postpartum/      # Hooks de pós-parto
├── pages/               # Páginas/rotas
├── contexts/            # Contextos React
├── lib/                 # Utilitários
│   └── validators/      # Schemas Zod
├── integrations/        # Integrações externas
│   └── supabase/        # Cliente Supabase
├── types/               # Tipos TypeScript
└── test/                # Testes
    ├── components/
    ├── hooks/
    └── lib/

supabase/
├── functions/           # Edge Functions
└── config.toml          # Configuração
```

## ✨ Funcionalidades

### Módulos Principais

| Módulo | Descrição | Status |
|--------|-----------|--------|
| 🛒 Enxoval | Gestão de itens, orçamento, compartilhamento | ✅ Completo |
| 🍼 Amamentação | Registro de mamadas, ordenha, dashboard | ✅ Completo |
| 😴 Sono | Diário de sono, análises, recomendações | ✅ Completo |
| 💉 Vacinação | Calendário, lembretes, multi-bebês | ✅ Completo |
| 📈 Desenvolvimento | Marcos, alertas, relatórios | ✅ Completo |
| 🍎 Nutrição | Planos, receitas, IA nutricional | ✅ Completo |
| 💪 Recuperação | Sintomas, medicamentos, bem-estar | ✅ Completo |
| 👥 Comunidade | Posts, comentários, desafios | ✅ Completo |
| 📦 Mala Maternidade | Checklist, compartilhamento, PDF | ✅ Completo |
| 🎁 Materiais | Calculadora de fraldas, ferramentas | ✅ Completo |

### Recursos Técnicos

- ✅ **PWA** - Instalável, funciona offline
- ✅ **Background Sync** - Sincronização em segundo plano
- ✅ **RLS** - Row Level Security em todas as tabelas
- ✅ **Lazy Loading** - Carregamento sob demanda
- ✅ **Prefetch** - Pré-carregamento de rotas
- ✅ **Dark Mode** - Tema escuro
- ✅ **Acessibilidade** - ARIA labels, skip links
- ✅ **Responsivo** - Mobile-first

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [README.md](README.md) | Visão geral e setup |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitetura técnica |
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

# 5. Commit
git commit -m "feat: adiciona nova feature"

# 6. Push e abra um PR
git push origin feature/minha-feature
```

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

**Desenvolvido com 💜 por Lovable**

*Última atualização: Janeiro 2026*
