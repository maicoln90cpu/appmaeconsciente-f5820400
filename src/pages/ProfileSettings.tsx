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
import { Baby, Upload, ArrowLeft, Save, Download, Trash2, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SyncQueuePanel } from "@/components/offline";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { SimpleModeToggle } from "@/components/profile/SimpleModeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  const [formData, setFormData] = useState({
    idade: profile?.idade?.toString() || "",
    sexo: profile?.sexo || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
    meses_gestacao: profile?.meses_gestacao?.toString() || "",
    data_prevista_parto: profile?.data_prevista_parto || "",
    data_inicio_planejamento: profile?.data_inicio_planejamento || "",
    possui_filhos: profile?.possui_filhos || false,
    idades_filhos: profile?.idades_filhos?.join(", ") || "",
    foto_perfil_url: profile?.foto_perfil_url || "",
  });

  // Exportar dados pessoais (LGPD)
  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Erro", { description: "Sessão expirada. Faça login novamente." });
        return;
      }

      const response = await supabase.functions.invoke('export-user-data', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw response.error;

      // Baixar o JSON
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast("Dados exportados!", { description: "Seu arquivo de dados pessoais foi baixado." });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error("Erro ao exportar", { description: "Tente novamente mais tarde." });
    } finally {
      setExporting(false);
    }
  };

  // Excluir conta (LGPD)
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== profile?.email) {
      toast.error("Email incorreto", { description: "Digite seu email corretamente para confirmar a exclusão." });
      return;
    }

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Erro", { description: "Sessão expirada. Faça login novamente." });
        return;
      }

      const response = await supabase.functions.invoke('delete-user-data', {
        body: { confirmEmail: deleteConfirmEmail },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw response.error;

      toast("Conta excluída", { description: "Sua conta e todos os dados foram excluídos permanentemente." });

      // Fazer logout e redirecionar
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error("Erro ao excluir conta", { description: "Contate o suporte se o problema persistir." });
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tamanho (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande", { description: "O tamanho máximo permitido é 5MB." });
      return;
    }

    // Validação de tipo MIME
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato inválido", { description: "Use apenas imagens JPEG, PNG, WebP ou GIF." });
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
      
      toast("Foto carregada!", { description: "Sua foto de perfil foi enviada com sucesso." });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Erro ao enviar foto", { description: "Tente novamente mais tarde." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: any = {};

    if (formData.idade) updates.idade = parseInt(formData.idade);
    if (formData.sexo) updates.sexo = formData.sexo;
    if (formData.cidade) updates.cidade = formData.cidade;
    if (formData.estado) updates.estado = formData.estado;
    if (formData.meses_gestacao) updates.meses_gestacao = parseInt(formData.meses_gestacao);
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
      toast.error("Erro ao salvar", { description: error });
    } else {
      toast("Perfil atualizado!", { description: "Suas informações foram salvas com sucesso." });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Baby className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Cadastro</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Conquistas & Nível */}
            <ProfileAchievements />

            {/* Modo Simples */}
            <SimpleModeToggle />

            {/* Foto de Perfil */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>Altere sua foto de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.foto_perfil_url && (
                  <div className="flex justify-center">
                    <img 
                      src={formData.foto_perfil_url} 
                      alt="Foto de perfil" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/10"
                    />
                  </div>
                )}
                <div className="flex justify-center">
                  <Label htmlFor="foto" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Enviando..." : "Alterar Foto"}
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
                </div>
              </CardContent>
            </Card>

            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Dados básicos sobre você</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idade">Idade</Label>
                    <Input
                      id="idade"
                      type="number"
                      value={formData.idade}
                      onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                      placeholder="Ex: 28"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
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
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
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
              </CardContent>
            </Card>

            {/* Informações da Gestação */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Gestação</CardTitle>
                <CardDescription>Dados sobre sua gestação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="meses_gestacao">Meses de Gestação</Label>
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
                    <Label htmlFor="data_prevista_parto">Data Prevista do Parto</Label>
                    <Input
                      id="data_prevista_parto"
                      type="date"
                      value={formData.data_prevista_parto}
                      onChange={(e) => setFormData({ ...formData, data_prevista_parto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="data_inicio_planejamento">Data de Início do Planejamento</Label>
                    <Input
                      id="data_inicio_planejamento"
                      type="date"
                      value={formData.data_inicio_planejamento}
                      onChange={(e) => setFormData({ ...formData, data_inicio_planejamento: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações sobre Filhos */}
            <Card>
              <CardHeader>
                <CardTitle>Informações sobre Filhos</CardTitle>
                <CardDescription>Você já possui filhos?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Privacidade e Dados (LGPD) */}
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Privacidade e Dados
                </CardTitle>
                <CardDescription>
                  Gerencie seus dados pessoais conforme a LGPD
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exportar Dados */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Baixar meus dados</h4>
                    <p className="text-sm text-muted-foreground">
                      Exporte todos os seus dados pessoais em formato JSON
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleExportData}
                    disabled={exporting}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? "Exportando..." : "Exportar"}
                  </Button>
                </div>

                <Separator />

                {/* Excluir Conta */}
                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div>
                    <h4 className="font-medium text-destructive">Excluir minha conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove permanentemente sua conta e todos os dados
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Excluir Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Excluir conta permanentemente?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>
                            Esta ação é <strong>irreversível</strong>. Todos os seus dados serão 
                            permanentemente excluídos, incluindo:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>Perfil e configurações</li>
                            <li>Itens do enxoval e listas</li>
                            <li>Registros de amamentação e sono</li>
                            <li>Dados de vacinação e desenvolvimento</li>
                            <li>Publicações e comentários</li>
                            <li>Conquistas e progressos</li>
                          </ul>
                          <div className="pt-4">
                            <Label htmlFor="confirm-email">
                              Digite seu email para confirmar: <strong>{profile?.email}</strong>
                            </Label>
                            <Input
                              id="confirm-email"
                              type="email"
                              placeholder="Digite seu email"
                              value={deleteConfirmEmail}
                              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmEmail("")}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleting || deleteConfirmEmail !== profile?.email}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? "Excluindo..." : "Sim, excluir minha conta"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* Sincronização Offline */}
            <SyncQueuePanel />

            {/* Botão Salvar */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
