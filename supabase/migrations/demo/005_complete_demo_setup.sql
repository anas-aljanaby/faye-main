-- Complete Demo Setup with Custom Auth
-- This script sets up the complete demo environment with custom auth accounts
-- Run this after running the initial schema migration (001_initial_schema.sql)

-- ============================================================================
-- SETUP INSTRUCTIONS
-- ============================================================================
-- 1. Make sure you've run 001_initial_schema.sql (or 005_custom_auth.sql for existing DBs)
-- 2. Run this script to create the demo organization with all data and auth accounts
-- 3. Log in with any of the demo accounts (all passwords: "admin")
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    
    -- User profile IDs (using fixed UUIDs for consistency)
    team_member_khaled_id UUID := '11111111-1111-1111-1111-111111111111';
    team_member_noora_id UUID := '22222222-2222-2222-2222-222222222222';
    sponsor_abdullah_id UUID := '33333333-3333-3333-3333-333333333333';
    sponsor_fatma_id UUID := '44444444-4444-4444-4444-444444444444';
    
    auth_id UUID;
    tx1_id UUID;
    tx2_id UUID;
    tx3_id UUID;
    tx4_id UUID;
    tx5_id UUID;
    tx6_id UUID;
    receipt1_id UUID;
BEGIN
    RAISE NOTICE 'Starting complete demo setup...';
    
    -- ============================================================================
    -- STEP 1: CREATE DEMO ORGANIZATION
    -- ============================================================================
    INSERT INTO organizations (id, name) 
    VALUES (demo_org_id, 'منظمة فيء - Demo')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    
    -- ============================================================================
    -- STEP 2: CREATE USER PROFILES
    -- ============================================================================
    -- Team Members
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
    VALUES 
        (team_member_khaled_id, demo_org_id, 'team_member', 'خالد الغامدي', 'https://picsum.photos/seed/khaled/100/100'),
        (team_member_noora_id, demo_org_id, 'team_member', 'نورة السعد', 'https://picsum.photos/seed/noura/100/100')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url;

    -- Sponsors
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
    VALUES 
        (sponsor_abdullah_id, demo_org_id, 'sponsor', 'عبدالله الراجحي', 'https://picsum.photos/seed/abdullah/100/100'),
        (sponsor_fatma_id, demo_org_id, 'sponsor', 'فاطمة الأحمد', 'https://picsum.photos/seed/fatima/100/100')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url;

    -- ============================================================================
    -- STEP 3: CREATE USER PERMISSIONS
    -- ============================================================================
    -- Team Member 1 (خالد الغامدي) - Manager with all permissions
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (
        team_member_khaled_id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
    )
    ON CONFLICT (user_id) DO UPDATE SET
        can_edit_orphans = EXCLUDED.can_edit_orphans,
        can_edit_sponsors = EXCLUDED.can_edit_sponsors,
        can_edit_transactions = EXCLUDED.can_edit_transactions,
        can_create_expense = EXCLUDED.can_create_expense,
        can_approve_expense = EXCLUDED.can_approve_expense,
        can_view_financials = EXCLUDED.can_view_financials,
        is_manager = EXCLUDED.is_manager;

    -- Team Member 2 (نورة السعد) - Employee with limited permissions
    INSERT INTO user_permissions (
        user_id, can_edit_orphans, can_edit_sponsors, can_edit_transactions,
        can_create_expense, can_approve_expense, can_view_financials, is_manager
    )
    VALUES (
        team_member_noora_id, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, FALSE
    )
    ON CONFLICT (user_id) DO UPDATE SET
        can_edit_orphans = EXCLUDED.can_edit_orphans,
        can_edit_sponsors = EXCLUDED.can_edit_sponsors,
        can_edit_transactions = EXCLUDED.can_edit_transactions,
        can_create_expense = EXCLUDED.can_create_expense,
        can_approve_expense = EXCLUDED.can_approve_expense,
        can_view_financials = EXCLUDED.can_view_financials,
        is_manager = EXCLUDED.is_manager;

    -- ============================================================================
    -- STEP 4: CREATE AUTH ACCOUNTS
    -- ============================================================================
    RAISE NOTICE 'Creating auth accounts...';
    
    -- Create account for خالد الغامدي (member.khaled@faye.com)
    BEGIN
        SELECT create_user_account(
            'member.khaled',
            'member.khaled@faye.com',
            'admin',
            team_member_khaled_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for خالد الغامدي (member.khaled@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for خالد الغامدي already exists: %', SQLERRM;
    END;
    
    -- Create account for نورة السعد (member.noora@faye.com)
    BEGIN
        SELECT create_user_account(
            'member.noora',
            'member.noora@faye.com',
            'admin',
            team_member_noora_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for نورة السعد (member.noora@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for نورة السعد already exists: %', SQLERRM;
    END;
    
    -- Create account for عبدالله الراجحي (sponsor.abdullah@faye.com)
    BEGIN
        SELECT create_user_account(
            'sponsor.abdullah',
            'sponsor.abdullah@faye.com',
            'admin',
            sponsor_abdullah_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for عبدالله الراجحي (sponsor.abdullah@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for عبدالله الراجحي already exists: %', SQLERRM;
    END;
    
    -- Create account for فاطمة الأحمد (sponsor.fatma@faye.com)
    BEGIN
        SELECT create_user_account(
            'sponsor.fatma',
            'sponsor.fatma@faye.com',
            'admin',
            sponsor_fatma_id
        ) INTO auth_id;
        RAISE NOTICE '  ✓ Created account for فاطمة الأحمد (sponsor.fatma@faye.com)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠ Account for فاطمة الأحمد already exists: %', SQLERRM;
    END;

    -- ============================================================================
    -- STEP 5: CREATE ORPHANS
    -- ============================================================================
    INSERT INTO orphans (
        id, organization_id, name, photo_url, date_of_birth, gender,
        health_status, grade, country, governorate, attendance, performance,
        family_status, housing_status, guardian, sponsorship_type
    ) VALUES 
        (
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            demo_org_id,
            'أحمد خالد',
            'https://picsum.photos/seed/ahmad/200/200',
            '2010-05-15',
            'ذكر',
            'جيد',
            'الصف السابع',
            'اليمن',
            'صنعاء',
            'منتظم',
            'ممتاز',
            'يتيم الأب',
            'سكن مستأجر',
            'الجدة فاطمة',
            'كفالة كاملة'
        ),
        (
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            demo_org_id,
            'سارة علي',
            'https://picsum.photos/seed/sara/200/200',
            '2012-08-20',
            'أنثى',
            'جيد',
            'الصف الخامس',
            'اليمن',
            'تعز',
            'منتظم',
            'جيد جداً',
            'يتيمة الأبوين',
            'سكن مستأجر',
            'الخالة سعاد',
            'كفالة كاملة'
        ),
        (
            'cccccccc-cccc-cccc-cccc-cccccccccccc',
            demo_org_id,
            'يوسف محمد',
            'https://picsum.photos/seed/yusuf/200/200',
            '2009-03-10',
            'ذكر',
            'ممتاز',
            'الصف الثامن',
            'اليمن',
            'عدن',
            'منتظم',
            'ممتاز',
            'يتيم الأب',
            'سكن عائلي',
            'الأم',
            'كفالة جزئية'
        )
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- STEP 6: LINK SPONSORS TO ORPHANS
    -- ============================================================================
    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES 
        (sponsor_abdullah_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),  -- عبدالله sponsors أحمد
        (sponsor_abdullah_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),  -- عبدالله sponsors يوسف
        (sponsor_fatma_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')      -- فاطمة sponsors سارة
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    -- ============================================================================
    -- STEP 7: ADD SAMPLE DATA
    -- ============================================================================
    
    -- Payments
    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-02-01', '2024-02-01', 'مدفوع'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-03-01', NULL, 'مستحق'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50.00, '2024-02-01', NULL, 'متأخر'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-02-01', '2024-02-01', 'مدفوع'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-03-01', NULL, 'مستحق')
    ON CONFLICT DO NOTHING;

    -- 2025 Payments
    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    SELECT 
        id as orphan_id,
        50.00 as amount,
        '2025-08-01'::DATE as due_date,
        '2025-08-15'::DATE as paid_date,
        'مدفوع' as status
    FROM orphans
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    SELECT 
        id as orphan_id,
        50.00 as amount,
        '2025-09-01'::DATE as due_date,
        NULL as paid_date,
        'متأخر' as status
    FROM orphans
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    SELECT 
        id as orphan_id,
        50.00 as amount,
        '2025-10-01'::DATE as due_date,
        NULL as paid_date,
        'مستحق' as status
    FROM orphans
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    SELECT 
        id as orphan_id,
        50.00 as amount,
        '2025-11-01'::DATE as due_date,
        NULL as paid_date,
        'قيد المعالجة' as status
    FROM orphans
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Achievements
    INSERT INTO achievements (orphan_id, title, description, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'تفوق دراسي', 'حصل على المركز الأول في الصف', '2024-01-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'مشاركة في مسابقة', 'شارك في مسابقة الرسم', '2024-02-10'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'إنجاز رياضي', 'فاز في بطولة المدرسة', '2024-01-20')
    ON CONFLICT DO NOTHING;

    -- Special Occasions
    INSERT INTO special_occasions (orphan_id, title, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عيد الميلاد', '2024-05-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'عيد الميلاد', '2024-08-20'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عيد الميلاد', '2024-03-10')
    ON CONFLICT DO NOTHING;

    -- Gifts
    INSERT INTO gifts (orphan_id, "from", item, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عبدالله الراجحي', 'دراجة هوائية', '2024-01-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'فاطمة الأحمد', 'لعبة تعليمية', '2024-02-10'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عبدالله الراجحي', 'كتب علمية', '2024-01-20')
    ON CONFLICT DO NOTHING;

    -- Family Members
    INSERT INTO family_members (orphan_id, relationship, age)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'الجدة', 65),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'العم', 35),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'الخالة', 40),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأم', 38),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأخت', 12)
    ON CONFLICT DO NOTHING;

    -- Program Participations
    INSERT INTO program_participations (orphan_id, program_type, status, details)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'educational', 'مكتمل', 'أكمل برنامج الدعم التعليمي'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'psychological_child', 'ملتحق', 'جلسات دعم نفسي منتظمة'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'psychological_child', 'بحاجة للتقييم', 'يحتاج تقييم نفسي'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'psychological_guardian', 'غير ملتحق', 'لم يبدأ بعد'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'psychological_guardian', 'ملتحق', 'جلسات دعم للوالدة')
    ON CONFLICT (orphan_id, program_type) DO NOTHING;

    -- Update Logs
    INSERT INTO update_logs (orphan_id, author_id, note)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', team_member_khaled_id, 'تمت زيارة اليتيم في المنزل. الوضع مستقر.'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', team_member_noora_id, 'تم التنسيق مع المدرسة لمتابعة الأداء الدراسي.'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', team_member_khaled_id, 'تم تحديث البيانات الصحية. الوضع جيد.')
    ON CONFLICT DO NOTHING;

    -- Tasks
    INSERT INTO tasks (team_member_id, title, due_date, completed, orphan_id)
    VALUES 
        (team_member_khaled_id, 'متابعة حالة الدفعة المتأخرة لأحمد', '2024-03-15', FALSE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
        (team_member_khaled_id, 'زيارة منزلية ليوسف', '2024-03-20', FALSE, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
        (team_member_noora_id, 'التنسيق مع المدرسة لسارة', '2024-03-18', FALSE, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
        (team_member_khaled_id, 'تحديث ملف أحمد', '2024-03-10', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    ON CONFLICT DO NOTHING;

    -- Financial Transactions
    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date
    )
    VALUES (
        demo_org_id, 'شراء وجبات طعام للرحلة', team_member_noora_id, 80.00, 'مرفوضة', 'مصروفات', '2025-05-15'
    )
    RETURNING id INTO tx1_id;

    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date
    )
    VALUES (
        demo_org_id, '[كفالة يتيم] - دفعة شهر يوليو', team_member_khaled_id, 100.00, 'مكتملة', 'إيرادات', '2025-07-20'
    )
    RETURNING id INTO tx2_id;

    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date
    )
    VALUES (
        demo_org_id, 'مصاريف صيانة السكن', team_member_khaled_id, 250.00, 'مكتملة', 'مصروفات', '2025-10-10'
    )
    RETURNING id INTO tx3_id;

    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date, orphan_id
    )
    VALUES (
        demo_org_id, 'رسوم دراسية', team_member_noora_id, 400.00, 'قيد المراجعة', 'مصروفات', '2025-09-15', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    )
    RETURNING id INTO tx4_id;

    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date
    )
    VALUES (
        demo_org_id, 'دعم من منظمة خارجية', team_member_khaled_id, 1000.00, 'مكتملة', 'إيرادات', '2025-12-01'
    )
    RETURNING id INTO tx5_id;

    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type, date, orphan_id
    )
    VALUES (
        demo_org_id, 'شراء ملابس العيد', team_member_noora_id, 320.00, 'قيد المراجعة', 'مصروفات', '2025-11-10', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
    RETURNING id INTO tx6_id;

    -- Create receipt for transaction 2
    INSERT INTO receipts (
        transaction_id, sponsor_id, donation_category, amount, date, description
    )
    VALUES (
        tx2_id, sponsor_abdullah_id, 'كفالة يتيم', 100.00, '2025-07-20', 'دفعة شهر يوليو'
    )
    RETURNING id INTO receipt1_id;

    -- Link orphans to receipt
    INSERT INTO receipt_orphans (receipt_id, orphan_id)
    VALUES 
        (receipt1_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
        (receipt1_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Demo setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Login Credentials (all passwords: "admin"):';
    RAISE NOTICE '  Team Members:';
    RAISE NOTICE '    - member.khaled@faye.com (or member.khaled)';
    RAISE NOTICE '    - member.noora@faye.com (or member.noora)';
    RAISE NOTICE '  Sponsors:';
    RAISE NOTICE '    - sponsor.abdullah@faye.com (or sponsor.abdullah)';
    RAISE NOTICE '    - sponsor.fatma@faye.com (or sponsor.fatma)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 1 organization';
    RAISE NOTICE '  - 2 team members (with permissions)';
    RAISE NOTICE '  - 2 sponsors';
    RAISE NOTICE '  - 3 orphans';
    RAISE NOTICE '  - Sample data (payments, achievements, etc.)';
    RAISE NOTICE '';
    
END $$;
