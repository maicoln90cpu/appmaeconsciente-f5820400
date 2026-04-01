import type { AuthMode } from "@/hooks/useAuthForm";

interface AuthFooterProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export const AuthFooter = ({ mode, onModeChange }: AuthFooterProps) => (
  <div className="mt-6 text-center space-y-2">
    {mode === "sign_in" && (
      <>
        <button
          type="button"
          onClick={() => onModeChange("forgot_password")}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Esqueceu sua senha?
        </button>
        <div className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <button
            type="button"
            onClick={() => onModeChange("sign_up")}
            className="text-primary hover:underline font-medium"
          >
            Crie uma
          </button>
        </div>
      </>
    )}

    {mode === "sign_up" && (
      <div className="text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <button
          type="button"
          onClick={() => onModeChange("sign_in")}
          className="text-primary hover:underline font-medium"
        >
          Entre
        </button>
      </div>
    )}

    {mode === "forgot_password" && (
      <div className="text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <button
          type="button"
          onClick={() => onModeChange("sign_in")}
          className="text-primary hover:underline font-medium"
        >
          Voltar ao login
        </button>
      </div>
    )}
  </div>
);
