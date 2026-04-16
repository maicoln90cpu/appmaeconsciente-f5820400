import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Droplets, AlertCircle, CheckCircle2, Snowflake, Refrigerator } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BreastMilkStorage } from '@/types/babyFeeding';

interface GestaoOrdenhaProps {
  storage: BreastMilkStorage[];
  onAddStorage: (
    item: Omit<
      BreastMilkStorage,
      'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_used' | 'used_at'
    >
  ) => Promise<unknown>;
  onMarkAsUsed: (id: string) => Promise<void>;
}

export const GestaoOrdenha = ({ storage, onAddStorage, onMarkAsUsed }: GestaoOrdenhaProps) => {
  const [formData, setFormData] = useState({
    volume_ml: '',
    pump_method: 'electric' as const,
    storage_location: 'fridge' as const,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const pumpedAt = new Date();
      const expiresAt = new Date();

      // Calcular validade baseado na localização
      if (formData.storage_location === 'fridge') {
        expiresAt.setDate(expiresAt.getDate() + 4); // 4 dias na geladeira
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 meses no freezer
      }

      await onAddStorage({
        pumped_at: pumpedAt.toISOString(),
        volume_ml: parseInt(formData.volume_ml),
        pump_method: formData.pump_method,
        storage_location: formData.storage_location,
        expires_at: expiresAt.toISOString(),
        notes: formData.notes || undefined,
      });

      setFormData({
        volume_ml: '',
        pump_method: 'electric',
        storage_location: 'fridge',
        notes: '',
      });
    } finally {
      setSaving(false);
    }
  };

  const getExpirationAlert = (expiresAt: string) => {
    const daysUntilExpiration = differenceInDays(new Date(expiresAt), new Date());

    if (daysUntilExpiration < 0) {
      return { type: 'error', message: 'Vencido', icon: AlertCircle };
    } else if (daysUntilExpiration <= 2) {
      return {
        type: 'warning',
        message: `Vence em ${daysUntilExpiration} dia(s)`,
        icon: AlertCircle,
      };
    } else {
      return {
        type: 'success',
        message: `Vence em ${daysUntilExpiration} dia(s)`,
        icon: CheckCircle2,
      };
    }
  };

  const totalVolume = storage.reduce((sum, item) => sum + item.volume_ml, 0);
  const fridgeVolume = storage
    .filter(item => item.storage_location === 'fridge')
    .reduce((sum, item) => sum + item.volume_ml, 0);
  const freezerVolume = storage
    .filter(item => item.storage_location === 'freezer')
    .reduce((sum, item) => sum + item.volume_ml, 0);
  const expiringCount = storage.filter(
    item => differenceInDays(new Date(item.expires_at), new Date()) <= 2
  ).length;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Droplets className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Estoque</p>
              <p className="text-2xl font-bold">{totalVolume} ml</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Refrigerator className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Geladeira</p>
              <p className="text-2xl font-bold">{fridgeVolume} ml</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Snowflake className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="text-sm text-muted-foreground">Freezer</p>
              <p className="text-2xl font-bold">{freezerVolume} ml</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Vencendo Logo</p>
              <p className="text-2xl font-bold">{expiringCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas */}
      {expiringCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem {expiringCount} item(ns) vencendo nos próximos 2 dias!
          </AlertDescription>
        </Alert>
      )}

      {/* Formulário de Nova Ordenha */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Registrar Nova Ordenha
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (ml)</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume_ml}
                onChange={e => setFormData({ ...formData, volume_ml: e.target.value })}
                placeholder="Ex: 120"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <Select
                value={formData.pump_method}
                onValueChange={(value: any) => setFormData({ ...formData, pump_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="electric">Elétrica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local de Armazenamento</Label>
            <Select
              value={formData.storage_location}
              onValueChange={(value: any) => setFormData({ ...formData, storage_location: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fridge">Geladeira (válido por 4 dias)</SelectItem>
                <SelectItem value="freezer">Freezer (válido por 3 meses)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Manhã, após mamada..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar Ordenha'}
          </Button>
        </form>
      </Card>

      {/* Tabela de Estoque */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storage.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum leite armazenado
                </TableCell>
              </TableRow>
            ) : (
              storage.map(item => {
                const alert = getExpirationAlert(item.expires_at);
                const AlertIcon = alert.icon;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.pumped_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{item.volume_ml} ml</TableCell>
                    <TableCell>{item.pump_method === 'manual' ? 'Manual' : 'Elétrica'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.storage_location === 'fridge' ? (
                          <Refrigerator className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Snowflake className="h-4 w-4 text-cyan-500" />
                        )}
                        <span>{item.storage_location === 'fridge' ? 'Geladeira' : 'Freezer'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertIcon
                          className={`h-4 w-4 ${
                            alert.type === 'error'
                              ? 'text-red-500'
                              : alert.type === 'warning'
                                ? 'text-orange-500'
                                : 'text-green-500'
                          }`}
                        />
                        <span className="text-sm">{alert.message}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{item.notes || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => onMarkAsUsed(item.id)}>
                        Marcar como Usado
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
