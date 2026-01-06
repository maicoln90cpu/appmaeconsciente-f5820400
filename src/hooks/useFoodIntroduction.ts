/**
 * @fileoverview Hook para gerenciar diário de introdução alimentar
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FoodIntroductionLog {
  id: string;
  user_id: string;
  baby_profile_id: string | null;
  food_name: string;
  food_category: string;
  introduction_date: string;
  reaction_type: string;
  reaction_symptoms: string[] | null;
  is_allergenic: boolean;
  accepted: boolean;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodIntroductionInput {
  baby_profile_id?: string;
  food_name: string;
  food_category: string;
  introduction_date: string;
  reaction_type?: string;
  reaction_symptoms?: string[];
  is_allergenic?: boolean;
  accepted?: boolean;
  notes?: string;
  photo_url?: string;
}

export const FOOD_CATEGORIES = [
  { value: "frutas", label: "Frutas", emoji: "🍎" },
  { value: "vegetais", label: "Vegetais", emoji: "🥦" },
  { value: "proteinas", label: "Proteínas", emoji: "🍗" },
  { value: "graos", label: "Grãos e Cereais", emoji: "🌾" },
  { value: "laticinios", label: "Laticínios", emoji: "🥛" },
  { value: "outros", label: "Outros", emoji: "🍽️" },
];

export const REACTION_TYPES = [
  { value: "nenhuma", label: "Nenhuma reação", color: "green" },
  { value: "leve", label: "Reação leve", color: "yellow" },
  { value: "moderada", label: "Reação moderada", color: "orange" },
  { value: "severa", label: "Reação severa", color: "red" },
];

export const COMMON_SYMPTOMS = [
  "Vermelhidão na pele",
  "Inchaço",
  "Urticária",
  "Vômito",
  "Diarréia",
  "Cólica",
  "Irritabilidade",
  "Dificuldade respiratória",
  "Recusa alimentar",
];

export const ALLERGENIC_FOODS = [
  "Leite de vaca",
  "Ovo",
  "Amendoim",
  "Castanhas",
  "Trigo",
  "Soja",
  "Peixe",
  "Frutos do mar",
  "Gergelim",
  "Kiwi",
  "Morango",
  "Mel",
];

export const useFoodIntroduction = (babyProfileId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch food logs
  const { data: foodLogs = [], isLoading } = useQuery({
    queryKey: ["food-introduction", user?.id, babyProfileId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("food_introduction_log")
        .select("*")
        .eq("user_id", user.id)
        .order("introduction_date", { ascending: false });

      if (babyProfileId) {
        query = query.eq("baby_profile_id", babyProfileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FoodIntroductionLog[];
    },
    enabled: !!user,
  });

  // Add food log
  const addFoodLog = useMutation({
    mutationFn: async (input: FoodIntroductionInput) => {
      if (!user) throw new Error("Not authenticated");

      const isAllergenic = ALLERGENIC_FOODS.some(
        (food) => input.food_name.toLowerCase().includes(food.toLowerCase())
      );

      const { data, error } = await supabase
        .from("food_introduction_log")
        .insert({
          user_id: user.id,
          ...input,
          is_allergenic: input.is_allergenic ?? isAllergenic,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["food-introduction"] });
      
      if (data.reaction_type && data.reaction_type !== "nenhuma") {
        toast.warning(`⚠️ Reação registrada para ${data.food_name}`, {
          description: "Monitore o bebê e consulte o pediatra se necessário",
          duration: 5000,
        });
      } else {
        toast.success(`${data.food_name} adicionado ao diário!`);
      }
    },
    onError: () => {
      toast.error("Erro ao registrar alimento");
    },
  });

  // Update food log
  const updateFoodLog = useMutation({
    mutationFn: async ({ id, ...input }: Partial<FoodIntroductionInput> & { id: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("food_introduction_log")
        .update(input)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-introduction"] });
      toast.success("Registro atualizado!");
    },
  });

  // Delete food log
  const deleteFoodLog = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("food_introduction_log")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-introduction"] });
      toast.success("Registro removido!");
    },
  });

  // Stats
  const stats = {
    totalFoods: foodLogs.length,
    acceptedFoods: foodLogs.filter((f) => f.accepted).length,
    rejectedFoods: foodLogs.filter((f) => !f.accepted).length,
    reactionsCount: foodLogs.filter((f) => f.reaction_type !== "nenhuma").length,
    allergenicFoods: foodLogs.filter((f) => f.is_allergenic).length,
    byCategory: FOOD_CATEGORIES.map((cat) => ({
      ...cat,
      count: foodLogs.filter((f) => f.food_category === cat.value).length,
    })),
  };

  // Foods with reactions (for alerts)
  const foodsWithReactions = foodLogs.filter(
    (f) => f.reaction_type && f.reaction_type !== "nenhuma"
  );

  // Check if food was already introduced
  const wasFoodIntroduced = (foodName: string) => {
    return foodLogs.some(
      (f) => f.food_name.toLowerCase() === foodName.toLowerCase()
    );
  };

  return {
    foodLogs,
    isLoading,
    stats,
    foodsWithReactions,
    addFoodLog: addFoodLog.mutate,
    updateFoodLog: updateFoodLog.mutate,
    deleteFoodLog: deleteFoodLog.mutate,
    isAdding: addFoodLog.isPending,
    wasFoodIntroduced,
    FOOD_CATEGORIES,
    REACTION_TYPES,
    COMMON_SYMPTOMS,
    ALLERGENIC_FOODS,
  };
};
