-- ============================================================================
-- Demo: Organization and Users
-- ============================================================================
-- Creates the demo organization, user profiles (team_member + sponsor roles),
-- a system/super admin (invisible in member lists), permissions, and custom
-- auth accounts. Timeline: join dates in Jan 2026.
--
-- Site components: Sign-in, Sidebar (role-based nav), Dashboard, HR/Team list,
-- Sponsors list, permission-gated Financial System / Orphans / Sponsors.
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    -- Super admin (system admin – invisible in team/sponsor lists)
    super_admin_id UUID := 'e0000000-0000-0000-0000-000000000001';
    -- Team members (most in Jan 2026)
    team_khaled_id UUID := '11111111-1111-1111-1111-111111111111';
    team_noora_id  UUID := '22222222-2222-2222-2222-222222222222';
    -- Sponsors: most Jan, some Feb, fewer March
    sponsor_abdullah_id UUID := '33333333-3333-3333-3333-333333333333';
    sponsor_fatma_id    UUID := '44444444-4444-4444-4444-444444444444';
    sponsor_mohammad_id UUID := '55555555-5555-5555-5555-555555555555';
    sponsor_muna_id     UUID := '66666666-6666-6666-6666-666666666666';
    sponsor_saad_id     UUID := '77777777-7777-7777-7777-777777777777';
    auth_id UUID;
BEGIN
    -- -------------------------------------------------------------------------
    -- Organization
    -- -------------------------------------------------------------------------
    INSERT INTO organizations (id, name, created_at, updated_at)
    VALUES (
        demo_org_id,
        'منظمة يتيم - Demo',
        '2026-01-01 08:00:00+00',
        '2026-01-01 08:00:00+00'
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- -------------------------------------------------------------------------
    -- User profiles: super admin (1), team_member (2), sponsor (5)
    -- -------------------------------------------------------------------------
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url, is_system_admin, created_at, updated_at)
    VALUES
        -- Super admin (invisible in team/sponsor lists; full access)
        (super_admin_id, demo_org_id, 'team_member', 'مدير النظام', 'https://picsum.photos/seed/admin/100/100', TRUE, '2026-01-01 08:00:00+00', '2026-01-01 08:00:00+00'),
        -- Team: joined Jan 2026
        (team_khaled_id, demo_org_id, 'team_member', 'خالد الغامدي', 'https://picsum.photos/seed/khaled/100/100', FALSE, '2026-01-05 10:00:00+00', '2026-01-05 10:00:00+00'),
        (team_noora_id,  demo_org_id, 'team_member', 'نورة السعد',  'https://picsum.photos/seed/noura/100/100',  FALSE, '2026-01-08 10:00:00+00', '2026-01-08 10:00:00+00'),
        -- Sponsors: 3 in Jan, 2 in Feb, 1 in March
        (sponsor_abdullah_id, demo_org_id, 'sponsor', 'عبدالله الراجحي', 'https://picsum.photos/seed/abdullah/100/100', FALSE, '2026-01-10 10:00:00+00', '2026-01-10 10:00:00+00'),
        (sponsor_fatma_id,    demo_org_id, 'sponsor', 'فاطمة الأحمد',    'https://picsum.photos/seed/fatima/100/100',    FALSE, '2026-01-12 10:00:00+00', '2026-01-12 10:00:00+00'),
        (sponsor_mohammad_id, demo_org_id, 'sponsor', 'محمد الشمري',   'https://picsum.photos/seed/mohammad/100/100',   FALSE, '2026-02-01 10:00:00+00', '2026-02-01 10:00:00+00'),
        (sponsor_muna_id,     demo_org_id, 'sponsor', 'منى العتيبي',     'https://picsum.photos/seed/muna/100/100',     FALSE, '2026-02-15 10:00:00+00', '2026-02-15 10:00:00+00'),
        (sponsor_saad_id,     demo_org_id, 'sponsor', 'سعد الدوسري',     'https://picsum.photos/seed/saad/100/100',     FALSE, '2026-03-01 10:00:00+00', '2026-03-01 10:00:00+00')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        is_system_admin = EXCLUDED.is_system_admin,
        updated_at = EXCLUDED.updated_at;

    -- -------------------------------------------------------------------------
    -- Permissions: super admin + manager (full), staff (limited)
    -- -------------------------------------------------------------------------
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES
        (super_admin_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
        (team_khaled_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
        (team_noora_id,  TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE)
    ON CONFLICT (user_id) DO UPDATE SET
        can_edit_orphans = EXCLUDED.can_edit_orphans,
        can_edit_sponsors = EXCLUDED.can_edit_sponsors,
        can_edit_transactions = EXCLUDED.can_edit_transactions,
        can_create_expense = EXCLUDED.can_create_expense,
        can_approve_expense = EXCLUDED.can_approve_expense,
        can_view_financials = EXCLUDED.can_view_financials,
        is_manager = EXCLUDED.is_manager;

    -- -------------------------------------------------------------------------
    -- Custom auth accounts (login: username or email, password: admin)
    -- -------------------------------------------------------------------------
    BEGIN
        SELECT create_user_account('admin', 'admin@yetim-demo.com', 'admin', super_admin_id) INTO auth_id;
        RAISE NOTICE 'Created account مدير النظام (admin@yetim-demo.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account مدير النظام: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('member.khaled', 'member.khaled@yetim.com', 'admin', team_khaled_id) INTO auth_id;
        RAISE NOTICE 'Created account خالد الغامدي (member.khaled@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account خالد الغامدي: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('member.noora', 'member.noora@yetim.com', 'admin', team_noora_id) INTO auth_id;
        RAISE NOTICE 'Created account نورة السعد (member.noora@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account نورة السعد: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('sponsor.abdullah', 'sponsor.abdullah@yetim.com', 'admin', sponsor_abdullah_id) INTO auth_id;
        RAISE NOTICE 'Created account عبدالله الراجحي (sponsor.abdullah@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account عبدالله الراجحي: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('sponsor.fatma', 'sponsor.fatma@yetim.com', 'admin', sponsor_fatma_id) INTO auth_id;
        RAISE NOTICE 'Created account فاطمة الأحمد (sponsor.fatma@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account فاطمة الأحمد: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('sponsor.mohammad', 'sponsor.mohammad@yetim.com', 'admin', sponsor_mohammad_id) INTO auth_id;
        RAISE NOTICE 'Created account محمد الشمري (sponsor.mohammad@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account محمد الشمري: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('sponsor.muna', 'sponsor.muna@yetim.com', 'admin', sponsor_muna_id) INTO auth_id;
        RAISE NOTICE 'Created account منى العتيبي (sponsor.muna@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account منى العتيبي: %', SQLERRM;
    END;
    BEGIN
        SELECT create_user_account('sponsor.saad', 'sponsor.saad@yetim.com', 'admin', sponsor_saad_id) INTO auth_id;
        RAISE NOTICE 'Created account سعد الدوسري (sponsor.saad@yetim.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Account سعد الدوسري: %', SQLERRM;
    END;

    RAISE NOTICE 'Demo org and users created. Run 008_demo_orphans_and_relationships.sql next.';
END $$;
