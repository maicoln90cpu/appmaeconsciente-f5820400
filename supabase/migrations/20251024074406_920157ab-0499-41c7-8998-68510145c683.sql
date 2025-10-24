-- Atualizar receitas existentes com informações nutricionais
UPDATE public.recipes
SET 
  nutrients = jsonb_build_object(
    'proteins', CASE category
      WHEN 'proteinas' THEN (15 + RANDOM() * 20)::numeric(10,1)
      WHEN 'vegetarianas' THEN (8 + RANDOM() * 12)::numeric(10,1)
      ELSE (10 + RANDOM() * 15)::numeric(10,1)
    END,
    'carbs', CASE category
      WHEN 'doces_saudaveis' THEN (35 + RANDOM() * 25)::numeric(10,1)
      WHEN 'snacks' THEN (20 + RANDOM() * 15)::numeric(10,1)
      ELSE (30 + RANDOM() * 20)::numeric(10,1)
    END,
    'fats', CASE category
      WHEN 'proteinas' THEN (8 + RANDOM() * 12)::numeric(10,1)
      WHEN 'doces_saudaveis' THEN (5 + RANDOM() * 8)::numeric(10,1)
      ELSE (6 + RANDOM() * 10)::numeric(10,1)
    END,
    'calcium', (150 + RANDOM() * 250)::numeric(10,1),
    'iron', (3 + RANDOM() * 8)::numeric(10,1),
    'folic_acid', (50 + RANDOM() * 150)::numeric(10,1),
    'fiber', (3 + RANDOM() * 8)::numeric(10,1)
  )
WHERE nutrients IS NULL OR nutrients = '{}'::jsonb;