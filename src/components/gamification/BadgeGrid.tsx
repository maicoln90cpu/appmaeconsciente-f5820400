import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGamification, Badge } from "@/hooks/useGamification";
import { 
  Award, 
  Lock, 
  MessageSquare, 
  MessageSquarePlus, 
  Megaphone,
  MessageCircle,
  Heart,
  HeartHandshake,
  Flame,
  Zap,
  Crown,
  Moon,
  Baby,
  Syringe,
  Eye,
  Compass,
  Sparkles,
  Share2,
  Trophy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  MessageSquarePlus,
  Megaphone,
  MessageCircle,
  Heart,
  HeartHandshake,
  Flame,
  Zap,
  Crown,
  Award,
  Moon,
  Baby,
  Syringe,
  Eye,
  Compass,
  Sparkles,
  Trophy,
};

const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
  contributor: { label: 'Contribuidor', icon: MessageSquare },
  mentor: { label: 'Mentor', icon: Heart },
  consistent: { label: 'Consistente', icon: Flame },
  explorer: { label: 'Explorador', icon: Compass },
};

interface BadgeCardProps {
  badge: Badge;
  isUnlocked: boolean;
  unlockedAt?: string;
  onClick: () => void;
}

const BadgeCard = memo(({ badge, isUnlocked, unlockedAt, onClick }: BadgeCardProps) => {
  const Icon = iconMap[badge.icon] || Award;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center p-3 rounded-lg border transition-all
        ${isUnlocked 
          ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:scale-105' 
          : 'bg-muted/30 border-muted hover:bg-muted/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
        }
      `}
    >
      {/* Badge glow effect when unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 rounded-lg bg-primary/10 animate-pulse" style={{ animationDuration: '3s' }} />
      )}
      
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform
        ${isUnlocked 
          ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg' 
          : 'bg-muted text-muted-foreground'
        }
      `}>
        {isUnlocked ? (
          <Icon className="h-6 w-6" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
      </div>
      
      <span className={`text-xs font-medium text-center leading-tight ${!isUnlocked && 'text-muted-foreground'}`}>
        {badge.name}
      </span>
      
      {isUnlocked && (
        <BadgeUI variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
          +{badge.xp_reward} XP
        </BadgeUI>
      )}
    </button>
  );
});

BadgeCard.displayName = 'BadgeCard';

interface BadgeDetailDialogProps {
  badge: Badge | null;
  isUnlocked: boolean;
  unlockedAt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BadgeDetailDialog = memo(({ badge, isUnlocked, unlockedAt, open, onOpenChange }: BadgeDetailDialogProps) => {
  if (!badge) return null;
  
  const Icon = iconMap[badge.icon] || Award;
  
  const shareBadge = () => {
    const message = `🏆 Desbloqueei a conquista "${badge.name}" no Mãe Consciente!\n\n${badge.description}\n\n+${badge.xp_reward} XP 💜`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto
            ${isUnlocked 
              ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl' 
              : 'bg-muted text-muted-foreground'
            }
          `}>
            {isUnlocked ? (
              <Icon className="h-10 w-10" />
            ) : (
              <Lock className="h-8 w-8" />
            )}
          </div>
          
          <DialogTitle className="text-xl">{badge.name}</DialogTitle>
          <DialogDescription className="text-base">{badge.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Categoria</span>
            <span className="font-medium capitalize">
              {categoryLabels[badge.category]?.label || badge.category}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recompensa</span>
            <span className="font-medium text-primary">+{badge.xp_reward} XP</span>
          </div>
          
          {isUnlocked && unlockedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Desbloqueado em</span>
              <span className="font-medium">
                {format(new Date(unlockedAt), "d 'de' MMM, yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
          
          {!isUnlocked && (
            <div className="bg-muted/50 rounded-lg p-3 text-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mx-auto mb-1" />
              Complete o requisito para desbloquear esta conquista
            </div>
          )}
          
          {isUnlocked && (
            <Button onClick={shareBadge} variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar no WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

BadgeDetailDialog.displayName = 'BadgeDetailDialog';

export const BadgeGrid = memo(() => {
  const { allBadges, userBadges, badgesByCategory, isBadgeUnlocked } = useGamification();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setDialogOpen(true);
  };

  const getUnlockedAt = (badgeId: string) => {
    return userBadges.find(ub => ub.badge_id === badgeId)?.unlocked_at;
  };

  const totalBadges = allBadges.length;
  const unlockedCount = userBadges.length;
  const progressPercentage = totalBadges > 0 ? (unlockedCount / totalBadges) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
          <BadgeUI variant="outline">
            {unlockedCount}/{totalBadges}
          </BadgeUI>
        </div>
        
        <div className="space-y-1 pt-2">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercentage)}% completo
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="all" className="text-xs px-2 py-1.5">Todas</TabsTrigger>
            {Object.entries(categoryLabels).map(([key, { label, icon: CatIcon }]) => (
              <TabsTrigger key={key} value={key} className="text-xs px-2 py-1.5">
                <CatIcon className="h-3 w-3 mr-1 hidden sm:inline" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {allBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={isBadgeUnlocked(badge.code)}
                  unlockedAt={getUnlockedAt(badge.id)}
                  onClick={() => handleBadgeClick(badge)}
                />
              ))}
            </div>
          </TabsContent>
          
          {Object.entries(badgesByCategory).map(([category, badges]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {badges.map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isUnlocked={isBadgeUnlocked(badge.code)}
                    unlockedAt={getUnlockedAt(badge.id)}
                    onClick={() => handleBadgeClick(badge)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      
      <BadgeDetailDialog
        badge={selectedBadge}
        isUnlocked={selectedBadge ? isBadgeUnlocked(selectedBadge.code) : false}
        unlockedAt={selectedBadge ? getUnlockedAt(selectedBadge.id) : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
});

BadgeGrid.displayName = 'BadgeGrid';
