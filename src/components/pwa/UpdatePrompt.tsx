import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const UpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  useEffect(() => {
    // Check for SW updates
    const checkForUpdates = async () => {
      if (!('serviceWorker' in navigator)) return;

      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);
          
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowPrompt(true);
                }
              });
            }
          });

          // Check for waiting SW
          if (reg.waiting) {
            setShowPrompt(true);
          }
        }
      } catch (error) {
        console.error('Error checking for SW updates:', error);
      }
    };

    checkForUpdates();

    // Periodic check for updates
    const interval = setInterval(() => {
      if (registration) {
        registration.update();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [registration]);

  const handleUpdate = async () => {
    if (registration?.waiting) {
      // Tell the waiting SW to take control
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page when new SW takes control
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom duration-300">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Atualização disponível</p>
                <p className="text-xs text-muted-foreground">
                  Nova versão pronta para uso
                </p>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="shrink-0 h-6 w-6"
              onClick={handleDismiss}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleUpdate}
            >
              Atualizar agora
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleDismiss}
            >
              Depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
