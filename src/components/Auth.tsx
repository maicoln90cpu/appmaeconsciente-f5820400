import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Baby, Eye, EyeOff, Loader2 } from "lucide-react";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

export const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

        if (error) {
          throw error;
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
        });

        if (error) throw error;

        // Registrar consentimento após criar conta
        if (data.user) {
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
        setMode('sign_in');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Baby className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Controle de Enxoval</CardTitle>
            <CardDescription className="mt-1">
              {mode === 'sign_in' && "Faça login para gerenciar seu enxoval"}
              {mode === 'sign_up' && "Crie sua conta para começar"}
              {mode === 'forgot_password' && "Recupere sua senha"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {mode === 'sign_up' && (
            <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                Eu li e concordo com os{" "}
                <a 
                  href="/termos" 
                  target="_blank" 
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Termos de Uso
                </a>{" "}
                e a{" "}
                <a 
                  href="/privacidade" 
                  target="_blank" 
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Política de Privacidade
                </a>
                . Entendo que meus dados serão tratados conforme a LGPD.
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'sign_in' && "Entrar"}
            {mode === 'sign_up' && "Criar conta"}
            {mode === 'forgot_password' && "Enviar instruções"}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {mode === 'sign_in' && (
            <>
              <button
                type="button"
                onClick={() => setMode('forgot_password')}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu sua senha?
              </button>
              <div className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setMode('sign_up')}
                  className="text-primary hover:underline"
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
                onClick={() => setMode('sign_in')}
                className="text-primary hover:underline"
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
                onClick={() => setMode('sign_in')}
                className="text-primary hover:underline"
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
