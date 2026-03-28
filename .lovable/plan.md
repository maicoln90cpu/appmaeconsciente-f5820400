

# Plano: Prompts Calibrados + Nomes/Avatares Variados para Bots

## Resumo

Três melhorias no sistema de engajamento automático:
1. **Reescrever completamente os prompts** — eliminar padrões repetitivos ("Ai, minha flor", "como eu te entendo") com regras explícitas de diversidade de abertura e tom
2. **Adicionar personalidades distintas aos bots** — cada bot terá um perfil (idade do bebê, estilo de escrita, temas preferidos) para gerar conteúdo mais variado
3. **Nomes de exibição + avatares** — expandir de 5 para 12 bots com nomes completos e atribuir uma `foto_perfil_url` usando avatares gerados (DiceBear API ou similar, sem custo)

---

## Detalhes Técnicos

### 1. Reescrita dos Prompts (auto-engage-community + generate-comment)

**Problema atual**: O system prompt genérico ("You are a warm, empathetic Brazilian mother") faz a IA repetir os mesmos padrões: "Ai, minha flor", "como eu te entendo", "meu Gabriel fez a mesma coisa". Todos os comentários soam iguais.

**Solução**: Criar um array de **personas** com personalidade, idade do filho, estilo de escrita. A cada geração, sortear uma persona e injetá-la no prompt.

**Personas** (12 perfis):
```
- Rafaela, 28, mãe de gêmeos de 8 meses, prática e direta, usa poucas palavras
- Débora, 35, mãe de 3, veterana, dá conselhos curtos baseados em experiência
- Thaís, 22, mãe de primeira viagem, faz muitas perguntas, insegura
- Priscila, 31, enfermeira, técnica mas acessível, cita fontes quando possível
- Aline, 27, grávida de 7 meses, ansiosa com o parto, fala do enxoval
- Luciana, 40, mãe de adolescente + bebê de 1 ano, perspectiva madura
- Bruna, 25, mãe solo, fala sobre conciliar trabalho e maternidade
- Camila, 33, adepta de criação com apego, gentil mas firme nas opiniões
- Vanessa, 29, mãe de menino de 2 anos, bem humorada, conta causos
- Isabela, 34, nutricionista, foca em alimentação e introdução alimentar
- Renata, 26, fisioterapeuta, fala sobre recuperação pós-parto e exercícios
- Patrícia, 38, psicóloga, foca em saúde mental materna
```

**Regras anti-repetição nos prompts**:
- Lista explícita de frases PROIBIDAS: "Ai, minha flor", "como eu te entendo", "meu [nome] fez a mesma coisa", "você não está sozinha", "força mamãe"
- Regra: NUNCA começar com interjeição + vocativo
- Exigir que cada resposta comece de forma diferente (pergunta, dado, relato direto, discordância respeitosa)
- Temperature 0.95 → manter para maximizar diversidade

**Prompts de posts** — substituir os 6 tópicos genéricos por ~20 tópicos ultra-específicos:
```
- "Meu bebê só dorme no colo, tentei berço e nada"
- "Alguém mais sentindo culpa por voltar ao trabalho?"
- "Receita de papinha que meu filho adorou"
- "Pomada para assadura que realmente funciona"
- "Como vocês lidam com palpite de sogra?"
- "Amamentação exclusiva x fórmula: alguém na mesma?"
- etc. (~20 temas)
```

### 2. Nomes de Exibição + Avatares

**Migração SQL**: Atualizar os profiles dos bots existentes com `foto_perfil_url` usando DiceBear (SVG gratuito):
```sql
UPDATE profiles SET foto_perfil_url = 'https://api.dicebear.com/7.x/initials/svg?seed=Rafaela' WHERE email = 'rafaela@maes.virtual';
```

**Edge function**: Expandir `virtualProfiles` de 5 para 12, cada um com nome, cidade, estado e avatar URL únicos. O `display_name` será o nome da persona.

**PostCard.tsx**: Atualizar para exibir `post.display_name || post.user_email.split("@")[0]` — já existe o campo `display_name` no tipo `Post`, só não é usado.

**CommentSection.tsx**: Buscar também `display_name` (ou nome do email) dos profiles ao enriquecer comentários, e exibir no avatar/nome.

### 3. generate-comment — Prompt Calibrado

Reescrever o prompt da function `generate-comment` com:
- Receber `persona` como parâmetro opcional (nome, perfil, estilo)
- Incluir lista de frases proibidas
- Variar aberturas obrigatoriamente

---

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/auto-engage-community/index.ts` | Personas, prompts reescritos, 12 bots, avatares |
| `supabase/functions/generate-comment/index.ts` | Prompt calibrado com anti-repetição e persona |
| `src/components/comunidade/PostCard.tsx` | Usar `display_name` no nome exibido |
| `src/components/comunidade/CommentSection.tsx` | Buscar `display_name` do profile |
| Migração SQL | Atualizar `foto_perfil_url` e criar novos bots virtuais |

---

## Checklist de Teste Manual
- [ ] Executar Automação IA no admin e verificar se os posts têm aberturas variadas (não começam igual)
- [ ] Verificar se comentários NÃO usam "Ai, minha flor" ou padrões repetitivos
- [ ] Confirmar que cada post/comentário exibe nome e avatar diferente na comunidade
- [ ] Verificar que bots novos NÃO aparecem na listagem de usuários do admin

## Vantagens
- Comunidade parece ter 12+ pessoas reais com personalidades distintas
- Conteúdo muito mais diverso e natural
- Avatares visuais aumentam credibilidade

## Desvantagens
- Mais bots = mais dados no banco (insignificante)
- Prompts maiores = custo marginalmente maior por chamada de IA

