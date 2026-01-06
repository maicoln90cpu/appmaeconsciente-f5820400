/**
 * Accessibility utilities and components
 * Provides ARIA helpers and screen reader announcements
 */

import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    let region = document.getElementById("aria-live-region") as HTMLDivElement;
    
    if (!region) {
      region = document.createElement("div");
      region.id = "aria-live-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      region.className = "sr-only";
      document.body.appendChild(region);
    }
    
    regionRef.current = region;

    return () => {
      // Cleanup not needed as the region is shared
    };
  }, []);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (regionRef.current) {
      regionRef.current.setAttribute("aria-live", priority);
      regionRef.current.textContent = "";
      // Force reflow
      void regionRef.current.offsetWidth;
      regionRef.current.textContent = message;
    }
  }, []);

  return { announce };
}

/**
 * Hook for managing focus trap
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore previous focus
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for keyboard navigation in lists
 */
export function useArrowNavigation<T extends HTMLElement>(
  items: React.RefObject<T>[],
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = "vertical", loop = true, onSelect } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal = orientation === "horizontal" || orientation === "both";

      let newIndex = index;
      let handled = false;

      if ((e.key === "ArrowDown" && isVertical) || (e.key === "ArrowRight" && isHorizontal)) {
        newIndex = index + 1;
        handled = true;
      } else if ((e.key === "ArrowUp" && isVertical) || (e.key === "ArrowLeft" && isHorizontal)) {
        newIndex = index - 1;
        handled = true;
      } else if (e.key === "Home") {
        newIndex = 0;
        handled = true;
      } else if (e.key === "End") {
        newIndex = items.length - 1;
        handled = true;
      } else if (e.key === "Enter" || e.key === " ") {
        onSelect?.(index);
        e.preventDefault();
        return;
      }

      if (handled) {
        e.preventDefault();

        if (loop) {
          newIndex = ((newIndex % items.length) + items.length) % items.length;
        } else {
          newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
        }

        currentIndex.current = newIndex;
        items[newIndex]?.current?.focus();
      }
    },
    [items, orientation, loop, onSelect]
  );

  return { handleKeyDown, currentIndex };
}

/**
 * Skip to main content link props
 */
export interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

/**
 * Accessible loading state wrapper
 */
export interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}

export function LoadingWrapper({
  loading,
  children,
  loadingMessage = "Carregando...",
  className,
}: LoadingWrapperProps) {
  const { announce } = useAnnounce();

  useEffect(() => {
    if (loading) {
      announce(loadingMessage);
    }
  }, [loading, loadingMessage, announce]);

  return (
    <div
      className={className}
      aria-busy={loading}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

/**
 * Generates ARIA label for data grids
 */
export function generateGridAriaLabel(
  tableName: string,
  rowCount: number,
  columnCount: number
): string {
  return `${tableName}: ${rowCount} linha${rowCount !== 1 ? "s" : ""}, ${columnCount} coluna${columnCount !== 1 ? "s" : ""}`;
}

/**
 * Generates ARIA description for form fields
 */
export function generateFieldDescription(
  required?: boolean,
  minLength?: number,
  maxLength?: number,
  pattern?: string
): string {
  const parts: string[] = [];
  
  if (required) parts.push("Campo obrigatório");
  if (minLength) parts.push(`Mínimo ${minLength} caracteres`);
  if (maxLength) parts.push(`Máximo ${maxLength} caracteres`);
  if (pattern) parts.push(pattern);
  
  return parts.join(". ");
}

/**
 * Format date for screen readers
 */
export function formatDateForSR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time for screen readers
 */
export function formatTimeForSR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format duration for screen readers
 */
export function formatDurationForSR(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minuto${minutes !== 1 ? "s" : ""}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = `${hours} hora${hours !== 1 ? "s" : ""}`;
  if (remainingMinutes > 0) {
    result += ` e ${remainingMinutes} minuto${remainingMinutes !== 1 ? "s" : ""}`;
  }
  
  return result;
}
