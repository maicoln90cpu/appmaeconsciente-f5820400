import { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { supabase } from '@/integrations/supabase/client';


const AI_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (rápido/barato)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (melhor qualidade)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (equilíbrio)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (premium)' },
];

const IMAGE_MODELS = [
  { value: 'google/gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image (rápido)' },
  { value: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (qualidade)' },
];

export const BlogSettingsPanel = () => {
  const queryClient = useQueryClient();
  const [newTopic, setNewTopic] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-blog-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_settings')
        .select(
          'id, ai_model, image_model, system_prompt, image_prompt_template, auto_publish, cron_schedule, cron_days, default_author, is_active, topics_pool, categories_list, created_at, updated_at'
        )
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    ai_model: '',
    image_model: '',
    default_author: '',
    system_prompt: '',
    auto_publish: true,
    topics_pool: [] as string[],
    categories_list: [] as string[],
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ai_model: settings.ai_model || '',
        image_model: settings.image_model || '',
        default_author: settings.default_author || '',
        system_prompt: settings.system_prompt || '',
        auto_publish: settings.auto_publish ?? true,
        topics_pool: (settings.topics_pool as string[]) || [],
        categories_list: (settings.categories_list as string[]) || [],
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error('Settings not found');
      const { error } = await supabase
        .from('blog_settings')
        .update({
          ai_model: form.ai_model,
          image_model: form.image_model,
          default_author: form.default_author,
          system_prompt: form.system_prompt,
          auto_publish: form.auto_publish,
          topics_pool: form.topics_pool,
          categories_list: form.categories_list,
        })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-settings'] });
      toast.success('Configurações salvas');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addTopic = () => {
    const topic = newTopic.trim();
    if (!topic || form.topics_pool.includes(topic)) return;
    setForm(prev => ({ ...prev, topics_pool: [...prev.topics_pool, topic] }));
    setNewTopic('');
  };

  const removeTopic = (t: string) => {
    setForm(prev => ({ ...prev, topics_pool: prev.topics_pool.filter(x => x !== t) }));
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="animate-spin h-5 w-5" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* AI Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Configuração de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Modelo de Texto</Label>
              <Select
                value={form.ai_model}
                onValueChange={v => setForm(prev => ({ ...prev, ai_model: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo de Imagem</Label>
              <Select
                value={form.image_model}
                onValueChange={v => setForm(prev => ({ ...prev, image_model: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Autor Padrão</Label>
              <Input
                value={form.default_author}
                onChange={e => setForm(prev => ({ ...prev, default_author: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch
                checked={form.auto_publish}
                onCheckedChange={v => setForm(prev => ({ ...prev, auto_publish: v }))}
              />
              <Label>Publicar automaticamente</Label>
            </div>
          </div>
          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={form.system_prompt}
              onChange={e => setForm(prev => ({ ...prev, system_prompt: e.target.value }))}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topics Pool */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pool de Tópicos ({form.topics_pool.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              placeholder="Novo tópico..."
              onKeyDown={e => e.key === 'Enter' && addTopic()}
            />
            <Button size="sm" onClick={addTopic} disabled={!newTopic.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {form.topics_pool.map(t => (
              <Badge key={t} variant="secondary" className="gap-1 text-xs">
                {t}
                <button onClick={() => removeTopic(t)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};
