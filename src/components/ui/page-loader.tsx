/**
 * @fileoverview Componente de loading skeleton para Suspense
 * @module components/ui/page-loader
 * 
 * Usado como fallback do Suspense para lazy loaded pages.
 * Mostra um skeleton que representa a estrutura da página.
 */

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loader minimalista para páginas - apenas spinner central
 */
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

/**
 * Skeleton para página de dashboard com cards
 */
export const DashboardSkeleton = () => (
  <div className="container py-6 space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 rounded-xl border bg-card">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    
    {/* Content area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton para página de listagem (tabela)
 */
export const TableSkeleton = () => (
  <div className="container py-6 space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    
    {/* Table skeleton */}
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
          {[...Array(5)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton para página de comunidade (feed)
 */
export const FeedSkeleton = () => (
  <div className="container py-6 max-w-2xl space-y-6">
    <Skeleton className="h-8 w-48" />
    
    {/* Post composer skeleton */}
    <div className="p-4 rounded-xl border bg-card">
      <Skeleton className="h-20 w-full" />
    </div>
    
    {/* Posts skeleton */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 rounded-xl border bg-card space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    ))}
  </div>
);
