-- Tabela de tipos de marcos (catálogo)
CREATE TABLE development_milestone_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_code TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL, -- motor_grosso | motor_fino | linguagem | cognitivo | social_emocional
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  age_min_months INTEGER NOT NULL,
  age_max_months INTEGER NOT NULL,
  stimulation_tips TEXT[],
  pediatrician_alert TEXT,
  video_demo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_milestone_types_area ON development_milestone_types(area);
CREATE INDEX idx_milestone_types_age ON development_milestone_types(age_min_months, age_max_months);

-- Tabela de registros de marcos do bebê
CREATE TABLE baby_milestone_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_profile_id UUID NOT NULL REFERENCES baby_vaccination_profiles(id) ON DELETE CASCADE,
  milestone_type_id UUID NOT NULL REFERENCES development_milestone_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  achieved_date DATE,
  mother_notes TEXT,
  photo_url TEXT,
  video_url TEXT,
  marked_as_achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_baby_milestone UNIQUE(baby_profile_id, milestone_type_id)
);

CREATE INDEX idx_milestone_records_baby ON baby_milestone_records(baby_profile_id);
CREATE INDEX idx_milestone_records_status ON baby_milestone_records(status);
CREATE INDEX idx_milestone_records_date ON baby_milestone_records(achieved_date);

-- RLS Policies para baby_milestone_records
ALTER TABLE baby_milestone_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their baby milestone records"
  ON baby_milestone_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their baby milestone records"
  ON baby_milestone_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their baby milestone records"
  ON baby_milestone_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their baby milestone records"
  ON baby_milestone_records FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_milestone_records_updated_at
  BEFORE UPDATE ON baby_milestone_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de configurações de alertas
CREATE TABLE development_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_profile_id UUID NOT NULL REFERENCES baby_vaccination_profiles(id) ON DELETE CASCADE,
  alerts_enabled BOOLEAN DEFAULT true,
  alert_when_passed_max_age BOOLEAN DEFAULT true,
  reminder_frequency_days INTEGER DEFAULT 7,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_alert_settings UNIQUE(user_id, baby_profile_id)
);

-- RLS para development_alert_settings
ALTER TABLE development_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alert settings"
  ON development_alert_settings FOR ALL
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON development_alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campos em baby_vaccination_profiles
ALTER TABLE baby_vaccination_profiles 
ADD COLUMN development_monitoring_enabled BOOLEAN DEFAULT true,
ADD COLUMN development_notes TEXT;

-- RLS para development_milestone_types (público para leitura)
ALTER TABLE development_milestone_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view milestone types"
  ON development_milestone_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage milestone types"
  ON development_milestone_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- SEED: 50 marcos iniciais (0-12 meses)

-- Motor Grosso
INSERT INTO development_milestone_types (milestone_code, area, title, description, age_min_months, age_max_months, stimulation_tips, pediatrician_alert) VALUES
('motor_grosso_controle_cabeca', 'motor_grosso', 'Controla a cabeça', 'Consegue sustentar a cabeça quando está no colo ou de bruços por alguns segundos', 1, 3, ARRAY['Coloque o bebê de bruços por alguns minutos quando estiver acordado', 'Segure-o no colo na posição vertical', 'Use brinquedos coloridos para estimular o movimento da cabeça'], 'Se após 4 meses o bebê ainda não consegue sustentar bem a cabeça ou se mostra muito "molinho", converse com o pediatra'),

('motor_grosso_rolar', 'motor_grosso', 'Rola de barriga para as costas', 'O bebê começa a usar os braços e pernas para se virar de posição', 3, 6, ARRAY['Coloque brinquedos ao lado para incentivá-lo a rolar', 'Deixe-o de barriga para baixo em superfície firme e segura', 'Movimente um chocalho para que ele tente alcançar'], 'Se após 6-7 meses não tenta rolar ou se mostra muito rígido/molinho nos movimentos'),

('motor_grosso_sentar_apoio', 'motor_grosso', 'Senta com apoio', 'Consegue sentar por alguns minutos com apoio nas costas ou nas laterais', 4, 6, ARRAY['Use almofadas para apoiar as costas e laterais', 'Coloque brinquedos na frente para estimular o equilíbrio', 'Faça sessões curtas, aumentando gradualmente'], 'Se após 7 meses não consegue sentar mesmo com apoio ou perde o equilíbrio muito facilmente'),

('motor_grosso_sentar_sozinho', 'motor_grosso', 'Senta sem apoio', 'Consegue sentar sozinho mantendo o equilíbrio, usando as mãos para brincar', 5, 8, ARRAY['Retire gradualmente o apoio conforme ele ganha confiança', 'Ofereça brinquedos que prendam a atenção', 'Crie um espaço seguro para ele treinar'], 'Se após 9 meses não consegue sentar sozinho ou sempre cai para os lados'),

('motor_grosso_engatinhar', 'motor_grosso', 'Engatinha ou se arrasta', 'Movimenta-se usando braços e pernas, pode ser engatinhando tradicional ou se arrastando', 6, 10, ARRAY['Coloque brinquedos um pouco distantes para estimular', 'Crie um espaço seguro para exploração', 'Alguns bebês pulam essa fase e vão direto para andar - isso é normal'], 'Se após 12 meses não demonstra nenhuma forma de locomoção independente (engatinhar, arrastar, rolar)'),

('motor_grosso_ficar_pe', 'motor_grosso', 'Fica em pé com apoio', 'Consegue ficar em pé segurando em móveis ou nas mãos de adultos', 7, 10, ARRAY['Deixe-o segurar em móveis baixos e seguros', 'Segure suas mãos para dar confiança', 'Use brinquedos em altura para estimular'], 'Se após 11 meses não tenta se apoiar para ficar em pé ou não sustenta o peso nas pernas'),

('motor_grosso_andar_apoio', 'motor_grosso', 'Anda com apoio', 'Consegue dar passos laterais apoiado em móveis ou andando de mãos dadas', 8, 12, ARRAY['Deixe móveis próximos para ele se apoiar', 'Ande com ele segurando suas mãos', 'Crie um ambiente seguro para exploração'], 'Se após 15 meses não tenta dar nenhum passo mesmo com apoio'),

('motor_grosso_primeiros_passos', 'motor_grosso', 'Dá os primeiros passos sozinho', 'Consegue dar alguns passos sozinho, mesmo que ainda caia frequentemente', 9, 15, ARRAY['Incentive sem forçar', 'Deixe-o andar descalço em casa', 'Celebre cada tentativa, mesmo com quedas'], 'Se após 18 meses não caminha sozinho ou só anda na ponta dos pés'),

-- Motor Fino
('motor_fino_reflexo_preensao', 'motor_fino', 'Reflexo de preensão forte', 'Fecha a mão com força quando algo toca a palma', 0, 2, ARRAY['Coloque seu dedo na palma da mão dele', 'Ofereça objetos leves e seguros', 'Estimule o toque'], 'Se após 3 meses não apresenta nenhum reflexo de preensão'),

('motor_fino_segurar_objetos', 'motor_fino', 'Segura objetos colocados na mão', 'Consegue segurar chocalhos ou objetos leves quando colocados na mão', 2, 4, ARRAY['Ofereça chocalhos leves', 'Varie texturas dos objetos', 'Brinque de passar objetos de uma mão para outra'], 'Se após 5 meses não consegue segurar nenhum objeto ou solta imediatamente'),

('motor_fino_alcançar', 'motor_fino', 'Alcança e pega objetos', 'Estica o braço e pega objetos que deseja', 3, 6, ARRAY['Coloque brinquedos ao alcance', 'Use objetos coloridos e interessantes', 'Estimule a coordenação olho-mão'], 'Se após 7 meses não tenta alcançar objetos ou não coordena os movimentos'),

('motor_fino_transferir', 'motor_fino', 'Transfere objetos entre as mãos', 'Consegue passar um brinquedo de uma mão para a outra', 5, 7, ARRAY['Ofereça brinquedos que prendam a atenção', 'Estimule a troca entre as mãos', 'Brinque com objetos de diferentes tamanhos'], 'Se após 8 meses usa sempre apenas uma mão ou não consegue coordenar as duas mãos'),

('motor_fino_pinca_inferior', 'motor_fino', 'Pinça inferior (palmar)', 'Pega objetos pequenos usando toda a mão', 6, 8, ARRAY['Ofereça alimentos seguros em pedaços pequenos', 'Use blocos de montar grandes', 'Supervisione sempre para evitar engasgos'], 'Se após 9 meses não consegue pegar nenhum objeto pequeno'),

('motor_fino_pinca_superior', 'motor_fino', 'Pinça superior (polegar e indicador)', 'Consegue pegar objetos pequenos usando polegar e indicador', 8, 10, ARRAY['Ofereça alimentos pequenos e seguros (sempre supervisionado)', 'Use atividades de encaixe', 'Estimule a precisão dos movimentos'], 'Se após 12 meses não desenvolveu a pinça fina ou usa apenas a palma da mão'),

('motor_fino_bater_objetos', 'motor_fino', 'Bate objetos um no outro', 'Pega dois objetos e bate um no outro fazendo barulho', 7, 10, ARRAY['Ofereça blocos ou brinquedos que façam som', 'Demonstre como fazer', 'Celebre quando ele conseguir'], 'Se após 11 meses não consegue coordenar dois objetos ao mesmo tempo'),

('motor_fino_apontar', 'motor_fino', 'Aponta com o dedo indicador', 'Usa o dedo indicador para apontar coisas que deseja ou que lhe interessam', 9, 12, ARRAY['Aponte coisas para ele e nomeie', 'Responda quando ele apontar', 'Use livros com figuras grandes'], 'Se após 15 meses não aponta ou não demonstra interesse em mostrar coisas'),

-- Linguagem
('linguagem_chorando_diferente', 'linguagem', 'Choros diferentes para necessidades diferentes', 'O choro começa a variar conforme a necessidade (fome, sono, fralda)', 0, 2, ARRAY['Observe os padrões de choro', 'Responda consistentemente', 'Converse enquanto atende às necessidades'], 'Se após 3 meses o choro não varia ou é sempre muito fraco/muito intenso'),

('linguagem_arrulhos', 'linguagem', 'Faz sons de arrulho', 'Emite sons como "aah", "ooh", "gu"', 1, 3, ARRAY['Converse muito com o bebê', 'Repita os sons que ele faz', 'Use entonação variada'], 'Se após 4 meses não emite nenhum som além do choro'),

('linguagem_risadas', 'linguagem', 'Dá risadas', 'Ri em resposta a brincadeiras e interações', 2, 4, ARRAY['Faça caras engraçadas', 'Brinque de esconder o rosto', 'Use brincadeiras repetitivas'], 'Se após 5 meses não ri ou não responde a estímulos sociais'),

('linguagem_balbucio', 'linguagem', 'Balbucio variado', 'Emite sons repetidos como "bababa", "mamama", "dadada"', 4, 7, ARRAY['Converse narrando o que você faz', 'Repita os sons que ele faz', 'Cante músicas simples'], 'Se após 8-9 meses não emite sons variados ou perdeu sons que fazia antes'),

('linguagem_entende_nao', 'linguagem', 'Entende "não" e outras palavras simples', 'Para ou reage quando ouve "não", seu nome ou palavras familiares', 6, 9, ARRAY['Use palavras consistentes', 'Associe gestos às palavras', 'Fale claramente e devagar'], 'Se após 10 meses não responde ao nome ou não entende nenhuma palavra simples'),

('linguagem_gestos', 'linguagem', 'Usa gestos comunicativos', 'Acena tchau, bate palmas, manda beijo', 8, 11, ARRAY['Demonstre os gestos repetidamente', 'Comemore quando ele imitar', 'Use gestos em contexto'], 'Se após 12 meses não usa nenhum gesto ou não imita'),

('linguagem_primeira_palavra', 'linguagem', 'Fala primeira palavra com significado', 'Diz "mama", "papa", "agua" ou outra palavra simples com intenção', 9, 14, ARRAY['Nomeie objetos e pessoas', 'Repita palavras simples', 'Celebre tentativas de fala'], 'Se após 18 meses não fala nenhuma palavra ou perdeu palavras que falava'),

('linguagem_segue_comandos', 'linguagem', 'Segue comandos simples', 'Entende e executa pedidos simples como "dá para a mamãe"', 10, 13, ARRAY['Use comandos curtos e claros', 'Demonstre o que quer', 'Seja consistente'], 'Se após 15 meses não segue nenhum comando simples ou não demonstra compreensão'),

-- Cognitivo
('cognitivo_segue_movimento', 'cognitivo', 'Acompanha objetos com os olhos', 'Segue objetos que se movem lentamente à sua frente', 1, 3, ARRAY['Mova objetos coloridos lentamente', 'Use brinquedos com cores contrastantes', 'Observe se acompanha em todas as direções'], 'Se após 4 meses não segue objetos com os olhos ou parece não ver'),

('cognitivo_reconhece_rostos', 'cognitivo', 'Reconhece rostos familiares', 'Reage diferente para pais e pessoas conhecidas vs. desconhecidos', 2, 4, ARRAY['Passe tempo face a face', 'Fale e sorria', 'Apresente pessoas gradualmente'], 'Se após 5 meses não demonstra reconhecimento ou não reage a rostos'),

('cognitivo_explora_boca', 'cognitivo', 'Leva objetos à boca', 'Explora objetos levando-os à boca (fase oral)', 3, 7, ARRAY['Ofereça objetos seguros para exploração', 'Supervisione sempre', 'Limpe brinquedos regularmente'], 'Se após 8 meses nunca leva objetos à boca ou leva tudo indiscriminadamente depois dos 12 meses'),

('cognitivo_busca_objeto', 'cognitivo', 'Busca objetos que caem', 'Olha para baixo quando um brinquedo cai', 4, 6, ARRAY['Deixe objetos caírem na frente dele', 'Nomeie "caiu!"', 'Recupere e mostre'], 'Se após 7 meses não demonstra interesse em objetos que desaparecem'),

('cognitivo_permanencia_objeto', 'cognitivo', 'Noção de permanência do objeto', 'Procura objetos escondidos - sabe que existem mesmo quando não vê', 6, 9, ARRAY['Brinque de esconder brinquedos', 'Use o jogo do "cadê-achou"', 'Esconda parcialmente primeiro'], 'Se após 12 meses não procura objetos escondidos ou parece esquecer completamente'),

('cognitivo_causa_efeito', 'cognitivo', 'Entende causa e efeito', 'Repete ações para fazer algo acontecer (apertar botão para música)', 7, 10, ARRAY['Ofereça brinquedos de causa e efeito', 'Demonstre ações repetidas', 'Celebre quando ele conseguir'], 'Se após 11 meses não demonstra compreensão de que suas ações causam resultados'),

('cognitivo_imita_acoes', 'cognitivo', 'Imita ações simples', 'Tenta imitar ações como bater palmas, acenar', 8, 11, ARRAY['Faça ações repetidamente', 'Simplifique movimentos', 'Brinque de espelho'], 'Se após 13 meses não tenta imitar nenhuma ação'),

('cognitivo_uso_funcional', 'cognitivo', 'Usa objetos funcionalmente', 'Usa objetos da forma correta: colher para comer, escova no cabelo', 10, 14, ARRAY['Demonstre o uso correto', 'Deixe-o tentar mesmo que não acerte', 'Use objetos do dia a dia'], 'Se após 18 meses não demonstra uso funcional de objetos comuns'),

-- Social/Emocional
('social_sorriso_social', 'social_emocional', 'Sorriso social', 'Sorri em resposta a sorrisos e vozes', 1, 3, ARRAY['Sorria e fale com o bebê', 'Mantenha contato visual', 'Use voz suave e alegre'], 'Se após 4 meses não sorri ou não responde socialmente'),

('social_vocaliza_interacao', 'social_emocional', 'Vocaliza durante interação', 'Faz sons quando você fala com ele, criando uma "conversa"', 2, 4, ARRAY['Converse e espere resposta', 'Imite os sons dele', 'Crie turnos de "conversa"'], 'Se após 5 meses não participa de interações vocais'),

('social_estranhamento', 'social_emocional', 'Demonstra estranhamento', 'Fica mais sério ou chora com pessoas desconhecidas', 5, 8, ARRAY['Respeite o tempo de adaptação', 'Mantenha-se próxima em novos ambientes', 'Apresente pessoas gradualmente'], 'Se após 9 meses não demonstra diferença entre familiares e estranhos ou demonstra medo excessivo'),

('social_angustia_separacao', 'social_emocional', 'Ansiedade de separação', 'Fica chateado quando pais saem de vista', 6, 10, ARRAY['Despedidas curtas e consistentes', 'Volte sempre que prometer', 'Deixe objeto de conforto'], 'Se a ansiedade é extrema e não melhora após 12 meses ou se nunca demonstra'),

('social_brinca_espelho', 'social_emocional', 'Brinca com reflexo no espelho', 'Se interessa pela própria imagem no espelho', 6, 9, ARRAY['Use espelhos seguros', 'Aponte e nomeie partes do corpo', 'Faça caretas juntos'], 'Se após 10 meses não demonstra interesse em espelhos ou imagens'),

('social_oferece_brinquedo', 'social_emocional', 'Oferece brinquedos', 'Estende brinquedos para outras pessoas (pode não soltar)', 8, 11, ARRAY['Agradeça quando oferecer', 'Ofereça brinquedos para ele também', 'Brinque de dar e pegar'], 'Se após 13 meses não demonstra comportamentos de compartilhar'),

('social_responde_nome', 'social_emocional', 'Responde quando chamado pelo nome', 'Olha ou reage quando ouve seu nome', 7, 10, ARRAY['Use o nome frequentemente', 'Chame em momentos positivos', 'Combine com contato visual'], 'Se após 12 meses não responde ao nome de forma consistente'),

('social_mostra_afeto', 'social_emocional', 'Demonstra afeto', 'Abraça, dá beijinhos, faz carinho', 9, 13, ARRAY['Demonstre afeto consistentemente', 'Celebre demonstrações de carinho', 'Crie momentos de conexão'], 'Se após 15 meses não demonstra afeto ou evita contato físico'),

('social_interesse_criancas', 'social_emocional', 'Interesse por outras crianças', 'Observa e tenta interagir com outras crianças', 10, 14, ARRAY['Proporcione contato com outras crianças', 'Supervisione interações', 'Ensine gentileza'], 'Se após 18 meses não demonstra nenhum interesse em outras crianças');
