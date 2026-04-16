import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { CreateUserDialog } from '../CreateUserDialog';

interface NoResultsProps {
  onClearFilters: () => void;
}

export const NoSearchResults = ({ onClearFilters }: NoResultsProps) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12">
      <Search className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
      <p className="text-muted-foreground text-center mb-4">Tente ajustar os filtros de busca</p>
      <Button variant="outline" onClick={onClearFilters}>
        Limpar Filtros
      </Button>
    </CardContent>
  </Card>
);

interface NoUsersProps {
  onUserCreated: () => void;
}

export const NoUsersRegistered = ({ onUserCreated }: NoUsersProps) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12">
      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
      <p className="text-muted-foreground text-center mb-4">Crie o primeiro usuário para começar</p>
      <CreateUserDialog onUserCreated={onUserCreated} />
    </CardContent>
  </Card>
);
