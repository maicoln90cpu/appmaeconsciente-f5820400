import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import { UserFiltersState } from './types';

interface UserFiltersProps {
  filters: UserFiltersState;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: 'all' | 'admin' | 'user') => void;
  onSortByChange: (value: 'date' | 'email') => void;
  onSortOrderToggle: () => void;
  onRefresh: () => void;
  totalFiltered: number;
  totalUsers: number;
}

export const UserFilters = ({
  filters,
  onSearchChange,
  onRoleFilterChange,
  onSortByChange,
  onSortOrderToggle,
  onRefresh,
  totalFiltered,
  totalUsers,
}: UserFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {totalFiltered} de {totalUsers} usuário(s)
            </p>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email..."
                  value={filters.searchTerm}
                  onChange={e => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filters.roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Apenas Admins</SelectItem>
                <SelectItem value="user">Apenas Usuários</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={filters.sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortByChange('date')}
              >
                📅 Data
              </Button>
              <Button
                variant={filters.sortBy === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSortByChange('email')}
              >
                📧 Email
              </Button>
              <Button variant="outline" size="sm" onClick={onSortOrderToggle}>
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
