/**
 * Generate SQL file for importing orphans data from Excel
 * This script reads the Excel file and generates a SQL migration file
 * The SQL file can be run directly in Supabase SQL Editor
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { generateUsername } from './transliterate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  varName: string;
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
  return 'ذكر';
}

/**
 * Convert birth year to date string
 */
function birthYearToDate(year: number | string): string | null {
  if (!year) return null;
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  if (isNaN(y) || y < 1900 || y > 2030) return null;
  return `${y}-01-01`;
}

/**
 * Escape SQL string
 */
function escapeSql(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Generate a valid SQL variable name from Arabic name
 */
function generateVarName(name: string, prefix: string, counter: number): string {
  return `${prefix}_${counter}`;
}

/**
 * Main function to generate SQL
 */
function generateSQL(): void {
  console.log('═'.repeat(60));
  console.log('🚀 Generating Import SQL');
  console.log('═'.repeat(60));

  // Read Excel data
  const rows = readExcelFile();

  // Extract unique users
  const sponsors = new Map<string, UserCredentials>();
  const teamMembers = new Map<string, UserCredentials>();
  const usedUsernames = new Set<string>();

  let sponsorCounter = 1;
  let teamMemberCounter = 1;

  for (const row of rows) {
    // Process sponsor
    if (row.sponsorName && !sponsors.has(row.sponsorName)) {
      const username = generateUsername(row.sponsorName, usedUsernames);
      sponsors.set(row.sponsorName, {
        username,
        password: `${username}Pass123`,
        role: 'sponsor',
        name: row.sponsorName,
        email: `${username}@faye.org`,
        varName: generateVarName(row.sponsorName, 'sponsor', sponsorCounter++),
      });
    }

    // Process team member
    if (row.teamMemberName && !teamMembers.has(row.teamMemberName)) {
      const username = generateUsername(row.teamMemberName, usedUsernames);
      teamMembers.set(row.teamMemberName, {
        username,
        password: `${username}Pass123`,
        role: 'team_member',
        name: row.teamMemberName,
        email: `${username}@faye.org`,
        varName: generateVarName(row.teamMemberName, 'team_member', teamMemberCounter++),
      });
    }
  }

  console.log(`👥 Unique sponsors: ${sponsors.size}`);
  console.log(`👤 Unique team members: ${teamMembers.size}`);

  // Generate SQL
  let sql = `-- ============================================================================
-- Faye Organization Data Import
-- Generated at: ${new Date().toISOString()}
-- ============================================================================
-- This script imports real organization data from the Excel file
-- Run this in Supabase SQL Editor after running 001_initial_schema.sql
-- ============================================================================

DO $$
DECLARE
    org_id UUID;
    
    -- Team Member profile IDs
`;

  // Declare team member variables
  for (const [, user] of teamMembers) {
    sql += `    ${user.varName}_id UUID;\n`;
  }

  sql += `\n    -- Sponsor profile IDs\n`;

  // Declare sponsor variables
  for (const [, user] of sponsors) {
    sql += `    ${user.varName}_id UUID;\n`;
  }

  sql += `\n    -- Orphan IDs\n`;

  // Declare orphan variables
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].orphanName) {
      sql += `    orphan_${i + 1}_id UUID;\n`;
    }
  }

  sql += `
    auth_id UUID;
BEGIN
    RAISE NOTICE 'Starting Faye organization data import...';
    
    -- ============================================================================
    -- STEP 1: CREATE ORGANIZATION
    -- ============================================================================
    RAISE NOTICE 'Creating organization...';
    
    INSERT INTO organizations (name) 
    VALUES ('${escapeSql(ORGANIZATION_NAME)}')
    RETURNING id INTO org_id;
    
    RAISE NOTICE '  ✓ Created organization: ${escapeSql(ORGANIZATION_NAME)} (ID: %)', org_id;

    -- ============================================================================
    -- STEP 2: CREATE TEAM MEMBER PROFILES
    -- ============================================================================
    RAISE NOTICE 'Creating team member profiles...';
`;

  // Create team member profiles
  for (const [, user] of teamMembers) {
    sql += `
    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'team_member', '${escapeSql(user.name)}')
    RETURNING id INTO ${user.varName}_id;
`;
  }

  sql += `
    RAISE NOTICE '  ✓ Created ${teamMembers.size} team member profiles';

    -- ============================================================================
    -- STEP 3: CREATE SPONSOR PROFILES
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor profiles...';
`;

  // Create sponsor profiles
  for (const [, user] of sponsors) {
    sql += `
    INSERT INTO user_profiles (organization_id, role, name)
    VALUES (org_id, 'sponsor', '${escapeSql(user.name)}')
    RETURNING id INTO ${user.varName}_id;
`;
  }

  sql += `
    RAISE NOTICE '  ✓ Created ${sponsors.size} sponsor profiles';

    -- ============================================================================
    -- STEP 4: CREATE USER PERMISSIONS (for all users)
    -- ============================================================================
    RAISE NOTICE 'Creating user permissions...';
`;

  // Create permissions for team members (first one gets manager permissions)
  let isFirst = true;
  for (const [, user] of teamMembers) {
    if (isFirst) {
      sql += `
    -- ${user.name} (Manager with all permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (${user.varName}_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);
`;
      isFirst = false;
    } else {
      sql += `
    -- ${user.name} (Team member with standard permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (${user.varName}_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE);
`;
    }
  }

  // Create permissions for sponsors (read-only defaults)
  for (const [, user] of sponsors) {
    sql += `
    -- ${user.name} (Sponsor with default permissions)
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (${user.varName}_id, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);
`;
  }

  sql += `
    RAISE NOTICE '  ✓ Created permissions for all users';

    -- ============================================================================
    -- STEP 5: CREATE AUTH ACCOUNTS
    -- ============================================================================
    RAISE NOTICE 'Creating auth accounts...';
`;

  // Create auth accounts for team members
  for (const [, user] of teamMembers) {
    sql += `
    BEGIN
        SELECT create_user_account(
            '${escapeSql(user.username)}',
            '${escapeSql(user.email)}',
            '${escapeSql(user.password)}',
            ${user.varName}_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ${escapeSql(user.name)} (${escapeSql(user.username)})';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ${escapeSql(user.name)} may already exist: %', SQLERRM;
    END;
`;
  }

  // Create auth accounts for sponsors
  for (const [, user] of sponsors) {
    sql += `
    BEGIN
        SELECT create_user_account(
            '${escapeSql(user.username)}',
            '${escapeSql(user.email)}',
            '${escapeSql(user.password)}',
            ${user.varName}_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for ${escapeSql(user.name)} (${escapeSql(user.username)})';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for ${escapeSql(user.name)} may already exist: %', SQLERRM;
    END;
`;
  }

  sql += `
    -- ============================================================================
    -- STEP 6: CREATE ORPHANS
    -- ============================================================================
    RAISE NOTICE 'Creating orphan records...';
`;

  // Create orphans
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.orphanName) continue;

    const gender = normalizeGender(row.gender);
    const dob = birthYearToDate(row.birthYear);

    sql += `
    INSERT INTO orphans (
        organization_id, name, gender, date_of_birth, guardian,
        country, governorate, sponsorship_type
    )
    VALUES (
        org_id,
        '${escapeSql(row.orphanName)}',
        '${gender}',
        ${dob ? `'${dob}'` : 'NULL'},
        ${row.guardian ? `'${escapeSql(row.guardian)}'` : 'NULL'},
        '${escapeSql(row.country || 'العراق')}',
        ${row.governorate ? `'${escapeSql(row.governorate)}'` : 'NULL'},
        ${row.sponsorshipType ? `'${escapeSql(row.sponsorshipType)}'` : 'NULL'}
    )
    RETURNING id INTO orphan_${i + 1}_id;
`;
  }

  sql += `
    RAISE NOTICE '  ✓ Created ${rows.filter(r => r.orphanName).length} orphan records';

    -- ============================================================================
    -- STEP 7: CREATE SPONSOR-ORPHAN RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor-orphan relationships...';
`;

  // Create sponsor-orphan relationships
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.orphanName || !row.sponsorName) continue;

    const sponsor = sponsors.get(row.sponsorName);
    if (!sponsor) continue;

    sql += `
    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES (${sponsor.varName}_id, orphan_${i + 1}_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;
`;
  }

  sql += `
    -- ============================================================================
    -- STEP 8: CREATE TEAM MEMBER-ORPHAN RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating team member-orphan relationships...';
`;

  // Create team member-orphan relationships
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.orphanName || !row.teamMemberName) continue;

    const teamMember = teamMembers.get(row.teamMemberName);
    if (!teamMember) continue;

    sql += `
    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES (${teamMember.varName}_id, orphan_${i + 1}_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;
`;
  }

  sql += `
    -- ============================================================================
    -- STEP 9: CREATE SPONSOR-TEAM MEMBER RELATIONSHIPS
    -- ============================================================================
    RAISE NOTICE 'Creating sponsor-team member relationships...';
`;

  // Create unique sponsor-team member relationships
  const sponsorTeamMemberPairs = new Set<string>();
  for (const row of rows) {
    if (!row.sponsorName || !row.teamMemberName) continue;
    
    const key = `${row.sponsorName}|${row.teamMemberName}`;
    if (sponsorTeamMemberPairs.has(key)) continue;
    sponsorTeamMemberPairs.add(key);

    const sponsor = sponsors.get(row.sponsorName);
    const teamMember = teamMembers.get(row.teamMemberName);
    if (!sponsor || !teamMember) continue;

    sql += `
    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES (${sponsor.varName}_id, ${teamMember.varName}_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;
`;
  }

  sql += `
    -- ============================================================================
    -- IMPORT COMPLETE
    -- ============================================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Import completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Organization: ${escapeSql(ORGANIZATION_NAME)}';
    RAISE NOTICE '  - Team Members: ${teamMembers.size}';
    RAISE NOTICE '  - Sponsors: ${sponsors.size}';
    RAISE NOTICE '  - Orphans: ${rows.filter(r => r.orphanName).length}';
    RAISE NOTICE '';
    
END $$;
`;

  // Write SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '006_import_faye_data.sql');
  fs.writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`\n✅ SQL file generated: ${sqlPath}`);

  // Generate credentials JSON
  const allUsers = [...teamMembers.values(), ...sponsors.values()];
  const credentials = {
    organization: ORGANIZATION_NAME,
    generatedAt: new Date().toISOString(),
    totalUsers: allUsers.length,
    teamMembers: teamMembers.size,
    sponsors: sponsors.size,
    users: allUsers.map(u => ({
      username: u.username,
      password: u.password,
      role: u.role,
      name: u.name,
      email: u.email,
    })),
  };

  const credentialsPath = path.join(__dirname, '..', 'user-credentials.json');
  fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2), 'utf-8');
  console.log(`✅ Credentials file generated: ${credentialsPath}`);

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Summary:');
  console.log(`   - Organization: ${ORGANIZATION_NAME}`);
  console.log(`   - Team Members: ${teamMembers.size}`);
  console.log(`   - Sponsors: ${sponsors.size}`);
  console.log(`   - Orphans: ${rows.filter(r => r.orphanName).length}`);
  console.log('═'.repeat(60));
  console.log('\n📝 Next steps:');
  console.log('   1. Open Supabase SQL Editor');
  console.log('   2. Copy and paste the contents of 006_import_faye_data.sql');
  console.log('   3. Run the SQL');
  console.log('   4. Use credentials from user-credentials.json to log in');
  console.log('═'.repeat(60));
}

// Run
generateSQL();
