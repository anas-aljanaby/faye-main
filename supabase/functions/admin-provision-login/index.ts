import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AccountStatus = 'no_login' | 'pending_first_login' | 'active';

type CallerProfile = {
  id: string;
  organization_id: string;
  is_system_admin: boolean;
};

async function getCallerProfile(
  adminClient: ReturnType<typeof createClient>,
  authUserId: string
): Promise<CallerProfile | null> {
  const { data, error } = await adminClient
    .from('user_profiles')
    .select('id, organization_id, is_system_admin')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error || !data || !data.is_system_admin) {
    return null;
  }
  return data as CallerProfile;
}

function accountPayload(
  authUserId: string | null,
  email: string | null,
  lastSignInAt: string | null
): { status: AccountStatus; email: string | null; lastSignInAt: string | null } {
  if (!authUserId) {
    return { status: 'no_login', email: null, lastSignInAt: null };
  }
  if (!lastSignInAt) {
    return { status: 'pending_first_login', email, lastSignInAt: null };
  }
  return { status: 'active', email, lastSignInAt };
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
      console.error('Missing Supabase env');
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
      error: authErr,
    } = await userClient.auth.getUser();

    if (authErr || !user) {
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
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action = body.action as string;

    if (action === 'create') {
      const profileId = body.profileId as string | undefined;
      const email = (body.email as string | undefined)?.trim().toLowerCase();
      const password = body.password as string | undefined;

      if (!profileId || !email || !password) {
        return new Response(JSON.stringify({ error: 'invalid_body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: 'password_too_short' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: target, error: targetErr } = await adminClient
        .from('user_profiles')
        .select('id, organization_id, role, auth_user_id')
        .eq('id', profileId)
        .maybeSingle();

      if (targetErr || !target) {
        return new Response(JSON.stringify({ error: 'profile_not_found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (target.organization_id !== caller.organization_id) {
        return new Response(JSON.stringify({ error: 'forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (target.role !== 'team_member' && target.role !== 'sponsor') {
        return new Response(JSON.stringify({ error: 'invalid_role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (target.auth_user_id) {
        return new Response(JSON.stringify({ error: 'already_has_login' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createErr || !created?.user) {
        const msg = createErr?.message?.toLowerCase() ?? '';
        if (msg.includes('already been registered') || msg.includes('already registered')) {
          return new Response(JSON.stringify({ error: 'email_taken' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('createUser', createErr);
        return new Response(JSON.stringify({ error: 'create_failed', message: createErr?.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newAuthId = created.user.id;

      const { error: updErr } = await adminClient
        .from('user_profiles')
        .update({ auth_user_id: newAuthId, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (updErr) {
        console.error('link profile', updErr);
        await adminClient.auth.admin.deleteUser(newAuthId);
        return new Response(JSON.stringify({ error: 'link_failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const payload = accountPayload(newAuthId, created.user.email ?? email, null);

      return new Response(
        JSON.stringify({
          ok: true,
          profileId,
          ...payload,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      const profileIds = body.profileIds as string[] | undefined;
      const singleId = body.profileId as string | undefined;
      const ids = Array.isArray(profileIds) && profileIds.length > 0
        ? profileIds
        : singleId
          ? [singleId]
          : [];

      if (ids.length === 0) {
        return new Response(JSON.stringify({ error: 'invalid_body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: rows, error: rowsErr } = await adminClient
        .from('user_profiles')
        .select('id, auth_user_id')
        .in('id', ids)
        .eq('organization_id', caller.organization_id);

      if (rowsErr) {
        console.error('status query', rowsErr);
        return new Response(JSON.stringify({ error: 'query_failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accounts: Record<
        string,
        { status: AccountStatus; email: string | null; lastSignInAt: string | null }
      > = {};

      for (const id of ids) {
        accounts[id] = { status: 'no_login', email: null, lastSignInAt: null };
      }

      for (const row of rows ?? []) {
        const aid = row.auth_user_id as string | null;
        if (!aid) {
          accounts[row.id] = accountPayload(null, null, null);
          continue;
        }
        const { data: uData, error: guErr } = await adminClient.auth.admin.getUserById(aid);
        if (guErr || !uData?.user) {
          accounts[row.id] = { status: 'no_login', email: null, lastSignInAt: null };
          continue;
        }
        const u = uData.user;
        accounts[row.id] = accountPayload(
          aid,
          u.email ?? null,
          u.last_sign_in_at ?? null
        );
      }

      return new Response(JSON.stringify({ accounts }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
