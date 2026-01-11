import { useState } from "react";
import { Users, Copy, Link2, Trash2, Mail, Clock, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PartnerAccess {
  id: string;
  partner_email: string;
  access_token: string;
  is_active: boolean;
  granted_at: string;
  expires_at: string | null;
  last_accessed: string | null;
}

export const PartnerAccessManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState<string>("30");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: accesses, isLoading } = useQuery({
    queryKey: ['partner-access'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('partner_access')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PartnerAccess[];
    },
  });

  const grantAccess = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expires_at = expiryDays !== "never" 
        ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('partner_access')
        .insert({ 
          user_id: user.id,
          partner_email: partnerEmail,
          expires_at
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-access'] });
      toast.success('Acesso concedido com sucesso! 💕');
      setPartnerEmail("");
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao conceder acesso: ' + error.message);
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('partner_access')
        .update({ is_active: false })
        .eq('id', accessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-access'] });
      toast.success('Acesso revogado');
    },
    onError: () => {
      toast.error('Erro ao revogar acesso');
    },
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/bebe-parceiro/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const activeAccesses = accesses?.filter(a => a.is_active) || [];
  const inactiveAccesses = accesses?.filter(a => !a.is_active) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0" />
              <span className="truncate">Modo Parceiro</span>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              Compartilhe acesso ao dashboard com parceiro ou cuidadores
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 shrink-0 w-full sm:w-auto">
                <Link2 className="h-4 w-4" />
                <span className="hidden xs:inline">Novo Acesso</span>
                <span className="xs:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conceder Acesso</DialogTitle>
                <DialogDescription>
                  Crie um link de acesso para parceiro ou cuidador visualizar os dados do bebê
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do parceiro/cuidador</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parceiro@email.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade do acesso</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="never">Sem expiração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => grantAccess.mutate()}
                  disabled={!partnerEmail || grantAccess.isPending}
                >
                  {grantAccess.isPending ? "Criando..." : "Criar Acesso"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : activeAccesses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum acesso ativo</p>
            <p className="text-sm mt-1">
              Clique em "Novo Acesso" para compartilhar com parceiro ou cuidador
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAccesses.map((access) => (
              <div 
                key={access.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{access.partner_email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {access.expires_at ? (
                        <span>
                          Expira em {formatDistance(new Date(access.expires_at), new Date(), { locale: ptBR })}
                        </span>
                      ) : (
                        <span>Sem expiração</span>
                      )}
                      {access.last_accessed && (
                        <span className="ml-2">
                          • Último acesso: {format(new Date(access.last_accessed), "dd/MM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-green-600">
                    Ativo
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyLink(access.access_token)}
                  >
                    {copiedToken === access.access_token ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeAccess.mutate(access.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {inactiveAccesses.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-2">Acessos revogados</p>
            <div className="space-y-2">
              {inactiveAccesses.slice(0, 3).map((access) => (
                <div 
                  key={access.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{access.partner_email}</span>
                  </div>
                  <Badge variant="outline">Revogado</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
