import { z } from "zod";

export const babyProfileSchema = z.object({
  baby_name: z.string()
    .min(1, "Nome do bebê é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  nickname: z.string()
    .max(50, "Apelido deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),
  birth_date: z.string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de nascimento inválida"
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: "Data de nascimento não pode ser no futuro"
    }),
  birth_city: z.string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  birth_type: z.enum(["normal", "cesarean"]).optional().nullable(),
  calendar_type: z.enum(["pni", "sbim", "both"]).default("pni"),
  avatar_url: z.string().url("URL do avatar inválida").optional().nullable().or(z.literal("")),
  development_monitoring_enabled: z.boolean().optional(),
  development_notes: z.string()
    .max(1000, "Notas devem ter no máximo 1000 caracteres")
    .optional()
    .nullable(),
});

export const vaccinationSchema = z.object({
  vaccine_name: z.string()
    .min(1, "Nome da vacina é obrigatório")
    .max(200, "Nome da vacina deve ter no máximo 200 caracteres"),
  application_date: z.string()
    .min(1, "Data de aplicação é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de aplicação inválida"
    })
    .refine((val) => new Date(val) <= new Date(), {
      message: "Data de aplicação não pode ser no futuro"
    }),
  dose_label: z.string()
    .max(50, "Dose deve ter no máximo 50 caracteres")
    .optional()
    .nullable(),
  batch_number: z.string()
    .max(100, "Lote deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  manufacturer: z.string()
    .max(100, "Fabricante deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  application_site: z.string()
    .max(100, "Local de aplicação deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  health_professional: z.string()
    .max(200, "Nome do profissional deve ter no máximo 200 caracteres")
    .optional()
    .nullable(),
  reactions: z.string()
    .max(500, "Reações devem ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  notes: z.string()
    .max(500, "Observações devem ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  proof_url: z.string().url("URL do comprovante inválida").optional().nullable().or(z.literal("")),
  calendar_vaccine_id: z.string().uuid("ID da vacina do calendário inválido").optional().nullable(),
});

export const reminderSettingsSchema = z.object({
  reminders_enabled: z.boolean().optional(),
  reminder_days_before: z.number()
    .min(1, "Dias de antecedência mínimo: 1")
    .max(30, "Dias de antecedência máximo: 30")
    .optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
});

export type BabyProfileInput = z.infer<typeof babyProfileSchema>;
export type VaccinationInput = z.infer<typeof vaccinationSchema>;
export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;

export function validateBabyProfile(data: unknown) {
  const result = babyProfileSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}

export function validateVaccination(data: unknown) {
  const result = vaccinationSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}

export function validateReminderSettings(data: unknown) {
  const result = reminderSettingsSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors.map(e => e.message) };
}
