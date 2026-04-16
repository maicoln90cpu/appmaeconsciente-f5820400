import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { FirstTimesAlbum } from '@/components/bebe/FirstTimesAlbum';

const AlbumMarcos = () => {
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/materiais')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Álbum de Marcos</h1>
          <p className="text-sm text-muted-foreground">
            Registre cada primeira vez do bebê com fotos e timeline
          </p>
        </div>
      </div>

      <FirstTimesAlbum />
    </div>
  );
};

export default AlbumMarcos;
