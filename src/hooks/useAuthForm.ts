import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { logger } from '@/lib/logger';
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from '@/lib/rate-limiter';
import { signUpSchema, signInSchema, forgotPasswordSchema } from '@/lib/validators/auth';

import { supabase } from '@/integrations/supabase/client';


export type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

export interface FormErrors {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  password?: string;
  confirmPassword?: string;
}

const RESET_PASSWORD_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 60 * 60 * 1000,
};

const REMEMBER_ME_KEY = 'maternidade_remember_email';

export function useAuthForm() {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [resetCooldown, setResetCooldown] = useState<number | null>(null);

  // Load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check reset cooldown
  useEffect(() => {
    if (mode === 'forgot_password') {
      const status = getRateLimitStatus(`reset:${email}`, RESET_PASSWORD_RATE_LIMIT);
      if (status.lockedUntil) {
        const remaining = Math.ceil((status.lockedUntil.getTime() - Date.now()) / 1000);
        setResetCooldown(remaining > 0 ? remaining : null);
      }
    }
  }, [mode, email]);

  // Countdown timer
  useEffect(() => {
    if (resetCooldown && resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(prev => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword;

  const validateForm = (): boolean => {
    setErrors({});
    try {
      if (mode === 'sign_up') {
        signUpSchema.parse({
          fullName,
          email,
          whatsapp: whatsapp || undefined,
          password,
          confirmPassword,
        });
      } else if (mode === 'sign_in') {
        signInSchema.parse({ email, password });
      } else {
        forgotPasswordSchema.parse({ email });
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof FormErrors;
          if (!newErrors[field]) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const rateLimitResult = checkRateLimit(`auth:${email}`);
    if (!rateLimitResult.allowed) {
      toast.error('Muitas tentativas', {
        description: rateLimitResult.message || 'Aguarde antes de tentar novamente.',
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        resetRateLimit(`auth:${email}`);
        toast('Bem-vindo(a)!', { description: 'Login realizado com sucesso.' });
      } else if (mode === 'sign_up') {
        if (!consentAccepted) {
          toast.error('Consentimento necessário', {
            description: 'Você precisa aceitar os termos para criar uma conta.',
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;

        if (data.user) {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName.trim(),
              whatsapp: whatsapp || null,
            })
            .eq('id', data.user.id);

          await supabase.from('user_consents').insert({
            user_id: data.user.id,
            consent_type: 'terms_and_privacy',
            consent_version: '1.0',
            accepted: true,
            accepted_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
          });
        }

        toast('Conta criada!', { description: 'Sua conta foi criada com sucesso.' });
      } else if (mode === 'forgot_password') {
        const resetResult = checkRateLimit(`reset:${email}`, RESET_PASSWORD_RATE_LIMIT);
        if (!resetResult.allowed) {
          const cooldownSeconds = resetResult.lockedUntil
            ? Math.ceil((resetResult.lockedUntil.getTime() - Date.now()) / 1000)
            : 60;
          setResetCooldown(cooldownSeconds);
          toast.error('Limite de tentativas atingido', {
            description: `Por segurança, aguarde ${Math.ceil(cooldownSeconds / 60)} minuto(s) antes de tentar novamente.`,
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;

        toast('Email enviado!', {
          description:
            'Verifique sua caixa de entrada para redefinir a senha. O link expira em 24 horas.',
        });
        setMode('sign_in');
      }
    } catch (error: any) {
      logger.error('Auth error', error, { context: 'Auth', data: { mode } });
      let message = 'Ocorreu um erro. Tente novamente.';

      if (error.message?.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos.';
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Confirme seu email antes de entrar.';
      } else if (error.message?.includes('User already registered')) {
        message = 'Este email já está cadastrado.';
      } else if (error.message?.includes('Password should be')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }

      toast.error('Erro', { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
  };

  return {
    mode,
    fullName,
    setFullName,
    email,
    setEmail,
    whatsapp,
    setWhatsapp,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    consentAccepted,
    setConsentAccepted,
    rememberMe,
    setRememberMe,
    errors,
    resetCooldown,
    passwordsMatch: !!passwordsMatch,
    passwordsDontMatch: !!passwordsDontMatch,
    handleSubmit,
    handleModeChange,
  };
}
