import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAutoSave } from '@/hooks/useAutoSave';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const postSchema = z.object({
  content: z.string().max(5000, 'O post deve ter no máximo 5000 caracteres'),
  displayName: z.string().max(100, 'O nome deve ter no máximo 100 caracteres').optional(),
});

const DANGEROUS_PATTERNS = [/<script/i, /javascript:/i, /on\w+\s*=/i, /data:text\/html/i];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type PostFormData = {
  content: string;
  displayName: string;
  categoria: string;
};

export const CATEGORIES = [
  { value: 'dicas', label: '💡 Dicas' },
  { value: 'desabafo', label: '💭 Desabafo' },
  { value: 'venda', label: '🛍️ Venda' },
  { value: 'duvida', label: '❓ Dúvida' },
  { value: 'conquista', label: '🎉 Conquista' },
];

interface UseCreatePostOptions {
  onPostCreated: (
    content: string,
    imageUrls: string[],
    displayName?: string | null,
    categoria?: string,
    tags?: string[]
  ) => Promise<void>;
}

export function useCreatePost({ onPostCreated }: UseCreatePostOptions) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [categoria, setCategoria] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useUserRole();

  const autoSave = useAutoSave<PostFormData>({
    type: 'community-post',
    enabled: open,
    debounceMs: 2000,
    minDataCheck: data => !!(data.content && (data.content as string).length > 10),
    onDraftLoaded: data => {
      const { __userId, __savedAt, ...cleanData } = data as PostFormData & {
        __userId?: string;
        __savedAt?: number;
      };
      if (cleanData.content) setContent(cleanData.content);
      if (cleanData.displayName) setDisplayName(cleanData.displayName);
      if (cleanData.categoria) setCategoria(cleanData.categoria);
    },
  });

  useEffect(() => {
    if (open && content.length > 10) {
      autoSave.triggerAutoSave({ content, displayName, categoria });
    }
  }, [content, displayName, categoria, open, autoSave.triggerAutoSave]);

  const handleLoadDraft = useCallback(
    async (id: string) => {
      await autoSave.loadDraftById(id);
      toast('Rascunho carregado', { description: 'O conteúdo do rascunho foi restaurado.' });
    },
    [autoSave.loadDraftById, toast]
  );

  const validateImages = useCallback(
    (files: File[]): boolean => {
      if (files.length + images.length > 4) {
        toast.error('Limite de imagens', { description: 'Máximo 4 imagens por post.' });
        return false;
      }
      for (const file of files) {
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error('Arquivo muito grande', { description: `${file.name} excede 5MB.` });
          return false;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error('Formato inválido', { description: `${file.name} não é JPG, PNG ou WebP.` });
          return false;
        }
      }
      return true;
    },
    [images.length, toast]
  );

  const addImages = useCallback(
    (files: File[]) => {
      if (!validateImages(files)) return;
      setImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setPreviews(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    },
    [validateImages]
  );

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setContent('');
    setDisplayName('');
    setCategoria('');
    setImages([]);
    setPreviews([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Post vazio', { description: 'Adicione texto ou imagens.' });
      return;
    }

    try {
      postSchema.parse({ content, displayName: isAdmin ? displayName : undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Erro de validação', { description: error.errors[0].message });
        return;
      }
    }

    if (DANGEROUS_PATTERNS.some(p => p.test(content))) {
      toast.error('Conteúdo bloqueado', {
        description: 'O post contém código potencialmente perigoso.',
      });
      return;
    }

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const imageUrls: string[] = [];
      for (const image of images) {
        const fileName = `${user.id}/${Date.now()}_${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
        imageUrls.push(data.publicUrl);
      }

      await onPostCreated(
        content,
        imageUrls,
        isAdmin && displayName ? displayName : null,
        categoria || undefined,
        undefined
      );
      await autoSave.deleteDraft();
      resetForm();
      setOpen(false);
    } catch (error) {
      logger.error('Error creating post', error, { context: 'useCreatePost' });
      toast.error('Erro ao criar post', { description: 'Tente novamente mais tarde.' });
    } finally {
      setUploading(false);
    }
  }, [
    content,
    images,
    displayName,
    categoria,
    isAdmin,
    onPostCreated,
    autoSave.deleteDraft,
    resetForm,
    toast,
  ]);

  return {
    open,
    setOpen,
    content,
    setContent,
    displayName,
    setDisplayName,
    categoria,
    setCategoria,
    images,
    previews,
    uploading,
    isAdmin,
    addImages,
    removeImage,
    handleSubmit,
    handleLoadDraft,
    autoSave,
  };
}
