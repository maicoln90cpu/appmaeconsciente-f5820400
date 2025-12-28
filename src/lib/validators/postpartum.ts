import { z } from "zod";

export const postpartumSymptomSchema = z.object({
  date: z.string()
    .min(1, "Data é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida"
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: "Data não pode ser no futuro"
    }),
  pain_level: z.number()
    .min(0, "Nível de dor mínimo: 0")
    .max(5, "Nível de dor máximo: 5")
    .optional()
    .nullable(),
  bleeding_intensity: z.enum(["light", "moderate", "heavy", "very_heavy"], {
    errorMap: () => ({ message: "Intensidade de sangramento inválida" })
  }).optional().nullable(),
  cramps_level: z.number()
    .min(0, "Nível de cólicas mínimo: 0")
    .max(5, "Nível de cólicas máximo: 5")
    .optional()
    .nullable(),
  swelling: z.array(z.string().max(50, "Item de inchaço muito longo"))
    .max(10, "Máximo 10 áreas de inchaço")
    .optional()
    .nullable(),
  healing_status: z.enum(["normal", "slow", "infected", "concerning"], {
    errorMap: () => ({ message: "Status de cicatrização inválido" })
  }).optional().nullable(),
  energy_level: z.number()
    .min(0, "Nível de energia mínimo: 0")
    .max(5, "Nível de energia máximo: 5")
    .optional()
    .nullable(),
  sleep_quality: z.number()
    .min(0, "Qualidade do sono mínima: 0")
    .max(5, "Qualidade do sono máxima: 5")
    .optional()
    .nullable(),
  appetite: z.enum(["normal", "low", "high", "none"], {
    errorMap: () => ({ message: "Apetite inválido" })
  }).optional().nullable(),
  bowel_movement: z.enum(["normal", "constipated", "diarrhea", "painful"], {
    errorMap: () => ({ message: "Funcionamento intestinal inválido" })
  }).optional().nullable(),
  urination: z.enum(["normal", "painful", "frequent", "difficult"], {
    errorMap: () => ({ message: "Micção inválida" })
  }).optional().nullable(),
  fever: z.boolean().optional().nullable(),
  temperature: z.number()
    .min(35, "Temperatura mínima: 35°C")
    .max(42, "Temperatura máxima: 42°C")
    .optional()
    .nullable(),
  breast_pain: z.boolean().optional().nullable(),
  notes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
});

export type PostpartumSymptomInput = z.infer<typeof postpartumSymptomSchema>;

export function validatePostpartumSymptom(data: unknown) {
  const result = postpartumSymptomSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}

// Validação adicional para alertas críticos
export function checkCriticalSymptoms(data: PostpartumSymptomInput): { 
  critical: boolean; 
  warnings: string[] 
} {
  const warnings: string[] = [];
  
  if (data.bleeding_intensity === 'very_heavy') {
    warnings.push('CRÍTICO: Sangramento muito intenso - procure atendimento médico imediatamente');
  }
  
  if (data.fever && data.temperature && data.temperature >= 38) {
    warnings.push('ALERTA: Febre detectada - pode indicar infecção');
  }
  
  if (data.healing_status === 'infected') {
    warnings.push('CRÍTICO: Sinais de infecção na cicatrização - procure atendimento médico');
  }
  
  if (data.pain_level && data.pain_level >= 4) {
    warnings.push('ALERTA: Dor intensa detectada');
  }
  
  return {
    critical: warnings.some(w => w.startsWith('CRÍTICO')),
    warnings
  };
}
