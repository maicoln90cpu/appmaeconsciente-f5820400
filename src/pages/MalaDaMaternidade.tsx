import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChecklistBag } from "@/components/mala-maternidade/ChecklistBag";
import { ProgressTracker } from "@/components/mala-maternidade/ProgressTracker";
import { HospitalSettings } from "@/components/mala-maternidade/HospitalSettings";
import { ExportPDF } from "@/components/mala-maternidade/ExportPDF";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Download } from "lucide-react";

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
  const [motherItems, setMotherItems] = useState<ChecklistItem[]>([]);
  const [babyItems, setBabyItems] = useState<ChecklistItem[]>([]);
  const [companionItems, setCompanionItems] = useState<ChecklistItem[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<string>("normal");
  const [weeksPregnant, setWeeksPregnant] = useState<number>(32);

  useEffect(() => {
    // Carregar dados salvos do localStorage
    const savedMother = localStorage.getItem("checklist-mother");
    const savedBaby = localStorage.getItem("checklist-baby");
    const savedCompanion = localStorage.getItem("checklist-companion");
    const savedHospital = localStorage.getItem("checklist-hospital");
    const savedDeliveryType = localStorage.getItem("checklist-delivery-type");
    const savedWeeks = localStorage.getItem("checklist-weeks");

    if (savedMother) setMotherItems(JSON.parse(savedMother));
    else setMotherItems(getDefaultMotherItems());

    if (savedBaby) setBabyItems(JSON.parse(savedBaby));
    else setBabyItems(getDefaultBabyItems());

    if (savedCompanion) setCompanionItems(JSON.parse(savedCompanion));
    else setCompanionItems(getDefaultCompanionItems());

    if (savedHospital) setSelectedHospital(savedHospital);
    if (savedDeliveryType) setDeliveryType(savedDeliveryType);
    if (savedWeeks) setWeeksPregnant(parseInt(savedWeeks));
  }, []);

  const getDefaultMotherItems = (): ChecklistItem[] => [
    // Documentos
    { id: "m1", name: "RG ou CNH", category: "Documentos", checked: false },
    { id: "m2", name: "Cartão do pré-natal", category: "Documentos", checked: false },
    { id: "m3", name: "Exames recentes", category: "Documentos", checked: false },
    { id: "m4", name: "Cartão do convênio (se houver)", category: "Documentos", checked: false },
    { id: "m5", name: "Cartão SUS", category: "Documentos", checked: false },
    
    // Roupas
    { id: "m6", name: "Camisolas abertas na frente", quantity: "2-3", category: "Roupas", checked: false },
    { id: "m7", name: "Calcinhas descartáveis pós-parto", quantity: "5-7", category: "Roupas", checked: false },
    { id: "m8", name: "Roupão ou robe", quantity: "1", category: "Roupas", checked: false },
    { id: "m9", name: "Meias", quantity: "2 pares", category: "Roupas", checked: false },
    { id: "m10", name: "Roupa confortável para alta", quantity: "1", category: "Roupas", checked: false },
    
    // Higiene
    { id: "m11", name: "Absorventes noturnos", quantity: "2 pacotes", category: "Higiene", checked: false },
    { id: "m12", name: "Xampu e condicionador", category: "Higiene", checked: false },
    { id: "m13", name: "Sabonete", category: "Higiene", checked: false },
    { id: "m14", name: "Escova e pente", category: "Higiene", checked: false },
    { id: "m15", name: "Desodorante", category: "Higiene", checked: false },
    { id: "m16", name: "Escova de dentes e pasta", category: "Higiene", checked: false },
    { id: "m17", name: "Toalha de banho", quantity: "2", category: "Higiene", checked: false },
    
    // Pós-parto
    { id: "m18", name: "Sutiãs de amamentação", quantity: "2-3", category: "Pós-parto", checked: false },
    { id: "m19", name: "Absorventes para seios", quantity: "1 caixa", category: "Pós-parto", checked: false },
    { id: "m20", name: "Pomada para mamilos", category: "Pós-parto", checked: false },
    { id: "m21", name: "Cinta pós-parto", category: "Pós-parto", checked: false, cesareanOnly: true },
    
    // Conforto
    { id: "m22", name: "Chinelos confortáveis", category: "Conforto", checked: false },
    { id: "m23", name: "Carregador de celular", category: "Conforto", checked: false },
    { id: "m24", name: "Travesseiro (se permitido)", category: "Conforto", checked: false },
    { id: "m25", name: "Lanches leves", category: "Conforto", checked: false },
  ];

  const getDefaultBabyItems = (): ChecklistItem[] => [
    // Roupas
    { id: "b1", name: "Bodies manga curta RN", quantity: "3", category: "Roupas", checked: false },
    { id: "b2", name: "Bodies manga longa RN", quantity: "3", category: "Roupas", checked: false },
    { id: "b3", name: "Macacões RN", quantity: "3", category: "Roupas", checked: false },
    { id: "b4", name: "Calças/Mijões RN", quantity: "2-3", category: "Roupas", checked: false },
    { id: "b5", name: "Meias", quantity: "3 pares", category: "Roupas", checked: false },
    { id: "b6", name: "Luvas anti-arranhões", quantity: "2 pares", category: "Roupas", checked: false },
    { id: "b7", name: "Gorro/Touca", quantity: "2", category: "Roupas", checked: false },
    { id: "b8", name: "Bodies P (reserva)", quantity: "2", category: "Roupas", checked: false },
    
    // Saída de maternidade
    { id: "b9", name: "Conjunto de saída da maternidade", quantity: "1", category: "Saída", checked: false },
    { id: "b10", name: "Manta/Cobertor leve", quantity: "2", category: "Saída", checked: false },
    
    // Higiene
    { id: "b11", name: "Fraldas RN", quantity: "1 pacote", category: "Higiene", checked: false },
    { id: "b12", name: "Lenços umedecidos", quantity: "1 pacote", category: "Higiene", checked: false },
    { id: "b13", name: "Pomada para assaduras", category: "Higiene", checked: false },
    { id: "b14", name: "Hastes flexíveis", category: "Higiene", checked: false },
    { id: "b15", name: "Álcool 70%", category: "Higiene", checked: false },
    { id: "b16", name: "Gazes esterilizadas", category: "Higiene", checked: false },
    
    // Outros
    { id: "b17", name: "Chupeta (opcional)", quantity: "2", category: "Outros", checked: false },
    { id: "b18", name: "Naninha/Paninho", category: "Outros", checked: false },
    { id: "b19", name: "Toalha fralda", quantity: "2", category: "Outros", checked: false },
  ];

  const getDefaultCompanionItems = (): ChecklistItem[] => [
    { id: "c1", name: "Documento com foto", category: "Documentos", checked: false },
    { id: "c2", name: "Roupas confortáveis", quantity: "2 trocas", category: "Roupas", checked: false },
    { id: "c3", name: "Chinelos", category: "Roupas", checked: false },
    { id: "c4", name: "Produtos de higiene pessoal", category: "Higiene", checked: false },
    { id: "c5", name: "Carregador de celular", category: "Eletrônicos", checked: false },
    { id: "c6", name: "Lanches e água", category: "Alimentação", checked: false },
    { id: "c7", name: "Travesseiro pequeno", category: "Conforto", checked: false },
    { id: "c8", name: "Cobertor leve", category: "Conforto", checked: false },
    { id: "c9", name: "Dinheiro/Cartão", category: "Financeiro", checked: false },
  ];

  const handleMotherUpdate = (items: ChecklistItem[]) => {
    setMotherItems(items);
    localStorage.setItem("checklist-mother", JSON.stringify(items));
  };

  const handleBabyUpdate = (items: ChecklistItem[]) => {
    setBabyItems(items);
    localStorage.setItem("checklist-baby", JSON.stringify(items));
  };

  const handleCompanionUpdate = (items: ChecklistItem[]) => {
    setCompanionItems(items);
    localStorage.setItem("checklist-companion", JSON.stringify(items));
  };

  const handleHospitalChange = (hospital: string) => {
    setSelectedHospital(hospital);
    localStorage.setItem("checklist-hospital", hospital);
  };

  const handleDeliveryTypeChange = (type: string) => {
    setDeliveryType(type);
    localStorage.setItem("checklist-delivery-type", type);
  };

  const handleWeeksChange = (weeks: number) => {
    setWeeksPregnant(weeks);
    localStorage.setItem("checklist-weeks", weeks.toString());
  };

  const totalItems = motherItems.length + babyItems.length + companionItems.length;
  const checkedItems = 
    motherItems.filter(i => i.checked).length +
    babyItems.filter(i => i.checked).length +
    companionItems.filter(i => i.checked).length;

  const daysUntilReady = Math.max(0, (37 - weeksPregnant) * 7);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Checklist de Mala da Maternidade</h1>
          <p className="text-muted-foreground">
            Organize suas malas com antecedência e tenha uma ida tranquila à maternidade
          </p>
        </div>

        {weeksPregnant < 37 && daysUntilReady > 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você está com {weeksPregnant} semanas. Sua mala deve estar pronta em aproximadamente {daysUntilReady} dias 
              (na semana 37). {weeksPregnant >= 32 ? "Hora de começar a preparar!" : "Ainda há tempo, mas você pode ir se organizando!"}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Progresso Geral</CardTitle>
              <CardDescription>Acompanhe o que já está pronto</CardDescription>
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
              <CardDescription>Personalize seu checklist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <HospitalSettings
                selectedHospital={selectedHospital}
                onHospitalChange={handleHospitalChange}
                deliveryType={deliveryType}
                onDeliveryTypeChange={handleDeliveryTypeChange}
                weeksPregnant={weeksPregnant}
                onWeeksChange={handleWeeksChange}
              />
              <ExportPDF
                motherItems={motherItems}
                babyItems={babyItems}
                companionItems={companionItems}
                hospital={selectedHospital}
                deliveryType={deliveryType}
              />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mother" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mother">
              Mala da Mãe ({motherItems.filter(i => i.checked).length}/{motherItems.length})
            </TabsTrigger>
            <TabsTrigger value="baby">
              Mala do Bebê ({babyItems.filter(i => i.checked).length}/{babyItems.length})
            </TabsTrigger>
            <TabsTrigger value="companion">
              Mala do Acompanhante ({companionItems.filter(i => i.checked).length}/{companionItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mother">
            <ChecklistBag
              title="Mala da Mãe"
              items={motherItems}
              onUpdate={handleMotherUpdate}
              deliveryType={deliveryType}
              icon="👩"
            />
          </TabsContent>

          <TabsContent value="baby">
            <ChecklistBag
              title="Mala do Bebê"
              items={babyItems}
              onUpdate={handleBabyUpdate}
              deliveryType={deliveryType}
              icon="👶"
            />
          </TabsContent>

          <TabsContent value="companion">
            <ChecklistBag
              title="Mala do Acompanhante"
              items={companionItems}
              onUpdate={handleCompanionUpdate}
              deliveryType={deliveryType}
              icon="👤"
            />
          </TabsContent>
        </Tabs>

        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Dicas importantes:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Coloque etiquetas com seu nome em todas as malas</li>
              <li>Deixe a mala no porta-malas do carro após 37 semanas</li>
              <li>Tenha cópias digitais dos documentos no celular</li>
              <li>Confirme com o hospital o que eles fornecem</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
  );
};

export default MalaDaMaternidade;
