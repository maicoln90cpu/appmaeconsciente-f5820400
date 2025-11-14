import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DevelopmentMilestoneType, 
  BabyMilestoneRecord, 
  MilestoneStatus,
  DevelopmentSummary 
} from '@/types/development';
import { differenceInMonths } from 'date-fns';

export const useDevelopmentMilestones = (babyProfileId: string | null) => {
  const [milestoneTypes, setMilestoneTypes] = useState<DevelopmentMilestoneType[]>([]);
  const [records, setRecords] = useState<BabyMilestoneRecord[]>([]);
  const [summary, setSummary] = useState<DevelopmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const calculateAge = (birthDate: string): number => {
    return differenceInMonths(new Date(), new Date(birthDate));
  };

  const calculateStatus = useCallback((
    milestone: DevelopmentMilestoneType,
    babyAgeMonths: number,
    record: BabyMilestoneRecord | null
  ): MilestoneStatus => {
    if (record?.achieved_date) return 'achieved';
    if (babyAgeMonths > milestone.age_max_months + 1) return 'attention';
    return 'pending';
  }, []);

  const loadData = useCallback(async () => {
    if (!babyProfileId) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para acessar os marcos de desenvolvimento.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Load baby profile to get age
      const { data: profile } = await supabase
        .from('baby_vaccination_profiles')
        .select('*')
        .eq('id', babyProfileId)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const babyAgeMonths = calculateAge(profile.birth_date);

      // Load milestone types
      // @ts-ignore
      const { data: types, error: typesError } = await supabase
        // @ts-ignore
        .from('development_milestone_types')
        .select('*')
        .eq('is_active', true)
        .order('age_min_months', { ascending: true });

      if (typesError) throw typesError;
      // @ts-ignore
      setMilestoneTypes((types || []) as DevelopmentMilestoneType[]);

      // Load existing records
      // @ts-ignore
      const { data: existingRecords, error: recordsError } = await supabase
        // @ts-ignore
        .from('baby_milestone_records')
        .select('*')
        .eq('baby_profile_id', babyProfileId);

      if (recordsError) throw recordsError;
      
      // @ts-ignore
      const typedRecords = (existingRecords || []) as BabyMilestoneRecord[];

      // Create records map for quick lookup
      const recordsMap = new Map(
        typedRecords.map(r => [r.milestone_type_id, r])
      );

      // Calculate status for all milestones and merge with records
      const enrichedRecords: BabyMilestoneRecord[] = (types || []).map(milestone => {
        // @ts-ignore
        const typedMilestone = milestone as DevelopmentMilestoneType;
        const existingRecord = recordsMap.get(milestone.id);
        const status = calculateStatus(typedMilestone, babyAgeMonths, existingRecord || null);

        if (existingRecord) {
          return {
            ...existingRecord,
            status,
            milestone: typedMilestone
          };
        }

        // Create virtual record for display
        return {
          id: '',
          user_id: user.id,
          baby_profile_id: babyProfileId,
          milestone_type_id: milestone.id,
          status,
          achieved_date: null,
          mother_notes: null,
          photo_url: null,
          video_url: null,
          marked_as_achieved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          milestone: typedMilestone
        };
      });

      setRecords(enrichedRecords);

      // Calculate summary
      const summaryData: DevelopmentSummary = {
        baby_profile_id: babyProfileId,
        baby_name: profile.baby_name,
        age_months: babyAgeMonths,
        motor_grosso_total: 0,
        motor_grosso_achieved: 0,
        motor_fino_total: 0,
        motor_fino_achieved: 0,
        linguagem_total: 0,
        linguagem_achieved: 0,
        cognitivo_total: 0,
        cognitivo_achieved: 0,
        social_emocional_total: 0,
        social_emocional_achieved: 0,
        attention_count: 0,
        last_milestone_date: null
      };

      enrichedRecords.forEach(record => {
        if (!record.milestone) return;
        
        const area = record.milestone.area;
        const isExpected = record.milestone.age_max_months <= babyAgeMonths;

        if (isExpected) {
          const totalKey = `${area}_total`;
          summaryData[totalKey] = ((summaryData as any)[totalKey] || 0) + 1;

          if (record.status === 'achieved') {
            const achievedKey = `${area}_achieved`;
            summaryData[achievedKey] = ((summaryData as any)[achievedKey] || 0) + 1;

            if (record.achieved_date) {
              if (!summaryData.last_milestone_date || 
                  record.achieved_date > summaryData.last_milestone_date) {
                summaryData.last_milestone_date = record.achieved_date;
              }
            }
          }

          if (record.status === 'attention') {
            summaryData.attention_count++;
          }
        }
      });

      setSummary(summaryData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading development data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os marcos de desenvolvimento.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [babyProfileId, calculateStatus, toast]);

  const markAsAchieved = async (
    milestoneTypeId: string, 
    achievedDate: Date, 
    notes?: string
  ) => {
    if (!babyProfileId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // @ts-ignore
      const { data, error } = await supabase
        // @ts-ignore
        .from('baby_milestone_records')
        .upsert({
          user_id: user.id,
          baby_profile_id: babyProfileId,
          milestone_type_id: milestoneTypeId,
          status: 'achieved',
          achieved_date: achievedDate.toISOString().split('T')[0],
          mother_notes: notes || null,
          marked_as_achieved_at: new Date().toISOString()
        }, {
          onConflict: 'baby_profile_id,milestone_type_id'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Marco registrado!",
        description: "A conquista foi salva com sucesso.",
      });

      await loadData();
    } catch (error) {
      console.error('Error marking milestone:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar o marco.",
        variant: "destructive",
      });
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<BabyMilestoneRecord>) => {
    try {
      // @ts-ignore
      const { error } = await supabase
        // @ts-ignore
        .from('baby_milestone_records')
        .update(updates)
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Atualizado!",
        description: "O marco foi atualizado com sucesso.",
      });

      await loadData();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o marco.",
        variant: "destructive",
      });
    }
  };

  const getMilestonesByArea = useCallback((area: string) => {
    return milestoneTypes.filter(m => m.area === area);
  }, [milestoneTypes]);

  const getMilestonesByAge = useCallback((ageMonths: number, marginMonths: number = 1) => {
    return milestoneTypes.filter(
      m => ageMonths >= m.age_min_months - marginMonths && 
           ageMonths <= m.age_max_months + marginMonths
    );
  }, [milestoneTypes]);

  const getAttentionMilestones = useCallback(() => {
    return records.filter(r => r.status === 'attention');
  }, [records]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    milestoneTypes,
    records,
    summary,
    loading,
    loadData,
    markAsAchieved,
    updateRecord,
    getMilestonesByArea,
    getMilestonesByAge,
    getAttentionMilestones
  };
};
