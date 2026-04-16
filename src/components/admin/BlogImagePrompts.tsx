import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, RefreshCw } from 'lucide-react';

interface ImagePrompt {
  id: string;
  name: string;
  prompt_template: string;
  style_description: string | null;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
}

export const BlogImagePrompts = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ImagePrompt | null>(null);
  const [name, setName] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [styleDesc, setStyleDesc] = useState('');

  const { data: prompts, isLoading } = useQuery({
    queryKey: ['admin-blog-image-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_image_prompts')
        .select(
          'id, name, prompt_template, style_description, is_active, usage_count, last_used_at, created_at, updated_at'
        )
        .order('created_at');
      if (error) throw error;
      return data as ImagePrompt[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from('blog_image_prompts')
          .update({
            name,
            prompt_template: promptTemplate,
            style_description: styleDesc,
          })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('blog_image_prompts').insert({
          name,
          prompt_template: promptTemplate,
          style_description: styleDesc,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-image-prompts'] });
      closeDialog();
      toast.success(editing ? 'Prompt atualizado' : 'Prompt criado');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('blog_image_prompts')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blog-image-prompts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_image_prompts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-image-prompts'] });
      toast.success('Prompt excluído');
    },
  });

  const openEdit = (p: ImagePrompt) => {
    setEditing(p);
    setName(p.name);
    setPromptTemplate(p.prompt_template);
    setStyleDesc(p.style_description || '');
    setShowCreate(true);
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPromptTemplate('{{topic}} — ');
    setStyleDesc('');
    setShowCreate(true);
  };

  const closeDialog = () => {
    setShowCreate(false);
    setEditing(null);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="animate-spin h-5 w-5" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Estilos de Imagem ({prompts?.length || 0})</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Novo Estilo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(prompts || []).map(p => (
          <Card key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">{p.name}</CardTitle>
                </div>
                <Switch
                  checked={p.is_active}
                  onCheckedChange={v => toggleMutation.mutate({ id: p.id, active: v })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{p.prompt_template}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {p.usage_count}x usado
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => {
                      if (confirm('Excluir?')) deleteMutation.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={o => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Novo'} Estilo de Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Aquarela Pastel"
              />
            </div>
            <div>
              <Label>Descrição do estilo</Label>
              <Input
                value={styleDesc}
                onChange={e => setStyleDesc(e.target.value)}
                placeholder="Breve descrição"
              />
            </div>
            <div>
              <Label>Prompt Template</Label>
              <Textarea
                value={promptTemplate}
                onChange={e => setPromptTemplate(e.target.value)}
                rows={4}
                className="font-mono text-xs"
                placeholder="Use {{topic}} para o tópico"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{{topic}}'} onde o tópico será inserido
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || !promptTemplate.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
