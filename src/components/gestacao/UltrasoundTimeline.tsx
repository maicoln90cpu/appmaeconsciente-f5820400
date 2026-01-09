import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Heart, 
  Calendar, 
  Weight, 
  Ruler, 
  Trash2, 
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Columns
} from "lucide-react";
import { UltrasoundImage, useUltrasounds } from "@/hooks/useUltrasounds";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UltrasoundTimelineProps {
  ultrasounds: UltrasoundImage[];
}

const ULTRASOUND_TYPE_LABELS: Record<string, string> = {
  routine: "Rotina",
  morphological: "Morfológico",
  transvaginal: "Transvaginal",
  "3d_4d": "3D/4D",
  doppler: "Doppler",
  other: "Outro",
};

export const UltrasoundTimeline = ({ ultrasounds }: UltrasoundTimelineProps) => {
  const { toggleFavorite, deleteUltrasound } = useUltrasounds();
  const [selectedImage, setSelectedImage] = useState<UltrasoundImage | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareImages, setCompareImages] = useState<[UltrasoundImage | null, UltrasoundImage | null]>([null, null]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSelectForCompare = (image: UltrasoundImage) => {
    if (compareImages[0] === null) {
      setCompareImages([image, null]);
    } else if (compareImages[1] === null && compareImages[0].id !== image.id) {
      setCompareImages([compareImages[0], image]);
    } else {
      // Reset and start new selection
      setCompareImages([image, null]);
    }
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const currentIndex = ultrasounds.findIndex(u => u.id === selectedImage.id);
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < ultrasounds.length) {
      setSelectedImage(ultrasounds[newIndex]);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteUltrasound(deleteId);
      setDeleteId(null);
      if (selectedImage?.id === deleteId) {
        setSelectedImage(null);
      }
    }
  };

  if (ultrasounds.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-lg mb-2">Nenhum ultrassom registrado ainda</p>
          <p className="text-sm">Adicione seu primeiro ultrassom para começar a timeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Compare Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {ultrasounds.length} ultrassom(s) registrado(s)
        </p>
        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareImages([null, null]);
          }}
          className="gap-2"
        >
          <Columns className="h-4 w-4" />
          Comparar
        </Button>
      </div>

      {/* Compare Selection Info */}
      {compareMode && (
        <Card className="mb-4 bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <p className="text-sm">
              {compareImages[0] && compareImages[1] 
                ? `Comparando: Semana ${compareImages[0].gestational_week} vs Semana ${compareImages[1].gestational_week}`
                : compareImages[0]
                  ? `Selecionado: Semana ${compareImages[0].gestational_week}. Selecione outro para comparar.`
                  : "Selecione duas imagens para comparar lado a lado"
              }
            </p>
            {(compareImages[0] || compareImages[1]) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCompareImages([null, null])}
                className="mt-2"
              >
                Limpar seleção
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compare View */}
      {compareMode && compareImages[0] && compareImages[1] && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {compareImages.map((img, idx) => img && (
                <div key={img.id} className="space-y-2">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={img.image_url}
                      alt={`Ultrassom semana ${img.gestational_week}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-lg">
                      Semana {img.gestational_week}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(img.ultrasound_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    {img.baby_weight_grams && (
                      <p className="text-sm">{img.baby_weight_grams}g</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {ultrasounds.map((ultrasound, index) => {
            const isSelected = compareMode && 
              (compareImages[0]?.id === ultrasound.id || compareImages[1]?.id === ultrasound.id);
            
            return (
              <Card 
                key={ultrasound.id} 
                className={`
                  flex-shrink-0 w-64 cursor-pointer transition-all hover:shadow-md
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                `}
                onClick={() => compareMode 
                  ? handleSelectForCompare(ultrasound) 
                  : setSelectedImage(ultrasound)
                }
              >
                <div className="relative aspect-square">
                  <img
                    src={ultrasound.image_url}
                    alt={`Ultrassom semana ${ultrasound.gestational_week}`}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {ultrasound.is_favorite && (
                      <Badge className="bg-red-500">
                        <Heart className="h-3 w-3 fill-current" />
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-black/70 text-white">
                      Semana {ultrasound.gestational_week}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(ultrasound.ultrasound_date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {ULTRASOUND_TYPE_LABELS[ultrasound.ultrasound_type] || ultrasound.ultrasound_type}
                  </Badge>
                  {(ultrasound.baby_weight_grams || ultrasound.baby_length_cm) && (
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {ultrasound.baby_weight_grams && (
                        <span className="flex items-center gap-1">
                          <Weight className="h-3 w-3" />
                          {ultrasound.baby_weight_grams}g
                        </span>
                      )}
                      {ultrasound.baby_length_cm && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {ultrasound.baby_length_cm}cm
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage && !compareMode} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Semana {selectedImage.gestational_week}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedImage.id); }}
                    >
                      <Heart 
                        className={`h-5 w-5 ${selectedImage.is_favorite ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(selectedImage.id); }}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="relative">
                <img
                  src={selectedImage.image_url}
                  alt={`Ultrassom semana ${selectedImage.gestational_week}`}
                  className="w-full rounded-lg"
                />
                
                {/* Navigation */}
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-white hover:bg-black/70 ml-2"
                    onClick={() => navigateImage("prev")}
                    disabled={ultrasounds.findIndex(u => u.id === selectedImage.id) === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 text-white hover:bg-black/70 mr-2"
                    onClick={() => navigateImage("next")}
                    disabled={ultrasounds.findIndex(u => u.id === selectedImage.id) === ultrasounds.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedImage.ultrasound_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {ULTRASOUND_TYPE_LABELS[selectedImage.ultrasound_type] || selectedImage.ultrasound_type}
                  </p>
                </div>
                {selectedImage.baby_weight_grams && (
                  <div>
                    <p className="text-sm text-muted-foreground">Peso do Bebê</p>
                    <p className="font-medium">{selectedImage.baby_weight_grams}g</p>
                  </div>
                )}
                {selectedImage.baby_length_cm && (
                  <div>
                    <p className="text-sm text-muted-foreground">Comprimento</p>
                    <p className="font-medium">{selectedImage.baby_length_cm}cm</p>
                  </div>
                )}
              </div>

              {selectedImage.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Anotações</p>
                  <p>{selectedImage.notes}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ultrassom?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ultrassom será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
