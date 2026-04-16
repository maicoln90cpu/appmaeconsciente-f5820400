# 🗄️ Database Schema — Mãe Consciente

**Última atualização:** Abril 2026  
**Total de tabelas:** 124 (Row types)  
**Engine:** PostgreSQL (Lovable Cloud)

---

## Índice

- [Visão Geral](#visão-geral)
- [Core / Usuários](#core--usuários)
- [Bebê — Perfis e Vacinação](#bebê--perfis-e-vacinação)
- [Bebê — Diário e Rotina](#bebê--diário-e-rotina)
- [Bebê — Saúde e Desenvolvimento](#bebê--saúde-e-desenvolvimento)
- [Gestação](#gestação)
- [Pós-Parto e Recuperação](#pós-parto-e-recuperação)
- [Nutrição e Alimentação](#nutrição-e-alimentação)
- [Amamentação](#amamentação)
- [Comunidade](#comunidade)
- [Enxoval e Mala](#enxoval-e-mala)
- [Gamificação](#gamificação)
- [Blog](#blog)
- [Monetização](#monetização)
- [Admin e Monitoramento](#admin-e-monitoramento)
- [Índices Otimizados](#índices-otimizados)
- [Convenções](#convenções)

---

## Visão Geral

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  auth.users  │────▶│     profiles        │────▶│  user_roles      │
│  (Supabase)  │     │  (dados públicos)   │     │  (admin/user)    │
└──────────────┘     └─────────────────────┘     └──────────────────┘
       │                      │
       ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│            Todas as tabelas referenciam user_id                   │
│  (NUNCA referência direta a auth.users — sempre via profiles)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core / Usuários

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Dados públicos do usuário (nome, avatar, fase_maternidade, is_virtual) | ✅ |
| `user_roles` | Roles (admin, moderator, user) — tabela separada por segurança | ✅ |
| `user_consents` | Consentimentos LGPD | ✅ |
| `user_access_logs` | Log de acessos | ✅ |
| `config` | Configurações do enxoval (orçamento, alertas) | ✅ |
| `site_settings` | Feature flags globais (ai_insights_enabled, badges_enabled) | ✅ |
| `notifications` | Notificações do sistema | ✅ |
| `user_notifications` | Relação user ↔ notification | ✅ |
| `push_subscriptions` | Assinaturas push web | ✅ |
| `push_notification_subscriptions` | Assinaturas push nativas | ✅ |
| `onboarding_progress` | Progresso do onboarding | ✅ |
| `partner_access` | Acesso compartilhado com parceiro | ✅ |
| `data_deletion_logs` | Log de solicitações LGPD de exclusão | ✅ |

---

## Bebê — Perfis e Vacinação

| Tabela | Descrição | FK Principal |
|--------|-----------|-------------|
| `baby_vaccination_profiles` | Perfil do bebê (nome, nascimento, gênero) | user_id |
| `baby_vaccinations` | Vacinas aplicadas | baby_profile_id |
| `vaccination_calendar` | Calendário oficial de vacinas (referência) | — |
| `vaccination_reminder_settings` | Config de lembretes | baby_profile_id |

---

## Bebê — Diário e Rotina

| Tabela | Descrição | FK Principal |
|--------|-----------|-------------|
| `baby_feeding_logs` | Registros de alimentação | user_id |
| `baby_sleep_logs` | Registros de sono | user_id |
| `baby_sleep_settings` | Configurações de sono | user_id |
| `baby_sleep_milestones` | Marcos de sono por idade (referência) | — |
| `baby_routines` | Rotinas agendadas | baby_profile_id |
| `baby_routine_logs` | Execução das rotinas | routine_id |
| `baby_appointments` | Consultas do bebê | baby_profile_id |
| `baby_first_times` | Álbum de primeiras vezes | baby_profile_id |
| `baby_timeline_events` | Timeline unificada | baby_profile_id |
| `baby_documents_checklist` | Checklist de documentos | user_id |

---

## Bebê — Saúde e Desenvolvimento

| Tabela | Descrição | FK Principal |
|--------|-----------|-------------|
| `baby_milestone_records` | Marcos de desenvolvimento alcançados | baby_profile_id |
| `development_milestone_types` | Catálogo de marcos (referência) | — |
| `development_alert_settings` | Config de alertas de dev | baby_profile_id |
| `baby_achievements` | Conquistas do bebê | baby_profile_id |
| `baby_medications` | Medicamentos ativos | baby_profile_id |
| `baby_medication_logs` | Administrações de medicamentos | medication_id |
| `baby_colic_logs` | Episódios de cólica | baby_profile_id |
| `baby_teeth_logs` | Nascimento de dentes | baby_profile_id |
| `baby_allergy_logs` | Reações alérgicas | baby_profile_id |
| `baby_stimulation_activities` | Atividades de estimulação | baby_profile_id |
| `baby_room_checklist` | Checklist do quarto | user_id |
| `growth_measurements` | Medidas de crescimento (peso, altura, PC) | user_id |
| `jaundice_logs` | Monitoramento de icterícia | user_id |
| `limites_rn` | Limites de referência para recém-nascidos | — |

---

## Gestação

| Tabela | Descrição |
|--------|-----------|
| `pregnancy_info` | Dados da gestação (DPP, semanas) |
| `pregnancy_exams` | Checklist de exames |
| `birth_plans` | Plano de parto |
| `contraction_logs` | Contador de contrações |
| `kick_count_sessions` | Sessões de contagem de movimentos |
| `ultrasound_images` | Imagens de ultrassom |
| `weight_tracking` | Controle de peso na gestação |

---

## Pós-Parto e Recuperação

| Tabela | Descrição |
|--------|-----------|
| `postpartum_symptoms` | Registro de sintomas pós-parto |
| `postpartum_medications` | Medicamentos da mãe |
| `postpartum_appointments` | Consultas da mãe |
| `postpartum_achievements` | Conquistas de recuperação |
| `recovery_checklist` | Checklist de recuperação |
| `emotional_logs` | Diário emocional |
| `daily_wellness_score` | Score diário de bem-estar |
| `body_image_log` | Diário de imagem corporal |
| `mom_wellness_logs` | Bem-estar geral da mãe |
| `exercises` | Catálogo de exercícios |
| `user_exercise_logs` | Exercícios realizados |
| `supplement_logs` | Suplementos |
| `user_supplements` | Suplementos do usuário |
| `medication_logs` | Log de medicamentos (mãe) |

---

## Nutrição e Alimentação

| Tabela | Descrição |
|--------|-----------|
| `meal_plans` | Planos alimentares gerados por IA |
| `recipes` | Receitas geradas por IA |
| `nutrition_chat_conversations` | Conversas com IA nutricional |
| `nutrition_chat_messages` | Mensagens do chat nutricional |
| `user_food_restrictions` | Restrições alimentares |
| `water_intake` | Registro de ingestão de água |
| `water_goals` | Metas de hidratação |
| `food_introduction_log` | Diário de introdução alimentar do bebê |
| `food_alerts` | Alertas alimentares |
| `feeding_settings` | Configurações de alimentação |

---

## Amamentação

| Tabela | Descrição |
|--------|-----------|
| `breast_milk_storage` | Banco de leite materno |

---

## Comunidade

| Tabela | Descrição |
|--------|-----------|
| `posts` | Posts da comunidade |
| `post_comments` | Comentários em posts |
| `post_likes` | Curtidas |
| `post_reports` | Denúncias |
| `post_moderation_logs` | Log de moderação |
| `blocked_users` | Bloqueios entre usuários |
| `user_follows` | Seguidores |
| `user_favorites` | Posts favoritos |
| `public_profiles` | Perfis públicos da comunidade |
| `ai_engagement_logs` | Log de engajamento dos bots |
| `support_tickets` | Tickets de suporte |
| `ticket_messages` | Mensagens dos tickets |
| `tool_suggestions` | Sugestões de ferramentas |

---

## Enxoval e Mala

| Tabela | Descrição |
|--------|-----------|
| `itens_enxoval` | Itens do enxoval |
| `shared_enxoval_links` | Links de compartilhamento |
| `maternity_bag_categories` | Categorias da mala |
| `maternity_bag_items` | Itens da mala |
| `maternity_bag_shared_access` | Acesso compartilhado da mala |

---

## Gamificação

| Tabela | Descrição |
|--------|-----------|
| `badges` | Catálogo de badges |
| `user_badges` | Badges conquistadas |
| `user_achievements` | Conquistas |
| `user_achievement_progress` | Progresso de conquistas |
| `challenges` | Desafios disponíveis |
| `user_challenges` | Desafios aceitos |
| `user_streaks` | Sequências de uso |
| `daily_activity` | Atividade diária (XP) |
| `xp_logs` | Log de XP |
| `leaderboard_cache` | Cache do ranking |

**Funções de banco:**
- `add_user_xp(user_id, amount, source)` — Adiciona XP
- `calculate_level(xp)` — Calcula nível
- `xp_for_next_level(level)` — XP necessário
- `refresh_leaderboard()` — Atualiza ranking
- `get_user_last_activities(user_id)` — Últimas atividades

---

## Blog

| Tabela | Descrição |
|--------|-----------|
| `blog_posts` | Posts do blog (SEO, conteúdo, imagem) |
| `blog_settings` | Configurações de geração |
| `blog_image_prompts` | Templates de prompt para imagens |
| `blog_generation_logs` | Log de custos de geração |

**Funções de banco:**
- `increment_blog_views(post_id)` — Incrementa views
- `sync_blog_cron_schedule()` — Sincroniza agenda do cron

---

## Monetização

| Tabela | Descrição |
|--------|-----------|
| `products` | Produtos/planos |
| `product_bundles` | Bundles de produtos |
| `promotions` | Promoções ativas |
| `coupons` | Cupons de desconto |
| `coupon_usage` | Uso de cupons |
| `user_product_access` | Acesso a produtos |
| `user_club_access` | Acesso ao Clube Premium |
| `hotmart_transactions` | Transações Hotmart |
| `hotmart_product_mapping` | Mapeamento de produtos Hotmart |

---

## Admin e Monitoramento

| Tabela | Descrição |
|--------|-----------|
| `admin_audit_log` | Auditoria de ações admin |
| `security_audit_logs` | Log de segurança |
| `client_error_logs` | Erros do frontend |
| `performance_logs` | Métricas de performance |
| `feature_usage_logs` | Uso de features |
| `cron_job_logs` | Log de jobs agendados |
| `system_health_logs` | Histórico de health checks |
| `system_health_status` | Status atual do sistema |

**Funções de banco:**
- `cleanup_monitoring_logs(days)` — Limpeza + detecção de spike
- `cleanup_old_logs()` — Limpeza legada
- `has_role(user_id, role)` — Verifica role (SECURITY DEFINER)
- `sync_cron_schedule()` — Sincroniza cron da comunidade

---

## Índices Otimizados

O banco possui **35+ índices** para otimização de queries frequentes. Os principais:

- `idx_profiles_user_id` — Busca rápida de perfil
- `idx_baby_*_user_id` — Todas as tabelas de bebê por user_id
- `idx_baby_*_baby_profile_id` — Tabelas de bebê por perfil
- `idx_posts_created_at` — Ordenação de posts
- `idx_blog_posts_slug` — Busca de blog por slug
- `idx_blog_posts_status_published` — Posts publicados
- `idx_client_error_logs_created_at` — Erros recentes
- `idx_performance_logs_created_at` — Performance recente

---

## Convenções

1. **user_id**: Toda tabela de dados do usuário tem `user_id UUID NOT NULL`
2. **Timestamps**: `created_at` e `updated_at` com defaults `now()`
3. **Soft deletes**: Não usamos — exclusão é hard delete com RLS
4. **FK para auth.users**: NUNCA — usamos `profiles.id` como referência indireta
5. **baby_profile_id**: Tabelas multi-bebê referenciam `baby_vaccination_profiles.id`
6. **RLS**: TODAS as tabelas de dados têm RLS habilitado
7. **Naming**: snake_case para tabelas e colunas
8. **IDs**: UUID v4 com `gen_random_uuid()` como default
