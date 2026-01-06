import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useUserRole } from "@/hooks/useUserRole";
import { z } from "zod";

const postSchema = z.object({
  content: z.string()
    .max(5000, "O post deve ter no máximo 5000 caracteres"),
  displayName: z.string()
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .optional(),
});

const CATEGORIES = [
  { value: "dicas", label: "💡 Dicas" },
  { value: "desabafo", label: "💭 Desabafo" },
  { value: "venda", label: "🛍️ Venda" },
  { value: "duvida", label: "❓ Dúvida" },
  { value: "conquista", label: "🎉 Conquista" },
];

interface CreatePostDialogProps {
  onPostCreated: (
    content: string,
    imageUrls: string[],
    displayName?: string | null,
    categoria?: string,
    tags?: string[]
  ) => Promise<void>;
}

export const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [categoria, setCategoria] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      toast({
        title: "Limite de imagens",
        description: "Você pode adicionar no máximo 4 imagens por post.",
        variant: "destructive",
      });
      return;
    }

    // Validação de tamanho e tipo
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 5MB.`,
          variant: "destructive",
        });
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: `${file.name} não é um formato válido. Use JPG, PNG ou WebP.`,
          variant: "destructive",
        });
        return;
      }
    }

    setImages((prev) => [...prev, ...files]);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Post vazio",
        description: "Adicione texto ou imagens ao seu post.",
        variant: "destructive",
      });
      return;
    }

    // Validação com Zod
    try {
      postSchema.parse({
        content,
        displayName: isAdmin ? displayName : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Validação anti-XSS
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /data:text\/html/i];
    if (dangerousPatterns.some(pattern => pattern.test(content))) {
      toast({
        title: "Conteúdo bloqueado",
        description: "O post contém código potencialmente perigoso.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload images
      const imageUrls: string[] = [];
      for (const image of images) {
        const fileName = `${user.id}/${Date.now()}_${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("post-images")
          .getPublicUrl(fileName);

        imageUrls.push(data.publicUrl);
      }

      await onPostCreated(
        content,
        imageUrls,
        isAdmin && displayName ? displayName : null,
        categoria || undefined,
        undefined
      );

      // Reset form
      setContent("");
      setDisplayName("");
      setCategoria("");
      setImages([]);
      setPreviews([]);
      setOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Erro ao criar post",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-6 rounded-full shadow-lg h-14 w-14 md:h-auto md:w-auto md:rounded-md md:px-6 z-50"
        >
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Criar Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Post</DialogTitle>
          <DialogDescription>
            Compartilhe sua história com a comunidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="O que você quer compartilhar?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição (opcional)</Label>
              <Input
                id="displayName"
                placeholder="Ex: Dra. Maria Silva"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    aria-label="Remover imagem"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={images.length >= 4}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Adicionar Imagens ({images.length}/4)
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading || (!content.trim() && images.length === 0)}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
