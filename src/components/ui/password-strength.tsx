import * as React from 'react';
import { cn } from '@/lib/utils';
import { calculatePasswordStrength } from '@/lib/validators/auth';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className }) => {
  const { score, label, color } = calculatePasswordStrength(password);

  if (!password) return null;

  const requirements = [
    { met: password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(password), text: 'Letra maiúscula' },
    { met: /[0-9]/.test(password), text: 'Número' },
    { met: /[^A-Za-z0-9]/.test(password), text: 'Caractere especial' },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', color)}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span
          className={cn(
            'text-xs font-medium capitalize',
            score <= 2 && 'text-destructive',
            score === 3 && 'text-yellow-600',
            score >= 4 && 'text-green-600'
          )}
        >
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              req.met ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {req.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export { PasswordStrength };
