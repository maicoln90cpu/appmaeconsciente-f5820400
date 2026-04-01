import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Bed, Bath, Shield, Palette, Utensils } from "lucide-react";
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

const CATEGORIES = [
  { key: "sono", label: "Berço & Sono", icon: Bed, color: "text-indigo-500" },
  { key: "banho", label: "Banho & Troca", icon: Bath, color: "text-sky-500" },
  { key: "alimentacao", label: "Alimentação", icon: Utensils, color: "text-emerald-500" },
  { key: "seguranca", label: "Segurança", icon: Shield, color: "text-amber-500" },
  { key: "decoracao", label: "Decoração", icon: Palette, color: "text-pink-500" },
];

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
        // Seed default items
        const defaults: ChecklistItem[] = [];
        Object.entries(DEFAULT_ITEMS).forEach(([cat, names]) => {
          names.forEach((name, i) => defaults.push({ category: cat, item_name: name, completed: false, is_custom: false }));
        });
        setItems(defaults);

        // Save to DB
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

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/materiais")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Quartinho do Bebê</h1>
          <p className="text-sm text-muted-foreground">Checklist completo para montar o quarto</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{completedItems} de {totalItems} itens</span>
            <span className="font-bold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        const catDone = catItems.filter((i) => i.completed).length;
        const Icon = cat.icon;

        return (
          <Card key={cat.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${cat.color}`} />
                  {cat.label}
                </span>
                <Badge variant="outline" className="text-xs">{catDone}/{catItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catItems.map((item) => {
                const idx = items.indexOf(item);
                return (
                  <div key={idx} className="flex items-center gap-3 py-1">
                    <Checkbox checked={item.completed} onCheckedChange={() => toggle(idx)} disabled={loading} />
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.item_name}
                    </span>
                    {item.is_custom && <Badge variant="secondary" className="text-[9px]">Personalizado</Badge>}
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
