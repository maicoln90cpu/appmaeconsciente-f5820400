/**
 * @fileoverview Utilitários para configuração de canais Supabase Realtime
 * @module lib/realtime-utils
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const log = logger.scoped("realtime");

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface RealtimeSubscriptionConfig {
  channelName: string;
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  schema?: string;
  onPayload: (payload: unknown) => void;
  onError?: (error: Error) => void;
}

interface MultiTableConfig {
  table: string;
  event: RealtimeEvent;
  filter?: string;
  onPayload: (payload: unknown) => void;
}

/**
 * Cria uma subscription realtime com configurações padronizadas
 */
export function createRealtimeSubscription({
  channelName,
  table,
  event = "*",
  filter,
  schema = "public",
  onPayload,
  onError,
}: RealtimeSubscriptionConfig) {
  log.debug(`Creating realtime subscription`, { channelName, table, event, filter });

  const channelConfig = {
    event,
    schema,
    table,
    ...(filter ? { filter } : {}),
  };

  const channel = supabase
    .channel(channelName)
    .on("postgres_changes" as const, channelConfig as any, (payload: unknown) => {
      try {
        onPayload(payload);
      } catch (error) {
        log.error(`Error processing realtime payload`, error, { channelName, table });
        onError?.(error as Error);
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        log.debug(`Subscribed to channel`, { channelName });
      } else if (status === "CHANNEL_ERROR") {
        log.error(`Channel error`, new Error(`Channel ${channelName} error`));
      }
    });

  return {
    channel,
    unsubscribe: () => {
      log.debug(`Unsubscribing from channel`, { channelName });
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Cria uma subscription realtime para múltiplas tabelas/eventos
 */
export function createMultiTableSubscription(
  channelName: string,
  configs: MultiTableConfig[],
  schema = "public"
) {
  log.debug(`Creating multi-table subscription`, { channelName, tables: configs.map(c => c.table) });

  let channel = supabase.channel(channelName);

  configs.forEach(({ table, event, filter, onPayload }) => {
    const config = {
      event,
      schema,
      table,
      ...(filter ? { filter } : {}),
    };

    channel = channel.on("postgres_changes" as const, config as any, (payload: unknown) => {
      try {
        onPayload(payload);
      } catch (error) {
        log.error(`Error processing multi-table payload`, error, { channelName, table });
      }
    });
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      log.debug(`Subscribed to multi-table channel`, { channelName });
    }
  });

  return {
    channel,
    unsubscribe: () => {
      log.debug(`Unsubscribing from multi-table channel`, { channelName });
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Cria filtro de user_id para subscriptions seguras
 */
export function createUserFilter(userId: string): string {
  return `user_id=eq.${userId}`;
}

/**
 * Hook helper para cleanup de subscriptions
 */
export function cleanupSubscription(subscription: { unsubscribe: () => void } | null) {
  subscription?.unsubscribe();
}
