import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  error?: string;
}

export const PasswordField = ({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  error,
}: PasswordFieldProps) => (
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
        className={cn('pl-10 pr-10', error && 'border-destructive focus-visible:ring-destructive')}
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
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);
