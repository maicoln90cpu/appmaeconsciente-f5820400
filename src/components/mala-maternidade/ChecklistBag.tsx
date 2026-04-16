import { useState } from 'react';

import { Plus, StickyNote } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';



interface ChecklistItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  checked: boolean;
  note?: string;
  cesareanOnly?: boolean;
  normalOnly?: boolean;
}

interface ChecklistBagProps {
  title: string;
  items: ChecklistItem[];
  onUpdate: (items: ChecklistItem[]) => void;
  deliveryType: string;
  icon: string;
}

export const ChecklistBag = ({ title, items, onUpdate, deliveryType, icon }: ChecklistBagProps) => {
  const [newItemName, setNewItemName] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(items.map(item => item.category)));

  const handleToggle = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onUpdate(updated);
  };

  const handleAddNote = (id: string, note: string) => {
    const updated = items.map(item => (item.id === id ? { ...item, note } : item));
    onUpdate(updated);
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      name: newItemName,
      category: 'Personalizado',
      checked: false,
    };

    onUpdate([...items, newItem]);
    setNewItemName('');
  };

  const toggleNoteExpansion = (id: string) => {
    const newSet = new Set(expandedNotes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedNotes(newSet);
  };

  const filterItemsByDeliveryType = (item: ChecklistItem) => {
    if (deliveryType === 'cesarea' && item.normalOnly) return false;
    if (deliveryType === 'normal' && item.cesareanOnly) return false;
    return true;
  };

  const filteredItems = items.filter(filterItemsByDeliveryType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>Marque os itens conforme for adicionando à mala</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {category}
                <Badge variant="secondary">
                  {categoryItems.filter(i => i.checked).length}/{categoryItems.length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {categoryItems.map(item => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={item.id}
                          className={`cursor-pointer font-medium ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.name}
                          {item.quantity && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({item.quantity})
                            </span>
                          )}
                          {item.cesareanOnly && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Cesárea
                            </Badge>
                          )}
                          {item.normalOnly && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Parto Normal
                            </Badge>
                          )}
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNoteExpansion(item.id)}
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                    </div>

                    <Collapsible open={expandedNotes.has(item.id)}>
                      <CollapsibleContent>
                        <div className="ml-9 mr-3">
                          <Textarea
                            placeholder="Adicione uma nota pessoal..."
                            value={item.note || ''}
                            onChange={e => handleAddNote(item.id, e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <h3 className="font-semibold text-lg mb-3">Adicionar Item Personalizado</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do item..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem} size="icon" aria-label="Adicionar item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
