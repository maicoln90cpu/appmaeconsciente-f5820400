import { Plus, Image as ImageIcon, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DraftIndicator } from '@/components/ui/draft-indicator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useCreatePost, CATEGORIES } from '@/hooks/useCreatePost';

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
  const {
    open,
    setOpen,
    content,
    setContent,
    displayName,
    setDisplayName,
    categoria,
    setCategoria,
    previews,
    uploading,
    isAdmin,
    images,
    addImages,
    removeImage,
    handleSubmit,
    handleLoadDraft,
    autoSave,
  } = useCreatePost({ onPostCreated });

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle>Criar Novo Post</DialogTitle>
              <DialogDescription>Compartilhe sua história com a comunidade</DialogDescription>
            </div>
            <DraftIndicator
              isSaving={autoSave.isSaving}
              hasSavedRecently={autoSave.hasSavedRecently}
              lastSavedAt={autoSave.lastSavedAt}
              availableDrafts={autoSave.availableDrafts}
              onLoadDraft={handleLoadDraft}
              onDeleteDraft={autoSave.deleteDraftById}
              onDeleteCurrentDraft={autoSave.deleteDraft}
            />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="O que você quer compartilhar?"
              value={content}
              onChange={e => setContent(e.target.value)}
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
                {CATEGORIES.map(cat => (
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
                onChange={e => setDisplayName(e.target.value)}
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
              onClick={() => document.getElementById('image-upload')?.click()}
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
              onChange={e => addImages(Array.from(e.target.files || []))}
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
              'Publicar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
