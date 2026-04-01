import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Upload, RefreshCw, MapPin, Edit2, Check, X, Sparkles, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface VirtualUser {
  id: string;
  email: string;
  full_name: string | null;
  foto_perfil_url: string | null;
  cidade: string | null;
  estado: string | null;
  personality: string | null;
  personality_style: string | null;
  is_active: boolean;
  created_at: string;
}

export const VirtualUserManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VirtualUser>>({});
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["virtual-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, foto_perfil_url, cidade, estado, personality, personality_style, is_active, created_at")
        .eq("is_virtual", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as VirtualUser[];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VirtualUser> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtual-users"] });
      toast.success("Perfil atualizado!");
      setEditingId(null);
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["virtual-users"] });
      toast.success(vars.is_active ? "Bot ativado" : "Bot desativado");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const handleAvatarUpload = async (userId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `bots/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(`Erro no upload: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ foto_perfil_url: urlData.publicUrl })
      .eq("id", userId);

    if (updateError) {
      toast.error(`Erro ao salvar URL: ${updateError.message}`);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["virtual-users"] });
    toast.success("Avatar atualizado!");
  };

  const handleGenerateAvatar = async (user: VirtualUser) => {
    setGeneratingAvatarId(user.id);
    try {
      const name = user.full_name || "Mãe";
      const { data, error } = await supabase.functions.invoke("generate-comment", {
        body: {
          postContent: `Gere uma descrição curta em inglês para uma foto de perfil realista de: ${name}, mãe brasileira. Selfie casual, iluminação natural, expressão calorosa, fundo desfocado. Apenas a descrição, sem aspas.`,
          postCategory: "avatar",
        },
      });

      if (error || !data?.comment) {
        toast.error("Não foi possível gerar o prompt para a imagem. Use upload manual.");
        return;
      }

      toast.info("💡 Funcionalidade futura: a geração automática de avatar por IA será implementada em breve. Por enquanto, use o upload manual clicando na foto do perfil.", { duration: 6000 });
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setGeneratingAvatarId(null);
    }
  };

  const startEditing = (user: VirtualUser) => {
    setEditingId(user.id);
    setEditForm({
      full_name: user.full_name,
      cidade: user.cidade,
      estado: user.estado,
      personality: user.personality,
      personality_style: user.personality_style,
    });
  };

  const saveEditing = () => {
    if (!editingId) return;
    updateUser.mutate({ id: editingId, updates: editForm });
  };

  const activeCount = users?.filter(u => u.is_active).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Usuários Virtuais
        </h2>
        <p className="text-muted-foreground">
          Gerencie perfis, avatares, personalidades e status dos bots da comunidade
        </p>
      </div>

      <div className="flex gap-4">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {users?.length || 0} bots cadastrados
        </Badge>
        <Badge variant="default" className="text-sm py-1 px-3 bg-green-600">
          {activeCount} ativos
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3">
          {(users?.length || 0) - activeCount} inativos
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users?.map((user) => (
            <Card key={user.id} className={`transition-opacity ${!user.is_active ? "opacity-50" : ""}`}>
              <CardContent className="pt-6 space-y-3">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.foto_perfil_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="h-5 w-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(user.id, file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === user.id ? (
                      <Input
                        value={editForm.full_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="text-sm font-semibold"
                        placeholder="Nome"
                      />
                    ) : (
                      <p className="font-semibold truncate">{user.full_name || "Sem nome"}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                {/* Location */}
                {editingId === user.id ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editForm.cidade || ""}
                      onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                      placeholder="Cidade"
                      className="text-sm"
                    />
                    <Input
                      value={editForm.estado || ""}
                      onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                      placeholder="UF"
                      className="text-sm"
                      maxLength={2}
                    />
                  </div>
                ) : (
                  user.cidade && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {user.cidade}{user.estado ? `, ${user.estado}` : ""}
                    </p>
                  )
                )}

                {/* Personality */}
                {editingId === user.id ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Personalidade</Label>
                      <Textarea
                        value={editForm.personality || ""}
                        onChange={(e) => setEditForm({ ...editForm, personality: e.target.value })}
                        placeholder="Ex: Mãe de primeira viagem, ansiosa mas curiosa..."
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Estilo de Escrita</Label>
                      <Textarea
                        value={editForm.personality_style || ""}
                        onChange={(e) => setEditForm({ ...editForm, personality_style: e.target.value })}
                        placeholder="Ex: Direta e prática, frases curtas..."
                        className="text-sm min-h-[50px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {user.personality && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-medium text-foreground">🧠</span> {user.personality}
                      </p>
                    )}
                    {user.personality_style && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-medium text-foreground">✍️</span> {user.personality_style}
                      </p>
                    )}
                    {!user.personality && !user.personality_style && (
                      <p className="text-xs text-muted-foreground italic">Sem personalidade definida</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: user.id, is_active: checked })}
                    />
                    <Label className="text-xs">{user.is_active ? "Ativo" : "Inativo"}</Label>
                  </div>

                  <div className="flex gap-1">
                    {editingId === user.id ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={saveEditing}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleGenerateAvatar(user)}
                          disabled={generatingAvatarId === user.id}
                          title="Gerar foto por IA (em breve)"
                        >
                          {generatingAvatarId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-amber-500" />
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => startEditing(user)}>
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {users && users.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Nenhum usuário virtual cadastrado</p>
          <p className="text-sm text-muted-foreground">Execute a automação IA para criar os bots automaticamente</p>
        </div>
      )}
    </div>
  );
};

export default VirtualUserManagement;
