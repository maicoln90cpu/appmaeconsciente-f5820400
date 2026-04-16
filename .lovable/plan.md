
# Plano: Aba Sistema — Monitoramento Avançado (5 Etapas)

## Status: Etapa 2 ✅ Concluída

---

## Etapa 1 — Infraestrutura Base ✅
- [x] 7 tabelas de monitoramento criadas (system_health_status, system_health_logs, client_error_logs, performance_logs, feature_usage_logs, admin_audit_log, cron_job_logs)
- [x] Hook usePagination criado
- [x] Aba Sistema reestruturada: 7 sub-abas (Saúde, Observabilidade, Banco de Dados, Usuários, Segurança, Configurações, GTM/Diag.)
- [x] Função cleanup_monitoring_logs para limpeza automática

## Etapa 2 — Sub-aba Saúde (10 Painéis Colapsáveis) ✅
- [x] Hook useTableSort + SortableTableHeader criados
- [x] Service systemHealthService.ts (queries + aggregações + CSV export)
- [x] Health Score (0-100 por módulo) com badges coloridos
- [x] Tendência de Score (gráfico Recharts linha, toggle 7d/30d/90d)
- [x] Erros do Frontend (agrupados por componente, paginados, ordenáveis)
- [x] Performance de Operações (média/máx ms, benchmarks coloridos)
- [x] Sessões Ativas (cards resumo)
- [x] Integrações Externas (status hardcoded Hotmart/Resend/WhatsApp/GTM)
- [x] Cron Monitor (tabela com taxa de sucesso colorida)
- [x] Monitor de Filas (cards placeholder)
- [x] Uso de Funcionalidades (gráfico barras horizontal top 10)
- [x] Audit Log com filtros + exportação CSV (UTF-8 com BOM)

## Etapa 3 — Sub-aba Observabilidade
- [ ] SLA/SLO Metrics
- [ ] AI Cost Summary
- [ ] Delivery Status
- [ ] Erros Recentes
- [ ] Performance Metrics
- [ ] Web Vitals
- [ ] Metrics Health Check

## Etapa 4 — Sub-aba Banco de Dados (5 sub-abas internas)
- [ ] Visão Geral (Overview)
- [ ] Tabelas & Atalhos
- [ ] Automações & Gatilhos
- [ ] Tarefas Agendadas
- [ ] Funções na Nuvem (Edge Functions)
- [ ] Edge Function system-health-check

## Etapa 5 — Configurações Expandidas + GTM/Diagnóstico
- [ ] Configurações globais expandidas (WhatsApp, Email, Timezone, Toggles)
- [ ] GTM Diagnóstico (verificação 3 etapas + retry)
- [ ] Cron Jobs de limpeza automática

## Prompt de Output (Memória)
Sempre responder em linguagem leiga e por etapas seguras. Para cada etapa informar: antes vs depois, melhorias, vantagens/desvantagens, checklist manual, pendências e prevenção de regressão.
