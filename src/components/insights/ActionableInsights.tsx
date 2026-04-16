import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, ArrowRight, AlertTriangle, Sparkles, TrendingUp, Search } from 'lucide-react';
import { useCrossModuleAnalytics, type Insight } from '@/hooks/useCrossModuleAnalytics';
import { cn } from '@/lib/utils';

interface ActionableInsightsProps {
  maxItems?: number;
  showTitle?: boolean;
}

export const ActionableInsights = ({ maxItems = 4, showTitle = true }: ActionableInsightsProps) => {
  const { loading, insights } = useCrossModuleAnalytics();

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayInsights = insights.slice(0, maxItems);

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      case 'achievement':
        return <Sparkles className="h-4 w-4" />;
      case 'pattern':
        return <Search className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTypeStyles = (type: Insight['type'], priority: Insight['priority']) => {
    if (type === 'warning') {
      return priority === 'high'
        ? 'bg-destructive/10 border-destructive/30 text-destructive'
        : 'bg-orange-500/10 border-orange-500/30 text-orange-600';
    }
    if (type === 'achievement') {
      return 'bg-green-500/10 border-green-500/30 text-green-600';
    }
    if (type === 'pattern') {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
    }
    return 'bg-primary/10 border-primary/30 text-primary';
  };

  const getPriorityBadge = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            Urgente
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="text-xs">
            Importante
          </Badge>
        );
      default:
        return null;
    }
  };

  if (displayInsights.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
              <span className="truncate">Insights Inteligentes</span>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-4 sm:py-6">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/30 mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground px-2">
              Continue registrando para receber insights!
            </p>
            <div className="flex flex-col xs:flex-row gap-2 justify-center mt-3 sm:mt-4">
              <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                <Link to="/materiais/rastreador-amamentacao">Registrar Mamada</Link>
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                <Link to="/materiais/diario-sono">Registrar Sono</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
            <span className="truncate">Insights Inteligentes</span>
            {insights.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                {insights.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2 sm:space-y-3">
        {displayInsights.map(insight => (
          <div
            key={insight.id}
            className={cn(
              'p-2.5 sm:p-3 rounded-lg border transition-all hover:shadow-sm',
              getTypeStyles(insight.type, insight.priority)
            )}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl shrink-0">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                  <p className="font-medium text-xs sm:text-sm truncate">{insight.title}</p>
                  {getPriorityBadge(insight.priority)}
                </div>
                <p className="text-xs sm:text-sm opacity-80 line-clamp-2">{insight.description}</p>
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1.5 sm:mt-2 h-6 sm:h-7 px-2 -ml-2 text-xs"
                    asChild
                  >
                    <Link to={insight.action.path}>
                      <span className="truncate">{insight.action.label}</span>
                      <ArrowRight className="h-3 w-3 ml-1 shrink-0" />
                    </Link>
                  </Button>
                )}
              </div>
              <div className="shrink-0 opacity-60">{getTypeIcon(insight.type)}</div>
            </div>
          </div>
        ))}

        {insights.length > maxItems && (
          <Button variant="ghost" className="w-full text-xs sm:text-sm" asChild>
            <Link to="/dashboard-bebe">
              Ver todos os {insights.length} insights
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 shrink-0" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
