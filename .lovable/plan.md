
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
