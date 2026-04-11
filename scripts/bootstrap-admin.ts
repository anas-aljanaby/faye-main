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
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function printHelp(): void {
  console.log(`
Usage:
  npm run bootstrap-admin -- --email admin@example.com --password 'StrongPass123' --organization 'My Org'

Options:
  --email <email>              Admin login email
  --password <password>        Admin password
  --organization <name>        Organization name to use or create
  --organization-id <uuid>     Existing organization ID to assign the admin to
  --name <display name>        Profile display name (default: System Admin)

Notes:
  - Provide either --organization or --organization-id.
  - If --organization is provided and no matching org exists, it will be created.
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

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }

    values.set(arg, value);
    i += 1;
  }

  const email = values.get('--email')?.trim().toLowerCase();
  const password = values.get('--password');
  const organizationName = values.get('--organization')?.trim();
  const organizationId = values.get('--organization-id')?.trim();
  const name = values.get('--name')?.trim() || 'System Admin';

  if (!email) {
    throw new Error('Missing required argument: --email');
  }

  if (!password) {
    throw new Error('Missing required argument: --password');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  if (!organizationName && !organizationId) {
    throw new Error('Provide either --organization or --organization-id');
  }

  return {
    email,
    password,
    organizationName,
    organizationId,
    name,
  };
}

async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string; email?: string | null } | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const users = data.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email);
    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function resolveOrganization(
  supabase: SupabaseClient,
  args: Args
): Promise<OrganizationRow> {
  if (args.organizationId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', args.organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load organization by ID: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Organization not found for ID: ${args.organizationId}`);
    }

    return data;
  }

  const { data: existing, error: lookupError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', args.organizationName!)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to look up organization: ${lookupError.message}`);
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from('organizations')
    .insert({ name: args.organizationName! })
    .select('id, name')
    .single();

  if (createError) {
    throw new Error(`Failed to create organization: ${createError.message}`);
  }

  return created;
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

    if (error || !data.user) {
      throw new Error(`Failed to update auth user: ${error?.message ?? 'Unknown error'}`);
    }

    return { id: data.user.id, email: data.user.email, created: false };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user: ${error?.message ?? 'Unknown error'}`);
  }

  return { id: data.user.id, email: data.user.email, created: true };
}

async function findProfileByAuthUserId(
  supabase: SupabaseClient,
  authUserId: string
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, organization_id, auth_user_id, name, role, is_system_admin')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up existing admin profile: ${error.message}`);
  }

  return data;
}

async function findReusableOrgAdminProfile(
  supabase: SupabaseClient,
  organizationId: string,
  name: string
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, organization_id, auth_user_id, name, role, is_system_admin')
    .eq('organization_id', organizationId)
    .eq('role', 'team_member')
    .eq('name', name)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to look up reusable admin profile: ${error.message}`);
  }

  return data;
}

async function ensureAdminProfile(
  supabase: SupabaseClient,
  authUserId: string,
  organizationId: string,
  name: string
): Promise<{ profileId: string; created: boolean }> {
  const linkedProfile = await findProfileByAuthUserId(supabase, authUserId);
  if (linkedProfile) {
    if (linkedProfile.organization_id !== organizationId) {
      throw new Error(
        `Auth user is already linked to another organization (${linkedProfile.organization_id}). Refusing to reassign automatically.`
      );
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        role: 'team_member',
        name,
        is_system_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkedProfile.id);

    if (error) {
      throw new Error(`Failed to update admin profile: ${error.message}`);
    }

    return { profileId: linkedProfile.id, created: false };
  }

  const reusableProfile = await findReusableOrgAdminProfile(supabase, organizationId, name);
  if (reusableProfile) {
    if (reusableProfile.auth_user_id && reusableProfile.auth_user_id !== authUserId) {
      throw new Error(`Admin profile "${name}" is already linked to another auth user.`);
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        auth_user_id: authUserId,
        role: 'team_member',
        is_system_admin: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reusableProfile.id);

    if (error) {
      throw new Error(`Failed to link existing admin profile: ${error.message}`);
    }

    return { profileId: reusableProfile.id, created: false };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      auth_user_id: authUserId,
      organization_id: organizationId,
      role: 'team_member',
      name,
      is_system_admin: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create admin profile: ${error?.message ?? 'Unknown error'}`);
  }

  return { profileId: data.id, created: true };
}

async function ensureAdminPermissions(
  supabase: SupabaseClient,
  profileId: string
): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from('user_permissions')
    .select('id')
    .eq('user_id', profileId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to load admin permissions: ${lookupError.message}`);
  }

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
      .update({
        ...permissionValues,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profileId);

    if (error) {
      throw new Error(`Failed to update admin permissions: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from('user_permissions').insert(permissionValues);
  if (error) {
    throw new Error(`Failed to create admin permissions: ${error.message}`);
  }
}

async function main(): Promise<void> {
  loadEnv();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }

  const args = parseArgs(process.argv.slice(2));
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('Starting admin bootstrap...');

  const organization = await resolveOrganization(supabase, args);
  const authUser = await ensureAuthUser(supabase, args.email, args.password);
  const profile = await ensureAdminProfile(supabase, authUser.id, organization.id, args.name);
  await ensureAdminPermissions(supabase, profile.profileId);

  console.log('Admin bootstrap complete.');
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
  console.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
