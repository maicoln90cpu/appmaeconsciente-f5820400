import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Baby, Upload, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    idade: profile?.idade || "",
    sexo: profile?.sexo || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
    meses_gestacao: profile?.meses_gestacao || "",
    data_prevista_parto: profile?.data_prevista_parto || "",
    data_inicio_planejamento: profile?.data_inicio_planejamento || "",
    possui_filhos: profile?.possui_filhos || false,
    idades_filhos: profile?.idades_filhos?.join(", ") || "",
    foto_perfil_url: profile?.foto_perfil_url || "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validação de tipo MIME
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use apenas imagens JPEG, PNG, WebP ou GIF.",
        variant: "destructive",
      });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}/${Math.random()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setFormData({ ...formData, foto_perfil_url: data.publicUrl });
      
      toast({
        title: "Foto carregada!",
        description: "Sua foto de perfil foi enviada com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro ao enviar foto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    const { error } = await updateProfile({ perfil_completo: true });

    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async () => {
    const updates: any = {
      perfil_completo: true,
    };

    // Adiciona apenas campos preenchidos
    if (formData.idade) updates.idade = parseInt(formData.idade as string);
    if (formData.sexo) updates.sexo = formData.sexo;
    if (formData.cidade) updates.cidade = formData.cidade;
    if (formData.estado) updates.estado = formData.estado;
    if (formData.meses_gestacao) updates.meses_gestacao = parseInt(formData.meses_gestacao as string);
    if (formData.data_prevista_parto) updates.data_prevista_parto = formData.data_prevista_parto;
    if (formData.data_inicio_planejamento) updates.data_inicio_planejamento = formData.data_inicio_planejamento;
    if (formData.foto_perfil_url) updates.foto_perfil_url = formData.foto_perfil_url;
    
    updates.possui_filhos = formData.possui_filhos;
    if (formData.possui_filhos && formData.idades_filhos) {
      updates.idades_filhos = formData.idades_filhos.split(",").map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    } else {
      updates.idades_filhos = [];
    }

    const { error } = await updateProfile(updates);

    if (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil completo!",
        description: "Bem-vindo ao sistema.",
      });
      navigate("/");
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Baby className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
              <CardDescription className="mt-1">
                Etapa {step} de 4
              </CardDescription>
            </div>
          </div>
          <Progress value={progress} className="w-full" />
          
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dica:</strong> Completar seu perfil nos ajuda a oferecer recomendações personalizadas de produtos e serviços, 
              além de melhorar sua experiência com a integração da nossa plataforma. Todos os campos são opcionais!
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade (sugerido)</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                    placeholder="Ex: 28"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo (sugerido)</Label>
                  <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade (sugerido)</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (sugerido)</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Pular
                </Button>
                <Button onClick={() => setStep(2)} className="flex-1">
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações da Gestação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meses_gestacao">Meses de Gestação (sugerido)</Label>
                  <Input
                    id="meses_gestacao"
                    type="number"
                    min="0"
                    max="40"
                    value={formData.meses_gestacao}
                    onChange={(e) => setFormData({ ...formData, meses_gestacao: e.target.value })}
                    placeholder="Ex: 6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_prevista_parto">Data Prevista do Parto (sugerido)</Label>
                  <Input
                    id="data_prevista_parto"
                    type="date"
                    value={formData.data_prevista_parto}
                    onChange={(e) => setFormData({ ...formData, data_prevista_parto: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="data_inicio_planejamento">Data de Início do Planejamento (sugerido)</Label>
                  <Input
                    id="data_inicio_planejamento"
                    type="date"
                    value={formData.data_inicio_planejamento}
                    onChange={(e) => setFormData({ ...formData, data_inicio_planejamento: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Pular
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Sobre Filhos</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="possui_filhos"
                    checked={formData.possui_filhos}
                    onCheckedChange={(checked) => setFormData({ ...formData, possui_filhos: checked as boolean })}
                  />
                  <Label htmlFor="possui_filhos">Já possui filhos?</Label>
                </div>
                {formData.possui_filhos && (
                  <div className="space-y-2">
                    <Label htmlFor="idades_filhos">Idades dos filhos (separadas por vírgula)</Label>
                    <Input
                      id="idades_filhos"
                      placeholder="Ex: 3, 5, 8"
                      value={formData.idades_filhos}
                      onChange={(e) => setFormData({ ...formData, idades_filhos: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Pular
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Foto de Perfil</h3>
              <div className="space-y-4">
                {formData.foto_perfil_url && (
                  <div className="flex justify-center">
                    <img 
                      src={formData.foto_perfil_url} 
                      alt="Foto de perfil" 
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="foto" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Enviando..." : "Escolher Foto"}
                    </div>
                  </Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground">Opcional, mas recomendado</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Voltar
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Pular
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
