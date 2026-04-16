import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { User, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormErrors } from '@/hooks/useAuthForm';

interface SignUpFieldsProps {
  fullName: string;
  setFullName: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  consentAccepted: boolean;
  setConsentAccepted: (v: boolean) => void;
  loading: boolean;
  errors: FormErrors;
  passwordsMatch: boolean;
  passwordsDontMatch: boolean;
}

export const SignUpFields = ({
  fullName,
  setFullName,
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
  consentAccepted,
  setConsentAccepted,
  loading,
  errors,
  passwordsMatch,
  passwordsDontMatch,
}: SignUpFieldsProps) => (
  <>
    {/* Full Name */}
    <div className="space-y-2">
      <Label htmlFor="fullName">Nome completo</Label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="fullName"
          type="text"
          placeholder="Maria Silva"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          disabled={loading}
          className={cn(
            'pl-10',
            errors.fullName && 'border-destructive focus-visible:ring-destructive'
          )}
        />
      </div>
      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
    </div>

    {/* WhatsApp */}
    <div className="space-y-2">
      <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
      <PhoneInput
        id="whatsapp"
        value={whatsapp}
        onChange={setWhatsapp}
        disabled={loading}
        error={errors.whatsapp}
      />
      {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
    </div>

    {/* Password */}
    <div className="space-y-2">
      <Label htmlFor="password">Senha</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
          className={cn(
            'pl-10 pr-10',
            errors.password && 'border-destructive focus-visible:ring-destructive'
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
      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      {password && <PasswordStrength password={password} />}
    </div>

    {/* Confirm Password */}
    <div className="space-y-2">
      <Label htmlFor="confirmPassword">Confirmar senha</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
          className={cn(
            'pl-10 pr-10',
            (errors.confirmPassword || passwordsDontMatch) &&
              'border-destructive focus-visible:ring-destructive',
            passwordsMatch && 'border-green-500 focus-visible:ring-green-500'
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
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            passwordsMatch ? 'text-green-600' : 'text-destructive'
          )}
        >
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

    {/* LGPD Consent */}
    <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg border border-border/50">
      <Checkbox
        id="consent"
        checked={consentAccepted}
        onCheckedChange={checked => setConsentAccepted(checked as boolean)}
        disabled={loading}
        className="mt-0.5"
      />
      <Label
        htmlFor="consent"
        className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
      >
        Eu li e concordo com os{' '}
        <a
          href="/termos"
          target="_blank"
          className="text-primary hover:underline font-medium"
          onClick={e => e.stopPropagation()}
        >
          Termos de Uso
        </a>{' '}
        e a{' '}
        <a
          href="/privacidade"
          target="_blank"
          className="text-primary hover:underline font-medium"
          onClick={e => e.stopPropagation()}
        >
          Política de Privacidade
        </a>
        . Entendo que meus dados serão tratados conforme a LGPD.
      </Label>
    </div>
  </>
);
