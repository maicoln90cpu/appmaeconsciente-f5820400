# 🏗️ Arquitetura do Sistema

## Visão Geral

O sistema é uma aplicação web progressiva (PWA) construída com React, focada em auxiliar mães durante a gravidez e pós-parto.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │  TanStack   │  │    Tailwind CSS     │  │
│  │   + Vite    │  │   Query     │  │    + shadcn/ui      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Vitest    │  │  Playwright │  │      Sentry         │  │
│  │   Tests     │  │    E2E      │  │    Monitoring       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Edge Functions    │  │
│  │  + RLS      │  │             │  │      (28+)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │   Storage   │  │  Realtime   │                           │
│  │             │  │             │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Camadas da Aplicação

### 1. Apresentação (UI)

```
src/
├── components/
│   ├── ui/                   # Componentes base (Button, Input, Card, etc.)
│   │   ├── virtualized-list.tsx    # Lista virtualizada para grandes volumes
│   │   ├── optimized-components.tsx # Componentes com memoização
│   │   └── ...
│   ├── admin/                # Componentes do painel admin
│   │   ├── user-management/  # Sub-componentes de gestão de usuários
│   │   │   ├── index.ts      # Barrel export
│   │   │   ├── types.ts      # Tipos compartilhados
│   │   │   └── ...
│   │   └── ...
│   ├── dashboard-bebe/       # Dashboard unificado do bebê
│   │   ├── index.ts          # Barrel export
│   │   ├── DashboardBebeHeader.tsx
│   │   ├── DashboardBebeKPIs.tsx
│   │   ├── DashboardBebeTabs.tsx
│   │   └── ...
│   ├── gamification/         # Sistema de gamificação
│   │   ├── index.ts
│   │   ├── BadgeGrid.tsx
│   │   ├── LevelProgress.tsx
│   │   └── ...
│   ├── insights/             # Insights cross-module
│   │   ├── index.ts
│   │   ├── ActionableInsights.tsx
│   │   └── CrossModuleInsights.tsx
│   ├── onboarding/           # Onboarding do usuário
│   ├── offline/              # Componentes offline/sync
│   ├── pwa/                  # Componentes PWA
│   └── [modulo]/             # Componentes específicos de cada módulo
└── pages/                    # Páginas/rotas da aplicação
```

**Responsabilidades:**
- Renderização de interfaces
- Interação com usuário
- Feedback visual (loading, erros, sucesso)
- Virtualização de listas grandes

### 2. Lógica de Negócio (Hooks)

```
src/hooks/
├── factories/                # Factories para geração de hooks
│   ├── index.ts
│   └── createSupabaseCRUD.ts # Factory CRUD genérica
├── postpartum/               # Hooks de recuperação pós-parto
│   ├── index.ts              # Barrel export
│   ├── useSymptoms.ts
│   ├── useMedications.ts
│   ├── useAppointments.ts
│   ├── useAchievements.ts
│   ├── useEmotionalLogs.ts
│   ├── useRecoveryChecklist.ts
│   └── useBodyImageLog.ts
├── useAuthenticatedAction.ts # Utilitário para ações autenticadas
├── useMemoizedCallback.ts    # Memoização avançada
├── useVirtualizedList.ts     # Hook para listas virtualizadas
├── useCrossModuleAnalytics.ts# Analytics cross-module
├── useDashboardBebe.ts       # Dashboard unificado
├── useGamification.ts        # Sistema de gamificação
├── useProfile.ts             # Dados do perfil
├── useEnxovalItems.ts        # Gestão do enxoval
├── useBabyFeeding.ts         # Amamentação
├── useBabySleep.ts           # Sono do bebê
├── useVaccination.ts         # Vacinação
└── ...
```

**Responsabilidades:**
- Gerenciamento de estado
- Chamadas à API
- Transformação de dados
- Cache e sincronização
- Memoização e otimização

### Factories & Abstrações

#### useAuthenticatedAction

Hook centralizado para ações que requerem autenticação:

```typescript
import { useAuthenticatedAction, getAuthenticatedUser } from '@/hooks/useAuthenticatedAction';

// Em componentes
const { executeAuthenticated, getUserId } = useAuthenticatedAction();
await executeAuthenticated(async (userId) => {
  // ação autenticada
});

// Em queryFn do React Query
const userId = await getAuthenticatedUser(); // throws se não autenticado
```

#### createSupabaseCRUD

Factory para criar hooks CRUD com React Query:

```typescript
import { createSupabaseCRUD } from '@/hooks/factories';

const useNotes = createSupabaseCRUD<Note, NoteInsert>({
  tableName: 'notes',
  queryKey: ['notes'],
  orderBy: 'created_at',
  messages: {
    addSuccess: 'Nota criada!',
  },
});

// Uso
const { data, add, update, remove, isLoading } = useNotes();
```

#### useMemoizedCallback

Hook para memoização avançada:

```typescript
import { useMemoizedCallback } from '@/hooks/useMemoizedCallback';

const handleClick = useMemoizedCallback((id: string) => {
  // função memoizada que não muda referência
}, []);
```

### 3. Serviços (Integrations)

```
src/integrations/
└── supabase/
    ├── client.ts         # Cliente Supabase
    └── types.ts          # Tipos gerados automaticamente
```

**Responsabilidades:**
- Comunicação com backend
- Autenticação
- Operações de banco de dados

### 4. Utilitários

```
src/lib/
├── utils.ts              # Funções gerais (cn, formatters)
├── calculations.ts       # Cálculos financeiros
├── lazy-utils.ts         # Lazy loading com retry e prefetch
├── performance.ts        # Monitoramento de performance
├── logger.ts             # Sistema de logging estruturado
├── sentry.ts             # Configuração Sentry
├── offline-cache.ts      # Cache offline
├── offline-sync.ts       # Sincronização offline
├── background-sync.ts    # Background sync
├── push-notifications.ts # Push notifications
├── rate-limiter.ts       # Rate limiting
├── url-validator.ts      # Validação de URLs
├── accessibility.tsx     # Utilitários de acessibilidade
├── analytics.ts          # Analytics
├── bundle-analyzer.ts    # Análise de bundle
├── size-predictions.ts   # Predições de tamanho
└── validators/           # Schemas Zod
    └── auth.ts           # Validação de auth
```

### 5. Testes

```
src/test/
├── setup.ts              # Configuração global Vitest
├── test-utils.tsx        # Helpers de teste
├── components/
│   └── ui/               # Testes de componentes UI
│       ├── alert.test.tsx
│       ├── button.test.tsx
│       ├── card.test.tsx
│       ├── dialog.test.tsx
│       ├── form.test.tsx
│       ├── input.test.tsx
│       └── tabs.test.tsx
├── hooks/
│   ├── factories/
│   │   └── createSupabaseCRUD.test.ts
│   └── ...               # Testes de hooks
└── lib/
    ├── calculations.test.ts
    ├── utils.test.ts
    └── validators/
        └── auth.test.ts

e2e/                      # Testes E2E Playwright
├── fixtures/
│   └── auth.ts           # Fixtures de autenticação
├── global.setup.ts       # Setup global
├── auth.spec.ts
├── navigation.spec.ts
├── accessibility.spec.ts
└── [modulo].spec.ts      # Specs por módulo
```

## Fluxo de Dados

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   User   │───▶│   Page   │───▶│   Hook   │───▶│ Supabase │
│  Action  │    │Component │    │  Query   │    │   API    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     ▲               │
                     │               ▼
                     │         ┌──────────┐
                     └─────────│  Cache   │
                               │(TanStack)│
                               └──────────┘
```

1. **Usuário** interage com a UI
2. **Componente** chama hook apropriado
3. **Hook** verifica cache e/ou faz requisição
4. **TanStack Query** gerencia cache e estados
5. **Supabase Client** comunica com backend
6. Dados fluem de volta para a UI

## Módulos Principais

### Autenticação

```typescript
// AuthContext gerencia estado global de auth
const { user, session, signOut } = useAuth();

// ProtectedRoute protege rotas autenticadas
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Perfil do Usuário

```typescript
const { profile, updateProfile } = useProfile();
```

### Enxoval

```typescript
const { 
  items, 
  addItem, 
  updateItem, 
  deleteItem 
} = useEnxovalItems();
```

### Dashboard Bebê

```typescript
const {
  todayStats,
  alerts,
  recentActivities,
  isLoading
} = useDashboardBebe();
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS:

```sql
-- Exemplo: usuários só veem seus próprios dados
CREATE POLICY "Users can view own data" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
```

### Validação

```typescript
// Entrada validada com Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

### Proteções Adicionais
- ✅ Leaked password protection habilitado
- ✅ Rate limiting em edge functions
- ✅ CORS configurado
- ✅ Validação de input com Zod

## Performance

### Lazy Loading

```typescript
// Páginas carregadas sob demanda com retry
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));

// Componentes pesados com lazy
const GrowthChart = lazy(() => import('./components/crescimento/GrowthChart'));
```

### Prefetch

```typescript
// Rotas pré-carregadas no hover
onMouseEnter={() => preloadComponent(routeImports.dashboard)}

// Prefetch durante idle time
requestIdleCallback(() => {
  prefetchCommonRoutes();
});
```

### Virtualização

```typescript
// Listas virtualizadas para grandes volumes
<VirtualizedList
  items={items}
  itemHeight={60}
  renderItem={(item) => <ItemCard item={item} />}
/>
```

### Caching

```typescript
// TanStack Query com cache otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutos
      gcTime: 30 * 60 * 1000,    // 30 minutos
    }
  }
});
```

## Tratamento de Erros

### Error Boundaries

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Logging Estruturado

```typescript
import { logger } from '@/lib/logger';

logger.error('Falha ao carregar dados', { userId, error });
```

### Sentry Integration

```typescript
// Erros capturados automaticamente
Sentry.captureException(error);
```

## Testes

### Estrutura

```
src/test/
├── setup.ts              # Configuração global
├── test-utils.tsx        # Helpers de teste
├── lib/                  # Testes de utilitários
├── hooks/                # Testes de hooks
└── components/           # Testes de componentes

e2e/                      # Testes E2E
```

### Executando

```bash
# Testes unitários
npm run test              # Executa todos
npm run test -- --watch   # Watch mode
npm run test -- --coverage # Com cobertura

# Testes E2E
npm run test:e2e          # Executa todos
npx playwright test --ui  # Interface visual
```

## Deploy

A aplicação é deployada automaticamente via Lovable:

1. Push para branch principal
2. Build automático
3. Deploy para CDN
4. Edge functions deployadas automaticamente

## Monitoramento

### Logs

- Console logs em desenvolvimento
- Logger estruturado em produção
- Sentry para erros em produção

### Analytics

- Google Tag Manager configurável
- Eventos de usuário rastreados
- Métricas de performance

---

## Otimizações de Bundle

### Code Splitting

- Páginas carregadas sob demanda via `lazyWithRetry`
- Componentes admin carregados via `lazy()` no AdminDashboard
- Componentes do DashboardBebe carregados sob demanda (16 componentes)
- Seções da Landing page separadas em componentes (`src/components/landing/`)

### Prefetch Strategies

- Prefetch on hover para navegação
- Prefetch durante idle time para rotas comuns
- Preload de assets críticos

### Tree-Shaking

- Imports de ícones Lucide específicos (não usar `import * from`)
- Exports nomeados em barrel files para melhor tree-shaking

### Estrutura de Componentes Modulares

```
src/components/
├── landing/              # Seções da landing page
│   ├── index.ts
│   ├── TestimonialsSection.tsx
│   └── FeaturesSection.tsx
├── dashboard-bebe/       # Dashboard do bebê
│   ├── index.ts
│   └── ...
├── gamification/         # Gamificação
│   ├── index.ts
│   └── ...
├── admin/
│   └── user-management/  # Sub-componentes
└── ...
```

---

## Edge Functions

O projeto possui 28+ edge functions para lógica de backend:

```
supabase/functions/
├── _shared/
│   ├── cors.ts           # CORS headers
│   └── rate-limiter.ts   # Rate limiting
├── generate-meal-plan/   # IA para planos alimentares
├── generate-nutrition-plan/
├── generate-exercises/
├── generate-recipes/
├── nutrition-chat/       # Chat nutricional com IA
├── hotmart-webhook/      # Integração Hotmart
├── send-resend-email/    # Envio de emails
│   └── templates/        # Templates de email
└── ...
```

---

## Responsividade Mobile

### Estratégias Implementadas

- **Texto Adaptativo**: Classes CSS globais (`.text-adaptive`, `.no-overflow-text`)
- **Grids Responsivos**: `grid-cols-2 sm:grid-cols-4` para tabs e cards
- **Tabelas → Cards**: Exibição condicional `sm:hidden` / `hidden sm:block`
- **Legendas de Gráficos**: Ocultas em mobile com CSS seletores
- **Botões Adaptativos**: Texto abreviado com `hidden xs:inline` / `xs:hidden`

### Breakpoints

```css
xs: 475px   /* Smartphones pequenos */
sm: 640px   /* Smartphones */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
```

---

*Diagrama de arquitetura atualizado em Janeiro 2026 (Sprint 5 - Mobile UX)*
