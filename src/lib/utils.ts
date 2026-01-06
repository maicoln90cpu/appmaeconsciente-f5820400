/**
 * @fileoverview Funções utilitárias gerais do projeto
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS condicionalmente e resolve conflitos do Tailwind
 * 
 * Utiliza `clsx` para composição condicional e `tailwind-merge` para
 * resolver conflitos de classes utilitárias (ex: p-2 e p-4).
 * 
 * @param inputs - Classes CSS, objetos condicionais ou arrays
 * @returns String com classes combinadas e sem conflitos
 * 
 * @example
 * ```tsx
 * // Uso básico
 * cn('p-4', 'mt-2') // => 'p-4 mt-2'
 * 
 * // Com condicionais
 * cn('base', isActive && 'bg-blue-500', { 'opacity-50': disabled })
 * 
 * // Resolve conflitos (última classe vence)
 * cn('p-2', 'p-4') // => 'p-4'
 * cn('text-red-500', 'text-blue-500') // => 'text-blue-500'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
