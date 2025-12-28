import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useModeration } from "@/hooks/useModeration";
import { Flag, Loader2 } from "lucide-react";

interface ReportPostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportPostDialog = ({ postId, open, onOpenChange }: ReportPostDialogProps) => {
  const { reportPost, isReporting, REPORT_REASONS } = useModeration();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    
    reportPost(
      { postId, reason, description: description || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
          setDescription("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Denunciar Postagem
          </DialogTitle>
          <DialogDescription>
            Nos ajude a manter a comunidade segura. Sua denúncia será analisada pela moderação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Motivo da denúncia</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detalhes (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Forneça mais detalhes sobre o problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || isReporting}
            variant="destructive"
          >
            {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
