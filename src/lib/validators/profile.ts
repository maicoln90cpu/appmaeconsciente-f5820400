import { z } from "zod";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export const profileSchema = z.object({
  idade: z.string()
    .optional()
    .refine((val) => !val || (parseInt(val) >= 12 && parseInt(val) <= 100), {
      message: "Idade deve ser entre 12 e 100 anos"
    }),
  sexo: z.enum(["masculino", "feminino", "outro"]).optional().or(z.literal("")),
  cidade: z.string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  estado: z.enum(ESTADOS as [string, ...string[]])
    .optional()
    .or(z.literal("")),
  meses_gestacao: z.string()
    .optional()
    .refine((val) => !val || (parseInt(val) >= 0 && parseInt(val) <= 40), {
      message: "Meses de gestação deve ser entre 0 e 40"
    }),
  data_prevista_parto: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Data prevista do parto inválida"
    }),
  data_inicio_planejamento: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Data de início do planejamento inválida"
    }),
  possui_filhos: z.boolean().optional(),
  idades_filhos: z.string()
    .max(100, "Lista de idades muito longa")
    .optional()
    .or(z.literal("")),
  foto_perfil_url: z.string()
    .url("URL da foto inválida")
    .optional()
    .or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export function validateProfile(data: unknown): { success: true; data: ProfileFormData } | { success: false; errors: string[] } {
  const result = profileSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(e => e.message);
  return { success: false, errors };
}
