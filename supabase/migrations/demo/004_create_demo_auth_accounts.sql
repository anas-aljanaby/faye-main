-- Create Demo Auth Accounts
-- This script creates custom auth accounts for the demo users
-- Run this after running the demo seed data scripts

-- ============================================================================
-- DEMO USER ACCOUNTS
-- ============================================================================
-- These accounts correspond to the demo organization members:
-- - sponsor.fatma@faye.com -> فاطمة الأحمد (sponsor)
-- - sponsor.abdullah@faye.com -> عبدالله الراجحي (sponsor)
-- - member.noora@faye.com -> نورة السعد (team member)
-- - member.khaled@faye.com -> خالد الغامدي (team member)
-- All passwords: "admin"
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    
    -- User profile IDs (matching the demo seed data)
    -- These should match the IDs used in 002_seed_demo_data.sql or 003_quick_demo_setup.sql
    team_member_khaled_id UUID;
    team_member_noora_id UUID;
    sponsor_abdullah_id UUID;
    sponsor_fatma_id UUID;
    
    auth_id UUID;
BEGIN
    -- Find user profile IDs by name and organization
    SELECT id INTO team_member_khaled_id
    FROM user_profiles
    WHERE organization_id = demo_org_id
    AND role = 'team_member'
    AND name = 'خالد الغامدي'
    LIMIT 1;
    
    SELECT id INTO team_member_noora_id
    FROM user_profiles
    WHERE organization_id = demo_org_id
    AND role = 'team_member'
    AND name = 'نورة السعد'
    LIMIT 1;
    
    SELECT id INTO sponsor_abdullah_id
    FROM user_profiles
    WHERE organization_id = demo_org_id
    AND role = 'sponsor'
    AND name = 'عبدالله الراجحي'
    LIMIT 1;
    
    SELECT id INTO sponsor_fatma_id
    FROM user_profiles
    WHERE organization_id = demo_org_id
    AND role = 'sponsor'
    AND name = 'فاطمة الأحمد'
    LIMIT 1;
    
    -- Verify all members were found
    IF team_member_khaled_id IS NULL THEN
        RAISE EXCEPTION 'Team member خالد الغامدي not found. Please run demo seed data first.';
    END IF;
    
    IF team_member_noora_id IS NULL THEN
        RAISE EXCEPTION 'Team member نورة السعد not found. Please run demo seed data first.';
    END IF;
    
    IF sponsor_abdullah_id IS NULL THEN
        RAISE EXCEPTION 'Sponsor عبدالله الراجحي not found. Please run demo seed data first.';
    END IF;
    
    IF sponsor_fatma_id IS NULL THEN
        RAISE EXCEPTION 'Sponsor فاطمة الأحمد not found. Please run demo seed data first.';
    END IF;
    
    RAISE NOTICE 'Found all demo members. Creating auth accounts...';
    RAISE NOTICE 'Team Member خالد الغامدي: %', team_member_khaled_id;
    RAISE NOTICE 'Team Member نورة السعد: %', team_member_noora_id;
    RAISE NOTICE 'Sponsor عبدالله الراجحي: %', sponsor_abdullah_id;
    RAISE NOTICE 'Sponsor فاطمة الأحمد: %', sponsor_fatma_id;
    
    -- ============================================================================
    -- CREATE AUTH ACCOUNTS
    -- ============================================================================
    
    -- Create account for خالد الغامدي (member.khaled@faye.com)
    BEGIN
        SELECT create_user_account(
            'member.khaled',
            'member.khaled@faye.com',
            'admin',
            team_member_khaled_id
        ) INTO auth_id;
        RAISE NOTICE 'Created auth account for خالد الغامدي (member.khaled@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account for خالد الغامدي already exists or error: %', SQLERRM;
    END;
    
    -- Create account for نورة السعد (member.noora@faye.com)
    BEGIN
        SELECT create_user_account(
            'member.noora',
            'member.noora@faye.com',
            'admin',
            team_member_noora_id
        ) INTO auth_id;
        RAISE NOTICE 'Created auth account for نورة السعد (member.noora@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account for نورة السعد already exists or error: %', SQLERRM;
    END;
    
    -- Create account for عبدالله الراجحي (sponsor.abdullah@faye.com)
    BEGIN
        SELECT create_user_account(
            'sponsor.abdullah',
            'sponsor.abdullah@faye.com',
            'admin',
            sponsor_abdullah_id
        ) INTO auth_id;
        RAISE NOTICE 'Created auth account for عبدالله الراجحي (sponsor.abdullah@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account for عبدالله الراجحي already exists or error: %', SQLERRM;
    END;
    
    -- Create account for فاطمة الأحمد (sponsor.fatma@faye.com)
    BEGIN
        SELECT create_user_account(
            'sponsor.fatma',
            'sponsor.fatma@faye.com',
            'admin',
            sponsor_fatma_id
        ) INTO auth_id;
        RAISE NOTICE 'Created auth account for فاطمة الأحمد (sponsor.fatma@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account for فاطمة الأحمد already exists or error: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Demo auth accounts creation completed!';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE '  - member.khaled@faye.com or member.khaled (password: admin)';
    RAISE NOTICE '  - member.noora@faye.com or member.noora (password: admin)';
    RAISE NOTICE '  - sponsor.abdullah@faye.com or sponsor.abdullah (password: admin)';
    RAISE NOTICE '  - sponsor.fatma@faye.com or sponsor.fatma (password: admin)';
    
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check created auth accounts
SELECT 
    ca.username,
    ca.email,
    up.name as member_name,
    up.role,
    ca.created_at
FROM custom_auth ca
JOIN user_profiles up ON up.id = ca.user_profile_id
WHERE up.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY up.role, up.name;

-- Check member linking
SELECT 
    up.name as member_name,
    up.role,
    up.member_id,
    CASE 
        WHEN up.member_id IS NOT NULL THEN 'Linked to account'
        ELSE 'Not linked'
    END as link_status
FROM user_profiles up
WHERE up.organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY up.role, up.name;
