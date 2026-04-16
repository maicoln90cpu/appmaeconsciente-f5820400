import { useEffect, useState } from 'react';

import { Trophy, Star, Award, Users, Flame, Compass, Heart, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { Badge } from '@/hooks/useGamification';


const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  users: Users,
  flame: Flame,
  compass: Compass,
  heart: Heart,
  sparkles: Sparkles,
};

interface BadgeUnlockAnimationProps {
  badge: Badge | null;
  onClose: () => void;
}

export const BadgeUnlockAnimation = ({ badge, onClose }: BadgeUnlockAnimationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (badge) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  if (!badge) return null;

  const Icon = iconMap[badge.icon] || Trophy;

  return (
    <Dialog open={!!badge} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md text-center overflow-hidden">
        {/* Confetti animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden motion-reduce:hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute motion-safe:animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                <Sparkles
                  className="h-4 w-4 text-yellow-400"
                  style={{ opacity: 0.5 + Math.random() * 0.5 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Badge icon with pulse animation */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full motion-safe:animate-ping opacity-20" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg motion-safe:animate-pulse">
              <Icon className="h-12 w-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">🎉 Badge Desbloqueado!</h2>
            <h3 className="text-xl font-semibold text-primary">{badge.name}</h3>
            <p className="text-muted-foreground">{badge.description}</p>
            {badge.xp_reward > 0 && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                +{badge.xp_reward} XP
              </p>
            )}
          </div>

          <Button onClick={onClose} className="mt-4">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
