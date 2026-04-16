// NOTA: MainLayout é aplicado globalmente no App.tsx - NÃO adicionar aqui
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChecklistBag } from '@/components/mala-maternidade/ChecklistBag';
import { ProgressTracker } from '@/components/mala-maternidade/ProgressTracker';
import { HospitalSettings } from '@/components/mala-maternidade/HospitalSettings';
import { ExportPDF } from '@/components/mala-maternidade/ExportPDF';
import { WeeklyMilestones } from '@/components/mala-maternidade/WeeklyMilestones';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calendar, ListChecks, Package, CheckCheck, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useMaternityBag } from '@/hooks/useMaternityBag';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

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

const MalaDaMaternidade = () => {
  const { categories, items, loading, updateItem, addItem, getItemsByCategory } = useMaternityBag();
  const { profile } = useProfile();
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<string>('normal');
  const [weeksPregnant, setWeeksPregnant] = useState<number>(32);

  useEffect(() => {
    // Load settings from localStorage (only for hospital and weeks)
    const savedHospital = localStorage.getItem('checklist-hospital');
    const savedDeliveryType = localStorage.getItem('checklist-delivery-type');
    const savedWeeks = localStorage.getItem('checklist-weeks');

    if (savedHospital) setSelectedHospital(savedHospital);
    if (savedDeliveryType) setDeliveryType(savedDeliveryType);
    if (savedWeeks) setWeeksPregnant(parseInt(savedWeeks));

    // Use profile data if available
    if (profile?.delivery_type) {
      setDeliveryType(profile.delivery_type);
    }
    if (profile?.meses_gestacao) {
      const weeks = Math.floor(profile.meses_gestacao * 4.33); // Convert months to weeks
      setWeeksPregnant(weeks);
    }
  }, [profile]);

  // Convert database items to ChecklistItem format for each category
  const getCategoryItems = (categoryName: string): ChecklistItem[] => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return [];

    const categoryItems = getItemsByCategory(category.id);
    return categoryItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity.toString(),
      category: categoryName,
      checked: item.checked,
      note: item.notes,
      cesareanOnly: item.cesarean_only,
      normalOnly: item.normal_only,
    }));
  };

  const motherItems = getCategoryItems('Mãe');
  const babyItems = getCategoryItems('Bebê');
  const companionItems = getCategoryItems('Acompanhante');

  const handleItemUpdate = (categoryName: string, updatedItems: ChecklistItem[]) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return;

    // Update items in database
    updatedItems.forEach(item => {
      const existingItem = items.find(i => i.id === item.id);
      if (existingItem) {
        // Update existing item
        updateItem(item.id, {
          name: item.name,
          quantity: parseInt(item.quantity || '1'),
          checked: item.checked,
          notes: item.note,
          cesarean_only: item.cesareanOnly || false,
          normal_only: item.normalOnly || false,
        });
      } else {
        // Add new item
        addItem(
          category.id,
          item.name,
          parseInt(item.quantity || '1'),
          item.cesareanOnly || false,
          item.normalOnly || false
        );
      }
    });
  };

  const handleMotherUpdate = (updatedItems: ChecklistItem[]) => {
    handleItemUpdate('Mãe', updatedItems);
  };

  const handleBabyUpdate = (updatedItems: ChecklistItem[]) => {
    handleItemUpdate('Bebê', updatedItems);
  };

  const handleCompanionUpdate = (updatedItems: ChecklistItem[]) => {
    handleItemUpdate('Acompanhante', updatedItems);
  };

  const handleHospitalChange = (hospital: string) => {
    setSelectedHospital(hospital);
    localStorage.setItem('checklist-hospital', hospital);
  };

  const handleDeliveryTypeChange = (type: string) => {
    setDeliveryType(type);
    localStorage.setItem('checklist-delivery-type', type);
  };

  const handleWeeksChange = (weeks: number) => {
    setWeeksPregnant(weeks);
    localStorage.setItem('checklist-weeks', weeks.toString());
  };

  const totalItems = motherItems.length + babyItems.length + companionItems.length;
  const checkedItems =
    motherItems.filter(i => i.checked).length +
    babyItems.filter(i => i.checked).length +
    companionItems.filter(i => i.checked).length;

  const daysUntilReady = Math.max(0, (37 - weeksPregnant) * 7);
  const daysUntilDueDate = weeksPregnant ? (40 - weeksPregnant) * 7 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleMarkEssentials = () => {
    const uncheckedItems = items.filter(i => !i.checked);
    if (uncheckedItems.length === 0) {
      toast.info('Todos os itens já estão marcados!');
      return;
    }
    let count = 0;
    uncheckedItems.forEach(item => {
      updateItem(item.id, { checked: true });
      count++;
    });
    toast.success(`✅ ${count} itens marcados como prontos!`);
  };

  const weeksRemaining = Math.max(0, 37 - weeksPregnant);
  const isUrgent = daysUntilReady <= 14 && daysUntilReady > 0;
  const isOverdue = weeksPregnant >= 37;

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Checklist de Mala da Maternidade</h1>
          <p className="text-muted-foreground">
            Organize suas malas com antecedência e tenha uma ida tranquila à maternidade
          </p>
        </div>

        {/* Contador regressivo */}
        {daysUntilReady > 0 && !isOverdue && (
          <Card
            className={`mb-6 border-2 ${isUrgent ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : 'border-primary/30 bg-primary/5'}`}
          >
            <CardContent className="py-5">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full shrink-0 ${isUrgent ? 'bg-red-100 dark:bg-red-900' : 'bg-primary/10'}`}
                >
                  <Timer
                    className={`h-6 w-6 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {isUrgent
                      ? '⚠️ Atenção — sua mala deve estar pronta em breve!'
                      : 'Sua mala deve estar pronta em'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-3xl font-bold ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}
                    >
                      {daysUntilReady}
                    </span>
                    <span className="text-lg text-muted-foreground">dias</span>
                    <span className="text-sm text-muted-foreground">
                      ({weeksRemaining} semanas)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Faltam {daysUntilDueDate > 0 ? daysUntilDueDate : 0} dias para a DPP •{' '}
                    {checkedItems}/{totalItems} itens prontos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isOverdue && checkedItems < totalItems && (
          <Alert className="mb-6 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700">
            <Timer className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              Você já está com {weeksPregnant} semanas! Sua mala já deveria estar pronta. Faltam{' '}
              {totalItems - checkedItems} itens.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs: Timeline vs Checklist */}
        <Tabs defaultValue="timeline" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Cronograma Semanal
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Checklist por Categoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <WeeklyMilestones currentWeek={weeksPregnant} />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            {/* Botão marcar todos essenciais */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkEssentials}
                className="gap-2"
                disabled={items.filter(i => !i.checked).length === 0}
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todos como prontos
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                  <CardDescription>
                    {checkedItems} de {totalItems} itens completos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressTracker
                    motherItems={motherItems}
                    babyItems={babyItems}
                    companionItems={companionItems}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Personalize sua lista de acordo com o seu hospital
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HospitalSettings
                    selectedHospital={selectedHospital}
                    deliveryType={deliveryType}
                    weeksPregnant={weeksPregnant}
                    onHospitalChange={handleHospitalChange}
                    onDeliveryTypeChange={handleDeliveryTypeChange}
                    onWeeksChange={handleWeeksChange}
                  />
                  <div className="mt-4">
                    <ExportPDF
                      motherItems={motherItems}
                      babyItems={babyItems}
                      companionItems={companionItems}
                      hospital={selectedHospital}
                      deliveryType={deliveryType}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="mother">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mother">
                  Mãe ({motherItems.filter(i => i.checked).length}/{motherItems.length})
                </TabsTrigger>
                <TabsTrigger value="baby">
                  Bebê ({babyItems.filter(i => i.checked).length}/{babyItems.length})
                </TabsTrigger>
                <TabsTrigger value="companion">
                  Acompanhante ({companionItems.filter(i => i.checked).length}/
                  {companionItems.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mother">
                <ChecklistBag
                  title="Mala da Mãe"
                  icon="👩"
                  items={motherItems}
                  onUpdate={handleMotherUpdate}
                  deliveryType={deliveryType}
                />
              </TabsContent>

              <TabsContent value="baby">
                <ChecklistBag
                  title="Mala do Bebê"
                  icon="👶"
                  items={babyItems}
                  onUpdate={handleBabyUpdate}
                  deliveryType={deliveryType}
                />
              </TabsContent>

              <TabsContent value="companion">
                <ChecklistBag
                  title="Mala do Acompanhante"
                  icon="👨"
                  items={companionItems}
                  onUpdate={handleCompanionUpdate}
                  deliveryType={deliveryType}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dicas importantes:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Comece a preparar suas malas a partir da 36ª semana</li>
              <li>Confirme com o hospital o que eles fornecem</li>
              <li>Deixe as malas em local de fácil acesso</li>
              <li>Informe sua família ou acompanhante sobre onde estão as malas</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
};

export default MalaDaMaternidade;
