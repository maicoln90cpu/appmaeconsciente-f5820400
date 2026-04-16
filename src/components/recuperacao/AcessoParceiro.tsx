import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePartnerAccess } from '@/hooks/usePartnerAccess';
import { Users, Link as LinkIcon, Copy, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const AcessoParceiro = () => {
  const { partnerAccesses, isLoading, grantAccess, revokeAccess, getShareLink } =
    usePartnerAccess();
  const [email, setEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleGrantAccess = () => {
    if (!email) {
      toast.error('Digite o email do parceiro/cuidador');
      return;
    }

    grantAccess({ partner_email: email });
    setEmail('');
  };

  const copyLink = (token: string) => {
    const link = getShareLink(token);
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Link copiado para a área de transferência');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Acesso do Parceiro/Cuidador
          </CardTitle>
          <CardDescription className="text-base">
            💙 Permita que seu parceiro ou cuidador acompanhe sua recuperação com um link seguro
            (apenas visualização).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-email">Email do Parceiro/Cuidador</Label>
              <div className="flex gap-2">
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="parceiro@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Button onClick={handleGrantAccess}>Conceder Acesso</Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">ℹ️ Como funciona:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>O parceiro/cuidador poderá visualizar seu progresso</li>
                <li>Ele não poderá editar ou deletar nada</li>
                <li>Você pode revogar o acesso a qualquer momento</li>
                <li>O link é seguro e pessoal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de acessos ativos */}
      {partnerAccesses && partnerAccesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acessos Ativos</CardTitle>
            <CardDescription>
              Pessoas que têm acesso para visualizar sua recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partnerAccesses.map(access => (
                <div
                  key={access.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    access.is_active ? 'bg-background' : 'bg-muted opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">{access.partner_email}</p>
                    <p className="text-sm text-muted-foreground">
                      Concedido em{' '}
                      {format(new Date(access.granted_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    {access.last_accessed && (
                      <p className="text-xs text-muted-foreground">
                        Último acesso:{' '}
                        {format(new Date(access.last_accessed), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                    {access.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(access.access_token)}
                        className="mt-2"
                      >
                        {copiedToken === access.access_token ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Link Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {access.is_active && (
                    <Button variant="destructive" size="sm" onClick={() => revokeAccess(access.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Revogar
                    </Button>
                  )}
                  {!access.is_active && (
                    <span className="text-sm text-muted-foreground">Revogado</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
