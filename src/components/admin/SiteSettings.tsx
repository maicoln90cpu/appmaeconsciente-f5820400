import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Loader2 } from "lucide-react";

export const SiteSettings = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useSiteSettings();
  const [gtmId, setGtmId] = useState("");

  useEffect(() => {
    if (settings?.gtm_id) {
      setGtmId(settings.gtm_id);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(gtmId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
        <CardDescription>
          Configure integrações e códigos de rastreamento para todo o site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
            <Input
              id="gtm-id"
              placeholder="GTM-XXXXXXX"
              value={gtmId}
              onChange={(e) => setGtmId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              O código GTM será aplicado em todas as páginas do site, incluindo páginas públicas e privadas.
            </p>
          </div>
          
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
