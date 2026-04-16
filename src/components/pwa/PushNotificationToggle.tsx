import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface PushNotificationToggleProps {
  showDescription?: boolean;
  className?: string;
}

export const PushNotificationToggle = ({
  showDescription = true,
  className = '',
}: PushNotificationToggleProps) => {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="p-2 rounded-full bg-muted">
          <BellOff className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <Label className="text-muted-foreground">Push não suportado</Label>
          {showDescription && (
            <p className="text-sm text-muted-foreground">
              Seu navegador não suporta notificações push
            </p>
          )}
        </div>
      </div>
    );
  }

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        toast.success('Notificações push ativadas!');
      } else if (permission === 'denied') {
        toast.error('Permissão negada. Ative nas configurações do navegador.');
      } else {
        toast.error('Erro ao ativar notificações push');
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast.info('Notificações push desativadas');
      }
    }
  };

  // Permission denied state
  if (permission === 'denied') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <BellOff className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <Label>Notificações bloqueadas</Label>
            {showDescription && (
              <p className="text-sm text-muted-foreground">Ative nas configurações do navegador</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('Acesse as configurações do seu navegador para desbloquear')}
        >
          Saiba mais
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isSubscribed ? 'bg-primary/10' : 'bg-muted'}`}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isSubscribed ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <Label>Notificações Push</Label>
          {showDescription && (
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'Você receberá lembretes e alertas'
                : 'Receba lembretes mesmo com o app fechado'}
            </p>
          )}
        </div>
      </div>
      <Switch
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={isLoading}
        aria-label="Ativar notificações push"
      />
    </div>
  );
};
