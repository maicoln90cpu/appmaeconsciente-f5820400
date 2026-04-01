import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { EnxovalItem, Category, Necessity, Status, Size, Origin, EtapaMaes, Classificacao, Emocao } from "@/types/enxoval";
import { calculatePriority, calculateSubtotalPlanned, calculateSubtotalPaid, calculateSavings, calculateSavingsPercent } from "@/lib/calculations";
import { TagsInput } from "@/components/TagsInput";
import { sanitizeUrl } from "@/lib/url-validator";
import { useToast } from "@/hooks/useToast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { DraftIndicator } from "@/components/ui/draft-indicator";

interface ItemDialogProps {
  onAdd?: (item: EnxovalItem) => void;
  onEdit?: (item: EnxovalItem) => void;
  editingItem?: EnxovalItem | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories: Category[] = [
  "Roupas",
  "Higiene",
  "Quarto",
  "Alimentação",
  "Mãe",
  "Extras"
];

const necessities: Necessity[] = ["Necessário", "Depois", "Não"];
const statuses: Status[] = ["A comprar", "Comprado"];
const sizes: Size[] = ["RN", "P", "M", "G", "Opcional"];
const origins = ["Novo", "Usado", "Brechó"];
const etapasMaes: EtapaMaes[] = ["Mapear", "Avaliar", "Enxugar", "Sustentar"];
const classificacoes: Classificacao[] = ["Essencial", "Pode Esperar", "Supérfluo"];
const emocoes: Emocao[] = ["😌 útil", "💸 impulso", "🧡 amor"];

type FormData = {
  category: Category;
  item: string;
  necessity: Necessity;
  size: Size | "";
  plannedQty: number;
  plannedPrice: number;
  boughtQty: number;
  unitPricePaid: number;
  frete: number;
  desconto: number;
  precoReferencia: number;
  store: string;
  link: string;
  status: Status;
  origin: string;
  dataLimiteTroca: string;
  notes: string;
  etapaMaes: EtapaMaes;
  classificacao: Classificacao | "";
  emocao: Emocao | "";
  tags: string[];
};

const defaultFormData: FormData = {
  category: "Roupas",
  item: "",
  necessity: "Necessário",
  size: "",
  plannedQty: 0,
  plannedPrice: 0,
  boughtQty: 0,
  unitPricePaid: 0,
  frete: 0,
  desconto: 0,
  precoReferencia: 0,
  store: "",
  link: "",
  status: "A comprar",
  origin: "",
  dataLimiteTroca: "",
  notes: "",
  etapaMaes: "Mapear",
  classificacao: "",
  emocao: "",
  tags: []
};

export const ItemDialog = ({ onAdd, onEdit, editingItem, open: controlledOpen, onOpenChange }: ItemDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // Auto-save for new items only (not when editing)
  const {
    isSaving,
    hasSavedRecently,
    lastSavedAt,
    availableDrafts,
    triggerAutoSave,
    deleteDraft,
    loadDraftById,
    deleteDraftById,
  } = useAutoSave<FormData>({
    type: 'enxoval-item',
    enabled: !editingItem && isOpen,
    debounceMs: 1500,
    minDataCheck: (data) => !!(data.item && (data.item as string).length > 2),
    onDraftLoaded: (data) => {
      // Remove metadata fields before setting form data
      const { __userId, __savedAt, ...cleanData } = data as FormData & { __userId?: string; __savedAt?: number };
      setFormData(prev => ({ ...prev, ...cleanData }));
    },
  });

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (!editingItem && isOpen && formData.item.length > 2) {
      triggerAutoSave(formData);
    }
  }, [formData, editingItem, isOpen, triggerAutoSave]);

  // Handle draft load
  const handleLoadDraft = useCallback(async (id: string) => {
    await loadDraftById(id);
    toast({
      title: "Rascunho carregado",
      description: "Os dados do rascunho foram restaurados.",
    });
  }, [loadDraftById, toast]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        category: editingItem.category,
        item: editingItem.item,
        necessity: editingItem.necessity,
        size: editingItem.size || "",
        plannedQty: editingItem.plannedQty,
        plannedPrice: editingItem.plannedPrice,
        boughtQty: editingItem.boughtQty,
        unitPricePaid: editingItem.unitPricePaid,
        frete: editingItem.frete,
        desconto: editingItem.desconto,
        precoReferencia: editingItem.precoReferencia,
        store: editingItem.store || "",
        link: editingItem.link || "",
        status: editingItem.status,
        origin: editingItem.origin || "",
        dataLimiteTroca: editingItem.dataLimiteTroca || "",
        notes: editingItem.notes || "",
        etapaMaes: editingItem.etapaMaes || "Mapear",
        classificacao: editingItem.classificacao || "",
        emocao: editingItem.emocao || "",
        tags: editingItem.tags || []
      });
    } else if (!isOpen) {
      // Reset form when dialog closes and not editing
      setFormData(defaultFormData);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar URL se fornecida
    if (formData.link && formData.link.trim()) {
      const safeUrl = sanitizeUrl(formData.link);
      if (!safeUrl) {
        toast({
          title: "URL inválida",
          description: "A URL fornecida contém caracteres perigosos ou é inválida. Use apenas links HTTP/HTTPS.",
          variant: "destructive",
        });
        return;
      }
      formData.link = safeUrl;
    }
    
    const priority = calculatePriority(formData.necessity);
    const subtotalPlanned = calculateSubtotalPlanned(formData.plannedQty, formData.plannedPrice);
    const subtotalPaid = calculateSubtotalPaid(formData.boughtQty, formData.unitPricePaid, formData.frete, formData.desconto);
    const savings = calculateSavings(subtotalPlanned, subtotalPaid);
    const savingsPercent = calculateSavingsPercent(subtotalPlanned, subtotalPaid);

    if (editingItem && onEdit) {
      const updatedItem: EnxovalItem = {
        ...editingItem,
        category: formData.category,
        item: formData.item,
        necessity: formData.necessity,
        priority,
        size: formData.size || undefined,
        plannedQty: formData.plannedQty,
        plannedPrice: formData.plannedPrice,
        boughtQty: formData.boughtQty,
        unitPricePaid: formData.unitPricePaid,
        frete: formData.frete,
        desconto: formData.desconto,
        precoReferencia: formData.precoReferencia,
        subtotalPlanned,
        subtotalPaid,
        savings,
        savingsPercent,
        store: formData.store || undefined,
        link: formData.link || undefined,
        status: formData.status,
        origin: formData.origin as Origin | undefined,
        dataLimiteTroca: formData.dataLimiteTroca || undefined,
        notes: formData.notes || undefined,
        etapaMaes: formData.etapaMaes as EtapaMaes | undefined,
        classificacao: formData.classificacao || undefined,
        emocao: formData.emocao || undefined,
        tags: formData.tags
      };
      onEdit(updatedItem);
    } else if (onAdd) {
      const newItem: EnxovalItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        category: formData.category,
        item: formData.item,
        necessity: formData.necessity,
        priority,
        size: formData.size || undefined,
        plannedQty: formData.plannedQty,
        plannedPrice: formData.plannedPrice,
        boughtQty: formData.boughtQty,
        unitPricePaid: formData.unitPricePaid,
        frete: formData.frete,
        desconto: formData.desconto,
        precoReferencia: formData.precoReferencia,
        subtotalPlanned,
        subtotalPaid,
        savings,
        savingsPercent,
        store: formData.store || undefined,
        link: formData.link || undefined,
        status: formData.status,
        origin: formData.origin as Origin | undefined,
        dataLimiteTroca: formData.dataLimiteTroca || undefined,
        notes: formData.notes || undefined,
        etapaMaes: formData.etapaMaes as EtapaMaes | undefined,
        classificacao: formData.classificacao || undefined,
        emocao: formData.emocao || undefined,
        tags: formData.tags
      };
      onAdd(newItem);
    }

    // Delete draft after successful save
    await deleteDraft();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!editingItem && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar item no enxoval 🧺
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>{editingItem ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
            {!editingItem && (
              <DraftIndicator
                isSaving={isSaving}
                hasSavedRecently={hasSavedRecently}
                lastSavedAt={lastSavedAt}
                availableDrafts={availableDrafts}
                onLoadDraft={handleLoadDraft}
                onDeleteDraft={deleteDraftById}
                onDeleteCurrentDraft={deleteDraft}
              />
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as Category })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Input
                id="item"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etapaMaes">Etapa do Método</Label>
              <Select value={formData.etapaMaes} onValueChange={(value) => setFormData({ ...formData, etapaMaes: value as EtapaMaes })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {etapasMaes.map((etapa) => (
                    <SelectItem key={etapa} value={etapa}>{etapa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use este campo para identificar em qual fase do método este item se encaixa
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="necessity">Necessidade</Label>
              <Select value={formData.necessity} onValueChange={(value) => setFormData({ ...formData, necessity: value as Necessity })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {necessities.map((nec) => (
                    <SelectItem key={nec} value={nec}>{nec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classificacao">Classificação do Item</Label>
              <Select value={formData.classificacao} onValueChange={(value) => setFormData({ ...formData, classificacao: value as Classificacao })}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {classificacoes.map((classif) => (
                    <SelectItem key={classif} value={classif}>{classif}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Essencial: o bebê realmente precisa agora. Pode Esperar: compre depois de testar. Supérfluo: evite ou substitua
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Tamanho</Label>
              <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value as Size })}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {sizes.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emocao">Emoção Associada (opcional)</Label>
              <Select value={formData.emocao} onValueChange={(value) => setFormData({ ...formData, emocao: value as Emocao })}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {emocoes.map((emoc) => (
                    <SelectItem key={emoc} value={emoc}>{emoc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ajuda a identificar compras feitas por emoção
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedQty">Qtd Planejada</Label>
              <Input
                id="plannedQty"
                type="number"
                min="0"
                value={formData.plannedQty}
                onChange={(e) => setFormData({ ...formData, plannedQty: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plannedPrice">Preço Planejado (R$)</Label>
              <Input
                id="plannedPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.plannedPrice}
                onChange={(e) => setFormData({ ...formData, plannedPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="boughtQty">Qtd Comprada</Label>
              <Input
                id="boughtQty"
                type="number"
                min="0"
                value={formData.boughtQty}
                onChange={(e) => setFormData({ ...formData, boughtQty: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPricePaid">Preço Unit. Pago (R$)</Label>
              <Input
                id="unitPricePaid"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPricePaid}
                onChange={(e) => setFormData({ ...formData, unitPricePaid: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frete">Frete (R$)</Label>
              <Input
                id="frete"
                type="number"
                min="0"
                step="0.01"
                value={formData.frete}
                onChange={(e) => setFormData({ ...formData, frete: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                min="0"
                step="0.01"
                value={formData.desconto}
                onChange={(e) => setFormData({ ...formData, desconto: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Informe descontos obtidos em cupons, promoções ou kits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precoReferencia">Preço Ref. (R$)</Label>
              <Input
                id="precoReferencia"
                type="number"
                min="0"
                step="0.01"
                value={formData.precoReferencia}
                onChange={(e) => setFormData({ ...formData, precoReferencia: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Preço médio do mercado — use para medir sua economia real
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem</Label>
              <Select value={formData.origin} onValueChange={(value) => setFormData({ ...formData, origin: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {origins.map((orig) => (
                    <SelectItem key={orig} value={orig}>{orig}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataLimiteTroca">Data Limite Troca</Label>
              <Input
                id="dataLimiteTroca"
                type="date"
                value={formData.dataLimiteTroca}
                onChange={(e) => setFormData({ ...formData, dataLimiteTroca: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store">Loja</Label>
              <Input
                id="store"
                placeholder="Digite o nome da loja ou site"
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                type="url"
                placeholder="Cole aqui o link do produto"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Ex: modelo, cor, condição, se vale esperar promoção."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <TagsInput
            tags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingItem ? "Salvar" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
