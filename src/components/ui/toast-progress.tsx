import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToastProgressProps {
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export const ToastProgress = React.forwardRef<HTMLDivElement, ToastProgressProps>(
  ({ duration = 5000, className, onComplete }, ref) => {
    const [progress, setProgress] = React.useState(100);

    React.useEffect(() => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          onComplete?.();
        }
      }, 16);

      return () => clearInterval(interval);
    }, [duration, onComplete]);

    return (
      <div
        ref={ref}
        className={cn(
          'absolute bottom-0 left-0 h-1 bg-primary/30 rounded-b-lg overflow-hidden w-full',
          className
        )}
      >
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }
);

ToastProgress.displayName = 'ToastProgress';
