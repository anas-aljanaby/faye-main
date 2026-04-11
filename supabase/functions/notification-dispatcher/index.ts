import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

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
  | 'general';

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  email_sent_at: string | null;
};

function buildEmailHtml(title: string, body: string, type: NotificationType): string {
  const accent = type === 'payment_overdue' ? '#dc2626' : type === 'payment_received' ? '#16a34a' : '#2563eb';
  return `
  <div dir="rtl" style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px;color:${accent};font-size:22px;">${title}</h2>
      <p style="margin:0 0 16px;color:#1f2937;line-height:1.8;font-size:16px;">${body}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="margin:0;color:#6b7280;font-size:13px;">
        هذا إشعار تلقائي من نظام فيء لإدارة الدفعات.
      </p>
    </div>
  </div>`;
}

async function sendWithResend(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Faye <noreply@faye.local>';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is missing');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error ${response.status}: ${text}`);
  }
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
      .select('id, user_id, type, title, body, email_sent_at')
      .eq('id', notificationId)
      .maybeSingle();

    if (notificationError || !notification) {
      return new Response(JSON.stringify({ error: 'notification_not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const n = notification as NotificationRow;
    if (n.email_sent_at) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_sent' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pref } = await adminClient
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', n.user_id)
      .maybeSingle();

    if (pref && pref.email_enabled === false) {
      return new Response(JSON.stringify({ ok: true, skipped: 'email_disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('auth_user_id')
      .eq('id', n.user_id)
      .maybeSingle();

    if (profileError || !profile?.auth_user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_auth_user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authUser = await adminClient.auth.admin.getUserById(profile.auth_user_id);
    const email = authUser.data?.user?.email;
    if (!email) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_email' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = buildEmailHtml(n.title, n.body, n.type);
    await sendWithResend(email, n.title, html);

    await adminClient
      .from('notifications')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', n.id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('notification-dispatcher error', error);
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
