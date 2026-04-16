# 🏛️ System Design Document

## Mãe Consciente

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Responsável:** Development Team

---

## 1. Visão Geral da Arquitetura

### 1.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (PWA)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        React + Vite + TypeScript                     │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │ │
│  │  │   Pages   │  │Components │  │   Hooks   │  │    Contexts       │ │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │ │
│  │  │  TanStack │  │  Router   │  │ IndexedDB │  │  Service Worker   │ │ │
│  │  │   Query   │  │           │  │           │  │                   │ │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD (Supabase)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                           API Gateway                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │PostgreSQL │  │   Auth    │  │  Storage  │  │    Edge Functions     │ │
│  │  + RLS    │  │           │  │           │  │       (28+)           │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────────────┘ │
│  ┌───────────┐  ┌───────────────────────────────────────────────────────┐ │
│  │ Realtime  │  │                    Rate Limiting                      │ │
│  └───────────┘  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVIÇOS EXTERNOS                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │  Sentry   │  │  Resend   │  │  OpenAI   │  │    Plausible/GTM      │ │
│  │(Monitoring)│  │  (Email)  │  │  (AI/LLM) │  │    (Analytics)        │ │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnológico Completo

| Camada | Tecnologia | Versão | Propósito |
|--------|------------|--------|-----------|
| **Frontend** | React | 18.3 | UI Library |
| | TypeScript | 5.x | Type Safety |
| | Vite | 5.x | Build Tool |
| | Tailwind CSS | 3.x | Styling |
| | shadcn/ui | latest | Component Library |
| | TanStack Query | 5.x | Server State |
| | React Router | 6.x | Routing |
| | Zod | 3.x | Validation |
| | Recharts | 2.x | Charts |
| **Backend** | PostgreSQL | 15 | Database |
| | Supabase Auth | - | Authentication |
| | Edge Functions | Deno | Serverless |
| | Supabase Storage | - | File Storage |
| | Supabase Realtime | - | WebSockets |
| **PWA** | vite-plugin-pwa | 1.x | PWA Support |
| | IndexedDB | - | Offline Storage |
| | Service Worker | - | Caching/Sync |
| **Testing** | Vitest | 4.x | Unit Tests |
| | Playwright | 1.57 | E2E Tests |
| **Monitoring** | Sentry | 10.x | Error Tracking |
| | Plausible | - | Analytics |

---

## 2. Fluxos de Dados

### 2.1 Fluxo de Autenticação

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│ Supabase │────▶│  JWT     │────▶│ AuthCtx  │
│  Form    │     │   Auth   │     │  Token   │     │  Update  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                  │
                      ▼                                  ▼
                ┌──────────┐                      ┌──────────┐
                │  Create  │                      │ Protected│
                │ Profile  │                      │  Routes  │
                └──────────┘                      └──────────┘
```

**Fluxo detalhado:**
1. Usuário submete credenciais
2. Supabase Auth valida e retorna JWT
3. Token armazenado em `localStorage` via Supabase client
4. `AuthContext` atualiza estado global
5. Rotas protegidas verificam `user` no contexto
6. Profile criado automaticamente via trigger SQL

### 2.2 Fluxo de Dados CRUD

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   UI     │────▶│  Custom  │────▶│ TanStack │────▶│ Supabase │
│ Component│     │   Hook   │     │  Query   │     │  Client  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                │                │                │
     │                ▼                ▼                ▼
     │          ┌──────────┐     ┌──────────┐     ┌──────────┐
     │          │  State   │     │  Cache   │     │PostgreSQL│
     │          │ Updates  │     │ Invalidate│    │  + RLS   │
     │          └──────────┘     └──────────┘     └──────────┘
     │                │
     └────────────────┘
```

**Código exemplo:**
```typescript
// Hook customizado usando factory
const useNotes = createSupabaseCRUD<Note, NoteInsert>({
  tableName: 'notes',
  queryKey: QueryKeys.notes.all,
  orderBy: 'created_at',
});

// Uso no componente
const { data, add, update, remove, isLoading } = useNotes();
```

### 2.3 Fluxo Offline-First

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│  Action  │────▶│  Online? │
│  Action  │     │  Handler │     │          │
└──────────┘     └──────────┘     └──────────┘
                                       │
                      ┌────────────────┼────────────────┐
                      ▼                                 ▼
                ┌──────────┐                      ┌──────────┐
                │ Execute  │                      │  Queue   │
                │ Supabase │                      │ IndexedDB│
                └──────────┘                      └──────────┘
                      │                                 │
                      ▼                                 ▼
                ┌──────────┐                      ┌──────────┐
                │ Optimistic│                     │  Sync    │
                │  Update  │                      │ on Online│
                └──────────┘                      └──────────┘
```

**Implementação:**
```typescript
// src/lib/offline-sync.ts
export const offlineSync = {
  registerHandler(type: string, handler: SyncHandler) { ... },
  queueOperation(task: SyncTask) { ... },
  processQueue() { ... },
};

// src/hooks/useOfflineSync.ts
export function useOfflineSync() {
  const queueOperation = async (type, table, operation, data) => {
    if (navigator.onLine) {
      await executeDirectly(type, table, operation, data);
    } else {
      await offlineSync.queueOperation({ type, table, operation, data });
    }
  };
  return { queueOperation, retryFailed, ... };
}
```

### 2.4 Fluxo de Auto-save (Rascunhos)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Form    │────▶│ Debounce │────▶│ IndexedDB│────▶│ Indicator│
│  Change  │     │  2000ms  │     │   Save   │     │  Update  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
                                 ┌──────────┐
                                 │  Draft   │
                                 │ Recovery │
                                 └──────────┘
```

**Implementação:**
```typescript
// src/hooks/useAutoSave.ts
export function useAutoSave<T>({
  type,
  debounceMs = 2000,
  minDataCheck,
}: UseAutoSaveOptions) {
  const triggerAutoSave = useCallback((data: T) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveDraft(data), debounceMs);
  }, []);
  
  return { triggerAutoSave, loadDraft, deleteDraft, ... };
}
```

---

## 3. Algoritmos e Lógica de Negócio

### 3.1 Cálculos de Enxoval

```typescript
// src/lib/calculations.ts

// Prioridade baseada em necessidade
export const calculatePriority = (necessity: Necessity): number => {
  const priorities = { "Necessário": 1, "Depois": 2, "Não": 3 };
  return priorities[necessity] || 3;
};

// Subtotal planejado
export const calculateSubtotalPlanned = (qty: number, price: number): number => 
  qty * price;

// Subtotal pago (com frete e desconto)
export const calculateSubtotalPaid = (
  qty: number, 
  unitPrice: number, 
  frete: number, 
  desconto: number
): number => (qty * unitPrice) + frete - desconto;

// Economia
export const calculateSavings = (planned: number, paid: number): number => 
  planned - paid;

// Percentual de economia
export const calculateSavingsPercent = (planned: number, paid: number): number => 
  planned > 0 ? ((planned - paid) / planned) * 100 : 0;
```

### 3.2 Lógica de Sono do Bebê

```typescript
// Determinar tipo de sono (noturno/diurno)
const getSleepType = (startTime: Date): 'noturno' | 'diurno' => {
  const hour = startTime.getHours();
  return (hour >= 20 || hour < 6) ? 'noturno' : 'diurno';
};

// Calcular duração em minutos
const calculateDuration = (start: Date, end: Date): number => 
  Math.round((end.getTime() - start.getTime()) / 60000);

// Recomendações por idade (baby_sleep_milestones)
const getRecommendations = (ageMonths: number): SleepMilestone => {
  return milestones.find(m => 
    ageMonths >= m.age_range_start && ageMonths <= m.age_range_end
  );
};
```

### 3.3 Sistema de Gamificação

```typescript
// src/hooks/useGamification.ts

// Cálculo de XP para próximo nível
const getXPForLevel = (level: number): number => 
  Math.floor(100 * Math.pow(1.5, level - 1));

// Verificar badges elegíveis
const checkBadgeEligibility = async (userId: string, badgeCode: string) => {
  const badge = badges.find(b => b.code === badgeCode);
  if (!badge) return false;
  
  switch (badge.requirement_type) {
    case 'action_count':
      return await getActionCount(userId, badge.category) >= badge.requirement_value;
    case 'streak':
      return await getStreakDays(userId) >= badge.requirement_value;
    case 'milestone':
      return await checkMilestone(userId, badge.code);
    default:
      return false;
  }
};
```

### 3.4 Algoritmo de Prefetch

```typescript
// src/lib/bundle-analyzer.ts

// Padrões de navegação para prefetch inteligente
const NAVIGATION_PATTERNS = {
  '/dashboard': ['/dashboard-bebe', '/diario-sono', '/rastreador-amamentacao'],
  '/dashboard-bebe': ['/diario-sono', '/rastreador-amamentacao', '/cartao-vacinacao'],
};

// Prefetch durante idle time
export function setupSmartPrefetch(routes: PrefetchRoute[]) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach(route => {
        if (route.priority === 'high') {
          route.loader(); // Trigger dynamic import
        }
      });
    }, { timeout: 10000 });
  }
}
```

---

## 4. APIs e Endpoints

### 4.1 Edge Functions

| Função | Método | Descrição | Auth |
|--------|--------|-----------|------|
| `apply-promotion` | POST | Aplica cupom de desconto | ✅ |
| `auto-engage-community` | POST | IA para engajamento | Admin |
| `check-development-alerts` | POST | Verifica alertas de marcos | ✅ |
| `check-exchange-alerts` | POST | Verifica alertas de troca | ✅ |
| `cleanup-old-logs` | POST | Limpa logs antigos | Admin |
| `create-user-admin` | POST | Cria usuário (admin) | Admin |
| `delete-user-admin` | POST | Remove usuário (admin) | Admin |
| `delete-user-data` | POST | LGPD - exclui dados | ✅ |
| `export-user-data` | POST | LGPD - exporta dados | ✅ |
| `generate-comment` | POST | IA gera comentário | ✅ |
| `generate-exercises` | POST | IA gera exercícios | ✅ |
| `generate-meal-plan` | POST | IA gera plano alimentar | ✅ |
| `generate-nutrition-plan` | POST | IA gera plano nutricional | ✅ |
| `generate-recipes` | POST | IA gera receitas | ✅ |
| `grant-trial-access` | POST | Concede trial premium | Admin |
| `hotmart-webhook` | POST | Webhook Hotmart | Webhook |
| `notify-ticket-created` | POST | Notifica novo ticket | Internal |
| `nutrition-chat` | POST | Chat nutricional IA | ✅ |
| `resend-purchase-credentials` | POST | Reenvia credenciais | Admin |
| `seed-community` | POST | Seeds para comunidade | Admin |
| `send-resend-email` | POST | Envia email via Resend | Internal |
| `send-weekly-recovery-email` | POST | Email semanal | Cron |

### 4.2 Estrutura de Resposta (Error Handler)

```typescript
// supabase/functions/_shared/error-handler.ts

// Resposta de sucesso
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Resposta de erro
interface ErrorResponse {
  success: false;
  error: {
    code: string;          // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
    message: string;       // Mensagem amigável
    details?: unknown;     // Detalhes técnicos (dev only)
  };
}

// Uso
return handleSuccess(data);
return handleError('VALIDATION_ERROR', 'Email inválido', { field: 'email' });
```

### 4.3 Rate Limiting

```typescript
// supabase/functions/_shared/rate-limiter.ts

const LIMITS = {
  generate: { window: 60000, max: 10 },    // 10/min
  chat: { window: 60000, max: 20 },        // 20/min
  default: { window: 60000, max: 100 },    // 100/min
};

export async function checkRateLimit(
  userId: string, 
  action: string
): Promise<boolean> {
  const limit = LIMITS[action] || LIMITS.default;
  const count = await getRequestCount(userId, action, limit.window);
  return count < limit.max;
}
```

---

## 5. Banco de Dados

### 5.1 Diagrama ER (Principais Entidades)

```
┌─────────────────────┐       ┌─────────────────────┐
│      profiles       │       │  baby_vaccination   │
│─────────────────────│       │      _profiles      │
│ id (PK, FK auth)    │──────▶│─────────────────────│
│ email               │       │ id (PK)             │
│ nome_completo       │       │ user_id (FK)        │
│ perfil_completo     │       │ baby_name           │
│ role                │       │ birth_date          │
│ ...                 │       │ gender              │
└─────────────────────┘       └─────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ baby_feeding    │ │   baby_sleep    │ │baby_vaccinations│
          │     _logs       │ │     _logs       │ │                 │
          │─────────────────│ │─────────────────│ │─────────────────│
          │ id (PK)         │ │ id (PK)         │ │ id (PK)         │
          │ user_id (FK)    │ │ user_id (FK)    │ │ baby_profile_id │
          │ feeding_type    │ │ sleep_start     │ │ vaccine_name    │
          │ duration_minutes│ │ sleep_end       │ │ application_date│
          └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 5.2 Índices Otimizados (35+)

```sql
-- Posts
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_categoria ON posts(categoria);

-- Baby Logs
CREATE INDEX idx_feeding_user_start ON baby_feeding_logs(user_id, start_time DESC);
CREATE INDEX idx_sleep_user_start ON baby_sleep_logs(user_id, sleep_start DESC);
CREATE INDEX idx_vaccinations_profile ON baby_vaccinations(baby_profile_id);

-- Milestones
CREATE INDEX idx_milestones_profile_type ON baby_milestone_records(baby_profile_id, milestone_type_id);

-- Gamification
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date);
CREATE INDEX idx_user_badges_unlocked ON user_badges(user_id, unlocked_at);
```

### 5.3 RLS Policies Pattern

```sql
-- Padrão: Usuário vê apenas seus dados
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 6. Interfaces e Tipos

### 6.1 Tipos Principais Exportados

```typescript
// src/types/index.ts
export * from './enxoval';
export * from './babyFeeding';
export * from './babySleep';
export * from './development';
export * from './vaccination';

// src/types/enxoval.ts
export type Category = "Roupas" | "Higiene" | "Quarto" | "Alimentação" | "Mãe" | "Extras";
export type Necessity = "Necessário" | "Depois" | "Não";
export type Status = "A comprar" | "Comprado";
export type Size = "RN" | "P" | "M" | "G" | "Opcional";

export interface EnxovalItem {
  id: string;
  category: Category;
  item: string;
  necessity: Necessity;
  priority: number;
  size?: Size;
  // ...
}
```

### 6.2 Query Keys Padronizados

```typescript
// src/lib/query-config.ts
export const QueryKeys = {
  // User
  user: {
    profile: (userId: string) => ['profile', userId],
    settings: ['user', 'settings'],
    role: ['user', 'role'],
  },
  
  // Baby
  baby: {
    profiles: ['baby', 'profiles'],
    profile: (id: string) => ['baby', 'profile', id],
  },
  
  // Feeding
  feeding: {
    all: ['feeding'],
    logs: (userId: string) => ['feeding', 'logs', userId],
    stats: (userId: string, period: string) => ['feeding', 'stats', userId, period],
  },
  
  // ... 40+ keys
};

export const QueryCacheConfig = {
  static: { staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000 },
  user: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  realtime: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },
};
```

### 6.3 Hook Interfaces

```typescript
// Hook de retorno padrão
interface UseCRUDReturn<T> {
  data: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  add: (item: Partial<T>) => Promise<void>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Hook de auto-save
interface UseAutoSaveReturn<T> {
  saveDraft: (data: T) => Promise<void>;
  loadDraft: () => Promise<T | null>;
  deleteDraft: () => Promise<void>;
  draftId: string | null;
  isSaving: boolean;
  hasSavedRecently: boolean;
  lastSavedAt: Date | null;
  availableDrafts: DraftEntry[];
  triggerAutoSave: (data: T) => void;
}
```

---

## 7. Padrões de Código

### 7.1 Estrutura de Componentes

```typescript
// Componente com auto-save e loading states
export function MyForm({ onSubmit }: MyFormProps) {
  // 1. Hooks primeiro
  const { toast } = useToast();
  const { triggerAutoSave, isSaving, hasSavedRecently } = useAutoSave({ type: 'my-form' });
  
  // 2. Estados locais
  const [formData, setFormData] = useState(defaultFormData);
  
  // 3. Effects
  useEffect(() => {
    triggerAutoSave(formData);
  }, [formData, triggerAutoSave]);
  
  // 4. Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    await deleteDraft();
  };
  
  // 5. Render
  return (
    <Card>
      <CardHeader>
        <DraftIndicator isSaving={isSaving} hasSavedRecently={hasSavedRecently} />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>...</form>
      </CardContent>
    </Card>
  );
}
```

### 7.2 Estrutura de Hooks

```typescript
// Hook com React Query
export function useMyData(userId: string) {
  const queryClient = useQueryClient();
  
  // Query
  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.myData.all(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    ...QueryCacheConfig.user,
    enabled: !!userId,
  });
  
  // Mutations
  const addMutation = useMutation({
    mutationFn: async (newItem: MyItemInsert) => {
      const { error } = await supabase.from('my_table').insert(newItem);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.myData.all(userId) });
      toast.success('Item adicionado!');
    },
  });
  
  return { data, isLoading, error, add: addMutation.mutate };
}
```

### 7.3 Estrutura de Edge Functions

```typescript
// supabase/functions/my-function/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { handleError, handleSuccess, withErrorHandler } from "../_shared/error-handler.ts";

Deno.serve(withErrorHandler(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return handleError("UNAUTHORIZED", "Missing authorization");
  }
  
  // Parse body
  const body = await req.json();
  
  // Business logic
  const result = await processData(body);
  
  // Success response
  return handleSuccess(result);
}));
```

---

## 8. Monitoramento e Observabilidade

### 8.1 Sentry

```typescript
// src/lib/sentry.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

### 8.2 Logging Estruturado

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, context?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...context, timestamp: new Date() }));
  },
  error: (message: string, error?: unknown, context?: object) => {
    console.error(JSON.stringify({ level: 'error', message, error, ...context }));
    Sentry.captureException(error);
  },
};
```

### 8.3 Analytics

```typescript
// src/lib/analytics.ts
export const analytics = {
  track: (event: string, properties?: object) => {
    if (typeof plausible !== 'undefined') {
      plausible(event, { props: properties });
    }
  },
  identify: (userId: string) => { ... },
};
```

---

## 9. Deploy e CI/CD

### 9.1 Fluxo de Deploy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Commit    │────▶│   Lovable   │────▶│   Preview   │
│  to Branch  │     │   Build     │     │    URL      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │    Tests    │
                    │  (Vitest +  │
                    │ Playwright) │
                    └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Publish    │
                    │ (Production)│
                    └─────────────┘
```

### 9.2 Playwright CI

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Documentos Relacionados

- [README.md](README.md) - Setup e visão geral
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura de componentes
- [PRD.md](PRD.md) - Requisitos do produto
- [ROADMAP.md](ROADMAP.md) - Fases e timeline
- [PENDENCIAS.md](PENDENCIAS.md) - Status de pendências
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guia de contribuição

---

*Documento mantido por: Development Team*  
*Última atualização: Janeiro 2026*
