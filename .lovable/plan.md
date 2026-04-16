
# Plano: Aba Sistema — Monitoramento Avançado (5 Etapas)

## Status: Etapa 3 ✅ Concluída

---

## Etapa 1 — Infraestrutura Base ✅
- [x] 7 tabelas de monitoramento criadas
- [x] Hook usePagination criado
- [x] Aba Sistema reestruturada: 7 sub-abas
- [x] Função cleanup_monitoring_logs para limpeza automática

## Etapa 2 — Sub-aba Saúde (10 Painéis Colapsáveis) ✅
- [x] Hook useTableSort + SortableTableHeader
- [x] Service systemHealthService.ts
- [x] 10 painéis implementados com dados reais

## Etapa 3 — Sub-aba Observabilidade ✅
- [x] Service observabilityService.ts (SLA, AI costs, delivery, errors, perf)
- [x] SLA/SLO Metrics com barras de progresso coloridas
- [x] AI Cost Summary com gráfico de barras por dia
- [x] Delivery Status (notificações enviadas/lidas)
- [x] Erros Recentes 24h com detecção de spike
- [x] Performance Metrics P95/P99 por tipo
- [x] Web Vitals com thresholds visuais
- [x] Metrics Health Check (verificação de canais de coleta)

## Etapa 4 — Sub-aba Banco de Dados (5 sub-abas internas)
- [ ] Visão Geral (Overview)
- [ ] Tabelas & Atalhos
- [ ] Automações & Gatilhos
- [ ] Tarefas Agendadas
- [ ] Funções na Nuvem (Edge Functions)
- [ ] Edge Function system-health-check

## Etapa 5 — Configurações Expandidas + GTM/Diagnóstico
- [ ] Configurações globais expandidas
- [ ] GTM Diagnóstico (verificação 3 etapas + retry)
- [ ] Cron Jobs de limpeza automática
