import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Baby, Moon, Ruler, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

const quickActions = [
  {
    label: 'Mamada',
    icon: Baby,
    path: '/materiais/rastreador-amamentacao',
    color: 'bg-pink-500 dark:bg-pink-600',
  },
  {
    label: 'Sono',
    icon: Moon,
    path: '/materiais/diario-sono',
    color: 'bg-indigo-500 dark:bg-indigo-600',
  },
  {
    label: 'Crescimento',
    icon: Ruler,
    path: '/materiais/monitor-desenvolvimento',
    color: 'bg-emerald-500 dark:bg-emerald-600',
  },
  {
    label: 'Fraldas',
    icon: Droplets,
    path: '/materiais/calculadora-fraldas',
    color: 'bg-amber-500 dark:bg-amber-600',
  },
];

export const QuickRecordFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action buttons - fan out above FAB */}
      {isOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-3 animate-scale-in">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => handleAction(action.path)}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium text-white bg-foreground/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {action.label}
                </span>
                <div
                  className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+68px)] left-1/2 -translate-x-1/2 z-[70] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-transform duration-200 active:scale-95 md:hidden ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label={isOpen ? 'Fechar menu rápido' : 'Registro rápido'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </>
  );
};
