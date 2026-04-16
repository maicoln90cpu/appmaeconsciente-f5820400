import { z } from 'zod';

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome muito longo')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
    email: z.string().email('Email inválido').max(255, 'Email muito longo'),
    whatsapp: z
      .string()
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'WhatsApp inválido. Use (XX) XXXXX-XXXX')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Password strength calculation
export const calculatePasswordStrength = (
  password: string
): {
  score: number;
  label: 'fraca' | 'média' | 'forte';
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: 'fraca', color: 'bg-destructive' };
  } else if (score <= 3) {
    return { score, label: 'média', color: 'bg-yellow-500' };
  } else {
    return { score, label: 'forte', color: 'bg-green-500' };
  }
};

// WhatsApp mask formatter
export const formatWhatsApp = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
