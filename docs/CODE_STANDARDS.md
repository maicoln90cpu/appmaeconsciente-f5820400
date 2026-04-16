# 📏 Padrões de Código — Mãe Consciente

**Última atualização:** Abril 2026

---

## Índice

- [TypeScript](#typescript)
- [React](#react)
- [Supabase / Banco de Dados](#supabase--banco-de-dados)
- [Estilização](#estilização)
- [Testes](#testes)
- [Comentários](#comentários)
- [Exemplos Do / Don't](#exemplos-do--dont)

---

## TypeScript

### Regras obrigatórias

| Regra | Descrição |
|-------|-----------|
| Strict mode | `strict: true` no tsconfig |
| Sem `any` | Usar `unknown` ou tipar corretamente |
| Named exports | `export { logger }` — nunca `export default` para utilitários |
| Interfaces vs Types | Preferir `interface` para objetos, `type` para unions |

### Imports

```typescript
// ✅ Correto — named imports, caminho com alias
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ❌ Errado — default import, caminho relativo
import logger from "../../lib/logger";
```

---

## React

### Componentes

```typescript
// ✅ Correto — interface Props separada, function component
interface MeuComponenteProps {
  titulo: string;
  onAction: () => void;
}

export function MeuComponente({ titulo, onAction }: MeuComponenteProps) {
  return <div>{titulo}</div>;
}

// ❌ Errado — React.FC, props inline
const MeuComponente: React.FC<{ titulo: string }> = ({ titulo }) => { ... }
```

### Hooks

- Prefixo `use` obrigatório
- Um hook por arquivo
- Retornar objeto nomeado (não array)

### Toast / Notificações

```typescript
// ✅ Correto — Sonner
import { toast } from "sonner";
toast.success("Salvo com sucesso!");

// ❌ Errado — shadcn useToast (removido do projeto)
import { useToast } from "@/hooks/use-toast";
```

### Loading States

```typescript
// ✅ Correto — PageLoader padronizado
import { PageLoader } from "@/components/ui/page-loader";
if (isLoading) return <PageLoader />;

// ❌ Errado — spinner avulso
if (isLoading) return <div className="animate-spin">...</div>;
```

### Empty States

```typescript
// ✅ Correto — EmptyState padronizado
import { EmptyState } from "@/components/ui/empty-state";
if (items.length === 0) return <EmptyState icon={Icon} title="..." />;
```

---

## Supabase / Banco de Dados

### Queries

```typescript
// ✅ Correto — colunas explícitas
const { data } = await supabase
  .from("posts")
  .select("id, title, created_at, user_id")
  .eq("user_id", userId);

// ❌ PROIBIDO — select('*')
const { data } = await supabase.from("posts").select("*");
```

### QueryKeys

```typescript
// ✅ Correto — QueryKeys padronizados
import { queryKeys } from "@/lib/query-config";
useQuery({ queryKey: queryKeys.posts.list(userId), ... });

// ❌ Errado — strings avulsas
useQuery({ queryKey: ["posts", userId], ... });
```

### Realtime

```typescript
// ✅ Correto — canal único por user
const channel = supabase.channel(`posts-${user.id}`);

// ❌ Errado — canal genérico (conflito entre usuários)
const channel = supabase.channel("posts");
```

### Tipagem

```typescript
// ✅ Correto — usar tipos gerados
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
type Post = Tables<"posts">;
type NewPost = TablesInsert<"posts">;

// ❌ Errado — tipos manuais que ficam desatualizados
interface Post { id: string; title: string; ... }
```

---

## Estilização

### Tailwind

```tsx
// ✅ Correto — tokens semânticos
<div className="bg-background text-foreground border-border">
<Button className="bg-primary text-primary-foreground">

// ❌ Errado — cores hardcoded
<div className="bg-white text-gray-900">
<Button className="bg-blue-500 text-white">
```

### Dark Mode

```tsx
// ✅ Correto — dark: variants quando necessário
<span className="text-yellow-600 dark:text-yellow-400">

// ❌ Errado — sem suporte dark
<span className="text-yellow-600">
```

### Touch Targets

```tsx
// ✅ Correto — mínimo 44px em mobile
<Button size="icon"> {/* já garante 44px */}

// ❌ Errado — targets pequenos
<button className="h-6 w-6">
```

---

## Testes

### Unitários (Vitest)

- Arquivo: `src/test/[area]/nome.test.ts`
- Mocks de Supabase via `vi.mock()`
- Testar happy path + edge cases

### E2E (Playwright)

- Arquivo: `e2e/nome.spec.ts`
- Fixtures de autenticação
- Testar fluxos completos do usuário

---

## Comentários

### Idioma

Todos os comentários em **PT-BR** (padrão do projeto).

```typescript
// ✅ Correto
// Busca perfis de bebê do usuário autenticado

// ❌ Errado
// Fetch baby profiles for authenticated user
```

### JSDoc para funções exportadas

```typescript
/**
 * Calcula o nível do usuário baseado no XP acumulado
 * @param xp - Total de XP do usuário
 * @returns Nível atual (1-50)
 */
export function calculateLevel(xp: number): number { ... }
```

---

## Exemplos Do / Don't

### ❌ Don't

```typescript
// Arquivo gigante com múltiplas responsabilidades
// select('*') em queries
// Cores hardcoded sem dark mode
// export default para utilitários
// useToast do shadcn
// Comentários em inglês
// Tipos any
// Canais realtime genéricos
// Touch targets < 44px
// localStorage para verificar admin
```

### ✅ Do

```typescript
// Componentes pequenos e focados
// select('id, title, created_at') explícito
// Tokens semânticos + dark: variants
// Named exports: export { logger }
// toast do Sonner
// Comentários em PT-BR
// Tipos explícitos ou unknown
// Canal: channel-${user.id}
// Button size="icon" (44px)
// has_role() via SECURITY DEFINER
```
