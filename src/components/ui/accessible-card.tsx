/**
 * Accessible Card component wrapper
 * Enhances cards with proper ARIA attributes and keyboard support
 */

import { forwardRef, useCallback, KeyboardEvent } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { cn } from '@/lib/utils';

export interface AccessibleCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  isInteractive?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  (
    {
      title,
      description,
      isInteractive = false,
      isSelected = false,
      onSelect,
      headerAction,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (isInteractive && onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      },
      [isInteractive, onSelect]
    );

    return (
      <Card
        ref={ref}
        className={cn(
          isInteractive && 'cursor-pointer hover:shadow-md transition-shadow',
          isSelected && 'ring-2 ring-primary',
          className
        )}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-pressed={isInteractive ? isSelected : undefined}
        onClick={isInteractive ? onSelect : undefined}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {headerAction && <div aria-label="Ações do card">{headerAction}</div>}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';
