import { z } from "zod";

export const feedingSettingsSchema = z.object({
  baby_name: z.string()
    .min(1, "Nome do bebê é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  baby_birthdate: z.string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de nascimento inválida"
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: "Data de nascimento não pode ser no futuro"
    }),
  feeding_interval_minutes: z.number()
    .min(30, "Intervalo mínimo de 30 minutos")
    .max(480, "Intervalo máximo de 8 horas")
    .optional()
    .nullable(),
  reminder_enabled: z.boolean().optional(),
  last_breast_side: z.enum(["left", "right"]).optional().nullable(),
});

export const feedingLogSchema = z.object({
  feeding_type: z.enum(["breastfeeding", "bottle", "mixed"], {
    errorMap: () => ({ message: "Tipo de alimentação inválido" })
  }),
  start_time: z.string()
    .min(1, "Horário de início é obrigatório")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Horário de início inválido"
    }),
  end_time: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Horário de término inválido"
    }),
  duration_minutes: z.number()
    .min(1, "Duração mínima de 1 minuto")
    .max(120, "Duração máxima de 2 horas")
    .optional()
    .nullable(),
  breast_side: z.enum(["left", "right", "both"]).optional().nullable(),
  volume_ml: z.number()
    .min(0, "Volume não pode ser negativo")
    .max(500, "Volume máximo de 500ml")
    .optional()
    .nullable(),
  milk_type: z.enum(["breast", "formula", "mixed"]).optional().nullable(),
  temperature: z.enum(["cold", "room", "warm"]).optional().nullable(),
  leftover_ml: z.number()
    .min(0, "Sobra não pode ser negativa")
    .max(500, "Sobra máxima de 500ml")
    .optional()
    .nullable(),
  baby_name: z.string()
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  notes: z.string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

export const milkStorageSchema = z.object({
  volume_ml: z.number()
    .min(1, "Volume mínimo de 1ml")
    .max(500, "Volume máximo de 500ml"),
  pumped_at: z.string()
    .min(1, "Data/hora de ordenha é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data/hora de ordenha inválida"
    }),
  storage_location: z.enum(["fridge", "freezer"], {
    errorMap: () => ({ message: "Local de armazenamento inválido" })
  }),
  expires_at: z.string()
    .min(1, "Data de validade é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de validade inválida"
    }),
  pump_method: z.enum(["manual", "electric"]).optional().nullable(),
  notes: z.string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

export type FeedingSettingsInput = z.infer<typeof feedingSettingsSchema>;
export type FeedingLogInput = z.infer<typeof feedingLogSchema>;
export type MilkStorageInput = z.infer<typeof milkStorageSchema>;

export function validateFeedingSettings(data: unknown) {
  const result = feedingSettingsSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}

export function validateFeedingLog(data: unknown) {
  const result = feedingLogSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}

export function validateMilkStorage(data: unknown) {
  const result = milkStorageSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}
