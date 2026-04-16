# 📋 Cópia Completa da Memo do Projeto — Mãe Consciente

**Gerado em:** 16 de Abril de 2026  
**Propósito:** Backup integral de todas as regras, preferências e decisões gravadas na memória do projeto.

---

## 🧠 Preferências do Usuário (`~user`)

```
Comunicação: sempre em português-BR, linguagem leiga, por etapas seguras.
Formato: antes vs depois, melhorias, vantagens/desvantagens, checklist manual, pendências, prevenção de regressão.
Perfil: dono do produto MasterQuiz, não é desenvolvedor. Precisa de explicações claras e acionáveis.
Preferência: nunca implementar sem plano aprovado. Sempre informar riscos antes de agir.
Prioriza deploys em fases para evitar regressões.
Prevenção de regressão: ao corrigir problema, avaliar se vale criar proteção permanente (função, componente, teste ou monitoramento).
Sugestões futuras: apenas sobre o que foi implementado, sem excessos.
Próximos passos: explicar como está hoje, como ficará e qual o ganho.
```

---

## 📌 Core (Regras Universais)

- **Tone:** Welcoming, warm, no alarmism. Use "Cada bebê tem seu tempo". Never use medical terms like "atraso".
- **UX/UI:** Persona is tired mothers. Min 44px touch targets. 5-item mobile nav. 'Modo Simples' support.
- **Branding:** App is 'Mãe Consciente'. Pricing: R$27/mo Clube.
- **Images:** AI images must be "natural maternal selfie", amateur photography. No stock photos.
- **Tech Stack:** Supabase Postgres, RLS, IndexedDB offline-first.
- **Rules:** Never use `.select('*')`. Unique realtime channels `channel-name-${user.id}`.
- **Data Visibility:** Tools need a `products` record. `is_virtual` flag in `profiles` hides bots from analytics.
- **Infrastructure:** Edge Functions need `*.lovable.app` CORS. `pg_cron` runs in UTC (account for BRT).
- **Output:** Sempre responder em linguagem leiga e por etapas seguras. Para cada etapa: antes vs depois, melhorias, vantagens/desvantagens, checklist manual, pendências, prevenção de regressão quando aplicável. Sugerir melhorias futuras apenas do que foi implementado.

---

## 🔗 Memórias Detalhadas

### Integrações

**Ecosystem Linking** — Platform designed with cross-module intelligence: Vaccination Card links to Development Monitor, Sleep Diary informs Development Monitor contextual alerts, Breastfeeding data suggests feeding schedule adjustments, Development Monitor suggests food introduction readiness at 6 months, Postpartum Recovery achievements display in main achievements system, Community enables anonymous milestone sharing, all modules support PDF export for healthcare providers. Foreign keys and RLS ensure data correlation while maintaining privacy boundaries.

### Design

**Tone & Messaging** — Core UX writing principle across all health features: acolhedor (welcoming, warm) tone that emphasizes safety, gentleness, and absence of alarm. Repeated messaging themes: "Cada bebê tem seu tempo", "Você não precisa de perfeição, só de consistência gentil", "Seu corpo está se curando". Never use medical terminology like "atraso". Always direct to pediatrician rather than self-diagnose. Educational disclaimers must be prominent on health modules.

**Mobile UX Standards** — O padrão de UI mobile para o Dashboard do Bebê (16+ ferramentas) utiliza uma grade de duas linhas fixas via 'flex-wrap' no 'TabsList', eliminando scrolls horizontais. As abas são organizadas por grupos categóricos (Hoje, Saúde, Alimentação, Rotina, Mais), onde 'Mais' é ocultado no 'Modo Simples'. Todos os touch targets respeitam 44px mínimo.

**UX Simplification** — A estratégia de UX prioriza extrema facilidade e baixa carga cognitiva, focando em mães cansadas ou com pouca instrução técnica. Diretrizes: agrupamento em sub-menus categóricos, ícones estilo 'app', touch targets 44px, personalização por fase (Gestante vs. Pós-parto).

**Navigation Architecture** — Navegação principal: 5 itens [Início, Ferramentas, +, Comunidade, Perfil]. FAB centralizado para "Registro Rápido" (Mamada, Sono, Crescimento, Fralda) via menu radial. "Materiais" renomeado para "Ferramentas".

**AI Image Style** — Diretiva para toda imagem gerada por IA: priorizar estética de 'selfie maternal natural'. Prompts calibrados para fotografia amadora, iluminação natural, ambientes casuais (casa, parques, selfies de espelho).

**Virtual User Personas** — Personas dos bots calibradas para simular diversidade real: mães de primeira viagem ansiosas, veteranas práticas, profissionais de saúde. Tom anti-robótico com regras de anti-repetição.

### Features

**Unified Dashboard** — Dashboard unificado: "/dashboard" + "/dashboard-bebe" → "Início". 16+ ferramentas em 5 categorias: Hoje, Saúde, Alimentação, Rotina, Mais. Cartões dinâmicos de "Próximos Eventos" e "Atividades Recentes".

**Maternity Phase** — Adaptação dinâmica via `fase_maternidade`: modal de seleção no primeiro acesso, ordenação de Ferramentas por fase, cartões de contexto dinâmicos (contagem regressiva vs. marcos de idade).

**Simple Mode** — 'Modo Simples' oculta gamificação avançada, insights profundos e aba 'Mais'. Persistido em `profiles.simple_mode` boolean.

**Unified Achievements** — Gamificação centralizada no Perfil do Usuário (ProfileAchievements.tsx) em vez de páginas separadas.

**Inline Monetization** — `PremiumUpgradeModal` para conversão inline sem redirecionamento externo. Oferece assinatura ou compra avulsa sem perder contexto.

**Tools Catalog** — 21 ferramentas especializadas organizadas por fase:
- Gratuitas: Calculadora de Semanas, Checklist Documentos, Checklist Quartinho, Timer de Mamada, Calculadora de Fraldas, Cartão de Vacinação.
- Premium/Wrapper: Diário de Crescimento OMS, Planejador de Rotina, Guia Alimentar, Álbum de Marcos.
- Outras: Mala Maternidade, Diário de Sono, Amamentação, Recuperação Pós-Parto, Monitor de Desenvolvimento, Gestação (Movimentos, Exames, Plano), Monitor de Icterícia, Diário da Mãe, Dentes, Estimulação, Alergias.

**Development Monitor** — 0-24 meses, 5 áreas (motor grosso, motor fino, linguagem, cognitivo, social/emocional), timeline, alertas de atenção, relatórios para pediatra.

**Pregnancy Tools** — 6 sub-ferramentas: DPP, Diário de Contrações, Galeria Ultrassons, Kick Counter (sessões 2h), Checklist Exames (28 exames SUS/Particular), Plano de Parto (PDF exportável, 4 etapas).

**Pregnancy Calculator** — Calculadora de Semanas gratuita com dicas semanais, compartilhamento social (Web Share API), contagem regressiva visual.

**Newborn Tools** — Monitor de Icterícia (escala Kramer, alertas zonas 4-5) e Diário de Bem-estar da Mãe (humor, energia, dor, ansiedade, gráficos Recharts).

**Year One Tools** — Dentes (mapa dental interativo 20 dentes), Estimulação (14 atividades filtráveis 0-12m), Alergias (protocolo 3 dias, alertas visuais).

**Maternity Bag** — Banco persistente com 3 tabelas, checklists por tipo de parto, lembretes por semana gestacional, compartilhamento com parceiros, contador de prontidão (37ª semana).

**Postpartum Recovery** — 0-6 meses: sintomas (escala 0-5), medicamentos, consultas, exercícios pélvicos, Escala de Edimburgo, alertas de emergência (hemorragias, febre, depressão).

**Free Tools Value** — Calculadora de Fraldas (preços editáveis, PDF), Checklist Documentos (urgência, compartilhamento), Checklist Quartinho (custos editáveis), Timer de Mamada (histórico, alerta 1.5-4h), Cartão de Vacinação (card "Próxima Vacina", PDF).

**Premium Tools Value** — Diário de Crescimento (PDF pediatra), Planejador de Rotina (templates por idade), Monitor de Desenvolvimento (persistência de alertas), Álbum de Marcos (cards sociais formatados).

**Offline Dashboard** — Fallback PWA com diagnóstico de cache, fila de sincronização (`offline-sync-queue`), redirecionamento automático ao reconectar.

**Tool Suggestions** — Canal de feedback para sugestões de novas ferramentas, com ciclo completo: ideia → revisão admin → aprovação/rejeição → recompensa.

**Feature Flags** — `FeatureFlagsProvider` com `useFeatureFlags()` (aiInsightsEnabled, badgesEnabled). Admin controla via site_settings. Default: ambos true.

### Landing Page

**Redesign** — 6 ferramentas destacadas com selos "Grátis", social proof com selfies IA, foco em 7 dias de trial gratuito.

**Commercial Logic** — Tabela comparativa "Grátis vs. Premium vs. Clube", calculador de economia automático, segmentação por fase.

### Blog

**Automated Blog** — SEO orgânico 100% automatizado via Gemini, 50+ tópicos, público em /blog.

**Generation Engine** — Conteúdo JSON estruturado, rotação entre 3 estilos de imagem (Aquarela, Flat, Fotografia), auto-internal linking.

**Public Interface** — Design editorial, TOC automático, JSON-LD (Article, FAQPage), compartilhamento social.

**Analytics & SEO** — Edge Function 'track-blog-view' com filtragem de bots, deduplicação IP (30min), sitemap XML dinâmico (cache 1h).

**Admin Management** — 5 áreas: Posts (TipTap + IA), Configurações, Prompts de Imagem, Agendamento (pg_cron), Logs de Geração (custos/tokens).

**App Integration** — Link 'Blog' na navegação desktop + banner na página de Ferramentas (mobile).

### Admin & Técnico

**Branding** — Nome oficial: "Mãe Consciente". M.A.E.S. = metodologia, não nome do app. Clube: R$27/mês, 30 dias trial. Calculadora de Fraldas e Cartão de Vacinação são permanentemente gratuitos.

**Admin Analytics** — UI de alta densidade. `is_virtual` filtra bots de todas as estatísticas reais.

**Virtual User Management** — 30 bots com personalidades editáveis, geração de avatar IA (1 clique), toggle is_active individual.

**Community Automation** — 100% autônomo via pg_cron + pg_net. Frequência configurável 1-8x/dia, horários randômicos, auto-moderação via Gemini (8 categorias sensíveis).

**Premium Wrappers** — Produtos independentes via páginas wrapper. Funcionam como módulos embutidos ou itens de venda avulsa com trial/pricing próprios.

### Constraints

**Database Queries** — Nunca usar `.select('*')`. Sempre selecionar campos específicos.

**Realtime Channels** — Canais únicos por usuário: `channel-name-${user.id}`.

**Product Visibility** — Ferramentas requerem registro na tabela `products`. Slug gerencia rotas e estados de acesso.

**Edge CORS** — Edge Functions devem permitir `*.lovable.app` via `cors.ts`.

**Cron Timezone** — `pg_cron` opera em UTC. Expressões devem considerar diferença para BRT.

---

*Fim do backup da memo — 16/04/2026*
