import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby } from "lucide-react";

export const Auth = () => {
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
                Faça login para gerenciar seu enxoval
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary))",
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email",
                  password_label: "Senha",
                  button_label: "Entrar",
                  loading_button_label: "Entrando...",
                  social_provider_text: "Entrar com {{provider}}",
                  link_text: "Já tem uma conta? Entre",
                },
                sign_up: {
                  email_label: "Email",
                  password_label: "Senha",
                  button_label: "Criar conta",
                  loading_button_label: "Criando conta...",
                  social_provider_text: "Criar conta com {{provider}}",
                  link_text: "Não tem uma conta? Crie uma",
                },
                forgotten_password: {
                  email_label: "Email",
                  button_label: "Enviar instruções",
                  link_text: "Esqueceu sua senha?",
                },
              },
            }}
            providers={[]}
          />
        </CardContent>
      </Card>
  );
};
