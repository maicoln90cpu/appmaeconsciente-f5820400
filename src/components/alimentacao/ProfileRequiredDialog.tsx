import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useProfile } from '@/hooks/useProfile';


interface ProfileRequiredDialogProps {
  open: boolean;
  onComplete: () => void;
}

export function ProfileRequiredDialog({ open, onComplete }: ProfileRequiredDialogProps) {
  const { updateProfile } = useProfile();
  const [formData, setFormData] = useState({
    peso_atual: '',
    altura_cm: '',
    sexo: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.peso_atual || !formData.altura_cm || !formData.sexo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      peso_atual: parseFloat(formData.peso_atual),
      altura_cm: parseInt(formData.altura_cm),
      sexo: formData.sexo as 'masculino' | 'feminino' | 'outro',
    });

    if (error) {
      toast.error('Erro ao atualizar perfil');
    } else {
      toast.success('Perfil atualizado!');
      onComplete();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete seu Perfil</DialogTitle>
          <DialogDescription>
            Para gerar planos personalizados, precisamos de algumas informações importantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo *</Label>
            <select
              id="sexo"
              value={formData.sexo}
              onChange={e => setFormData({ ...formData, sexo: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Selecione...</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="peso">Peso Atual (kg) *</Label>
            <Input
              id="peso"
              type="number"
              step="0.1"
              value={formData.peso_atual}
              onChange={e => setFormData({ ...formData, peso_atual: e.target.value })}
              placeholder="Ex: 65.5"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altura">Altura (cm) *</Label>
            <Input
              id="altura"
              type="number"
              value={formData.altura_cm}
              onChange={e => setFormData({ ...formData, altura_cm: e.target.value })}
              placeholder="Ex: 165"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
