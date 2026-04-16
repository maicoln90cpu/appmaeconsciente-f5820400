
# Plano: Consistência e Padrões de Código (3 Etapas)

## Status: Etapa 1 ✅ | Etapa 2 ✅ | Etapa 3 ✅

---

## Etapa 1 — Padronizar Logger e Toast ✅
- [x] Logger: removido `export default`, forçando `import { logger }` (named only)
- [x] 9 arquivos migrados de `import logger from` para `import { logger } from`
- [x] Toast: 63 arquivos migrados de `useToast` (shadcn) para `toast` do Sonner
- [x] Helper functions (checkEdinburghScore, checkAlerts) simplificadas (removido parâmetro toast)
- [x] Testes atualizados (mocks de useToast → sonner)
- [x] Zero erros TypeScript, zero referências residuais a useToast fora da infra

## Etapa 2 — Scripts de Enforcement + ESLint Rules ✅
- [x] Adicionar scripts: lint:fix, format, format:check no package.json
- [x] Rodar prettier --write para normalizar formatação global (100% dos arquivos já estavam conformes)
- [x] Regra ESLint de naming convention de Props: adiada (requer plugin extra com config complexa; benefício marginal vs risco)

## Etapa 3 — Padronizar Comentários e Documentação ✅
- [x] Definir idioma padrão (PT-BR) para comentários
- [x] ~50 arquivos traduzidos (hooks, contexts, lib, main.tsx)
- [x] Zero erros TypeScript após tradução

---

# Plano: Responsividade e UI/UX (5 Etapas)

## Status: Etapa 1 ✅ | Etapa 2 ✅ | Etapa 3 ⬜ | Etapa 4 ⬜ | Etapa 5 ⬜

---

## Etapa 1 — Touch Targets 44px ✅
- [x] Classe utilitária `.touch-target` adicionada ao `index.css` (min-h/min-w 44px)
- [x] Button `size="icon"` já garante 44px — removidas overrides `h-8 w-8`, `h-7 w-7`, `h-6 w-6` em ~12 componentes user-facing
- [x] Componentes corrigidos: OnboardingWizard, OnboardingChecklist, SyncQueuePanel, FirstTimesAlbum, UpdatePrompt, FoodIntroductionDiary, StimulationBank, RoutinePlanner, EnxovalMobileCard, ExamChecklist
- [x] Componentes admin mantidos com tamanhos menores (desktop-only)

## Etapa 2 — Reduced Motion + Animações Seguras ✅
- [x] `@media (prefers-reduced-motion: reduce)` global no `index.css` — desabilita todas as animações/transições
- [x] Spinners (`animate-spin`) preservados como feedback essencial de carregamento
- [x] Efeitos decorativos removidos: ripple, page transitions, bounce, pulse, ping
- [x] `BadgeUnlockAnimation` atualizado com `motion-safe:` e `motion-reduce:hidden` para confetti

## Etapa 3 — Loading States Padronizados ⬜
- [ ] Verificar/criar `PageLoader` reutilizável
- [ ] Aplicar em ~10 páginas com `isLoading` sem feedback visual

## Etapa 4 — Empty States Unificados ⬜
- [ ] Substituir `<p>Nenhum...</p>` pelo componente `EmptyState`
- [ ] Aplicar em ~15-20 listas/tabelas sem mensagem orientativa

## Etapa 5 — Dark Mode: Cores Hardcoded ⬜
- [ ] Auditar cores literais (bg-pink-50, text-green-600, etc.)
- [ ] Adicionar variantes `dark:` nos componentes mais visíveis
