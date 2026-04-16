import { useState } from 'react';

import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';



interface PostFiltersProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string | null) => void;
  selectedCategory: string | null;
}

const CATEGORIES = [
  { value: 'dicas', label: 'Dicas', icon: '💡' },
  { value: 'desabafo', label: 'Desabafo', icon: '💭' },
  { value: 'venda', label: 'Vendas', icon: '🛍️' },
  { value: 'duvida', label: 'Dúvida', icon: '❓' },
  { value: 'conquista', label: 'Conquista', icon: '🎉' },
];

export const PostFilters = ({ onSearch, onCategoryFilter, selectedCategory }: PostFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Buscar</Button>
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery('');
              onSearch('');
            }}
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => onCategoryFilter(null)}
        >
          Todos
        </Badge>
        {CATEGORIES.map(cat => (
          <Badge
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onCategoryFilter(cat.value)}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Badge>
        ))}
      </div>
    </div>
  );
};
