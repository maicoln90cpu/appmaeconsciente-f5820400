import { AlertCircle, CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

/**
 * Configurações centralizadas de status e prioridade para tickets.
 * Usado por: TicketManagement (admin), TicketList (user), TicketDetail (user).
 */

// ─── Status ───────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface StatusConfig {
  label: string;
  badgeVariant: "destructive" | "default" | "secondary" | "outline";
  dotColor: string;
  icon: LucideIcon;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  open: { label: "Aberto", badgeVariant: "destructive", dotColor: "bg-blue-500", icon: Clock },
  in_progress: { label: "Em Progresso", badgeVariant: "default", dotColor: "bg-yellow-500", icon: AlertCircle },
  resolved: { label: "Resolvido", badgeVariant: "secondary", dotColor: "bg-green-500", icon: CheckCircle2 },
  closed: { label: "Fechado", badgeVariant: "outline", dotColor: "bg-gray-500", icon: XCircle },
};

export const getTicketStatusLabel = (status: string): string =>
  TICKET_STATUS_CONFIG[status as TicketStatus]?.label ?? status;

export const getTicketStatusBadgeVariant = (status: string) =>
  TICKET_STATUS_CONFIG[status as TicketStatus]?.badgeVariant ?? "outline";

export const getTicketStatusDotColor = (status: string) =>
  TICKET_STATUS_CONFIG[status as TicketStatus]?.dotColor ?? "bg-gray-500";

export const getTicketStatusIcon = (status: string) =>
  TICKET_STATUS_CONFIG[status as TicketStatus]?.icon ?? Clock;

// ─── Prioridade ───────────────────────────────────────

export type TicketPriority = "low" | "medium" | "high";

interface PriorityConfig {
  label: string;
  badgeVariant: "destructive" | "default" | "secondary" | "outline";
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  low: { label: "Baixa", badgeVariant: "secondary" },
  medium: { label: "Média", badgeVariant: "default" },
  high: { label: "Alta", badgeVariant: "destructive" },
};

export const getTicketPriorityLabel = (priority: string): string =>
  TICKET_PRIORITY_CONFIG[priority as TicketPriority]?.label ?? priority;

export const getTicketPriorityBadgeVariant = (priority: string) =>
  TICKET_PRIORITY_CONFIG[priority as TicketPriority]?.badgeVariant ?? "outline";

// ─── Suggestion Status ────────────────────────────────

export type SuggestionStatus = "pending" | "approved" | "in_development" | "implemented" | "rejected";

export const SUGGESTION_STATUS_CONFIG: Record<SuggestionStatus, { label: string; badgeVariant: "secondary" | "default" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", badgeVariant: "secondary" },
  approved: { label: "Aprovada", badgeVariant: "default" },
  in_development: { label: "Em Desenvolvimento", badgeVariant: "outline" },
  implemented: { label: "Implementada", badgeVariant: "default" },
  rejected: { label: "Rejeitada", badgeVariant: "destructive" },
};

export const getSuggestionStatusLabel = (status: string) =>
  SUGGESTION_STATUS_CONFIG[status as SuggestionStatus]?.label ?? status;

export const getSuggestionStatusBadgeVariant = (status: string) =>
  SUGGESTION_STATUS_CONFIG[status as SuggestionStatus]?.badgeVariant ?? "secondary";
