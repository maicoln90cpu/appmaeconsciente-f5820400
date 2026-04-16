import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { QueryCacheConfig } from '@/lib/query-config';
import { toast } from 'sonner';

export interface StimulationActivity {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  title: string;
  description: string | null;
  category: string;
  age_range_start: number;
  age_range_end: number;
  duration_minutes: number;
  materials: string[];
  development_areas: string[];
  is_favorite: boolean;
  completed_count: number;
  last_done_at: string | null;
  is_custom: boolean;
  created_at: string;
}

export const ACTIVITY_CATEGORIES = [
  { value: 'motor', label: 'Motor', icon: '🏃' },
  { value: 'cognitive', label: 'Cognitivo', icon: '🧠' },
  { value: 'language', label: 'Linguagem', icon: '🗣️' },
  { value: 'social', label: 'Social', icon: '👶' },
  { value: 'sensory', label: 'Sensorial', icon: '✋' },
];

export const DEVELOPMENT_AREAS = [
  'Coordenação motora fina',
  'Coordenação motora grossa',
  'Cognição',
  'Linguagem receptiva',
  'Linguagem expressiva',
  'Socialização',
  'Percepção visual',
  'Percepção auditiva',
  'Percepção tátil',
  'Equilíbrio',
  'Resolução de problemas',
];

export const DEFAULT_ACTIVITIES: Omit<
  StimulationActivity,
  | 'id'
  | 'user_id'
  | 'baby_profile_id'
  | 'is_favorite'
  | 'completed_count'
  | 'last_done_at'
  | 'is_custom'
  | 'created_at'
>[] = [
  {
    title: 'Tummy Time',
    description:
      'Coloque o bebê de bruços por curtos períodos para fortalecer pescoço e tronco. Use brinquedos coloridos à frente.',
    category: 'motor',
    age_range_start: 0,
    age_range_end: 3,
    duration_minutes: 5,
    materials: ['Tapete macio', 'Brinquedo colorido'],
    development_areas: ['Coordenação motora grossa', 'Percepção visual'],
  },
  {
    title: 'Seguir com o olhar',
    description: 'Mova um objeto colorido lentamente de um lado ao outro na frente do bebê.',
    category: 'cognitive',
    age_range_start: 0,
    age_range_end: 3,
    duration_minutes: 5,
    materials: ['Chocalho colorido'],
    development_areas: ['Percepção visual', 'Cognição'],
  },
  {
    title: 'Conversa e canção',
    description: 'Converse e cante para o bebê olhando nos olhos dele. Varie tons e expressões.',
    category: 'language',
    age_range_start: 0,
    age_range_end: 3,
    duration_minutes: 10,
    materials: [],
    development_areas: ['Linguagem receptiva', 'Socialização'],
  },
  {
    title: 'Massagem sensorial',
    description: 'Massageie suavemente braços, pernas e barriga com diferentes texturas.',
    category: 'sensory',
    age_range_start: 0,
    age_range_end: 3,
    duration_minutes: 10,
    materials: ['Óleo de bebê', 'Tecidos variados'],
    development_areas: ['Percepção tátil', 'Socialização'],
  },
  {
    title: 'Alcançar objetos',
    description: 'Segure brinquedos ao alcance do bebê para que tente pegá-los.',
    category: 'motor',
    age_range_start: 3,
    age_range_end: 6,
    duration_minutes: 10,
    materials: ['Mordedor', 'Chocalho'],
    development_areas: ['Coordenação motora fina', 'Cognição'],
  },
  {
    title: 'Espelho mágico',
    description: 'Coloque um espelho seguro à frente do bebê e observe as reações.',
    category: 'social',
    age_range_start: 3,
    age_range_end: 6,
    duration_minutes: 10,
    materials: ['Espelho seguro'],
    development_areas: ['Socialização', 'Cognição'],
  },
  {
    title: 'Livro de texturas',
    description: 'Passe as mãos do bebê em diferentes texturas de livros sensoriais.',
    category: 'sensory',
    age_range_start: 3,
    age_range_end: 6,
    duration_minutes: 10,
    materials: ['Livro sensorial'],
    development_areas: ['Percepção tátil', 'Cognição'],
  },
  {
    title: 'Cesto de tesouros',
    description: 'Ofereça um cesto com objetos variados e seguros para exploração.',
    category: 'sensory',
    age_range_start: 6,
    age_range_end: 9,
    duration_minutes: 15,
    materials: ['Cesto', 'Colher de pau', 'Esponja', 'Tecido'],
    development_areas: ['Percepção tátil', 'Coordenação motora fina', 'Cognição'],
  },
  {
    title: 'Cadê? Achou!',
    description: 'Brinque de esconder o rosto e objetos, trabalhando a permanência do objeto.',
    category: 'cognitive',
    age_range_start: 6,
    age_range_end: 9,
    duration_minutes: 10,
    materials: ['Pano leve'],
    development_areas: ['Cognição', 'Socialização'],
  },
  {
    title: 'Tamborzinho',
    description: 'Ofereça potes e colheres para o bebê bater e explorar sons.',
    category: 'sensory',
    age_range_start: 6,
    age_range_end: 9,
    duration_minutes: 10,
    materials: ['Pote plástico', 'Colher de pau'],
    development_areas: ['Percepção auditiva', 'Coordenação motora grossa'],
  },
  {
    title: 'Empilhar e derrubar',
    description: 'Use blocos ou potes empilháveis. Ajude a empilhar e deixe derrubar.',
    category: 'motor',
    age_range_start: 9,
    age_range_end: 12,
    duration_minutes: 15,
    materials: ['Blocos de empilhar'],
    development_areas: ['Coordenação motora fina', 'Resolução de problemas'],
  },
  {
    title: 'Primeiro desenho',
    description: 'Giz de cera grosso em papel grande. Deixe rabiscar livremente.',
    category: 'motor',
    age_range_start: 9,
    age_range_end: 12,
    duration_minutes: 10,
    materials: ['Giz de cera grosso', 'Papel grande'],
    development_areas: ['Coordenação motora fina', 'Cognição'],
  },
  {
    title: 'Apontar e nomear',
    description: 'Aponte para objetos, animais e pessoas nomeando cada um.',
    category: 'language',
    age_range_start: 9,
    age_range_end: 12,
    duration_minutes: 10,
    materials: ['Livro com figuras'],
    development_areas: ['Linguagem receptiva', 'Linguagem expressiva', 'Cognição'],
  },
  {
    title: 'Circuito de obstáculos',
    description: 'Crie um percurso seguro com almofadas para o bebê engatinhar/andar.',
    category: 'motor',
    age_range_start: 9,
    age_range_end: 12,
    duration_minutes: 15,
    materials: ['Almofadas', 'Túnel de tecido'],
    development_areas: ['Coordenação motora grossa', 'Equilíbrio', 'Resolução de problemas'],
  },
];

export function useStimulationBank(babyProfileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['stimulation-activities', user?.id, babyProfileId];

  const { data: activities = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('baby_stimulation_activities')
        .select('*')
        .eq('user_id', user!.id)
        .order('category', { ascending: true });

      if (babyProfileId) query = query.eq('baby_profile_id', babyProfileId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StimulationActivity[];
    },
    enabled: !!user,
    ...QueryCacheConfig.list,
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const items = DEFAULT_ACTIVITIES.map(a => ({
        ...a,
        user_id: user.id,
        baby_profile_id: babyProfileId || null,
        is_custom: false,
        is_favorite: false,
        completed_count: 0,
      }));
      const { error } = await supabase.from('baby_stimulation_activities').insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast('✨ Atividades carregadas!', {
        description: `${DEFAULT_ACTIVITIES.length} atividades disponíveis`,
      });
    },
    onError: () => {
      toast.error('Erro', { description: 'Erro ao carregar atividades' });
    },
  });

  const addActivity = useMutation({
    mutationFn: async (activity: Record<string, unknown>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('baby_stimulation_activities')
        .insert({
          ...activity,
          user_id: user.id,
          is_custom: true,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as StimulationActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast('Atividade criada!', { description: 'Nova atividade adicionada' });
    },
  });

  const markDone = useMutation({
    mutationFn: async (id: string) => {
      const current = activities.find(a => a.id === id);
      if (!current) throw new Error('Atividade não encontrada');
      const { data, error } = await supabase
        .from('baby_stimulation_activities')
        .update({
          completed_count: current.completed_count + 1,
          last_done_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as StimulationActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast('✅ Feito!', { description: 'Atividade registrada' });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      const current = activities.find(a => a.id === id);
      if (!current) throw new Error('Atividade não encontrada');
      const { data, error } = await supabase
        .from('baby_stimulation_activities')
        .update({ is_favorite: !current.is_favorite })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as StimulationActivity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('baby_stimulation_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast('Removido', { description: 'Atividade excluída' });
    },
  });

  return {
    activities,
    loading,
    addActivity: addActivity.mutateAsync,
    markDone: markDone.mutateAsync,
    toggleFavorite: toggleFavorite.mutateAsync,
    removeActivity: removeActivity.mutateAsync,
    seedDefaults: seedDefaults.mutateAsync,
    reload: () => queryClient.invalidateQueries({ queryKey }),
  };
}
