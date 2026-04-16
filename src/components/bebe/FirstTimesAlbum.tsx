import { useState } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Camera,
  Plus,
  Heart,
  MapPin,
  Users,
  Trash2,
  Star,
  Calendar,
  Edit2,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import { useBabyFirstTimes } from '@/hooks/useBabyGamification';


interface FirstTimesAlbumProps {
  babyProfileId?: string;
}

const eventTypes = [
  { value: 'smile', label: 'Primeiro Sorriso', icon: '😊' },
  { value: 'laugh', label: 'Primeira Risada', icon: '😂' },
  { value: 'rollover', label: 'Primeira Virada', icon: '🔄' },
  { value: 'sitting', label: 'Sentou Sozinho', icon: '🪑' },
  { value: 'crawling', label: 'Engatinhou', icon: '🐛' },
  { value: 'standing', label: 'Ficou em Pé', icon: '🧍' },
  { value: 'walking', label: 'Primeiros Passos', icon: '👣' },
  { value: 'word', label: 'Primeira Palavra', icon: '🗣️' },
  { value: 'tooth', label: 'Primeiro Dente', icon: '🦷' },
  { value: 'food', label: 'Primeira Papinha', icon: '🥣' },
  { value: 'bath', label: 'Primeiro Banho', icon: '🛁' },
  { value: 'haircut', label: 'Primeiro Corte', icon: '✂️' },
  { value: 'trip', label: 'Primeira Viagem', icon: '✈️' },
  { value: 'beach', label: 'Primeira Praia', icon: '🏖️' },
  { value: 'christmas', label: 'Primeiro Natal', icon: '🎄' },
  { value: 'birthday', label: 'Primeiro Aniversário', icon: '🎂' },
  { value: 'other', label: 'Outro Momento', icon: '⭐' },
];

const moodOptions = [
  { value: 'happy', label: 'Feliz', icon: '😊' },
  { value: 'excited', label: 'Animado', icon: '🤩' },
  { value: 'curious', label: 'Curioso', icon: '🧐' },
  { value: 'calm', label: 'Calmo', icon: '😌' },
  { value: 'surprised', label: 'Surpreso', icon: '😲' },
];

export const FirstTimesAlbum = ({ babyProfileId }: FirstTimesAlbumProps) => {
  const { firstTimes, isLoading, addFirstTime, updateFirstTime, deleteFirstTime } =
    useBabyFirstTimes(babyProfileId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    event_type: '',
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    location: '',
    mood: '',
    notes: '',
    witnesses: '',
  });

  const handleSubmit = () => {
    if (!formData.event_type || !formData.title || !formData.event_date) return;

    const selectedType = eventTypes.find(t => t.value === formData.event_type);

    addFirstTime({
      baby_profile_id: babyProfileId || null,
      event_type: formData.event_type,
      title: formData.title || selectedType?.label || '',
      description: formData.description || null,
      event_date: formData.event_date,
      photo_url: null,
      video_url: null,
      location: formData.location || null,
      witnesses: formData.witnesses ? formData.witnesses.split(',').map(w => w.trim()) : null,
      mood: formData.mood || null,
      notes: formData.notes || null,
      is_favorite: false,
    });

    setFormData({
      event_type: '',
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      location: '',
      mood: '',
      notes: '',
      witnesses: '',
    });
    setIsDialogOpen(false);
  };

  const toggleFavorite = (id: string, currentValue: boolean) => {
    updateFirstTime({ id, is_favorite: !currentValue });
  };

  const getEventIcon = (type: string) => {
    return eventTypes.find(t => t.value === type)?.icon || '⭐';
  };

  const favorites = firstTimes?.filter(f => f.is_favorite) || [];
  const others = firstTimes?.filter(f => !f.is_favorite) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-pink-500 shrink-0" />
              <span className="truncate">Álbum de Primeiras Vezes</span>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              Eternize os momentos especiais do seu bebê
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shrink-0 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Novo Momento</span>
                <span className="xs:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Momento Especial</DialogTitle>
                <DialogDescription>Guarde para sempre essa memória do seu bebê</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Tipo de Momento</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={value => {
                      const type = eventTypes.find(t => t.value === value);
                      setFormData({
                        ...formData,
                        event_type: value,
                        title: type?.label || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o momento" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Primeiro sorriso para a mamãe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Como foi esse momento especial?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Input
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Onde aconteceu?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Humor do Bebê</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={value => setFormData({ ...formData, mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Como estava?" />
                      </SelectTrigger>
                      <SelectContent>
                        {moodOptions.map(mood => (
                          <SelectItem key={mood.value} value={mood.value}>
                            <span className="flex items-center gap-2">
                              <span>{mood.icon}</span>
                              <span>{mood.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quem estava presente?</Label>
                  <Input
                    value={formData.witnesses}
                    onChange={e => setFormData({ ...formData, witnesses: e.target.value })}
                    placeholder="Mamãe, Papai, Vovó... (separado por vírgula)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas adicionais</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Algo mais que queira lembrar..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.event_type || !formData.event_date}
                >
                  Salvar Momento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : !firstTimes || firstTimes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhum momento registrado ainda</p>
            <p className="text-sm mt-1">
              Clique em "Novo Momento" para eternizar as primeiras vezes do seu bebê
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorites */}
            {favorites.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  Favoritos
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {favorites.map(item => (
                    <FirstTimeCard
                      key={item.id}
                      item={item}
                      getEventIcon={getEventIcon}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteFirstTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All moments */}
            <div>
              {favorites.length > 0 && (
                <h4 className="text-sm font-medium mb-3">Todos os Momentos</h4>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {others.map(item => (
                  <FirstTimeCard
                    key={item.id}
                    item={item}
                    getEventIcon={getEventIcon}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteFirstTime}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FirstTimeCardProps {
  item: {
    id: string;
    event_type: string;
    title: string;
    description: string | null;
    event_date: string;
    location: string | null;
    mood: string | null;
    witnesses: string[] | null;
    is_favorite: boolean;
  };
  getEventIcon: (type: string) => string;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

const handleShareMilestone = async (
  item: FirstTimeCardProps['item'],
  getEventIcon: (type: string) => string
) => {
  const icon = getEventIcon(item.event_type);
  const dateStr = format(new Date(item.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const text = `${icon} ${item.title}\n📅 ${dateStr}${item.location ? `\n📍 ${item.location}` : ''}${item.description ? `\n\n${item.description}` : ''}\n\n✨ Registrado no Mãe Consciente`;

  if (navigator.share) {
    try {
      await navigator.share({ title: item.title, text });
      return;
    } catch {}
  }

  await navigator.clipboard.writeText(text);
  toast.success('Texto copiado! Cole onde quiser compartilhar 💕');
};

const FirstTimeCard = ({ item, getEventIcon, onToggleFavorite, onDelete }: FirstTimeCardProps) => {
  const moodIcon = moodOptions.find(m => m.value === item.mood)?.icon;

  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{getEventIcon(item.event_type)}</div>
          <div>
            <h4 className="font-semibold">{item.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(item.event_date), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.location && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {item.location}
                </Badge>
              )}
              {moodIcon && (
                <Badge variant="outline" className="text-xs">
                  {moodIcon}
                </Badge>
              )}
              {item.witnesses && item.witnesses.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {item.witnesses.length}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            className=""
            onClick={() => handleShareMilestone(item, getEventIcon)}
            title="Compartilhar"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className=""
            onClick={() => onToggleFavorite(item.id, item.is_favorite)}
          >
            <Heart
              className={`h-4 w-4 ${
                item.is_favorite ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
