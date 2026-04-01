import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { EmailField } from "@/components/auth/EmailField";
import { PasswordField } from "@/components/auth/PasswordField";
import { SignUpFields } from "@/components/auth/SignUpFields";

export const Auth = () => {
  const {
    mode,
    fullName, setFullName,
    email, setEmail,
    whatsapp, setWhatsapp,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    loading,
    consentAccepted, setConsentAccepted,
    rememberMe, setRememberMe,
    errors,
    resetCooldown,
    passwordsMatch,
    passwordsDontMatch,
    handleSubmit,
    handleModeChange,
  } = useAuthForm();

  return (
    <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-xl border-border/50">
      <AuthHeader mode={mode} />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "sign_up" && (
            <SignUpFields
              fullName={fullName} setFullName={setFullName}
              whatsapp={whatsapp} setWhatsapp={setWhatsapp}
              password={password} setPassword={setPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
              consentAccepted={consentAccepted} setConsentAccepted={setConsentAccepted}
              loading={loading} errors={errors}
              passwordsMatch={passwordsMatch} passwordsDontMatch={passwordsDontMatch}
            />
          )}

          {/* Email — always visible */}
          {mode !== "sign_up" && (
            <EmailField email={email} setEmail={setEmail} loading={loading} error={errors.email} />
          )}
          {mode === "sign_up" && (
            <EmailField email={email} setEmail={setEmail} loading={loading} error={errors.email} />
          )}

          {/* Password — sign_in only (sign_up has its own inside SignUpFields) */}
          {mode === "sign_in" && (
            <PasswordField
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              loading={loading} error={errors.password}
            />
          )}

          {/* Remember me */}
          {mode === "sign_in" && (
            <div className="flex items-center space-x-2">
              <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} disabled={loading} />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">Lembrar meu email</Label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={loading || (mode === "sign_up" && !consentAccepted) || (mode === "forgot_password" && resetCooldown !== null && resetCooldown > 0)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "sign_in" && "Entrar"}
            {mode === "sign_up" && "Criar conta"}
            {mode === "forgot_password" && (
              resetCooldown && resetCooldown > 0
                ? `Aguarde ${Math.ceil(resetCooldown / 60)}min`
                : "Enviar instruções"
            )}
          </Button>
        </form>

        <AuthFooter mode={mode} onModeChange={handleModeChange} />
      </CardContent>
    </Card>
  );
};
