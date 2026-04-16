/**
 * OptimizedImage component with lazy loading, blur placeholder, and responsive sizing
 */
import { useState, useRef, useEffect, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'onLoad' | 'onError'
> {
  /** Fallback image URL if the main image fails to load */
  fallbackSrc?: string;
  /** Enable lazy loading with IntersectionObserver */
  lazy?: boolean;
  /** Show blur placeholder while loading */
  showPlaceholder?: boolean;
  /** Aspect ratio for the container (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Priority loading - skip lazy loading */
  priority?: boolean;
}

const DEFAULT_FALLBACK = '/placeholder.svg';

/**
 * Performance-optimized image component
 *
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur-up placeholder effect
 * - Fallback image on error
 * - Native loading="lazy" support
 * - Responsive sizing hints
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/avatar.jpg"
 *   alt="User avatar"
 *   aspectRatio="1/1"
 *   className="rounded-full"
 * />
 * ```
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  lazy = true,
  showPlaceholder = true,
  aspectRatio,
  priority = false,
  className,
  style,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(priority ? src : undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    if (priority || !lazy) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src, lazy, priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  // Handle image error - fallback to default
  const handleError = () => {
    setHasError(true);
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (priority || !lazy) {
      setImageSrc(src);
    }
  }, [src, priority, lazy]);

  const containerStyles: React.CSSProperties = {
    ...style,
    aspectRatio: aspectRatio,
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', aspectRatio && 'w-full', className)}
      style={containerStyles}
    >
      {/* Placeholder skeleton */}
      {showPlaceholder && !isLoaded && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            'transition-opacity duration-300',
            isLoaded && 'opacity-0'
          )}
        />
      )}

      {/* Actual image */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover',
            'transition-opacity duration-300',
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100'
          )}
          {...props}
        />
      )}

      {/* Error indicator */}
      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <span className="text-xs text-muted-foreground">Imagem indisponível</span>
        </div>
      )}
    </div>
  );
});

/**
 * Preload an image programmatically
 * Useful for preloading hero images or images that will be displayed soon
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get responsive image srcset for different device sizes
 * Useful when working with image CDNs that support size parameters
 */
export function getResponsiveSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 768, 1024, 1280]
): string {
  // This is a placeholder - in production, you'd integrate with your image CDN
  // Example for Cloudinary: `${baseSrc}?w=${width}`
  return widths.map(width => `${baseSrc}?w=${width} ${width}w`).join(', ');
}
