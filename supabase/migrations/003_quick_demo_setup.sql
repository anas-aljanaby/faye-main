-- Quick Demo Setup Script
-- INSTRUCTIONS:
-- 1. Create 4 users in Supabase Dashboard > Authentication > Users
-- 2. Copy their User IDs (UUIDs) from the Authentication dashboard
-- 3. Replace the placeholder UUIDs below (search for "REPLACE_ME")
-- 4. Run this script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: REPLACE THESE UUIDs WITH YOUR ACTUAL AUTH USER IDs
-- Get these from: Supabase Dashboard > Authentication > Users
-- ============================================================================

DO $$
DECLARE
    -- REPLACE THESE WITH YOUR ACTUAL USER IDs FROM AUTH DASHBOARD
    team_member_1_id UUID := '6a65d2a0-0525-48f2-827d-6a2de3aa024a';  -- REPLACE_ME
    team_member_2_id UUID := '31983d90-75f3-454d-9226-6ed82509d8c8';  -- REPLACE_ME
    sponsor_1_id UUID := 'a888c094-2bcb-4999-9ac5-b1df6c94fd1c';      -- REPLACE_ME
    sponsor_2_id UUID := '659cfd87-e813-4a8a-ab69-6599d2d34854';      -- REPLACE_ME
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- ============================================================================
    -- CREATE DEMO ORGANIZATION
    -- ============================================================================
    INSERT INTO organizations (id, name) 
    VALUES (demo_org_id, 'منظمة فيء - Demo')
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- CREATE USER PROFILES
    -- ============================================================================
    -- Team Members
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
    VALUES 
        (team_member_1_id, demo_org_id, 'team_member', 'خالد الغامدي', 'https://ui-avatars.com/api/?name=خالد+الغامدي&background=8c1c3e&color=fff'),
        (team_member_2_id, demo_org_id, 'team_member', 'سارة أحمد', 'https://ui-avatars.com/api/?name=سارة+أحمد&background=8c1c3e&color=fff')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url;

    -- Sponsors
    INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
    VALUES 
        (sponsor_1_id, demo_org_id, 'sponsor', 'عبدالله الراجحي', 'https://ui-avatars.com/api/?name=عبدالله+الراجحي&background=10b981&color=fff'),
        (sponsor_2_id, demo_org_id, 'sponsor', 'فاطمة الأحمد', 'https://ui-avatars.com/api/?name=فاطمة+الأحمد&background=10b981&color=fff')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url;

    -- ============================================================================
    -- CREATE ORPHANS
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
            'https://ui-avatars.com/api/?name=أحمد+خالد&background=8c1c3e&color=fff',
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
            'مريم علي',
            'https://ui-avatars.com/api/?name=مريم+علي&background=8c1c3e&color=fff',
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
            'https://ui-avatars.com/api/?name=يوسف+محمد&background=8c1c3e&color=fff',
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
    -- LINK SPONSORS TO ORPHANS
    -- ============================================================================
    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES 
        (sponsor_1_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),  -- عبدالله sponsors أحمد
        (sponsor_1_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),  -- عبدالله sponsors يوسف
        (sponsor_2_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')   -- فاطمة sponsors مريم
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    -- ============================================================================
    -- LINK TEAM MEMBERS TO ORPHANS
    -- ============================================================================
    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES 
        (team_member_1_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),  -- خالد assigned to أحمد
        (team_member_1_id, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),  -- خالد assigned to يوسف
        (team_member_2_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')   -- سارة assigned to مريم
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    -- ============================================================================
    -- ADD SAMPLE DATA
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
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-03-01', NULL, 'مستحق');

    -- Achievements
    INSERT INTO achievements (orphan_id, title, description, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'تفوق دراسي', 'حصل على المركز الأول في الصف', '2024-01-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'مشاركة في مسابقة', 'شارك في مسابقة الرسم', '2024-02-10'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'إنجاز رياضي', 'فاز في بطولة المدرسة', '2024-01-20');

    -- Special Occasions
    INSERT INTO special_occasions (orphan_id, title, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عيد الميلاد', '2024-05-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'عيد الميلاد', '2024-08-20'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عيد الميلاد', '2024-03-10');

    -- Gifts
    INSERT INTO gifts (orphan_id, "from", item, date)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عبدالله الراجحي', 'دراجة هوائية', '2024-01-15'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'فاطمة الأحمد', 'لعبة تعليمية', '2024-02-10'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عبدالله الراجحي', 'كتب علمية', '2024-01-20');

    -- Family Members
    INSERT INTO family_members (orphan_id, relationship, age)
    VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'الجدة', 65),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'العم', 35),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'الخالة', 40),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأم', 38),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأخت', 12);

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
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', team_member_1_id, 'تمت زيارة اليتيم في المنزل. الوضع مستقر.'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', team_member_2_id, 'تم التنسيق مع المدرسة لمتابعة الأداء الدراسي.'),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', team_member_1_id, 'تم تحديث البيانات الصحية. الوضع جيد.');

    -- Tasks
    INSERT INTO tasks (team_member_id, title, due_date, completed, orphan_id)
    VALUES 
        (team_member_1_id, 'متابعة حالة الدفعة المتأخرة لأحمد', '2024-03-15', FALSE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
        (team_member_1_id, 'زيارة منزلية ليوسف', '2024-03-20', FALSE, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
        (team_member_2_id, 'التنسيق مع المدرسة لمريم', '2024-03-18', FALSE, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
        (team_member_1_id, 'تحديث ملف أحمد', '2024-03-10', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

    -- Financial Transactions
    INSERT INTO financial_transactions (
        organization_id, description, created_by_id, amount, status, type
    )
    VALUES 
        (demo_org_id, '[كفالة يتيم] - كفالة شهرية لشهر يناير', team_member_1_id, 100.00, 'مكتملة', 'إيرادات'),
        (demo_org_id, '[كفالة يتيم] - كفالة شهرية لشهر يناير', team_member_1_id, 50.00, 'مكتملة', 'إيرادات'),
        (demo_org_id, '[تبرع عام] - تبرع للمشاريع التعليمية', team_member_1_id, 500.00, 'مكتملة', 'إيرادات'),
        (demo_org_id, 'مصروفات طبية - فحوصات دورية', team_member_1_id, 150.00, 'مكتملة', 'مصروفات');

    RAISE NOTICE 'Demo organization setup completed successfully!';
    RAISE NOTICE 'Created: 1 org, 2 team members, 2 sponsors, 3 orphans, and sample data';
END $$;
