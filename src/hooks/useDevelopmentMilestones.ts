/**
 * @fileoverview Hook para gerenciamento de marcos de desenvolvimento
 * @module hooks/useDevelopmentMilestones
 * 
 * Provê dados de marcos com React Query e cache otimizado
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DevelopmentMilestoneType, 
  BabyMilestoneRecord, 
  MilestoneStatus,
  DevelopmentSummary 
} from '@/types/development';
import { differenceInMonths } from 'date-fns';
import { QueryKeys, QueryCacheConfig } from '@/lib/query-config';

export const useDevelopmentMilestones = (babyProfileId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Query para tipos de marcos (dados estáticos)
  const { data: milestoneTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: QueryKeys.milestoneTypes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('development_milestone_types')
        .select('id, area, title, description, age_min_months, age_max_months, is_active, display_order, created_at')
        .eq('is_active', true)
        .order('age_min_months', { ascending: true });

      if (error) throw error;
      return (data || []) as DevelopmentMilestoneType[];
    },
    ...QueryCacheConfig.static, // Cache estático (24h)
  });

  // Query para registros do bebê
  const { 
    data: queryData, 
    isLoading: recordsLoading,
    refetch: refetchRecords
  } = useQuery({
    queryKey: babyProfileId ? QueryKeys.milestoneRecords(babyProfileId) : ['milestone-records'],
    queryFn: async () => {
      if (!babyProfileId || !user) return { records: [], summary: null, babyAgeMonths: 0 };

      // Carregar perfil do bebê
      const { data: profile } = await supabase
        .from('baby_vaccination_profiles')
        .select('id, baby_name, birth_date, gender')
        .eq('id', babyProfileId)
        .single();

      if (!profile) return { records: [], summary: null, babyAgeMonths: 0 };

      const babyAgeMonths = calculateAge(profile.birth_date);

      // Carregar registros existentes
      const { data: existingRecords, error } = await supabase
        .from('baby_milestone_records')
        .select('id, user_id, baby_profile_id, milestone_type_id, status, achieved_date, mother_notes, photo_url, video_url, marked_as_achieved_at, created_at, updated_at')
        .eq('baby_profile_id', babyProfileId);

      if (error) throw error;

      const typedRecords = (existingRecords || []) as BabyMilestoneRecord[];
      const recordsMap = new Map(typedRecords.map(r => [r.milestone_type_id, r]));

      // Enriquecer registros com status calculado
      const enrichedRecords: BabyMilestoneRecord[] = milestoneTypes.map(milestone => {
        const existingRecord = recordsMap.get(milestone.id);
        const status = calculateStatus(milestone, babyAgeMonths, existingRecord || null);

        if (existingRecord) {
          return { ...existingRecord, status, milestone };
        }

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
          milestone
        };
      });

      // Calcular resumo
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
          (summaryData as any)[totalKey] = ((summaryData as any)[totalKey] || 0) + 1;

          if (record.status === 'achieved') {
            const achievedKey = `${area}_achieved`;
            (summaryData as any)[achievedKey] = ((summaryData as any)[achievedKey] || 0) + 1;

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

      return { records: enrichedRecords, summary: summaryData, babyAgeMonths };
    },
    enabled: !!babyProfileId && !!user && milestoneTypes.length > 0,
    ...QueryCacheConfig.user, // Cache de usuário (5min)
  });

  const records = queryData?.records ?? [];
  const summary = queryData?.summary ?? null;

  // Mutation para marcar como alcançado
  const markMutation = useMutation({
    mutationFn: async ({ 
      milestoneTypeId, 
      achievedDate, 
      notes 
    }: { 
      milestoneTypeId: string; 
      achievedDate: Date; 
      notes?: string;
    }) => {
      if (!babyProfileId || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
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
      return data;
    },
    onSuccess: () => {
      toast({ title: "Marco registrado!", description: "A conquista foi salva com sucesso." });
      if (babyProfileId) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.milestoneRecords(babyProfileId) });
      }
    },
    onError: (error) => {
      console.error('Error marking milestone:', error);
      toast({ title: "Erro ao salvar", description: "Não foi possível registrar o marco.", variant: "destructive" });
    }
  });

  // Mutation para atualizar registro
  const updateMutation = useMutation({
    mutationFn: async ({ recordId, updates }: { recordId: string; updates: Partial<BabyMilestoneRecord> }) => {
      const { error } = await supabase
        .from('baby_milestone_records')
        .update(updates)
        .eq('id', recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Atualizado!", description: "O marco foi atualizado com sucesso." });
      if (babyProfileId) {
        queryClient.invalidateQueries({ queryKey: QueryKeys.milestoneRecords(babyProfileId) });
      }
    },
    onError: (error) => {
      console.error('Error updating record:', error);
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar o marco.", variant: "destructive" });
    }
  });

  const markAsAchieved = async (milestoneTypeId: string, achievedDate: Date, notes?: string): Promise<void> => {
    await markMutation.mutateAsync({ milestoneTypeId, achievedDate, notes });
  };

  const updateRecord = async (recordId: string, updates: Partial<BabyMilestoneRecord>) => {
    return updateMutation.mutateAsync({ recordId, updates });
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

  const loading = typesLoading || recordsLoading;

  return {
    milestoneTypes,
    records,
    summary,
    loading,
    loadData: refetchRecords,
    markAsAchieved,
    updateRecord,
    getMilestonesByArea,
    getMilestonesByAge,
    getAttentionMilestones
  };
};
