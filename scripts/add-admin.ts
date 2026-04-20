import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Args = {
  email: string;
  password: string;
  organizationName?: string;
  organizationId?: string;
  name: string;
};

type OrganizationRow = {
  id: string;
  name: string;
};

type UserProfileRow = {
  id: string;
  organization_id: string;
  auth_user_id: string | null;
  name: string;
  role: 'team_member' | 'sponsor';
  is_system_admin: boolean;
};

function loadEnv(): void {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value && !process.env[key]) process.env[key] = value;
  }
}

function printHelp(): void {
  console.log(`
Usage:
  npm run add-admin -- --email admin@example.com --password 'StrongPass123' --organization 'My Org'

Options:
  --email <email>              Admin login email
  --password <password>        Admin password (min 8 chars)
  --organization <name>        Existing organization name
  --organization-id <uuid>     Existing organization ID
  --name <display name>        Profile display name (default: System Admin)

Notes:
  - The organization must already exist.
  - Provide either --organization or --organization-id.
  `.trim());
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);

    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);

    values.set(arg, value);
    i += 1;
  }

  const email = values.get('--email')?.trim().toLowerCase();
  const password = values.get('--password');
  const organizationName = values.get('--organization')?.trim();
  const organizationId = values.get('--organization-id')?.trim();
  const name = values.get('--name')?.trim() || 'System Admin';

  if (!email) throw new Error('Missing required argument: --email');
  if (!password) throw new Error('Missing required argument: --password');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long');
  if (!organizationName && !organizationId) throw new Error('Provide either --organization or --organization-id');

  return { email, password, organizationName, organizationId, name };
}

async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string; email?: string | null } | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);

    const users = data.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function resolveOrganization(
  supabase: SupabaseClient,
  args: Args
): Promise<OrganizationRow> {
  const query = args.organizationId
    ? supabase.from('organizations').select('id, name').eq('id', args.organizationId).maybeSingle()
    : supabase.from('organizations').select('id, name').eq('name', args.organizationName!).maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error(`Failed to look up organization: ${error.message}`);
  if (!data) throw new Error(`Organization not found: ${args.organizationId ?? args.organizationName}`);

  return data;
}

async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<{ id: string; email?: string | null; created: boolean }> {
  const existing = await findAuthUserByEmail(supabase, email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Failed to update auth user: ${error?.message ?? 'Unknown error'}`);
    return { id: data.user.id, email: data.user.email, created: false };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create auth user: ${error?.message ?? 'Unknown error'}`);
  return { id: data.user.id, email: data.user.email, created: true };
}

async function ensureAdminProfile(
  supabase: SupabaseClient,
  authUserId: string,
  organizationId: string,
  name: string
): Promise<{ profileId: string; created: boolean }> {
  const { data: linked, error: linkedError } = await supabase
    .from('user_profiles')
    .select('id, organization_id, is_system_admin')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (linkedError) throw new Error(`Failed to look up existing profile: ${linkedError.message}`);

  if (linked) {
    if (linked.organization_id !== organizationId) {
      throw new Error(
        `This auth user is already linked to a different organization (${linked.organization_id}). Refusing to reassign.`
      );
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: 'team_member', name, is_system_admin: true, updated_at: new Date().toISOString() })
      .eq('id', linked.id);

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return { profileId: linked.id, created: false };
  }

  const { data: created, error: createError } = await supabase
    .from('user_profiles')
    .insert({ auth_user_id: authUserId, organization_id: organizationId, role: 'team_member', name, is_system_admin: true })
    .select('id')
    .single();

  if (createError || !created) throw new Error(`Failed to create admin profile: ${createError?.message ?? 'Unknown error'}`);
  return { profileId: created.id, created: true };
}

async function ensureAdminPermissions(supabase: SupabaseClient, profileId: string): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from('user_permissions')
    .select('id')
    .eq('user_id', profileId)
    .maybeSingle();

  if (lookupError) throw new Error(`Failed to load permissions: ${lookupError.message}`);

  const permissionValues = {
    user_id: profileId,
    can_edit_orphans: true,
    can_edit_sponsors: true,
    can_edit_transactions: true,
    can_create_expense: true,
    can_approve_expense: true,
    can_view_financials: true,
    is_manager: true,
  };

  if (existing) {
    const { error } = await supabase
      .from('user_permissions')
      .update({ ...permissionValues, updated_at: new Date().toISOString() })
      .eq('user_id', profileId);
    if (error) throw new Error(`Failed to update permissions: ${error.message}`);
    return;
  }

  const { error } = await supabase.from('user_permissions').insert(permissionValues);
  if (error) throw new Error(`Failed to create permissions: ${error.message}`);
}

async function main(): Promise<void> {
  loadEnv();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const args = parseArgs(process.argv.slice(2));
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Adding admin...');

  const organization = await resolveOrganization(supabase, args);
  const authUser = await ensureAuthUser(supabase, args.email, args.password);
  const profile = await ensureAdminProfile(supabase, authUser.id, organization.id, args.name);
  await ensureAdminPermissions(supabase, profile.profileId);

  console.log('Done.');
  console.log(JSON.stringify({
    email: args.email,
    organizationId: organization.id,
    organizationName: organization.name,
    authUserId: authUser.id,
    authUserCreated: authUser.created,
    profileId: profile.profileId,
    profileCreated: profile.created,
  }, null, 2));
}

main().catch((error) => {
  console.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
