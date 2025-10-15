import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ShareEnxoval = () => {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Gerar token único
      const token = crypto.randomUUID();
      
      // Link expira em 7 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // @ts-ignore
      const { error } = await supabase
        .from("shared_enxoval_links")
        .insert({
          user_id: user.id,
          token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);

      toast({
        title: "Link criado!",
        description: "O link expira em 7 dias.",
      });
    } catch (error: any) {
      console.error("Erro ao criar link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o link de compartilhamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const revokeLink = async () => {
    try {
      const token = shareUrl.split("/").pop();
      
      // @ts-ignore
      const { error } = await supabase
        .from("shared_enxoval_links")
        .update({ is_active: false })
        .eq("token", token);

      if (error) throw error;

      setShareUrl("");
      toast({
        title: "Link revogado",
        description: "O link de compartilhamento foi desativado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível revogar o link.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Enxoval</DialogTitle>
          <DialogDescription>
            Crie um link temporário para compartilhar sua lista com familiares e amigos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {!shareUrl ? (
            <Button onClick={generateShareLink} disabled={loading} className="w-full">
              {loading ? "Gerando..." : "Gerar Link de Compartilhamento"}
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Link de Compartilhamento</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Este link expira em 7 dias.
                </p>
              </div>
              
              <Button
                variant="destructive"
                onClick={revokeLink}
                className="w-full gap-2"
              >
                <X className="h-4 w-4" />
                Revogar Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};