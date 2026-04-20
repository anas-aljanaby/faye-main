/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CallerProfile = {
  id: string;
  organization_id: string;
};

type PushSubscriptionBody = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

async function getCallerProfile(
  adminClient: any,
  authUserId: string
): Promise<CallerProfile | null> {
  const { data, error } = await adminClient
    .from('user_profiles')
    .select('id, organization_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CallerProfile;
}

function getExpirationIso(expirationTime?: number | null): string | null {
  if (typeof expirationTime !== 'number' || !Number.isFinite(expirationTime)) {
    return null;
  }

  try {
    return new Date(expirationTime).toISOString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const caller = await getCallerProfile(adminClient, user.id);
    if (!caller) {
      return new Response(JSON.stringify({ error: 'profile_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action as string | undefined;

    if (action === 'upsert') {
      const subscription = (body.subscription ?? {}) as PushSubscriptionBody;
      const endpoint = subscription.endpoint?.trim();
      const p256dh = subscription.keys?.p256dh?.trim();
      const auth = subscription.keys?.auth?.trim();

      if (!endpoint || !p256dh || !auth) {
        return new Response(JSON.stringify({ error: 'invalid_body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const now = new Date().toISOString();
      const { error } = await adminClient
        .from('push_subscriptions')
        .upsert(
          {
            user_id: caller.id,
            organization_id: caller.organization_id,
            endpoint,
            p256dh,
            auth,
            expiration_time: getExpirationIso(subscription.expirationTime),
            user_agent:
              typeof body.userAgent === 'string' && body.userAgent.trim().length > 0
                ? body.userAgent.trim().slice(0, 1024)
                : req.headers.get('user-agent') ?? null,
            installed_via_pwa: body.installedViaPwa !== false,
            last_seen_at: now,
            disabled_at: null,
            last_failure_at: null,
            failure_reason: null,
          },
          { onConflict: 'endpoint' }
        );

      if (error) {
        console.error('push subscription upsert failed', error);
        return new Response(JSON.stringify({ error: 'upsert_failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove') {
      const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
      if (!endpoint) {
        return new Response(JSON.stringify({ error: 'invalid_body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await adminClient
        .from('push_subscriptions')
        .delete()
        .eq('user_id', caller.id)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('push subscription remove failed', error);
        return new Response(JSON.stringify({ error: 'remove_failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notification-subscriptions error', error);
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
