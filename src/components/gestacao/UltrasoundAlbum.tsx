import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Heart, Calendar } from "lucide-react";
import { useUltrasounds } from "@/hooks/useUltrasounds";
import { UltrasoundUploader } from "./UltrasoundUploader";
import { UltrasoundTimeline } from "./UltrasoundTimeline";

export const UltrasoundAlbum = () => {
  const { ultrasounds, isLoading, groupedByTrimester, favorites } = useUltrasounds();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-48 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Álbum de Ultrassons
            </CardTitle>
            <CardDescription>
              Guarde as memórias da sua gestação e acompanhe a evolução do seu bebê
            </CardDescription>
          </div>
          <UltrasoundUploader />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {ultrasounds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              1º Tri: {groupedByTrimester.first.length}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              2º Tri: {groupedByTrimester.second.length}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              3º Tri: {groupedByTrimester.third.length}
            </Badge>
            {favorites.length > 0 && (
              <Badge variant="outline" className="gap-1 text-red-500 border-red-200">
                <Heart className="h-3 w-3 fill-current" />
                {favorites.length} favorito(s)
              </Badge>
            )}
          </div>
        )}

        {/* Tabs by Trimester */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos ({ultrasounds.length})</TabsTrigger>
            <TabsTrigger value="first">1º Trimestre</TabsTrigger>
            <TabsTrigger value="second">2º Trimestre</TabsTrigger>
            <TabsTrigger value="third">3º Trimestre</TabsTrigger>
            {favorites.length > 0 && (
              <TabsTrigger value="favorites" className="gap-1">
                <Heart className="h-3 w-3" />
                Favoritos
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <UltrasoundTimeline ultrasounds={ultrasounds} />
          </TabsContent>

          <TabsContent value="first" className="mt-4">
            <UltrasoundTimeline ultrasounds={groupedByTrimester.first} />
          </TabsContent>

          <TabsContent value="second" className="mt-4">
            <UltrasoundTimeline ultrasounds={groupedByTrimester.second} />
          </TabsContent>

          <TabsContent value="third" className="mt-4">
            <UltrasoundTimeline ultrasounds={groupedByTrimester.third} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <UltrasoundTimeline ultrasounds={favorites} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
