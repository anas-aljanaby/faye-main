/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import webpush from 'npm:web-push';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationType =
  | 'payment_due'
  | 'payment_overdue'
  | 'payment_received'
  | 'payment_reminder'
  | 'payment_status_changed'
  | 'message_received'
  | 'financial_transaction_pending_approval'
  | 'financial_transaction_approved'
  | 'financial_transaction_rejected'
  | 'general';

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  push_sent_at: string | null;
  action_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, unknown> | null;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
};

function getPushKeys() {
  const subject = Deno.env.get('WEB_PUSH_SUBJECT');
  const publicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY');
  const privateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY');

  if (!subject || !publicKey || !privateKey) {
    return null;
  }

  return { subject, publicKey, privateKey };
}

function toAppUrl(actionUrl: string | null | undefined): string {
  const path = actionUrl && actionUrl.startsWith('/') ? actionUrl : '/';
  return `/#${path}`;
}

function buildPushPayload(notification: NotificationRow) {
  return JSON.stringify({
    title: notification.title,
    body: notification.body,
    tag: notification.related_entity_id ?? `notification:${notification.id}`,
    icon: '/icons/icon-192.svg',
    badge: '/icons/favicon.svg',
    data: {
      notificationId: notification.id,
      actionUrl: notification.action_url ?? '/',
      relatedEntityType: notification.related_entity_type,
      relatedEntityId: notification.related_entity_id,
      metadata: notification.metadata ?? {},
    },
  });
}

function describePushError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'body' in error) {
    return String((error as { body?: unknown }).body ?? 'push_failed');
  }

  return String(error);
}

function shouldDisableSubscription(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = Number((error as { statusCode?: unknown }).statusCode);
    return statusCode === 404 || statusCode === 410;
  }

  return false;
}

async function sendPushNotifications(
  adminClient: any,
  notification: NotificationRow,
  subscriptions: PushSubscriptionRow[]
): Promise<{ delivered: boolean; error: string | null }> {
  if (subscriptions.length === 0) {
    return { delivered: false, error: null };
  }

  const vapidKeys = getPushKeys();
  if (!vapidKeys) {
    return { delivered: false, error: 'web_push_not_configured' };
  }

  webpush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

  const payload = buildPushPayload(notification);
  const now = new Date().toISOString();
  let delivered = false;
  let lastError: string | null = null;

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expiration_time
              ? new Date(subscription.expiration_time).getTime()
              : null,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );

        delivered = true;
        await adminClient
          .from('push_subscriptions')
          .update({
            last_seen_at: now,
            last_failure_at: null,
            failure_reason: null,
            disabled_at: null,
          })
          .eq('id', subscription.id);
      } catch (error) {
        lastError = describePushError(error);
        const nextState: Record<string, string | null> = {
          last_failure_at: now,
          failure_reason: lastError,
        };

        if (shouldDisableSubscription(error)) {
          nextState.disabled_at = now;
        }

        await adminClient.from('push_subscriptions').update(nextState).eq('id', subscription.id);
      }
    })
  );

  return { delivered, error: lastError };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const notificationId = body.notification_id as string | undefined;
    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'notification_id_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: notification, error: notificationError } = await adminClient
      .from('notifications')
      .select(
        'id, user_id, type, title, body, push_sent_at, action_url, related_entity_type, related_entity_id, metadata'
      )
      .eq('id', notificationId)
      .maybeSingle();

    if (notificationError || !notification) {
      return new Response(JSON.stringify({ error: 'notification_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const n = notification as NotificationRow;
    const shouldAttemptPush = !n.push_sent_at;
    let pushSentAt: string | null = null;
    let lastPushError: string | null = null;

    if (shouldAttemptPush) {
      const { data: subscriptions, error: subscriptionError } = await adminClient
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth, expiration_time')
        .eq('user_id', n.user_id)
        .is('disabled_at', null);

      if (!subscriptionError && subscriptions && subscriptions.length > 0) {
        const pushResult = await sendPushNotifications(
          adminClient,
          {
            ...n,
            action_url: n.action_url ?? '/',
            metadata: n.metadata ?? { notificationType: n.type, actionUrl: toAppUrl(n.action_url) },
          },
          subscriptions as PushSubscriptionRow[]
        );

        if (pushResult.delivered) {
          pushSentAt = new Date().toISOString();
          lastPushError = null;
        } else {
          lastPushError = pushResult.error;
        }
      }
    }

    if (pushSentAt || lastPushError !== null) {
      await adminClient
        .from('notifications')
        .update({
          ...(pushSentAt ? { push_sent_at: pushSentAt } : {}),
          last_push_error: lastPushError,
        })
        .eq('id', n.id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        push_sent_at: pushSentAt,
        push_error: lastPushError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('notification-dispatcher error', error);
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
