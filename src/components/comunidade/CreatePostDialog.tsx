import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Image, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  onPostCreated: (content: string, imageUrls: string[]) => Promise<void>;
}

export const CreatePostDialog = ({ onPostCreated }: CreatePostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

      await onPostCreated(content, imageUrls);

      // Reset form
      setContent("");
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
        <Button className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg md:h-auto md:w-auto md:rounded-md md:px-6">
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Criar Post</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar novo post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="O que você está pensando?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
          />

          <div className="text-sm text-muted-foreground text-right">
            {content.length}/500
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={images.length >= 4}
            >
              <Image className="mr-2 h-4 w-4" />
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
