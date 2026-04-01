import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby } from "lucide-react";
import type { AuthMode } from "@/hooks/useAuthForm";

interface AuthHeaderProps {
  mode: AuthMode;
}

export const AuthHeader = ({ mode }: AuthHeaderProps) => (
  <CardHeader className="space-y-4">
    <div className="flex items-center gap-3 justify-center">
      <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
        <Baby className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <CardTitle className="text-2xl">Maternidade Consciente</CardTitle>
        <CardDescription className="mt-1">
          {mode === "sign_in" && "Faça login para continuar"}
          {mode === "sign_up" && "Crie sua conta para começar"}
          {mode === "forgot_password" && "Recupere sua senha"}
        </CardDescription>
      </div>
    </div>
  </CardHeader>
);
