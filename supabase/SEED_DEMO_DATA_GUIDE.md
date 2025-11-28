# Guide: Creating Demo Organization with Sample Data

This guide explains how to create a demo organization with team members, sponsors, and orphans in your Supabase database.

## Prerequisites

1. You've already run the initial schema migration (`001_initial_schema.sql`)
2. You have access to Supabase Dashboard

## Step-by-Step Instructions

### Step 1: Create Auth Users

Before running the seed script, you need to create authentication users in Supabase:

1. Go to **Supabase Dashboard** > **Authentication** > **Users**
2. Click **"Add user"** or **"Create new user"**
3. Create 4 users (2 team members + 2 sponsors):
   - **Team Member 1**: Email: `khalid@faye-demo.com` (or any email)
   - **Team Member 2**: Email: `sara@faye-demo.com` (or any email)
   - **Sponsor 1**: Email: `abdullah@faye-demo.com` (or any email)
   - **Sponsor 2**: Email: `fatima@faye-demo.com` (or any email)

4. For each user, **copy their User ID** (UUID) - you'll need these in the next step

### Step 2: Update the Seed Script

1. Open `supabase/migrations/002_seed_demo_data.sql`
2. Find the section **"STEP 3: Create User Profiles"**
3. Replace the placeholder UUIDs with the actual User IDs you copied:
   - Replace `'11111111-1111-1111-1111-111111111111'` with Team Member 1's User ID
   - Replace `'22222222-2222-2222-2222-222222222222'` with Team Member 2's User ID
   - Replace `'33333333-3333-3333-3333-333333333333'` with Sponsor 1's User ID
   - Replace `'44444444-4444-4444-4444-444444444444'` with Sponsor 2's User ID

### Step 3: Run the Seed Script

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Open a new query
3. Copy and paste the entire contents of `002_seed_demo_data.sql`
4. Click **"Run"** to execute the script

### Step 4: Verify the Data

Run these verification queries in the SQL Editor to check everything was created:

```sql
-- Check organization
SELECT * FROM organizations WHERE name LIKE '%Demo%';

-- Check user profiles
SELECT id, name, role, organization_id FROM user_profiles;

-- Check orphans
SELECT id, name, organization_id FROM orphans;

-- Check sponsor-orphan relationships
SELECT 
    up.name as sponsor_name,
    o.name as orphan_name
FROM sponsor_orphans so
JOIN user_profiles up ON up.id = so.sponsor_id
JOIN orphans o ON o.id = so.orphan_id;

-- Check team member-orphan assignments
SELECT 
    up.name as team_member_name,
    o.name as orphan_name
FROM team_member_orphans tmo
JOIN user_profiles up ON up.id = tmo.team_member_id
JOIN orphans o ON o.id = tmo.orphan_id;
```

## What Gets Created

The seed script creates:

- ✅ 1 Demo organization
- ✅ 2 Team members (user profiles)
- ✅ 2 Sponsors (user profiles)
- ✅ 3 Orphans with complete profiles
- ✅ Sponsor-orphan relationships
- ✅ Team member-orphan assignments
- ✅ Sample payments (8 records)
- ✅ Sample achievements (3 records)
- ✅ Sample special occasions (3 records)
- ✅ Sample gifts (3 records)
- ✅ Sample family members (5 records)
- ✅ Sample program participations (7 records)
- ✅ Sample update logs (3 records)
- ✅ Sample tasks (4 records)
- ✅ Sample financial transactions (4 records)

## Alternative: Quick Setup Script

If you want to create users programmatically, you can use this helper script after creating auth users:

```sql
-- Quick setup: Just update these UUIDs with your auth user IDs
DO $$
DECLARE
    team_member_1_id UUID := 'YOUR_TEAM_MEMBER_1_UUID_HERE';
    team_member_2_id UUID := 'YOUR_TEAM_MEMBER_2_UUID_HERE';
    sponsor_1_id UUID := 'YOUR_SPONSOR_1_UUID_HERE';
    sponsor_2_id UUID := 'YOUR_SPONSOR_2_UUID_HERE';
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Create organization
    INSERT INTO organizations (id, name) 
    VALUES (demo_org_id, 'منظمة فيء - Demo')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create user profiles (update UUIDs above first!)
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
    VALUES 
        (team_member_1_id, demo_org_id, 'team_member', 'خالد الغامدي', 'https://ui-avatars.com/api/?name=خالد+الغامدي&background=8c1c3e&color=fff'),
        (team_member_2_id, demo_org_id, 'team_member', 'سارة أحمد', 'https://ui-avatars.com/api/?name=سارة+أحمد&background=8c1c3e&color=fff'),
        (sponsor_1_id, demo_org_id, 'sponsor', 'عبدالله الراجحي', 'https://ui-avatars.com/api/?name=عبدالله+الراجحي&background=10b981&color=fff'),
        (sponsor_2_id, demo_org_id, 'sponsor', 'فاطمة الأحمد', 'https://ui-avatars.com/api/?name=فاطمة+الأحمد&background=10b981&color=fff')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url;
END $$;
```

Then continue with the rest of the seed script.

## Troubleshooting

### Error: "violates foreign key constraint"
- Make sure you've updated all the UUIDs in the script with actual auth user IDs
- Ensure the organization was created first

### Error: "duplicate key value"
- Some data might already exist. The script uses `ON CONFLICT DO NOTHING` in most places, so it's safe to run multiple times
- If you want to start fresh, you can delete the demo organization and all related data first

### Users can't see data after logging in
- Check that the user's `user_profiles` record has the correct `organization_id`
- Verify RLS policies are working by checking the user's role matches their access level

## Next Steps

After seeding the demo data:

1. Test login with one of the created users
2. Verify that team members can see all orphans in their organization
3. Verify that sponsors can only see their sponsored orphans
4. Test creating new records through your application

