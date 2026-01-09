import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Image, Loader2, Plus } from "lucide-react";
import { useUltrasounds, UltrasoundInput } from "@/hooks/useUltrasounds";
import { toast } from "sonner";

interface UltrasoundUploaderProps {
  onSuccess?: () => void;
}

const ULTRASOUND_TYPES = [
  { value: "routine", label: "Rotina" },
  { value: "morphological", label: "Morfológico" },
  { value: "transvaginal", label: "Transvaginal" },
  { value: "3d_4d", label: "3D/4D" },
  { value: "doppler", label: "Doppler" },
  { value: "other", label: "Outro" },
];

export const UltrasoundUploader = ({ onSuccess }: UltrasoundUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    gestational_week: 12,
    ultrasound_date: new Date().toISOString().split('T')[0],
    ultrasound_type: "routine",
    notes: "",
    baby_weight_grams: undefined as number | undefined,
    baby_length_cm: undefined as number | undefined,
  });

  const { uploadImage, addUltrasound, isAdding } = useUltrasounds();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    try {
      setIsUploading(true);

      // Upload image first
      const imageUrl = await uploadImage(selectedFile);

      // Then save the record
      const input: UltrasoundInput = {
        image_url: imageUrl,
        gestational_week: formData.gestational_week,
        ultrasound_date: formData.ultrasound_date,
        ultrasound_type: formData.ultrasound_type,
        notes: formData.notes || undefined,
        baby_weight_grams: formData.baby_weight_grams,
        baby_length_cm: formData.baby_length_cm,
      };

      addUltrasound(input);
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setFormData({
        gestational_week: 12,
        ultrasound_date: new Date().toISOString().split('T')[0],
        ultrasound_type: "routine",
        notes: "",
        baby_weight_grams: undefined,
        baby_length_cm: undefined,
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error uploading ultrasound:", error);
      toast.error("Erro ao fazer upload do ultrassom");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Ultrassom
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Novo Ultrassom
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagem do Ultrassom *</Label>
            <div 
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-colors hover:border-primary/50
                ${previewUrl ? 'border-primary' : 'border-muted'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-48 mx-auto rounded-md object-contain"
                  />
                  <p className="text-sm text-muted-foreground">
                    Clique para trocar a imagem
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique ou arraste uma imagem aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Date and Week */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data do Ultrassom *</Label>
              <Input
                id="date"
                type="date"
                value={formData.ultrasound_date}
                onChange={(e) => setFormData(prev => ({ ...prev, ultrasound_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="week">Semana Gestacional *</Label>
              <Input
                id="week"
                type="number"
                min={4}
                max={42}
                value={formData.gestational_week}
                onChange={(e) => setFormData(prev => ({ ...prev, gestational_week: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo de Ultrassom</Label>
            <Select 
              value={formData.ultrasound_type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, ultrasound_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ULTRASOUND_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Baby Measurements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso do Bebê (g)</Label>
              <Input
                id="weight"
                type="number"
                min={0}
                placeholder="Ex: 350"
                value={formData.baby_weight_grams || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  baby_weight_grams: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Comprimento (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                min={0}
                placeholder="Ex: 25.5"
                value={formData.baby_length_cm || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  baby_length_cm: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Anotações</Label>
            <Textarea
              id="notes"
              placeholder="Observações do médico, sentimentos, etc."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || isAdding || !selectedFile}
          >
            {(isUploading || isAdding) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Salvar Ultrassom
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
