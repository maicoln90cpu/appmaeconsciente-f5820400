import { useState } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Camera, Smile, Meh, Frown, Lock, Users, Globe, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

import { useBodyImageLog } from '@/hooks/postpartum';


export const DiarioAutoestima = () => {
  const { logs, isLoading, addLog, deleteLog } = useBodyImageLog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    notes: '',
    mood: 'neutral' as 'positive' | 'neutral' | 'challenging',
    privacy: 'private' as 'private' | 'partner' | 'community',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = () => {
    addLog({
      ...formData,
      photo: selectedPhoto || undefined,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      notes: '',
      mood: 'neutral',
      privacy: 'private',
    });
    setSelectedPhoto(null);
    setPreviewUrl(null);
  };

  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'challenging':
        return <Frown className="h-5 w-5 text-orange-500" />;
      default:
        return <Meh className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'partner':
        return <Users className="h-4 w-4" />;
      case 'community':
        return <Globe className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando diário...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com mensagem de acolhimento */}
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            Diário de Autoestima
          </CardTitle>
          <CardDescription className="text-base">
            💕 Seu corpo está se transformando — registre e celebre cada momento dessa jornada de
            amor próprio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Camera className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Registro de Autoestima</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título (opcional)</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Me sentindo mais forte hoje"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Foto (opcional)</Label>
                  <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mt-2 max-h-48 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mood">Como você se sente?</Label>
                  <Select
                    value={formData.mood}
                    onValueChange={(value: any) => setFormData({ ...formData, mood: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">😊 Positiva</SelectItem>
                      <SelectItem value="neutral">😐 Neutra</SelectItem>
                      <SelectItem value="challenging">😔 Desafiador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Reflexão pessoal</Label>
                  <Textarea
                    id="notes"
                    placeholder="Escreva seus pensamentos, conquistas ou desafios de hoje..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacidade</Label>
                  <Select
                    value={formData.privacy}
                    onValueChange={(value: any) => setFormData({ ...formData, privacy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">🔒 Apenas eu</SelectItem>
                      <SelectItem value="partner">👥 Compartilhar com parceiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  Salvar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Timeline de registros */}
      <div className="grid gap-4">
        {logs && logs.length > 0 ? (
          logs.map(log => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getMoodIcon(log.mood)}
                      {log.title || format(new Date(log.date), "d 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                      <span>•</span>
                      {getPrivacyIcon(log.privacy)}
                      <span className="text-xs">
                        {log.privacy === 'private'
                          ? 'Privado'
                          : log.privacy === 'partner'
                            ? 'Compartilhado com parceiro'
                            : 'Público'}
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteLog(log.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {log.photo_url && (
                  <img
                    src={log.photo_url}
                    alt="Registro"
                    className="w-full max-h-96 object-cover rounded-lg mb-3"
                  />
                )}
                {log.notes && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={Heart}
            title="Ainda não há registros"
            description="Comece a registrar sua jornada de autoestima e transformação 💕"
          />
        )}
      </div>
    </div>
  );
};
