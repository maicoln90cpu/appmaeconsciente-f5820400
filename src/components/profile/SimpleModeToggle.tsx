import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export const SimpleModeToggle = () => {
  const { profile, updateProfile } = useProfile();

  const simpleMode = profile?.simple_mode ?? false;

  const handleToggle = async (checked: boolean) => {
    const { error } = await updateProfile({ simple_mode: checked });
    if (!error) {
      toast(checked ? 'Modo Simples ativado' : 'Modo Completo ativado', { description: checked });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {simpleMode ? (
            <EyeOff className="h-5 w-5 text-primary" />
          ) : (
            <Eye className="h-5 w-5 text-primary" />
          )}
          Modo de Visualização
        </CardTitle>
        <CardDescription>
          O Modo Simples esconde funções avançadas, deixando apenas o essencial visível.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="simple-mode" className="font-medium cursor-pointer">
              {simpleMode ? 'Modo Simples' : 'Modo Completo'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {simpleMode
                ? 'Mostrando apenas ferramentas essenciais'
                : 'Mostrando todas as ferramentas e funções'}
            </p>
          </div>
          <Switch id="simple-mode" checked={simpleMode} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
};
