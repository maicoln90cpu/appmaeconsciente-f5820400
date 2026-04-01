import { 
  Baby, Moon, Ruler, ShoppingBag, Pill, Apple, Syringe, 
  Brain, Stethoscope, Droplets, Wrench, FileText, Heart,
  Calendar, Timer, ClipboardList, Home,
  type LucideIcon 
} from "lucide-react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string;
  is_free: boolean;
  price: number | null;
  category?: string | null;
}

interface ToolIconGridProps {
  products: Product[];
  hasAccess: (id: string) => boolean;
  isAdmin: boolean;
  onProductClick: (product: Product) => void;
}

const slugIconMap: Record<string, LucideIcon> = {
  "rastreador-amamentacao": Baby,
  "diario-sono": Moon,
  "monitor-desenvolvimento": Brain,
  "controle-enxoval": ShoppingBag,
  "calculadora-fraldas": Droplets,
  "mala-maternidade": FileText,
  "guia-alimentacao": Apple,
  "cartao-vacinacao": Syringe,
  "recuperacao-pos-parto": Heart,
  "ferramentas-gestacao": Stethoscope,
  "calculadora-semanas": Calendar,
  "checklist-documentos": ClipboardList,
  "checklist-quartinho": Home,
  "timer-mamada": Timer,
};

const slugColorMap: Record<string, string> = {
  "rastreador-amamentacao": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "diario-sono": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "monitor-desenvolvimento": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "controle-enxoval": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "calculadora-fraldas": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "mala-maternidade": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "guia-alimentacao": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "cartao-vacinacao": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "recuperacao-pos-parto": "bg-red-500/10 text-red-600 dark:text-red-400",
  "ferramentas-gestacao": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

export const ToolIconGrid = ({ products, hasAccess, isAdmin, onProductClick }: ToolIconGridProps) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {products.map((product) => {
        const Icon = slugIconMap[product.slug] || Wrench;
        const colorClass = slugColorMap[product.slug] || "bg-muted text-muted-foreground";
        const canAccess = product.is_free || hasAccess(product.id) || isAdmin;
        const shortTitle = product.title.replace(/^(Guia de |Controle de |Calculadora de |Rastreador de |Cartão de |Monitor de |Diário de |Ferramentas de |Recuperação )/, "");

        return (
          <button
            key={product.id}
            onClick={() => onProductClick(product)}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:bg-accent/50 active:scale-95 relative"
          >
            {/* Icon circle */}
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${colorClass} transition-transform group-hover:scale-105`}>
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
              {/* Lock overlay */}
              {!canAccess && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Label */}
            <span className="text-[11px] sm:text-xs font-medium text-center leading-tight line-clamp-2 text-foreground/80 group-hover:text-foreground min-h-[28px]">
              {shortTitle}
            </span>

            {/* Free badge */}
            {product.is_free && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 absolute top-1 right-1">
                Grátis
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};
