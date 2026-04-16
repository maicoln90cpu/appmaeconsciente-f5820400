import { logger } from '@/lib/logger';

import { supabase } from '@/integrations/supabase/client';

// VAPID public key - generate a pair for production
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert a base64 string to a Uint8Array for use with push subscriptions
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    logger.warn('Notifications not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    logger.info('Notification permission result', { data: { permission } });
    return permission;
  } catch (error) {
    logger.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    logger.warn('Push notifications not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    logger.warn('VAPID public key not configured');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await (registration as any).pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      logger.info('Push subscription created');
    }

    // Save subscription to database
    await savePushSubscription(subscription);

    return subscription;
  } catch (error) {
    logger.error('Error subscribing to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removePushSubscription(subscription.endpoint);
      logger.info('Push subscription removed');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Save push subscription to the database
 */
async function savePushSubscription(subscription: PushSubscription): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.warn('No user logged in, cannot save push subscription');
    return;
  }

  const subscriptionData = subscription.toJSON();

  // Use raw SQL via rpc or handle gracefully if table doesn't exist yet
  const { error } = await supabase.from('push_subscriptions' as any).upsert(
    {
      user_id: user.id,
      endpoint: subscriptionData.endpoint,
      p256dh: subscriptionData.keys?.p256dh,
      auth: subscriptionData.keys?.auth,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,endpoint',
    }
  );

  if (error) {
    logger.error('Error saving push subscription:', error);
  }
}

/**
 * Remove push subscription from the database
 */
async function removePushSubscription(endpoint: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('push_subscriptions' as any)
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    logger.error('Error removing push subscription:', error);
  }
}

/**
 * Show a local notification (for when app is in foreground)
 */
export function showLocalNotification(title: string, options?: NotificationOptions): void {
  if (getNotificationPermission() !== 'granted') {
    logger.warn('Notification permission not granted');
    return;
  }

  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    logger.error('Error showing notification:', error);
  }
}

/**
 * Schedule a local notification
 */
export function scheduleNotification(
  title: string,
  delayMs: number,
  options?: NotificationOptions
): number {
  const timeoutId = window.setTimeout(() => {
    showLocalNotification(title, options);
  }, delayMs);

  return timeoutId;
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}
