import { useState } from 'react';

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

import type { BabyVaccinationProfile } from '@/types/vaccination';

interface CadastroBebeProps {
  profile?: BabyVaccinationProfile | null;
  onSave: (profile: Partial<BabyVaccinationProfile>) => Promise<any>;
}

export const CadastroBebe = ({ profile, onSave }: CadastroBebeProps) => {
  const [formData, setFormData] = useState({
    baby_name: profile?.baby_name || '',
    nickname: profile?.nickname || '',
    birth_date: profile?.birth_date || '',
    birth_type: profile?.birth_type || '',
    birth_city: profile?.birth_city || '',
    calendar_type: profile?.calendar_type || 'brasil',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(profile ? { ...formData, id: profile.id } : formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>👶 Cadastro do Bebê</CardTitle>
        <CardDescription>
          Preencha os dados do bebê para começar a acompanhar a vacinação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baby_name">Nome completo *</Label>
              <Input
                id="baby_name"
                value={formData.baby_name}
                onChange={e => setFormData({ ...formData, baby_name: e.target.value })}
                placeholder="Ex: Maria Silva Santos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Ex: Mari"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento *</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_type">Tipo de parto</Label>
              <Select
                value={formData.birth_type}
                onValueChange={value => setFormData({ ...formData, birth_type: value })}
              >
                <SelectTrigger id="birth_type">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="cesariana">Cesárea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_city">Cidade de nascimento</Label>
              <Input
                id="birth_city"
                value={formData.birth_city}
                onChange={e => setFormData({ ...formData, birth_city: e.target.value })}
                placeholder="Ex: São Paulo - SP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar_type">Calendário de vacinação *</Label>
              <Select
                value={formData.calendar_type}
                onValueChange={(value: 'brasil' | 'particular') =>
                  setFormData({ ...formData, calendar_type: value })
                }
              >
                <SelectTrigger id="calendar_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brasil">Padrão Brasil (Ministério da Saúde)</SelectItem>
                  <SelectItem value="particular">
                    Calendário Particular (Clínicas Privadas)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {profile ? 'Atualizar Dados' : 'Cadastrar Bebê'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
