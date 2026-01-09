import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardBebeStats24hProps {
  feedingCount: number;
  totalFeedingTime: number;
  sleepCount: number;
  totalSleepTime: number;
  averageSleepDuration: number;
}

export const DashboardBebeStats24h = ({
  feedingCount,
  totalFeedingTime,
  sleepCount,
  totalSleepTime,
  averageSleepDuration
}: DashboardBebeStats24hProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total de Mamadas (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{feedingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalFeedingTime} minutos no total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Total de Sonecas (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{sleepCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.floor(totalSleepTime / 60)}h {totalSleepTime % 60}min no total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Média de Sono</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {Math.floor(averageSleepDuration / 60)}h {averageSleepDuration % 60}min
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Por soneca
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
