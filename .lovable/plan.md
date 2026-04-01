
# Plano: Fotos Reais nos Depoimentos + Auditoria de Ferramentas por Fase

---

## Parte 1: Corrigir fotos dos depoimentos na landing

### Problema
As imagens foram criadas como arquivos `.jpg` mas provavelmente estão vazias ou corrompidas (o diff mostra apenas `<binary>` sem conteúdo real). O componente importa corretamente, mas as imagens não renderizam — caindo no fallback (letra inicial).

### Solução
Criar uma edge function temporária (ou usar a existente `generate-avatar`) para gerar 5 fotos realistas via IA e salvar no storage. Depois, referenciar as URLs do storage no componente ao invés de importar arquivos locais.

**Prompt para cada foto** — estilo selfie amadora, luz natural, sem maquiagem pesada, cenários do dia-a-dia (casa, parque, cozinha). Cada uma com variação de idade, tom de pele e cenário:

| Nome | Descrição da foto |
|------|------------------|
| Fernanda Lima | Selfie sorrindo, cabelo preso, em casa, ~28 anos |
| Mariana Costa | Selfie com barriga de grávida visível, luz natural, ~30 anos |
| Camila Rodrigues | Selfie segurando dois bebês/gêmeos, expressão cansada mas feliz, ~32 anos |
| Patrícia Alves | Selfie no espelho, casual, criança ao fundo desfocada, ~35 anos |
| Ana Paula Santos | Selfie ao ar livre, sorriso natural, ~26 anos |

### Implementação
1. Criar script edge function que gera as 5 imagens via `google/gemini-3.1-flash-image-preview` e salva no bucket `avatars` do storage
2. Atualizar `TestimonialsSection.tsx` para usar URLs do storage ao invés de imports locais
3. Remover os arquivos `.jpg` vazios de `src/assets/testimonials/`

---

## Parte 2: Auditoria de Ferramentas por Fase

### Ferramentas atuais organizadas por fase

**Gestantes (pré-natal)**
| Ferramenta | Status | Preço |
|-----------|--------|-------|
| Ferramentas de Gestação (DPP, contrações, ultrassom, kick counter, exames, plano de parto) | Existe | R$10,90 |
| Controle de Enxoval | Existe | R$17,90 |
| Mala da Maternidade | Existe | Grátis |
| Calculadora de Fraldas | Existe | Grátis |
| Guia de Alimentação (nutrição gestante) | Existe | R$12,90 |
| E-book Mala Maternidade | Existe | Grátis |

**Pós-parto imediato (0-3 meses)**
| Ferramenta | Status | Preço |
|-----------|--------|-------|
| Rastreador de Amamentação | Existe | R$9,90 |
| Diário de Sono | Existe | R$8,90 |
| Recuperação Pós-Parto | Existe | R$12,90 |
| Cartão de Vacinação | Existe | Grátis |
| Monitor de Icterícia | Existe (sub-ferramenta) | Incluído |
| Diário de Bem-estar da Mãe | Existe (sub-ferramenta) | Incluído |

**Bebês 3-12 meses**
| Ferramenta | Status | Preço |
|-----------|--------|-------|
| Monitor de Desenvolvimento | Existe | R$9,90 |
| Rastreador de Dentes | Existe (sub-ferramenta) | Incluído |
| Banco de Estimulação | Existe (sub-ferramenta) | Incluído |
| Diário de Alergias | Existe (sub-ferramenta) | Incluído |
| Alimentação do Bebê (introdução alimentar) | Existe (sub-ferramenta) | Incluído |

### Gaps identificados e sugestões

#### Sugestões GRATUITAS (simples, checklists, alto valor viral)

1. **Checklist do Quartinho do Bebê** — lista de itens essenciais para montar o quarto, com categorias (berço, enxoval cama, segurança, decoração). Diferente do enxoval que é geral.
   - Fase: Gestante
   - Justificativa: viral no Pinterest/Instagram, atrai tráfego orgânico

2. **Calculadora de Semanas de Gestação** — widget simples que converte semanas em meses, mostra trimestre atual e tamanho do bebê (comparação com frutas).
   - Fase: Gestante
   - Justificativa: ferramenta mais buscada no Google por gestantes, excelente SEO

3. **Checklist de Documentos do Bebê** — lista passo-a-passo dos documentos necessários após o nascimento (certidão, CPF, plano de saúde, SUS, passaporte).
   - Fase: Pós-parto imediato
   - Justificativa: dúvida universal, resolve problema real

4. **Timer de Mamada Rápido** — cronômetro simples para registrar mamada (sem o dashboard completo do Rastreador de Amamentação). Funciona como "versão free" que converte para premium.
   - Fase: Pós-parto
   - Justificativa: entrada gratuita que converte para o Rastreador completo

#### Sugestões PREMIUM (completas, com IA/dashboards)

5. **Diário de Crescimento com Curvas OMS** — registro de peso/altura/perímetro cefálico com gráficos comparativos das curvas da OMS. Alertas automáticos se fora do percentil.
   - Fase: 0-12 meses
   - Preço sugerido: R$9,90
   - Justificativa: gap crítico — existe `GrowthChart.tsx` mas não é um produto standalone

6. **Planejador de Rotina do Bebê** — montador visual de rotina diária (comer-dormir-brincar) por idade, com sugestões de IA e templates prontos.
   - Fase: 3-12 meses
   - Preço sugerido: R$8,90
   - Justificativa: rotina é a maior dor de mães de 3-6 meses

7. **Guia de Introdução Alimentar com IA** — calendário de introdução de alimentos com protocolo BLW/tradicional, receitas por idade, registro de reações alérgicas.
   - Fase: 6-12 meses
   - Preço sugerido: R$10,90
   - Justificativa: já existe `FoodIntroductionDiary` como sub-ferramenta, mas merece ser produto próprio

8. **Registro de Marcos Fotográfico** — álbum de "primeiras vezes" (primeiro sorriso, primeiro dente, primeiros passos) com templates de foto e timeline visual compartilhável.
   - Fase: 0-12 meses
   - Preço sugerido: R$7,90
   - Justificativa: já existe `FirstTimesAlbum.tsx` mas não é produto — alto potencial de compartilhamento viral

### Prioridade recomendada
- **Implementar primeiro**: Calculadora de Semanas (grátis, SEO) + Diário de Crescimento com Curvas OMS (premium, gap crítico)
- **Depois**: Checklist Documentos (grátis) + Introdução Alimentar standalone (premium)

---

## Etapas de implementação

**Este plano**: Gerar as 5 fotos reais por IA e corrigir a landing
**Futuro**: Implementar ferramentas sugeridas conforme prioridade

## Checklist
- [ ] 5 fotos realistas renderizando no carrossel de depoimentos
- [ ] Fotos nos mini-cards também visíveis
- [ ] Nenhuma foto com aparência de IA (sem pele perfeita, sem iluminação de estúdio)
