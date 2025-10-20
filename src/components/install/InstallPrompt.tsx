import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Handler para Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = localStorage.getItem("install-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000); // Mostrar após 3 segundos
      }
    };

    // iOS não dispara beforeinstallprompt, então mostramos instruções manualmente
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem("install-prompt-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA installed");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("install-prompt-dismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-500">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Instalar App</CardTitle>
                <CardDescription>
                  Acesso rápido na tela inicial
                </CardDescription>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isIOS ? (
            // Instruções para iOS
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Como instalar no iPhone:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li className="flex items-center gap-2">
                  <Share className="h-4 w-4 shrink-0" />
                  Toque no botão <strong>Compartilhar</strong>
                </li>
                <li className="flex items-center gap-2">
                  <PlusSquare className="h-4 w-4 shrink-0" />
                  Selecione <strong>"Adicionar à Tela de Início"</strong>
                </li>
                <li>Toque em <strong>"Adicionar"</strong></li>
              </ol>
            </div>
          ) : (
            // Botão de instalação para Android/Desktop
            <div className="flex gap-2">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Instalar Agora
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Depois
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
