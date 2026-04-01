import { Trophy, Star, TrendingUp, Heart, Award, Sparkles, Moon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState } from "react";

export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: 'trophy' | 'star' | 'trending-up' | 'heart' | 'award' | 'sparkles' | 'moon';
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  'trending-up': TrendingUp,
  heart: Heart,
  award: Award,
  sparkles: Sparkles,
  moon: Moon,
};

export const AchievementBadge = ({ achievement }: AchievementBadgeProps) => {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[achievement.icon];

  const shareAchievement = () => {
    const message = `🏆 Conquistei: ${achievement.name}!\n${achievement.description}\n\nEstou usando o app Mãe Consciente para organizar minha maternidade! 💜`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all hover:scale-105 ${
          achievement.unlocked 
            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-300' 
            : 'opacity-50 grayscale'
        }`}
        onClick={() => achievement.unlocked && setOpen(true)}
      >
        <CardContent className="p-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            achievement.unlocked 
              ? 'bg-yellow-500 text-white' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-sm mb-1">{achievement.name}</h3>
          {achievement.unlocked ? (
            <Badge className="bg-green-500 text-xs">Desbloqueada</Badge>
          ) : achievement.progress !== undefined && achievement.total !== undefined ? (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2 mb-1">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {achievement.progress} / {achievement.total}
              </p>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs mt-1">Bloqueada</Badge>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
              <Icon className="h-10 w-10" />
            </div>
            <DialogTitle className="text-center text-2xl">
              {achievement.name}
            </DialogTitle>
            <DialogDescription className="text-center">
              {achievement.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={shareAchievement} className="flex-1">
              Compartilhar no WhatsApp
            </Button>
            <Button onClick={() => setOpen(false)} variant="outline" className="flex-1">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
