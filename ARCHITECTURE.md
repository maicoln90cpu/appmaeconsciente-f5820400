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
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Edge Functions    │  │
│  │  + RLS      │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Camadas da Aplicação

### 1. Apresentação (UI)

```
src/
├── components/
│   ├── ui/                   # Componentes base (Button, Input, Card, etc.)
│   ├── admin/                # Componentes do painel admin
│   │   ├── user-management/  # Sub-componentes de gestão de usuários
│   │   │   ├── index.ts      # Barrel export
│   │   │   ├── types.ts      # Tipos compartilhados
│   │   │   ├── UserCard.tsx
│   │   │   ├── UserFilters.tsx
│   │   │   ├── UserEmptyStates.tsx
│   │   │   └── UserLoadingError.tsx
│   │   └── ...
│   └── [modulo]/             # Componentes específicos de cada módulo
└── pages/                    # Páginas/rotas da aplicação
```

**Responsabilidades:**
- Renderização de interfaces
- Interação com usuário
- Feedback visual (loading, erros, sucesso)

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

### 3. Serviços (Integrations)

```
src/integrations/
└── supabase/
    ├── client.ts         # Cliente Supabase
    └── types.ts          # Tipos gerados
```

**Responsabilidades:**
- Comunicação com backend
- Autenticação
- Operações de banco de dados

### 4. Utilitários

```
src/lib/
├── utils.ts              # Funções gerais
├── calculations.ts       # Cálculos financeiros
├── validators/           # Schemas Zod
└── logger.ts             # Sistema de logging
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

## Performance

### Lazy Loading

```typescript
// Páginas carregadas sob demanda
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Com retry automático
const Page = lazyWithRetry(() => import('./pages/Page'));
```

### Prefetch

```typescript
// Rotas pré-carregadas no hover
onMouseEnter={() => preloadComponent(routeImports.dashboard)}
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

## Testes

### Estrutura

```
src/test/
├── setup.ts              # Configuração global
├── test-utils.tsx        # Helpers de teste
├── lib/                  # Testes de utilitários
└── components/           # Testes de componentes
```

### Executando

```bash
npm run test              # Executa todos os testes
npm run test -- --watch   # Watch mode
```

## Deploy

A aplicação é deployada automaticamente via Lovable:

1. Push para branch principal
2. Build automático
3. Deploy para CDN
4. Edge functions deployadas

## Monitoramento

### Logs

- Console logs em desenvolvimento
- Logger estruturado em produção

### Analytics

- Google Tag Manager configurável
- Eventos de usuário rastreados

---

## Otimizações de Bundle

### Code Splitting

- Páginas carregadas sob demanda via `lazyWithRetry`
- Componentes admin carregados via `lazy()` no AdminDashboard
- Seções da Landing page separadas em componentes (`src/components/landing/`)

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
├── admin/
│   └── user-management/  # Sub-componentes
└── ...
```

---

*Diagrama de arquitetura atualizado em Janeiro 2026*
