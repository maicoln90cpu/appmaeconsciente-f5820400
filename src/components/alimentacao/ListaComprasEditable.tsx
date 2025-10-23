import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface ShoppingItem {
  item: string;
  category: string;
  checked: boolean;
}

interface AddItemDialogProps {
  onAdd: (item: ShoppingItem) => void;
}

export function AddItemDialog({ onAdd }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("Outros");

  const handleAdd = () => {
    if (!item.trim()) {
      toast.error("Digite o nome do item");
      return;
    }
    onAdd({ item: item.trim(), category, checked: false });
    setItem("");
    setOpen(false);
    toast.success("Item adicionado!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Item à Lista</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Nome do item"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Frutas e Vegetais">Frutas e Vegetais</SelectItem>
              <SelectItem value="Proteínas">Proteínas</SelectItem>
              <SelectItem value="Laticínios">Laticínios</SelectItem>
              <SelectItem value="Grãos e Cereais">Grãos e Cereais</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} className="w-full">Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
