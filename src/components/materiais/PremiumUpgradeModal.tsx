import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles, Crown } from "lucide-react";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
  productPrice: number | null;
  paymentUrl: string | null;
  clubPrice: number | null;
  clubPaymentUrl: string | null;
  includedCount: number;
}

export const PremiumUpgradeModal = ({
  open,
  onOpenChange,
  productTitle,
  productPrice,
  paymentUrl,
  clubPrice,
  clubPaymentUrl,
  includedCount,
}: PremiumUpgradeModalProps) => {

  const handleBuySingle = () => {
    if (paymentUrl) window.open(paymentUrl, "_blank");
  };

  const handleSubscribeClub = () => {
    if (clubPaymentUrl) window.open(clubPaymentUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5 text-primary" />
            Desbloquear {productTitle}
          </DialogTitle>
          <DialogDescription>
            Escolha como acessar esta ferramenta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Opção Clube Premium — destacada */}
          {clubPrice && (
            <button
              onClick={handleSubscribeClub}
              className="w-full relative rounded-xl border-2 border-primary bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 active:scale-[0.98]"
            >
              <Badge className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px]">
                <Sparkles className="h-3 w-3 mr-1" />
                MELHOR OPÇÃO
              </Badge>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">Clube Premium</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    R$ {clubPrice.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      Acesso a TODAS as {includedCount} ferramentas
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      Cancele quando quiser
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      Novos materiais incluídos
                    </p>
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Opção avulsa */}
          {productPrice && paymentUrl && (
            <button
              onClick={handleBuySingle}
              className="w-full rounded-xl border border-border p-4 text-left transition-all hover:bg-accent/50 active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">Compra avulsa</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Acesso apenas a esta ferramenta</p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  R$ {productPrice.toFixed(2)}
                </p>
              </div>
            </button>
          )}

          {!paymentUrl && !clubPaymentUrl && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Entre em contato para adquirir este produto.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
