import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Bed, Bath, Shield, Palette, Utensils, DollarSign, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ChecklistItem {
  id?: string;
  category: string;
  item_name: string;
  completed: boolean;
  is_custom: boolean;
}

type Priority = "essential" | "optional";

const CATEGORIES = [
  { key: "sono", label: "Berço & Sono", icon: Bed, color: "text-indigo-500" },
  { key: "banho", label: "Banho & Troca", icon: Bath, color: "text-sky-500" },
  { key: "alimentacao", label: "Alimentação", icon: Utensils, color: "text-emerald-500" },
  { key: "seguranca", label: "Segurança", icon: Shield, color: "text-amber-500" },
  { key: "decoracao", label: "Decoração", icon: Palette, color: "text-pink-500" },
];

interface ItemMeta {
  price: number;
  priority: Priority;
}

const ITEM_META: Record<string, ItemMeta> = {
  "Berço com certificação INMETRO": { price: 600, priority: "essential" },
  "Colchão firme": { price: 150, priority: "essential" },
  "2 lençóis de elástico": { price: 60, priority: "essential" },
  "Mosquiteiro": { price: 40, priority: "optional" },
  "Babá eletrônica": { price: 250, priority: "optional" },
  "Luminária noturna": { price: 50, priority: "essential" },
  "Cortina blackout": { price: 120, priority: "optional" },
  "Banheira com suporte": { price: 180, priority: "essential" },
  "2 toalhas com capuz": { price: 70, priority: "essential" },
  "Kit higiene (algodão, cotonete, tesoura)": { price: 45, priority: "essential" },
  "Trocador acolchoado": { price: 80, priority: "essential" },
  "Lixeira com pedal": { price: 60, priority: "optional" },
  "Fraldas (estoque inicial)": { price: 150, priority: "essential" },
  "Pomada para assaduras": { price: 30, priority: "essential" },
  "Cadeira de alimentação": { price: 350, priority: "essential" },
  "Babadores (kit 5+)": { price: 50, priority: "essential" },
  "Kit prato/colher/copo": { price: 60, priority: "essential" },
  "Esterilizador": { price: 120, priority: "optional" },
  "Escova para mamadeiras": { price: 20, priority: "essential" },
  "Protetores de tomada": { price: 15, priority: "essential" },
  "Grades de proteção": { price: 100, priority: "essential" },
  "Travas para gavetas": { price: 25, priority: "essential" },
  "Protetor de quina": { price: 20, priority: "essential" },
  "Tela de proteção (janelas)": { price: 200, priority: "essential" },
  "Tapete emborrachado/EVA": { price: 80, priority: "optional" },
  "Prateleiras para livros/brinquedos": { price: 90, priority: "optional" },
  "Cesto organizador de roupas": { price: 50, priority: "optional" },
  "Adesivos decorativos": { price: 40, priority: "optional" },
  "Móbile para berço": { price: 70, priority: "optional" },
};

const DEFAULT_ITEMS: Record<string, string[]> = {
  sono: ["Berço com certificação INMETRO", "Colchão firme", "2 lençóis de elástico", "Mosquiteiro", "Babá eletrônica", "Luminária noturna", "Cortina blackout"],
  banho: ["Banheira com suporte", "2 toalhas com capuz", "Kit higiene (algodão, cotonete, tesoura)", "Trocador acolchoado", "Lixeira com pedal", "Fraldas (estoque inicial)", "Pomada para assaduras"],
  alimentacao: ["Cadeira de alimentação", "Babadores (kit 5+)", "Kit prato/colher/copo", "Esterilizador", "Escova para mamadeiras"],
  seguranca: ["Protetores de tomada", "Grades de proteção", "Travas para gavetas", "Protetor de quina", "Tela de proteção (janelas)"],
  decoracao: ["Tapete emborrachado/EVA", "Prateleiras para livros/brinquedos", "Cesto organizador de roupas", "Adesivos decorativos", "Móbile para berço"],
};

const ChecklistQuartinho = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [filterEssential, setFilterEssential] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("baby_room_checklist")
        .select("id, category, item_name, completed, is_custom")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        setItems(data);
      } else {
        const defaults: ChecklistItem[] = [];
        Object.entries(DEFAULT_ITEMS).forEach(([cat, names]) => {
          names.forEach((name) => defaults.push({ category: cat, item_name: name, completed: false, is_custom: false }));
        });
        setItems(defaults);
        const inserts = defaults.map((item) => ({ user_id: user.id, ...item }));
        await supabase.from("baby_room_checklist").insert(inserts);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggle = async (index: number) => {
    if (!user) return;
    const item = items[index];
    const newVal = !item.completed;
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, completed: newVal } : it));
    if (item.id) {
      await supabase.from("baby_room_checklist").update({ completed: newVal }).eq("id", item.id);
    }
  };

  const addItem = async (category: string) => {
    if (!user || !newItemText[category]?.trim()) return;
    const name = newItemText[category].trim();
    const newItem: ChecklistItem = { category, item_name: name, completed: false, is_custom: true };
    const { data } = await supabase.from("baby_room_checklist").insert({ user_id: user.id, ...newItem }).select("id").single();
    if (data) {
      setItems((prev) => [...prev, { ...newItem, id: data.id }]);
      setNewItemText((prev) => ({ ...prev, [category]: "" }));
      toast.success("Item adicionado!");
    }
  };

  const getItemMeta = (name: string): ItemMeta => {
    return ITEM_META[name] || { price: 0, priority: "optional" as Priority };
  };

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Cálculo de custo estimado
  const totalEstimatedCost = items.reduce((sum, item) => sum + getItemMeta(item.item_name).price, 0);
  const remainingCost = items.filter((i) => !i.completed).reduce((sum, item) => sum + getItemMeta(item.item_name).price, 0);

  const getFilteredItems = (catKey: string) => {
    let catItems = items.filter((i) => i.category === catKey);
    if (filterEssential) {
      catItems = catItems.filter((i) => getItemMeta(i.item_name).priority === "essential");
    }
    return catItems;
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Quartinho do Bebê</h1>
          <p className="text-sm text-muted-foreground">Checklist com estimativas de custo</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>{completedItems} de {totalItems} itens</span>
            <span className="font-bold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-3" />

          {/* Estimativa de custo */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Estimativa total</p>
              <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4" />
                R$ {totalEstimatedCost.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Falta comprar</p>
              <p className="text-lg font-bold flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4" />
                R$ {remainingCost.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtro essencial/opcional */}
      <div className="flex items-center gap-2">
        <Button
          variant={filterEssential ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterEssential(!filterEssential)}
          className="gap-1.5 text-xs"
        >
          <Star className="h-3.5 w-3.5" />
          {filterEssential ? "Ver todos" : "Só essenciais"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {filterEssential ? "Mostrando apenas itens essenciais" : "Mostrando todos os itens"}
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const catItems = getFilteredItems(cat.key);
        const catDone = catItems.filter((i) => i.completed).length;
        const catCost = catItems.reduce((s, i) => s + getItemMeta(i.item_name).price, 0);
        const Icon = cat.icon;

        return (
          <Card key={cat.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${cat.color}`} />
                  {cat.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-normal">
                    ~R$ {catCost.toLocaleString("pt-BR")}
                  </span>
                  <Badge variant="outline" className="text-xs">{catDone}/{catItems.length}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catItems.map((item) => {
                const idx = items.indexOf(item);
                const meta = getItemMeta(item.item_name);
                const isEssential = meta.priority === "essential";

                return (
                  <div key={idx} className="flex items-center gap-3 py-1">
                    <Checkbox checked={item.completed} onCheckedChange={() => toggle(idx)} disabled={loading} />
                    <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.item_name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEssential ? (
                        <Badge className="text-[9px] bg-primary/15 text-primary border-0 gap-0.5">
                          <Star className="h-2.5 w-2.5" /> Essencial
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px]">Opcional</Badge>
                      )}
                      {meta.price > 0 && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          ~R${meta.price}
                        </span>
                      )}
                      {item.is_custom && <Badge variant="secondary" className="text-[9px]">Custom</Badge>}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Adicionar item..."
                  value={newItemText[cat.key] || ""}
                  onChange={(e) => setNewItemText((p) => ({ ...p, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem(cat.key)}
                  className="text-sm h-8"
                />
                <Button size="sm" variant="outline" onClick={() => addItem(cat.key)} className="h-8 px-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ChecklistQuartinho;
