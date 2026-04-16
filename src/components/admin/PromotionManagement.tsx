import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { logAdminAction } from '@/services/monitoringService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  product_id: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  products?: {
    title: string;
  };
}

export function PromotionManagement() {
  const queryClient = useQueryClient();
  const [newPromo, setNewPromo] = useState({
    name: '',
    description: '',
    product_id: '',
    duration_days: 5,
    is_active: true,
  });

  // Buscar produtos disponíveis
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Buscar promoções
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(
          `
          *,
          products:product_id (
            title
          )
        `
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
  });

  // Criar promoção
  const createMutation = useMutation({
    mutationFn: async (promo: typeof newPromo) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promo,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      logAdminAction('create_promotion', { entityType: 'promotions', newValues: { name: newPromo.name } });
      toast('Promoção criada com sucesso!');
      setNewPromo({
        name: '',
        description: '',
        product_id: '',
        duration_days: 5,
        is_active: true,
      });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar promoção', { description: error.message });
    },
  });

  // Deletar promoção
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      toast('Promoção deletada');
      logAdminAction('delete_promotion', { entityType: 'promotions', entityId: id });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });

  // Aplicar promoção para todos os usuários
  const applyMutation = useMutation({
    mutationFn: async (promotionId: string) => {
      const { data, error } = await supabase.functions.invoke('apply-promotion', {
        body: { promotion_id: promotionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, promotionId) => {
      toast('Promoção aplicada!', {
        description: `${data.users_affected} usuários receberam acesso`,
      });
      logAdminAction('apply_promotion', { entityType: 'promotions', entityId: promotionId, newValues: { usersAffected: data.users_affected } });
    },
    onError: (error: any) => {
      toast.error('Erro ao aplicar promoção', { description: error.message });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Criar Nova Promoção
          </CardTitle>
          <CardDescription>
            Configure uma promoção para liberar acesso temporário a todos os usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Promoção</Label>
              <Input
                value={newPromo.name}
                onChange={e => setNewPromo({ ...newPromo, name: e.target.value })}
                placeholder="Ex: Natal 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Produto</Label>
              <Select
                value={newPromo.product_id}
                onValueChange={value => setNewPromo({ ...newPromo, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={newPromo.description}
              onChange={e => setNewPromo({ ...newPromo, description: e.target.value })}
              placeholder="Ex: Presente de Natal para todas as mães!"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Dias de Acesso</Label>
            <Input
              type="number"
              min="1"
              value={newPromo.duration_days}
              onChange={e => setNewPromo({ ...newPromo, duration_days: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={newPromo.is_active}
              onCheckedChange={checked => setNewPromo({ ...newPromo, is_active: checked })}
            />
            <Label>Promoção Ativa</Label>
          </div>

          <Button
            onClick={() => createMutation.mutate(newPromo)}
            disabled={!newPromo.name || !newPromo.product_id || createMutation.isPending}
            className="w-full"
          >
            Criar Promoção
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promoções Criadas</CardTitle>
          <CardDescription>Gerencie e aplique promoções existentes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : promotions?.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma promoção criada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions?.map(promo => (
                <Card key={promo.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{promo.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Produto: {promo.products?.title}
                        </p>
                        {promo.description && (
                          <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Duração: <strong>{promo.duration_days} dias</strong>
                          </span>
                          <span
                            className={promo.is_active ? 'text-green-600' : 'text-muted-foreground'}
                          >
                            Status: <strong>{promo.is_active ? 'Ativa' : 'Inativa'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => applyMutation.mutate(promo.id)}
                          disabled={!promo.is_active || applyMutation.isPending}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Aplicar Agora
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(promo.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
