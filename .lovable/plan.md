
# Plano: Consistência e Padrões de Código (3 Etapas)

## Status: Etapa 1 ✅ | Etapa 2 ⏳ | Etapa 3 ⏳

---

## Etapa 1 — Padronizar Logger e Toast ✅
- [x] Logger: removido `export default`, forçando `import { logger }` (named only)
- [x] 9 arquivos migrados de `import logger from` para `import { logger } from`
- [x] Toast: 63 arquivos migrados de `useToast` (shadcn) para `toast` do Sonner
- [x] Helper functions (checkEdinburghScore, checkAlerts) simplificadas (removido parâmetro toast)
- [x] Testes atualizados (mocks de useToast → sonner)
- [x] Zero erros TypeScript, zero referências residuais a useToast fora da infra

## Etapa 2 — Scripts de Enforcement + ESLint Rules ⏳
- [ ] Adicionar scripts: lint:fix, format, format:check no package.json
- [ ] Rodar prettier --write para normalizar formatação global
- [ ] Adicionar regra ESLint para naming convention de Props

## Etapa 3 — Padronizar Comentários e Documentação ⏳
- [ ] Definir idioma padrão (PT-BR) para comentários
- [ ] Revisar hooks, contexts e lib/ mais críticos
