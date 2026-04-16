import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, UserPlus, KeyRound, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


import { UserData, ProductData, ProductAccessData, AccessGrantState } from './types';

interface UserCardProps {
  user: UserData;
  products: ProductData[] | undefined;
  userAccess: ProductAccessData[] | undefined;
  accessState: AccessGrantState;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onResetPassword: (email: string) => void;
  onDeleteUser: (userId: string, email: string) => void;
  onRevokeAccess: (userId: string, productId: string, productTitle: string, email: string) => void;
  onSelectProduct: (userId: string, productId: string) => void;
  onAccessDurationChange: (duration: number) => void;
  onLifetimeChange: (lifetime: boolean) => void;
  onGrantAccess: (userId: string) => void;
}

export const UserCard = ({
  user,
  products,
  userAccess,
  accessState,
  onToggleAdmin,
  onResetPassword,
  onDeleteUser,
  onRevokeAccess,
  onSelectProduct,
  onAccessDurationChange,
  onLifetimeChange,
  onGrantAccess,
}: UserCardProps) => {
  const isAdmin =
    Array.isArray(user.user_roles) && user.user_roles.length > 0
      ? user.user_roles.some(r => r?.role === 'admin')
      : false;

  const isSelected = accessState.selectedUser === user.id;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{user.email}</CardTitle>
              {isAdmin && (
                <Badge variant="destructive">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {user.hasUsedTools ? (
                <Badge variant="secondary">
                  Ativo há{' '}
                  {user.lastActivity
                    ? formatDistanceToNow(new Date(user.lastActivity), { locale: ptBR })
                    : ''}
                </Badge>
              ) : (
                <Badge variant="outline">Nunca usou</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cadastrado em {format(new Date(user.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isAdmin ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => onToggleAdmin(user.id, isAdmin)}
            >
              {isAdmin ? 'Remover Admin' : 'Tornar Admin'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onResetPassword(user.email)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Resetar Senha
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteUser(user.id, user.email)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">Perfil: {user.perfil_completo ? 'Completo' : 'Incompleto'}</p>

          {/* Produtos com acesso */}
          {userAccess && userAccess.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs mb-2 block">Produtos com Acesso</Label>
              <div className="flex flex-wrap gap-2">
                {userAccess.map((access, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-secondary rounded-md px-2 py-1 group"
                  >
                    <span className="text-xs">
                      {access.product_title}
                      {access.expires_at && (
                        <span className="ml-1 text-muted-foreground">
                          (até {format(new Date(access.expires_at), 'dd/MM/yyyy')})
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        onRevokeAccess(user.id, access.product_id, access.product_title, user.email)
                      }
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-end pt-2 border-t">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Conceder Acesso ao Produto</Label>
              <Select
                value={isSelected ? accessState.selectedProduct : ''}
                onValueChange={value => onSelectProduct(user.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isSelected && accessState.selectedProduct && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={accessState.accessDuration}
                    onChange={e => onAccessDurationChange(parseInt(e.target.value) || 30)}
                    disabled={accessState.lifetimeAccess}
                    min={1}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">dias</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="checkbox"
                      checked={accessState.lifetimeAccess}
                      onChange={e => onLifetimeChange(e.target.checked)}
                      className="rounded"
                    />
                    <Label className="text-xs">Vitalício</Label>
                  </div>
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => onGrantAccess(user.id)}
              disabled={!accessState.selectedProduct || !isSelected}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Conceder
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
