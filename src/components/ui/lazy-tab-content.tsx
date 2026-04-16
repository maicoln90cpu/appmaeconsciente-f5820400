import { Suspense, ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

interface LazyTabContentProps {
  children: ReactNode;
  fallbackHeight?: string;
}

/**
 * Wrapper component for lazy-loaded tab content with Suspense
 * Provides a consistent loading fallback while the lazy component loads
 */
export const LazyTabContent = ({ children, fallbackHeight = 'h-48' }: LazyTabContentProps) => (
  <Suspense
    fallback={
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className={`${fallbackHeight} w-full`} />
        <Skeleton className="h-24 w-full" />
      </div>
    }
  >
    {children}
  </Suspense>
);
