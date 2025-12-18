/**
 * Import orphans data from Excel file
 * Creates organization, users, orphans, and relationships
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { transliterate, generateUsername } from './transliterate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface ExcelRow {
  sequence: number;
  orphanName: string;
  gender: string;
  birthYear: number | string;
  guardian: string;
  country: string;
  governorate: string;
  sponsorName: string;
  sponsorshipType: string;
  teamMemberName: string;
}

interface UserCredentials {
  username: string;
  password: string;
  role: 'sponsor' | 'team_member';
  name: string;
  email: string;
  profileId?: string;
}

interface ImportResult {
  organization: { id: string; name: string };
  users: UserCredentials[];
  orphansCreated: number;
  sponsorOrphanRelationships: number;
  teamMemberOrphanRelationships: number;
  sponsorTeamMemberRelationships: number;
}

// Organization name
const ORGANIZATION_NAME = 'منظمة فيء';

/**
 * Read and parse Excel file
 */
function readExcelFile(): ExcelRow[] {
  const filePath = path.join(__dirname, '..', 'بيانات الايتام - ٢٠٢٥.xlsx');
  console.log('📖 Reading Excel file:', filePath);

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const rows: ExcelRow[] = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    // Skip empty rows
    if (!row || !row[1]) continue;
    
    // Clean up text values (remove invisible Unicode characters)
    const cleanText = (val: any): string => {
      if (val === undefined || val === null) return '';
      return String(val)
        .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
        .trim();
    };

    rows.push({
      sequence: row[0] || i,
      orphanName: cleanText(row[1]),
      gender: cleanText(row[2]),
      birthYear: row[3] || '',
      guardian: cleanText(row[4]),
      country: cleanText(row[5]),
      governorate: cleanText(row[6]),
      sponsorName: cleanText(row[7]),
      sponsorshipType: cleanText(row[8]),
      teamMemberName: cleanText(row[9]),
    });
  }

  console.log(`📊 Found ${rows.length} orphan records`);
  return rows;
}

/**
 * Normalize gender value to match database constraint
 */
function normalizeGender(gender: string): 'ذكر' | 'أنثى' {
  const g = gender.trim().toLowerCase();
  if (g === 'ذكر' || g.includes('ذكر')) return 'ذكر';
  if (g === 'انثى' || g === 'أنثى' || g.includes('انث') || g.includes('أنث')) return 'أنثى';
  // Default to male if unknown
  return 'ذكر';
}

/**
 * Convert birth year to date
 */
function birthYearToDate(year: number | string): string | null {
  if (!year) return null;
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  if (isNaN(y) || y < 1900 || y > 2030) return null;
  return `${y}-01-01`;
}

/**
 * Extract unique sponsors and team members
 */
function extractUniqueUsers(rows: ExcelRow[]): { sponsors: Set<string>; teamMembers: Set<string> } {
  const sponsors = new Set<string>();
  const teamMembers = new Set<string>();

  for (const row of rows) {
    if (row.sponsorName) {
      sponsors.add(row.sponsorName);
    }
    if (row.teamMemberName) {
      teamMembers.add(row.teamMemberName);
    }
  }

  console.log(`👥 Found ${sponsors.size} unique sponsors`);
  console.log(`👤 Found ${teamMembers.size} unique team members`);

  return { sponsors, teamMembers };
}

/**
 * Create organization
 */
async function createOrganization(): Promise<string> {
  console.log('\n🏢 Creating organization:', ORGANIZATION_NAME);

  // First, try to find existing organization
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', ORGANIZATION_NAME)
    .single();

  if (existing) {
    console.log('   Organization already exists, using existing ID:', existing.id);
    return existing.id;
  }

  // Create new organization
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: ORGANIZATION_NAME })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create organization: ${error.message}`);
  }

  console.log('   ✅ Created organization with ID:', data.id);
  return data.id;
}

/**
 * Create user profiles and auth accounts
 */
async function createUsers(
  organizationId: string,
  sponsors: Set<string>,
  teamMembers: Set<string>
): Promise<{ credentials: UserCredentials[]; profileMap: Map<string, string> }> {
  console.log('\n👤 Creating user accounts...');

  const credentials: UserCredentials[] = [];
  const profileMap = new Map<string, string>(); // name -> profile_id
  const usedUsernames = new Set<string>();

  // Create team members first (they might also be referenced in sponsor-team-member relationships)
  console.log('   Creating team members...');
  for (const name of teamMembers) {
    const username = generateUsername(name, usedUsernames);
    const password = `${username}Pass123`;
    const email = `${username}@faye.org`;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        organization_id: organizationId,
        role: 'team_member',
        name: name,
      })
      .select('id')
      .single();

    if (profileError) {
      console.error(`   ❌ Failed to create team member profile for ${name}:`, profileError.message);
      continue;
    }

    // Create auth account using the existing create_user_account function
    const { error: authError } = await supabase.rpc('create_user_account', {
      p_username: username,
      p_email: email,
      p_password: password,
      p_member_profile_id: profile.id,
    });

    if (authError) {
      console.error(`   ❌ Failed to create auth for team member ${name}:`, authError.message);
      // Delete the profile since auth failed
      await supabase.from('user_profiles').delete().eq('id', profile.id);
      continue;
    }

    // Create user permissions (team members get basic permissions)
    await supabase.from('user_permissions').insert({
      user_id: profile.id,
      can_edit_orphans: true,
      can_edit_sponsors: true,
      can_edit_transactions: false,
      can_create_expense: false,
      can_approve_expense: false,
      can_view_financials: true,
      is_manager: false,
    });

    profileMap.set(name, profile.id);
    credentials.push({
      username,
      password,
      role: 'team_member',
      name,
      email,
      profileId: profile.id,
    });
  }
  console.log(`   ✅ Created ${credentials.filter(c => c.role === 'team_member').length} team members`);

  // Create sponsors
  console.log('   Creating sponsors...');
  for (const name of sponsors) {
    const username = generateUsername(name, usedUsernames);
    const password = `${username}Pass123`;
    const email = `${username}@faye.org`;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        organization_id: organizationId,
        role: 'sponsor',
        name: name,
      })
      .select('id')
      .single();

    if (profileError) {
      console.error(`   ❌ Failed to create sponsor profile for ${name}:`, profileError.message);
      continue;
    }

    // Create auth account using the existing create_user_account function
    const { error: authError } = await supabase.rpc('create_user_account', {
      p_username: username,
      p_email: email,
      p_password: password,
      p_member_profile_id: profile.id,
    });

    if (authError) {
      console.error(`   ❌ Failed to create auth for sponsor ${name}:`, authError.message);
      await supabase.from('user_profiles').delete().eq('id', profile.id);
      continue;
    }

    profileMap.set(name, profile.id);
    credentials.push({
      username,
      password,
      role: 'sponsor',
      name,
      email,
      profileId: profile.id,
    });
  }
  console.log(`   ✅ Created ${credentials.filter(c => c.role === 'sponsor').length} sponsors`);

  return { credentials, profileMap };
}

/**
 * Create orphans
 */
async function createOrphans(
  organizationId: string,
  rows: ExcelRow[]
): Promise<Map<string, string>> {
  console.log('\n👶 Creating orphan records...');

  const orphanMap = new Map<string, string>(); // orphan_name -> orphan_id
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.orphanName) {
      skipped++;
      continue;
    }

    // Check if orphan already exists
    const { data: existing } = await supabase
      .from('orphans')
      .select('id')
      .eq('name', row.orphanName)
      .eq('organization_id', organizationId)
      .single();

    if (existing) {
      orphanMap.set(row.orphanName, existing.id);
      skipped++;
      continue;
    }

    const { data: orphan, error } = await supabase
      .from('orphans')
      .insert({
        organization_id: organizationId,
        name: row.orphanName,
        gender: normalizeGender(row.gender),
        date_of_birth: birthYearToDate(row.birthYear),
        guardian: row.guardian || null,
        country: row.country || 'العراق',
        governorate: row.governorate || null,
        sponsorship_type: row.sponsorshipType || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Failed to create orphan ${row.orphanName}:`, error.message);
      continue;
    }

    orphanMap.set(row.orphanName, orphan.id);
    created++;
  }

  console.log(`   ✅ Created ${created} orphans (${skipped} skipped)`);
  return orphanMap;
}

/**
 * Create relationships between sponsors, orphans, and team members
 */
async function createRelationships(
  rows: ExcelRow[],
  profileMap: Map<string, string>,
  orphanMap: Map<string, string>
): Promise<{ sponsorOrphan: number; teamMemberOrphan: number; sponsorTeamMember: number }> {
  console.log('\n🔗 Creating relationships...');

  let sponsorOrphanCount = 0;
  let teamMemberOrphanCount = 0;
  let sponsorTeamMemberCount = 0;

  // Track unique relationships to avoid duplicates
  const sponsorOrphanPairs = new Set<string>();
  const teamMemberOrphanPairs = new Set<string>();
  const sponsorTeamMemberPairs = new Set<string>();

  for (const row of rows) {
    const orphanId = orphanMap.get(row.orphanName);
    const sponsorId = profileMap.get(row.sponsorName);
    const teamMemberId = profileMap.get(row.teamMemberName);

    if (!orphanId) continue;

    // Create sponsor-orphan relationship
    if (sponsorId) {
      const key = `${sponsorId}-${orphanId}`;
      if (!sponsorOrphanPairs.has(key)) {
        sponsorOrphanPairs.add(key);
        const { error } = await supabase
          .from('sponsor_orphans')
          .insert({ sponsor_id: sponsorId, orphan_id: orphanId })
          .select()
          .single();
        
        if (!error) sponsorOrphanCount++;
      }
    }

    // Create team_member-orphan relationship
    if (teamMemberId) {
      const key = `${teamMemberId}-${orphanId}`;
      if (!teamMemberOrphanPairs.has(key)) {
        teamMemberOrphanPairs.add(key);
        const { error } = await supabase
          .from('team_member_orphans')
          .insert({ team_member_id: teamMemberId, orphan_id: orphanId })
          .select()
          .single();
        
        if (!error) teamMemberOrphanCount++;
      }
    }

    // Create sponsor-team_member relationship
    if (sponsorId && teamMemberId) {
      const key = `${sponsorId}-${teamMemberId}`;
      if (!sponsorTeamMemberPairs.has(key)) {
        sponsorTeamMemberPairs.add(key);
        const { error } = await supabase
          .from('sponsor_team_members')
          .insert({ sponsor_id: sponsorId, team_member_id: teamMemberId })
          .select()
          .single();
        
        if (!error) sponsorTeamMemberCount++;
      }
    }
  }

  console.log(`   ✅ Created ${sponsorOrphanCount} sponsor-orphan relationships`);
  console.log(`   ✅ Created ${teamMemberOrphanCount} team_member-orphan relationships`);
  console.log(`   ✅ Created ${sponsorTeamMemberCount} sponsor-team_member relationships`);

  return {
    sponsorOrphan: sponsorOrphanCount,
    teamMemberOrphan: teamMemberOrphanCount,
    sponsorTeamMember: sponsorTeamMemberCount,
  };
}

/**
 * Save credentials to JSON file
 */
function saveCredentials(credentials: UserCredentials[], organizationName: string): void {
  const outputPath = path.join(__dirname, '..', 'user-credentials.json');
  
  const output = {
    organization: organizationName,
    generatedAt: new Date().toISOString(),
    totalUsers: credentials.length,
    teamMembers: credentials.filter(c => c.role === 'team_member').length,
    sponsors: credentials.filter(c => c.role === 'sponsor').length,
    users: credentials.map(c => ({
      username: c.username,
      password: c.password,
      role: c.role,
      name: c.name,
      email: c.email,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Credentials saved to: ${outputPath}`);
}

/**
 * Main import function
 */
async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🚀 Starting Orphans Data Import');
  console.log('═'.repeat(60));

  try {
    // Step 1: Read Excel file
    const rows = readExcelFile();

    // Step 2: Extract unique users
    const { sponsors, teamMembers } = extractUniqueUsers(rows);

    // Step 3: Create organization
    const organizationId = await createOrganization();

    // Step 4: Create user profiles and auth accounts
    const { credentials, profileMap } = await createUsers(organizationId, sponsors, teamMembers);

    // Step 5: Create orphans
    const orphanMap = await createOrphans(organizationId, rows);

    // Step 6: Create relationships
    const relationships = await createRelationships(rows, profileMap, orphanMap);

    // Step 7: Save credentials
    saveCredentials(credentials, ORGANIZATION_NAME);

    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Import completed successfully!');
    console.log('═'.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Organization: ${ORGANIZATION_NAME}`);
    console.log(`   - Team Members: ${credentials.filter(c => c.role === 'team_member').length}`);
    console.log(`   - Sponsors: ${credentials.filter(c => c.role === 'sponsor').length}`);
    console.log(`   - Orphans: ${orphanMap.size}`);
    console.log(`   - Sponsor-Orphan relationships: ${relationships.sponsorOrphan}`);
    console.log(`   - Team Member-Orphan relationships: ${relationships.teamMemberOrphan}`);
    console.log(`   - Sponsor-Team Member relationships: ${relationships.sponsorTeamMember}`);
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();
