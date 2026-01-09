import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/useToast";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Baby, Eye, EyeOff, Loader2, Mail, Lock, User, Check, X } from "lucide-react";
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from "@/lib/rate-limiter";
import { signUpSchema, signInSchema, forgotPasswordSchema } from "@/lib/validators/auth";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

interface FormErrors {
  fullName?: string;
  email?: string;
  whatsapp?: string;
  password?: string;
  confirmPassword?: string;
}

// Rate limit config específico para reset de senha (mais restritivo)
const RESET_PASSWORD_RATE_LIMIT = {
  maxAttempts: 3,           // Máximo 3 tentativas
  windowMs: 15 * 60 * 1000, // Janela de 15 minutos
  lockoutMs: 60 * 60 * 1000 // Bloqueio de 1 hora
};

// Chave para persistência do "Lembrar-me"
const REMEMBER_ME_KEY = 'maternidade_remember_email';

export const Auth = () => {
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
  const { toast } = useToast();

  // Carregar email salvo do "Lembrar-me"
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Verificar cooldown do reset de senha
  useEffect(() => {
    if (mode === 'forgot_password') {
      const status = getRateLimitStatus(`reset:${email}`, RESET_PASSWORD_RATE_LIMIT);
      if (status.lockedUntil) {
        const remaining = Math.ceil((status.lockedUntil.getTime() - Date.now()) / 1000);
        setResetCooldown(remaining > 0 ? remaining : null);
      }
    }
  }, [mode, email]);

  // Countdown timer para cooldown
  useEffect(() => {
    if (resetCooldown && resetCooldown > 0) {
      const timer = setTimeout(() => {
        setResetCooldown(prev => prev && prev > 1 ? prev - 1 : null);
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
        signUpSchema.parse({ fullName, email, whatsapp: whatsapp || undefined, password, confirmPassword });
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

    // Rate limiting check
    const rateLimitResult = checkRateLimit(`auth:${email}`);
    if (!rateLimitResult.allowed) {
      toast({
        title: "Muitas tentativas",
        description: rateLimitResult.message || "Aguarde antes de tentar novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Salvar ou remover email baseado no "Lembrar-me"
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        resetRateLimit(`auth:${email}`);
        toast({
          title: "Bem-vindo(a)!",
          description: "Login realizado com sucesso.",
        });
      } else if (mode === 'sign_up') {
        if (!consentAccepted) {
          toast({
            title: "Consentimento necessário",
            description: "Você precisa aceitar os termos para criar uma conta.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (error) throw error;

        // Update profile with full_name and whatsapp after creating account
        if (data.user) {
          await supabase.from('profiles').update({
            full_name: fullName.trim(),
            whatsapp: whatsapp || null,
          }).eq('id', data.user.id);

          // Register consent
          await supabase.from('user_consents').insert({
            user_id: data.user.id,
            consent_type: 'terms_and_privacy',
            consent_version: '1.0',
            accepted: true,
            accepted_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
          });
        }

        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso.",
        });
      } else if (mode === 'forgot_password') {
        // Rate limiting específico para reset de senha (mais restritivo)
        const resetRateLimitResult = checkRateLimit(`reset:${email}`, RESET_PASSWORD_RATE_LIMIT);
        if (!resetRateLimitResult.allowed) {
          const cooldownSeconds = resetRateLimitResult.lockedUntil 
            ? Math.ceil((resetRateLimitResult.lockedUntil.getTime() - Date.now()) / 1000)
            : 60;
          setResetCooldown(cooldownSeconds);
          toast({
            title: "Limite de tentativas atingido",
            description: `Por segurança, aguarde ${Math.ceil(cooldownSeconds / 60)} minuto(s) antes de tentar novamente.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha. O link expira em 24 horas.",
        });
        setMode('sign_in');
      }
    } catch (error: any) {
      logger.error("Auth error", error, { context: "Auth", data: { mode } });
      let message = "Ocorreu um erro. Tente novamente.";
      
      if (error.message?.includes('Invalid login credentials')) {
        message = "Email ou senha incorretos.";
      } else if (error.message?.includes('Email not confirmed')) {
        message = "Confirme seu email antes de entrar.";
      } else if (error.message?.includes('User already registered')) {
        message = "Este email já está cadastrado.";
      } else if (error.message?.includes('Password should be')) {
        message = "A senha deve ter pelo menos 6 caracteres.";
      }

      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    // Keep email when switching modes for convenience
  };

  return (
    <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl border-border/50">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
            <Baby className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Maternidade Consciente</CardTitle>
            <CardDescription className="mt-1">
              {mode === 'sign_in' && "Faça login para continuar"}
              {mode === 'sign_up' && "Crie sua conta para começar"}
              {mode === 'forgot_password' && "Recupere sua senha"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name - Only for sign up */}
          {mode === 'sign_up' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Maria Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className={cn(
                    "pl-10",
                    errors.fullName && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={cn(
                  "pl-10",
                  errors.email && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* WhatsApp - Only for sign up */}
          {mode === 'sign_up' && (
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <PhoneInput
                id="whatsapp"
                value={whatsapp}
                onChange={setWhatsapp}
                disabled={loading}
                error={errors.whatsapp}
              />
              {errors.whatsapp && (
                <p className="text-xs text-destructive">{errors.whatsapp}</p>
              )}
            </div>
          )}

          {/* Password */}
          {mode !== 'forgot_password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  className={cn(
                    "pl-10 pr-10",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
              {mode === 'sign_up' && password && (
                <PasswordStrength password={password} />
              )}
            </div>
          )}

          {/* Confirm Password - Only for sign up */}
          {mode === 'sign_up' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  className={cn(
                    "pl-10 pr-10",
                    (errors.confirmPassword || passwordsDontMatch) && "border-destructive focus-visible:ring-destructive",
                    passwordsMatch && "border-green-500 focus-visible:ring-green-500"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
              {confirmPassword && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  passwordsMatch ? "text-green-600" : "text-destructive"
                )}>
                  {passwordsMatch ? (
                    <>
                      <Check className="h-3 w-3" />
                      Senhas conferem
                    </>
                  ) : passwordsDontMatch ? (
                    <>
                      <X className="h-3 w-3" />
                      Senhas não conferem
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* LGPD Consent - Only for sign up */}
          {mode === 'sign_up' && (
            <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg border border-border/50">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                disabled={loading}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                Eu li e concordo com os{" "}
                <a 
                  href="/termos" 
                  target="_blank" 
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a 
                  href="/privacidade" 
                  target="_blank" 
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de Privacidade
                </a>
                . Entendo que meus dados serão tratados conforme a LGPD.
              </Label>
            </div>
          )}

          {/* Lembrar-me - Only for sign in */}
          {mode === 'sign_in' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label 
                htmlFor="rememberMe" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Lembrar meu email
              </Label>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={loading || (mode === 'sign_up' && !consentAccepted) || (mode === 'forgot_password' && resetCooldown !== null && resetCooldown > 0)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'sign_in' && "Entrar"}
            {mode === 'sign_up' && "Criar conta"}
            {mode === 'forgot_password' && (
              resetCooldown && resetCooldown > 0 
                ? `Aguarde ${Math.ceil(resetCooldown / 60)}min` 
                : "Enviar instruções"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'sign_in' && (
            <>
              <button
                type="button"
                onClick={() => handleModeChange('forgot_password')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Esqueceu sua senha?
              </button>
              <div className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange('sign_up')}
                  className="text-primary hover:underline font-medium"
                >
                  Crie uma
                </button>
              </div>
            </>
          )}

          {mode === 'sign_up' && (
            <div className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => handleModeChange('sign_in')}
                className="text-primary hover:underline font-medium"
              >
                Entre
              </button>
            </div>
          )}

          {mode === 'forgot_password' && (
            <div className="text-sm text-muted-foreground">
              Lembrou a senha?{" "}
              <button
                type="button"
                onClick={() => handleModeChange('sign_in')}
                className="text-primary hover:underline font-medium"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
