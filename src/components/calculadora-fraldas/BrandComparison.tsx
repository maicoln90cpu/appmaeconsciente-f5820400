import { useState, useMemo, useEffect } from 'react';

import { TrendingDown, TrendingUp, Award, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { DiaperEstimate } from '@/pages/CalculadoraFraldas';

interface Props {
  estimate: DiaperEstimate | null;
}

type SizeKey = 'RN' | 'P' | 'M' | 'G' | 'XG';

interface BrandData {
  name: string;
  pricePerUnit: Record<SizeKey, number>;
  quality: string;
}

const DEFAULT_BRANDS: BrandData[] = [
  {
    name: 'Pampers Premium Care',
    pricePerUnit: { RN: 0.85, P: 0.9, M: 0.95, G: 1.0, XG: 1.1 },
    quality: 'premium',
  },
  {
    name: 'Huggies Supreme Care',
    pricePerUnit: { RN: 0.8, P: 0.85, M: 0.9, G: 0.95, XG: 1.05 },
    quality: 'premium',
  },
  {
    name: 'MamyPoko',
    pricePerUnit: { RN: 0.65, P: 0.7, M: 0.75, G: 0.8, XG: 0.9 },
    quality: 'standard',
  },
  {
    name: 'Pom Pom Derma Protek',
    pricePerUnit: { RN: 0.7, P: 0.75, M: 0.8, G: 0.85, XG: 0.95 },
    quality: 'standard',
  },
  {
    name: 'Pampers Supersec',
    pricePerUnit: { RN: 0.55, P: 0.6, M: 0.65, G: 0.7, XG: 0.8 },
    quality: 'economic',
  },
  {
    name: 'Cremer Disney',
    pricePerUnit: { RN: 0.5, P: 0.55, M: 0.6, G: 0.65, XG: 0.75 },
    quality: 'economic',
  },
];

const STORAGE_KEY = 'fraldas_custom_prices';

export const BrandComparison = ({ estimate }: Props) => {
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Load custom prices from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomPrices(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const getPrice = (brandName: string, size: SizeKey): number => {
    const key = `${brandName}_${size}`;
    if (customPrices[key] !== undefined) return customPrices[key];
    const brand = DEFAULT_BRANDS.find(b => b.name === brandName);
    return brand?.pricePerUnit[size] ?? 0;
  };

  const isCustom = (brandName: string, size: SizeKey): boolean => {
    return customPrices[`${brandName}_${size}`] !== undefined;
  };

  const handlePriceClick = (brandName: string, size: SizeKey) => {
    const key = `${brandName}_${size}`;
    setEditingCell(key);
    setEditValue(getPrice(brandName, size).toFixed(2));
  };

  const savePrice = (brandName: string, size: SizeKey) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value <= 0) {
      setEditingCell(null);
      return;
    }
    const key = `${brandName}_${size}`;
    const updated = { ...customPrices, [key]: value };
    setCustomPrices(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditingCell(null);
    toast.success('Preço atualizado!');
  };

  const resetAllPrices = () => {
    setCustomPrices({});
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Preços restaurados para os valores padrão');
  };

  const hasCustomPrices = Object.keys(customPrices).length > 0;

  const comparison = useMemo(() => {
    if (!estimate) return [];

    return DEFAULT_BRANDS.map(brand => {
      let totalCost = 0;

      estimate.estimates.forEach(est => {
        const size = est.size as SizeKey;
        if (selectedSize === 'all' || selectedSize === size) {
          totalCost += est.monthlyQty * getPrice(brand.name, size);
        }
      });

      const monthlyCost = totalCost / estimate.calculationPeriod;

      return {
        brand: brand.name,
        quality: brand.quality,
        monthlyCost,
        totalCost,
        annualCost: monthlyCost * 12,
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [estimate, selectedSize, customPrices]);

  const savings = useMemo(() => {
    if (comparison.length < 2) return 0;
    return comparison[comparison.length - 1].totalCost - comparison[0].totalCost;
  }, [comparison]);

  if (!estimate) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Calcule uma estimativa acima para ver a comparação de marcas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro + Reset */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Label htmlFor="sizeFilter">Filtrar por tamanho:</Label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger id="sizeFilter" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estimate.estimates.map(est => (
                <SelectItem key={est.size} value={est.size}>
                  Tamanho {est.size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasCustomPrices && (
          <Button variant="outline" size="sm" onClick={resetAllPrices} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar preços
          </Button>
        )}
      </div>

      {/* Dica de edição */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
        <Pencil className="h-4 w-4 shrink-0" />
        <span>
          Clique em qualquer preço na tabela abaixo para editá-lo com os valores da sua região.
        </span>
      </div>

      {/* Tabela de Preços por Unidade */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              {(['RN', 'P', 'M', 'G', 'XG'] as SizeKey[]).map(size => (
                <TableHead key={size} className="text-center text-xs">
                  {size}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEFAULT_BRANDS.map(brand => (
              <TableRow key={brand.name}>
                <TableCell className="font-medium text-sm">{brand.name}</TableCell>
                {(['RN', 'P', 'M', 'G', 'XG'] as SizeKey[]).map(size => {
                  const key = `${brand.name}_${size}`;
                  const editing = editingCell === key;
                  const custom = isCustom(brand.name, size);

                  return (
                    <TableCell key={size} className="text-center p-1">
                      {editing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => savePrice(brand.name, size)}
                          onKeyDown={e => e.key === 'Enter' && savePrice(brand.name, size)}
                          className="h-8 w-20 mx-auto text-center text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handlePriceClick(brand.name, size)}
                          className={`cursor-pointer px-2 py-1 rounded text-sm hover:bg-primary/10 transition-colors ${
                            custom ? 'font-semibold text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          R${getPrice(brand.name, size).toFixed(2)}
                          {custom && <span className="text-[10px] ml-0.5">✎</span>}
                        </button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Tabela de Comparação */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead className="text-right">Custo Mensal</TableHead>
              <TableHead className="text-right">
                Custo Total ({estimate.calculationPeriod}m)
              </TableHead>
              <TableHead className="text-right">Custo Anual</TableHead>
              <TableHead className="text-center">Ranking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.map((item, index) => (
              <TableRow key={item.brand} className={index === 0 ? 'bg-success/10' : ''}>
                <TableCell className="font-medium">{item.brand}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.quality === 'premium'
                        ? 'default'
                        : item.quality === 'standard'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {item.quality === 'premium'
                      ? 'Premium'
                      : item.quality === 'standard'
                        ? 'Padrão'
                        : 'Econômica'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {item.monthlyCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {item.totalCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">R$ {item.annualCost.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  {index === 0 && (
                    <Badge className="bg-success">
                      <Award className="h-3 w-3 mr-1" />
                      Melhor
                    </Badge>
                  )}
                  {index === comparison.length - 1 && <Badge variant="outline">Mais cara</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Economia Destacada */}
      {savings > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingDown className="h-5 w-5" />
            <span className="font-semibold text-lg">Economia Potencial</span>
          </div>
          <p className="text-muted-foreground">
            Escolhendo <strong>{comparison[0].brand}</strong> em vez de{' '}
            <strong>{comparison[comparison.length - 1].brand}</strong>, você economiza{' '}
            <strong className="text-success">R$ {savings.toFixed(2)}</strong> em{' '}
            {estimate.calculationPeriod} meses!
          </p>
        </div>
      )}

      {/* Dica de Pacotes Grandes */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary mb-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold">Dica de Economia</span>
        </div>
        <p className="text-muted-foreground">
          Comprar pacotes maiores (mega, hiper) reduz o custo por fralda em até 30%. Planeje compras
          mensais em vez de semanais!
        </p>
      </div>
    </div>
  );
};
