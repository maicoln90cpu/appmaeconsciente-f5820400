-- Adicionar campos de peso e altura ao perfil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS peso_atual numeric,
ADD COLUMN IF NOT EXISTS altura_cm integer;

-- Inserir receitas pré-configuradas
INSERT INTO recipes (
  title, description, category, prep_time, servings, calories,
  ingredients, preparation, tips, tags, trimester_focus,
  is_public, is_ai_generated
) VALUES
-- CAFÉ DA MANHÃ (10 receitas)
(
  'Panqueca de Aveia com Banana',
  'Panqueca nutritiva rica em fibras e potássio',
  'cafe_manha', 15, 2, 280,
  ARRAY['2 ovos', '1 banana madura', '3 colheres de aveia', '1 pitada de canela'],
  ARRAY['Amasse a banana em um bowl', 'Adicione os ovos e misture', 'Acrescente a aveia e canela', 'Aqueça uma frigideira antiaderente', 'Despeje a massa e cozinhe 2-3 min cada lado'],
  'Sirva com mel ou frutas frescas',
  ARRAY['café da manhã', 'sem glúten', 'proteína'],
  ARRAY[1, 2, 3], true, false
),
(
  'Smoothie Verde Energético',
  'Vitamina refrescante com nutrientes essenciais',
  'cafe_manha', 5, 1, 180,
  ARRAY['1 banana', '1 xícara de espinafre', '1 colher de chia', '200ml de leite', '1 colher de mel'],
  ARRAY['Coloque todos os ingredientes no liquidificador', 'Bata até ficar homogêneo', 'Adicione gelo se desejar'],
  'Rico em ácido fólico e ferro',
  ARRAY['vitamina', 'rápido', 'nutritivo'],
  ARRAY[1, 2, 3], true, false
),
(
  'Tapioca com Queijo e Tomate',
  'Opção sem glúten e rica em cálcio',
  'cafe_manha', 10, 1, 220,
  ARRAY['3 colheres de goma de tapioca', '50g de queijo minas', '1 tomate fatiado', 'Orégano a gosto'],
  ARRAY['Aqueça uma frigideira antiaderente', 'Espalhe a tapioca formando um círculo', 'Quando firmar, adicione o queijo e tomate', 'Dobre ao meio e sirva'],
  'Pode adicionar linhaça para mais fibras',
  ARRAY['sem glúten', 'prático', 'cálcio'],
  ARRAY[1, 2, 3], true, false
),
(
  'Mingau de Aveia com Frutas',
  'Café da manhã quente e reconfortante',
  'cafe_manha', 10, 1, 250,
  ARRAY['1/2 xícara de aveia', '1 xícara de leite', '1 banana', 'Canela a gosto', '1 colher de mel'],
  ARRAY['Aqueça o leite em uma panela', 'Adicione a aveia e mexa constantemente', 'Cozinhe por 5 minutos', 'Sirva com banana e canela por cima'],
  'Fonte de energia de longa duração',
  ARRAY['quente', 'fibras', 'energia'],
  ARRAY[1, 2, 3], true, false
),
(
  'Ovo Mexido com Espinafre',
  'Proteína de alta qualidade com ferro',
  'cafe_manha', 8, 1, 200,
  ARRAY['2 ovos', '1 xícara de espinafre', '1 colher de azeite', 'Sal e pimenta'],
  ARRAY['Bata os ovos levemente', 'Aqueça o azeite na frigideira', 'Adicione o espinafre e refogue', 'Despeje os ovos e mexa até cozinhar'],
  'Rico em ácido fólico e proteína',
  ARRAY['proteína', 'ferro', 'rápido'],
  ARRAY[1, 2, 3], true, false
),
(
  'Iogurte com Granola e Frutas Vermelhas',
  'Probióticos e antioxidantes para começar o dia',
  'cafe_manha', 5, 1, 280,
  ARRAY['200g de iogurte natural', '3 colheres de granola', '1/2 xícara de frutas vermelhas', '1 colher de mel'],
  ARRAY['Coloque o iogurte em uma tigela', 'Adicione a granola', 'Cubra com as frutas vermelhas', 'Regue com mel'],
  'Fonte de cálcio e probióticos',
  ARRAY['probióticos', 'prático', 'antioxidantes'],
  ARRAY[1, 2, 3], true, false
),
(
  'Pão Integral com Abacate',
  'Gorduras saudáveis e fibras',
  'cafe_manha', 5, 1, 240,
  ARRAY['2 fatias de pão integral', '1/2 abacate', '1 ovo cozido', 'Tomate cereja', 'Sal e limão'],
  ARRAY['Toste o pão levemente', 'Amasse o abacate e tempere com sal e limão', 'Espalhe no pão', 'Decore com ovo e tomate'],
  'Gorduras boas para o desenvolvimento do bebê',
  ARRAY['gorduras saudáveis', 'saciedade', 'fibras'],
  ARRAY[1, 2, 3], true, false
),
(
  'Crepioca Proteica',
  'Combinação de tapioca e ovo',
  'cafe_manha', 10, 1, 210,
  ARRAY['2 colheres de tapioca', '1 ovo', '50g de queijo cottage', 'Tomate e manjericão'],
  ARRAY['Bata o ovo com a tapioca', 'Despeje em frigideira quente', 'Recheie com cottage, tomate e manjericão', 'Dobre e sirva'],
  'Alta em proteína e sem glúten',
  ARRAY['proteína', 'sem glúten', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Vitamina de Mamão com Aveia',
  'Digestão saudável e energia',
  'cafe_manha', 5, 1, 200,
  ARRAY['1/2 mamão papaya', '200ml de leite', '2 colheres de aveia', '1 colher de mel', 'Gelo'],
  ARRAY['Coloque todos os ingredientes no liquidificador', 'Bata até ficar cremoso', 'Sirva gelado'],
  'Ajuda na digestão e constipação',
  ARRAY['digestivo', 'fibras', 'refrescante'],
  ARRAY[1, 2, 3], true, false
),
(
  'Omelete de Forno com Legumes',
  'Prático e nutritivo',
  'cafe_manha', 20, 2, 260,
  ARRAY['3 ovos', '1/2 xícara de brócolis', '1/2 xícara de tomate', '50g de queijo', 'Temperos'],
  ARRAY['Pré-aqueça o forno a 180°C', 'Bata os ovos e adicione os legumes picados', 'Despeje em forma untada', 'Asse por 15 minutos'],
  'Pode preparar com antecedência',
  ARRAY['proteína', 'legumes', 'prático'],
  ARRAY[1, 2, 3], true, false
),

-- ALMOÇO (10 receitas)
(
  'Frango Grelhado com Quinoa',
  'Proteína magra com grãos integrais',
  'almoco', 30, 2, 420,
  ARRAY['200g de peito de frango', '1 xícara de quinoa', '2 xícaras de água', 'Legumes variados', 'Temperos naturais'],
  ARRAY['Tempere e grelhe o frango', 'Cozinhe a quinoa na água', 'Refogue os legumes', 'Monte o prato'],
  'Refeição completa e balanceada',
  ARRAY['proteína', 'grãos integrais', 'completo'],
  ARRAY[1, 2, 3], true, false
),
(
  'Salmão Assado com Batata Doce',
  'Ômega-3 e carboidratos complexos',
  'almoco', 35, 2, 480,
  ARRAY['200g de salmão', '2 batatas doces médias', 'Brócolis', 'Azeite e limão'],
  ARRAY['Tempere o salmão com limão', 'Corte as batatas em rodelas', 'Asse tudo junto a 200°C por 25 min', 'Cozinhe o brócolis no vapor'],
  'Rico em ômega-3 para o cérebro do bebê',
  ARRAY['ômega-3', 'assado', 'nutritivo'],
  ARRAY[1, 2, 3], true, false
),
(
  'Risoto de Abóbora com Frango',
  'Cremoso e nutritivo',
  'almoco', 40, 3, 380,
  ARRAY['300g de abóbora', '200g de frango', '1 xícara de arroz arbóreo', 'Caldo de legumes', 'Queijo parmesão'],
  ARRAY['Cozinhe a abóbora e amasse', 'Refogue o arroz', 'Adicione caldo aos poucos', 'Incorpore a abóbora e frango', 'Finalize com queijo'],
  'Rico em betacaroteno e proteína',
  ARRAY['cremoso', 'vitamina A', 'conforto'],
  ARRAY[1, 2, 3], true, false
),
(
  'Carne Moída com Lentilha',
  'Proteína e ferro em dose dupla',
  'almoco', 30, 4, 400,
  ARRAY['300g de carne moída magra', '1 xícara de lentilha', 'Tomate', 'Cebola', 'Temperos'],
  ARRAY['Cozinhe a lentilha', 'Refogue a carne com temperos', 'Misture com a lentilha', 'Sirva com arroz integral'],
  'Excelente fonte de ferro',
  ARRAY['ferro', 'proteína', 'econômico'],
  ARRAY[1, 2, 3], true, false
),
(
  'Peixe ao Molho de Maracujá',
  'Leve e refrescante',
  'almoco', 25, 2, 350,
  ARRAY['2 filés de peixe branco', 'Suco de 2 maracujás', 'Cebola', 'Tomate', 'Coentro'],
  ARRAY['Tempere o peixe', 'Refogue cebola e tomate', 'Adicione o suco de maracujá', 'Cozinhe o peixe no molho', 'Finalize com coentro'],
  'Fonte de proteína leve e vitamina C',
  ARRAY['peixe', 'leve', 'vitamina C'],
  ARRAY[2, 3], true, false
),
(
  'Escondidinho de Frango com Mandioca',
  'Conforto e nutrição',
  'almoco', 45, 4, 420,
  ARRAY['500g de mandioca', '300g de frango desfiado', 'Requeijão', 'Temperos', 'Queijo para gratinar'],
  ARRAY['Cozinhe e amasse a mandioca', 'Tempere o frango', 'Monte camadas em refratário', 'Cubra com queijo', 'Asse até gratinar'],
  'Pode congelar porções',
  ARRAY['conforto', 'proteína', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Estrogonofe de Carne Magra',
  'Clássico mais saudável',
  'almoco', 35, 4, 450,
  ARRAY['400g de carne magra', 'Champignon', 'Creme de leite light', 'Mostarda', 'Ketchup natural'],
  ARRAY['Corte a carne em tiras', 'Refogue com temperos', 'Adicione champignon', 'Finalize com creme e mostarda', 'Sirva com arroz integral'],
  'Versão mais leve do clássico',
  ARRAY['proteína', 'família', 'cremoso'],
  ARRAY[2, 3], true, false
),
(
  'Lasanha de Berinjela',
  'Baixo carboidrato e nutritiva',
  'almoco', 50, 6, 380,
  ARRAY['3 berinjelas', '500g de carne moída', 'Molho de tomate caseiro', 'Queijo mussarela', 'Ricota'],
  ARRAY['Fatie as berinjelas', 'Grelhe levemente', 'Prepare o molho com a carne', 'Monte camadas', 'Asse por 30 minutos'],
  'Rica em fibras e baixa em carboidratos',
  ARRAY['low carb', 'fibras', 'família'],
  ARRAY[1, 2, 3], true, false
),
(
  'Moqueca de Peixe',
  'Sabor do mar com nutrição',
  'almoco', 30, 3, 380,
  ARRAY['400g de peixe', 'Leite de coco', 'Tomate', 'Pimentão', 'Coentro', 'Azeite de dendê (pouco)'],
  ARRAY['Tempere o peixe', 'Refogue os legumes', 'Adicione o leite de coco', 'Cozinhe o peixe no molho', 'Finalize com coentro'],
  'Use pouco dendê na gestação',
  ARRAY['peixe', 'regional', 'saboroso'],
  ARRAY[2, 3], true, false
),
(
  'Arroz à Grega Completo',
  'Colorido e nutritivo',
  'almoco', 25, 4, 320,
  ARRAY['2 xícaras de arroz', 'Cenoura', 'Vagem', 'Milho', 'Ervilha', 'Passas', 'Temperos'],
  ARRAY['Cozinhe o arroz', 'Refogue os legumes', 'Misture tudo', 'Adicione as passas', 'Sirva quente'],
  'Ótima opção para festas',
  ARRAY['colorido', 'fibras', 'festivo'],
  ARRAY[1, 2, 3], true, false
),

-- LANCHE/LANCHE RÁPIDO (10 receitas)
(
  'Pasta de Grão-de-Bico (Homus)',
  'Proteína vegetal cremosa',
  'lanche', 10, 4, 180,
  ARRAY['1 xícara de grão-de-bico cozido', '2 colheres de tahine', '1 dente de alho', 'Suco de limão', 'Azeite'],
  ARRAY['Bata todos os ingredientes no processador', 'Ajuste a consistência com água', 'Tempere a gosto', 'Sirva com palitos de cenoura'],
  'Rico em proteína e fibras',
  ARRAY['proteína vegetal', 'prático', 'versátil'],
  ARRAY[1, 2, 3], true, false
),
(
  'Bolinho de Banana com Aveia',
  'Doce natural e nutritivo',
  'lanche', 20, 6, 150,
  ARRAY['2 bananas maduras', '1 xícara de aveia', '1 ovo', 'Canela', 'Gotas de chocolate 70%'],
  ARRAY['Amasse as bananas', 'Misture todos os ingredientes', 'Forme bolinhos', 'Asse a 180°C por 15 minutos'],
  'Pode congelar',
  ARRAY['doce', 'sem açúcar', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Sanduíche Natural de Frango',
  'Lanche completo e leve',
  'lanche', 15, 1, 280,
  ARRAY['Pão integral', 'Frango desfiado', 'Cenoura ralada', 'Alface', 'Cream cheese light'],
  ARRAY['Passe o cream cheese no pão', 'Adicione o frango', 'Coloque os vegetais', 'Feche o sanduíche'],
  'Ideal para levar',
  ARRAY['prático', 'proteína', 'leve'],
  ARRAY[1, 2, 3], true, false
),
(
  'Mousse de Abacate',
  'Gorduras boas em forma de sobremesa',
  'lanche', 10, 3, 200,
  ARRAY['2 abacates maduros', '3 colheres de cacau', '3 colheres de mel', '1 pitada de sal'],
  ARRAY['Bata todos os ingredientes no liquidificador', 'Ajuste a doçura', 'Leve à geladeira por 1 hora'],
  'Rico em gorduras saudáveis',
  ARRAY['doce', 'gorduras boas', 'cremoso'],
  ARRAY[1, 2, 3], true, false
),
(
  'Palitos de Queijo Assado',
  'Crocante e rico em cálcio',
  'lanche', 25, 4, 220,
  ARRAY['200g de queijo minas', 'Gergelim', 'Orégano', 'Azeite'],
  ARRAY['Corte o queijo em palitos', 'Pincele com azeite', 'Polvilhe gergelim e orégano', 'Asse até dourar'],
  'Fonte de cálcio',
  ARRAY['cálcio', 'crocante', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Smoothie Bowl de Açaí',
  'Antioxidantes e energia',
  'lanche', 10, 1, 320,
  ARRAY['1 pacote de açaí', '1 banana', 'Granola', 'Frutas variadas', 'Mel'],
  ARRAY['Bata o açaí com a banana', 'Despeje em uma tigela', 'Decore com granola e frutas', 'Regue com mel'],
  'Rico em antioxidantes',
  ARRAY['energético', 'antioxidantes', 'cremoso'],
  ARRAY[1, 2, 3], true, false
),
(
  'Chips de Batata Doce',
  'Crocante e nutritivo',
  'lanche', 30, 2, 180,
  ARRAY['2 batatas doces', 'Azeite', 'Sal', 'Páprica'],
  ARRAY['Fatie as batatas bem finas', 'Tempere com azeite e especiarias', 'Asse a 180°C até ficarem crocantes'],
  'Versão saudável de chips',
  ARRAY['crocante', 'assado', 'carboidrato complexo'],
  ARRAY[1, 2, 3], true, false
),
(
  'Pudim de Chia com Frutas',
  'Ômega-3 e fibras',
  'lanche', 5, 2, 190,
  ARRAY['3 colheres de chia', '1 xícara de leite', 'Frutas variadas', 'Mel'],
  ARRAY['Misture chia e leite', 'Deixe na geladeira por 4 horas', 'Sirva com frutas e mel'],
  'Prepare na noite anterior',
  ARRAY['ômega-3', 'fibras', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Wrap de Atum',
  'Proteína e praticidade',
  'lanche', 10, 1, 260,
  ARRAY['1 tortilha integral', '1 lata de atum', 'Alface', 'Tomate', 'Iogurte natural'],
  ARRAY['Misture o atum com iogurte', 'Espalhe na tortilha', 'Adicione vegetais', 'Enrole e corte'],
  'Rico em ômega-3',
  ARRAY['proteína', 'prático', 'ômega-3'],
  ARRAY[1, 2, 3], true, false
),
(
  'Biscoito de Polvilho Caseiro',
  'Crocante sem glúten',
  'lanche', 30, 20, 90,
  ARRAY['1 xícara de polvilho azedo', '1/2 xícara de água', '2 colheres de azeite', 'Queijo ralado', 'Sal'],
  ARRAY['Ferva a água com azeite e sal', 'Adicione o polvilho', 'Misture até formar massa', 'Modele os biscoitos', 'Asse até dourar'],
  'Sem glúten e delicioso',
  ARRAY['sem glúten', 'crocante', 'caseiro'],
  ARRAY[1, 2, 3], true, false
),

-- JANTAR (10 receitas)
(
  'Sopa de Legumes com Frango',
  'Reconfortante e nutritiva',
  'jantar', 30, 4, 220,
  ARRAY['Peito de frango', 'Cenoura', 'Batata', 'Abóbora', 'Alho-poró', 'Caldo de legumes'],
  ARRAY['Cozinhe o frango e desfie', 'Refogue os legumes', 'Adicione caldo e cozinhe', 'Volte o frango', 'Sirva quente'],
  'Hidratante e reconfortante',
  ARRAY['sopa', 'leve', 'reconfortante'],
  ARRAY[1, 2, 3], true, false
),
(
  'Omelete de Legumes',
  'Leve e proteico',
  'jantar', 15, 2, 260,
  ARRAY['3 ovos', 'Tomate', 'Cebola', 'Espinafre', 'Queijo branco'],
  ARRAY['Bata os ovos', 'Refogue os legumes', 'Despeje os ovos', 'Adicione queijo', 'Dobre e sirva'],
  'Jantar rápido e nutritivo',
  ARRAY['proteína', 'rápido', 'leve'],
  ARRAY[1, 2, 3], true, false
),
(
  'Salada Caesar com Frango Grelhado',
  'Fresca e completa',
  'jantar', 20, 2, 340,
  ARRAY['Alface romana', 'Frango grelhado', 'Croutons integrais', 'Queijo parmesão', 'Molho Caesar light'],
  ARRAY['Lave e corte a alface', 'Grelhe e fatie o frango', 'Monte a salada', 'Adicione croutons e parmesão', 'Regue com molho'],
  'Refeição leve e saborosa',
  ARRAY['salada', 'proteína', 'leve'],
  ARRAY[2, 3], true, false
),
(
  'Peixe ao Forno com Ervas',
  'Simples e saudável',
  'jantar', 25, 2, 280,
  ARRAY['2 filés de peixe branco', 'Limão', 'Alecrim', 'Tomilho', 'Azeite', 'Batatas baby'],
  ARRAY['Tempere o peixe com ervas e limão', 'Disponha em forma com batatas', 'Regue com azeite', 'Asse a 200°C por 20 min'],
  'Fonte de proteína leve',
  ARRAY['peixe', 'assado', 'ervas'],
  ARRAY[1, 2, 3], true, false
),
(
  'Risoto de Cogumelos',
  'Cremoso e sofisticado',
  'jantar', 35, 3, 360,
  ARRAY['Arroz arbóreo', 'Cogumelos variados', 'Caldo de legumes', 'Vinho branco (opcional)', 'Parmesão'],
  ARRAY['Refogue o arroz', 'Adicione caldo aos poucos', 'Incorpore cogumelos refogados', 'Finalize com parmesão'],
  'Pode usar apenas caldo sem vinho',
  ARRAY['cremoso', 'sofisticado', 'vegetariano'],
  ARRAY[2, 3], true, false
),
(
  'Wrap de Frango com Legumes',
  'Prático e balanceado',
  'jantar', 20, 2, 320,
  ARRAY['Tortilha integral', 'Frango desfiado', 'Pimentão', 'Cebola', 'Alface', 'Molho de iogurte'],
  ARRAY['Refogue frango com legumes', 'Espalhe molho na tortilha', 'Adicione recheio', 'Enrole e aqueça levemente'],
  'Pode substituir frango por carne',
  ARRAY['prático', 'proteína', 'versátil'],
  ARRAY[1, 2, 3], true, false
),
(
  'Berinjela à Parmegiana Light',
  'Clássico mais leve',
  'jantar', 40, 4, 320,
  ARRAY['2 berinjelas', 'Molho de tomate caseiro', 'Queijo mussarela light', 'Parmesão', 'Manjericão'],
  ARRAY['Fatie e grelhe as berinjelas', 'Monte camadas com molho e queijo', 'Asse até gratinar'],
  'Assada em vez de frita',
  ARRAY['legumes', 'gratinado', 'light'],
  ARRAY[1, 2, 3], true, false
),
(
  'Caldo Verde Tradicional',
  'Conforto brasileiro',
  'jantar', 30, 6, 180,
  ARRAY['Batatas', 'Couve manteiga', 'Linguiça de frango', 'Alho', 'Caldo de legumes'],
  ARRAY['Cozinhe as batatas e amasse', 'Adicione caldo', 'Refogue a linguiça', 'Adicione a couve picada', 'Sirva quente'],
  'Tradicional e reconfortante',
  ARRAY['sopa', 'brasileiro', 'reconfortante'],
  ARRAY[2, 3], true, false
),
(
  'Salada de Grão-de-Bico',
  'Proteína vegetal completa',
  'jantar', 15, 3, 280,
  ARRAY['Grão-de-bico cozido', 'Tomate', 'Pepino', 'Cebola roxa', 'Azeite e limão', 'Coentro'],
  ARRAY['Misture todos os vegetais', 'Tempere com azeite e limão', 'Adicione o grão-de-bico', 'Finalize com coentro'],
  'Refeição leve e completa',
  ARRAY['proteína vegetal', 'leve', 'refrescante'],
  ARRAY[1, 2, 3], true, false
),
(
  'Frango Xadrez',
  'Oriental e saudável',
  'jantar', 25, 3, 340,
  ARRAY['Peito de frango', 'Pimentão colorido', 'Cebola', 'Castanha de caju', 'Shoyu light'],
  ARRAY['Corte o frango em cubos', 'Refogue com os legumes', 'Tempere com shoyu', 'Adicione castanhas', 'Sirva com arroz'],
  'Versão saudável do clássico',
  ARRAY['oriental', 'colorido', 'proteína'],
  ARRAY[1, 2, 3], true, false
),

-- CEIA (10 receitas)
(
  'Leite Dourado com Cúrcuma',
  'Anti-inflamatório e relaxante',
  'lanche', 10, 1, 150,
  ARRAY['1 xícara de leite', '1 colher de chá de cúrcuma', '1 pitada de pimenta preta', 'Mel', 'Canela'],
  ARRAY['Aqueça o leite', 'Adicione cúrcuma e pimenta', 'Mexa bem', 'Adoce com mel', 'Polvilhe canela'],
  'Ajuda no sono e reduz inflamação',
  ARRAY['relaxante', 'anti-inflamatório', 'quente'],
  ARRAY[1, 2, 3], true, false
),
(
  'Chá de Camomila com Mel',
  'Calmante natural',
  'lanche', 5, 1, 30,
  ARRAY['Flores de camomila', 'Água quente', 'Mel'],
  ARRAY['Ferva a água', 'Adicione a camomila', 'Deixe em infusão por 5 min', 'Coe e adoce com mel'],
  'Auxilia no relaxamento',
  ARRAY['chá', 'relaxante', 'natural'],
  ARRAY[1, 2, 3], true, false
),
(
  'Banana Assada com Canela',
  'Doce natural e reconfortante',
  'lanche', 15, 1, 120,
  ARRAY['1 banana', 'Canela em pó', 'Mel', 'Aveia'],
  ARRAY['Corte a banana ao meio', 'Polvilhe canela', 'Regue com mel', 'Asse por 10 min', 'Sirva com aveia'],
  'Ajuda a dormir melhor',
  ARRAY['doce', 'quente', 'natural'],
  ARRAY[1, 2, 3], true, false
),
(
  'Iogurte com Mel e Granola',
  'Leve e nutritivo',
  'lanche', 5, 1, 180,
  ARRAY['1 pote de iogurte natural', '1 colher de mel', '2 colheres de granola'],
  ARRAY['Coloque o iogurte em uma tigela', 'Adicione a granola', 'Regue com mel'],
  'Probióticos para boa digestão',
  ARRAY['probióticos', 'prático', 'leve'],
  ARRAY[1, 2, 3], true, false
),
(
  'Torrada Integral com Cottage',
  'Proteína antes de dormir',
  'lanche', 5, 1, 160,
  ARRAY['2 fatias de pão integral', '3 colheres de queijo cottage', 'Tomate cereja', 'Manjericão'],
  ARRAY['Toste o pão levemente', 'Espalhe o cottage', 'Decore com tomate e manjericão'],
  'Proteína de digestão lenta',
  ARRAY['proteína', 'leve', 'prático'],
  ARRAY[1, 2, 3], true, false
),
(
  'Smoothie de Mamão com Aveia',
  'Digestivo e calmante',
  'lanche', 5, 1, 140,
  ARRAY['1/2 mamão', '2 colheres de aveia', '200ml de leite morno', 'Mel'],
  ARRAY['Bata todos os ingredientes', 'Sirva morno'],
  'Ajuda na digestão noturna',
  ARRAY['digestivo', 'fibras', 'morno'],
  ARRAY[1, 2, 3], true, false
),
(
  'Mingau de Aveia Noturno',
  'Reconfortante e nutritivo',
  'lanche', 10, 1, 200,
  ARRAY['1/2 xícara de aveia', '1 xícara de leite', 'Canela', 'Mel', 'Frutas secas'],
  ARRAY['Aqueça o leite', 'Adicione a aveia', 'Mexa até engrossar', 'Adoce com mel', 'Polvilhe canela'],
  'Energia de liberação lenta',
  ARRAY['quente', 'reconfortante', 'saciedade'],
  ARRAY[1, 2, 3], true, false
),
(
  'Suco de Maracujá Natural',
  'Calmante natural',
  'lanche', 5, 1, 80,
  ARRAY['Polpa de 2 maracujás', 'Água', 'Mel (opcional)'],
  ARRAY['Bata a polpa com água', 'Coe', 'Adoce levemente se desejar'],
  'Propriedades calmantes',
  ARRAY['calmante', 'refrescante', 'natural'],
  ARRAY[1, 2, 3], true, false
),
(
  'Panqueca de Banana Light',
  'Doce saudável para ceia',
  'lanche', 15, 2, 190,
  ARRAY['1 banana', '2 ovos', '2 colheres de aveia', 'Canela'],
  ARRAY['Amasse a banana', 'Misture com ovos e aveia', 'Aque ça frigideira', 'Cozinhe pequenas panquecas'],
  'Satisfaz a vontade de doce',
  ARRAY['doce', 'proteína', 'sem açúcar'],
  ARRAY[1, 2, 3], true, false
),
(
  'Queijo Branco com Geleia de Frutas Vermelhas',
  'Simples e saboroso',
  'lanche', 5, 1, 140,
  ARRAY['100g de queijo branco', '2 colheres de geleia de frutas vermelhas sem açúcar', 'Torradas integrais'],
  ARRAY['Corte o queijo em fatias', 'Sirva com geleia', 'Acompanhe com torradas'],
  'Fonte de cálcio e antioxidantes',
  ARRAY['cálcio', 'prático', 'leve'],
  ARRAY[1, 2, 3], true, false
);