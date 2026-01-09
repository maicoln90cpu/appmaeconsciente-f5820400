import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnxovalItem, Category } from "@/types/enxoval";
import { calculateTotals, formatCurrency } from "@/lib/calculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingDown, TrendingUp, ShoppingCart, CheckCircle2, Package, Sparkles, Ruler } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClothingSizeCalculator } from "@/components/enxoval/ClothingSizeCalculator";

interface DashboardTabProps {
  items: EnxovalItem[];
  budget: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.2)'];

export const DashboardTab = ({ items, budget }: DashboardTabProps) => {
  const totals = calculateTotals(items);
  
  const categoryData = items.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) {
      acc[cat] = { planned: 0, paid: 0 };
    }
    acc[cat].planned += item.subtotalPlanned;
    acc[cat].paid += item.subtotalPaid;
    return acc;
  }, {} as Record<Category, { planned: number; paid: number }>);

  const chartData = Object.entries(categoryData).map(([category, values]) => ({
    category,
    planejado: values.planned,
    pago: values.paid
  }));

  const statusData = [
    { name: 'A comprar', value: items.filter(i => i.status === 'A comprar').length },
    { name: 'Comprado', value: items.filter(i => i.status === 'Comprado').length }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Mensagem Motivacional + Size Calculator */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Alert className="border-primary/30 bg-primary/5 flex-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertDescription className="text-base">
            Cada escolha consciente é um passo rumo a uma maternidade mais leve 💕
          </AlertDescription>
        </Alert>
        <ClothingSizeCalculator />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(budget)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Definido para o enxoval
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Planejado</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalPlanned)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todos os itens planejados
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.itemsBought} itens comprados
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${totals.totalSavings >= 0 ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
            {totals.totalSavings >= 0 ? (
              <TrendingDown className="h-4 w-4 text-success" />
            ) : (
              <TrendingUp className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(totals.totalSavings))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.savingsPercentage.toFixed(1)}% {totals.totalSavings >= 0 ? 'economizado' : 'gasto a mais'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Pendentes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.itemsToBuy}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ainda precisam ser comprados
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.length > 0 ? Math.round((totals.itemsBought / items.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              dos itens já comprados
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Supérfluos Evitados</CardTitle>
            <Sparkles className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totals.superfluosEvitados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Economia potencial: {formatCurrency(totals.economiaPotencialSuperfluos)}
            </p>
            <p className="text-xs text-success font-medium mt-2">
              Escolhas inteligentes!
            </p>
          </CardContent>
        </Card>
      </div>

      {totals.totalSavings > 0 && (
        <Alert className="border-success/30 bg-success/5">
          <Sparkles className="h-4 w-4 text-success" />
          <AlertDescription className="text-base text-success font-medium">
            🎉 Parabéns! Você já economizou {formatCurrency(totals.totalSavings)} com suas escolhas conscientes!
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gasto por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Bar dataKey="planejado" fill="hsl(var(--primary))" name="Planejado" />
                <Bar dataKey="pago" fill="hsl(var(--accent))" name="Pago" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasto por Categoria (Pizza)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, pago }) => `${category}: ${formatCurrency(pago)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="pago"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé do Dashboard */}
      <div className="text-center py-4 text-muted-foreground italic">
        "O enxoval perfeito é aquele que cabe na sua rotina, no seu orçamento e no seu coração." 💗
      </div>
    </div>
  );
};
