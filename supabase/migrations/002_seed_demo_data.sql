-- Seed Demo Organization Data
-- This script creates a demo organization with sample team members, sponsors, and orphans
-- Note: You'll need to create auth users first, then update the user IDs in this script

-- ============================================================================
-- STEP 1: Create Demo Organization
-- ============================================================================

INSERT INTO organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'منظمة فيء - Demo')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Auth Users (if not using Supabase Dashboard)
-- ============================================================================
-- Note: In Supabase, you typically create users through the Auth dashboard
-- or via the API. For this script, we'll assume you'll create users and
-- then update the UUIDs below.

-- Example: Create users via SQL (requires auth schema access)
-- You can also create users via Supabase Dashboard > Authentication > Users

-- ============================================================================
-- STEP 3: Create User Profiles
-- ============================================================================
-- IMPORTANT: Replace the UUIDs below with actual auth.users IDs from your Supabase project
-- You can get these from: Supabase Dashboard > Authentication > Users

-- Team Members
-- Replace these UUIDs with your actual auth user IDs
INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
VALUES 
    -- Team Member 1 (replace with actual auth user ID)
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'team_member', 'خالد الغامدي', 'https://ui-avatars.com/api/?name=خالد+الغامدي&background=8c1c3e&color=fff'),
    -- Team Member 2 (replace with actual auth user ID)
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'team_member', 'سارة أحمد', 'https://ui-avatars.com/api/?name=سارة+أحمد&background=8c1c3e&color=fff')
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;

-- Sponsors
INSERT INTO user_profiles (id, organization_id, role, name, avatar_url)
VALUES 
    -- Sponsor 1 (replace with actual auth user ID)
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'sponsor', 'عبدالله الراجحي', 'https://ui-avatars.com/api/?name=عبدالله+الراجحي&background=10b981&color=fff'),
    -- Sponsor 2 (replace with actual auth user ID)
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'sponsor', 'فاطمة الأحمد', 'https://ui-avatars.com/api/?name=فاطمة+الأحمد&background=10b981&color=fff')
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;

-- ============================================================================
-- STEP 4: Create Orphans
-- ============================================================================

INSERT INTO orphans (
    id, organization_id, name, photo_url, date_of_birth, gender,
    health_status, grade, country, governorate, attendance, performance,
    family_status, housing_status, guardian, sponsorship_type
) VALUES 
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '00000000-0000-0000-0000-000000000001',
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
        '00000000-0000-0000-0000-000000000001',
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
        '00000000-0000-0000-0000-000000000001',
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
-- STEP 5: Link Sponsors to Orphans
-- ============================================================================

INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
VALUES 
    -- عبدالله الراجحي sponsors أحمد and يوسف
    ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    -- فاطمة الأحمد sponsors مريم
    ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Link Team Members to Orphans (Assignments)
-- ============================================================================

INSERT INTO team_member_orphans (team_member_id, orphan_id)
VALUES 
    -- خالد الغامدي assigned to أحمد and يوسف
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    -- سارة أحمد assigned to مريم
    ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

-- ============================================================================
-- STEP 7: Add Sample Payments
-- ============================================================================

INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
VALUES 
    -- Payments for أحمد
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-02-01', '2024-02-01', 'مدفوع'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 50.00, '2024-03-01', NULL, 'مستحق'),
    -- Payments for مريم
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50.00, '2024-02-01', NULL, 'متأخر'),
    -- Payments for يوسف
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-01-01', '2024-01-01', 'مدفوع'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-02-01', '2024-02-01', 'مدفوع'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, '2024-03-01', NULL, 'مستحق');

-- ============================================================================
-- STEP 8: Add Sample Achievements
-- ============================================================================

INSERT INTO achievements (orphan_id, title, description, date, media_url, media_type)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'تفوق دراسي', 'حصل على المركز الأول في الصف', '2024-01-15', NULL, NULL),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'مشاركة في مسابقة', 'شارك في مسابقة الرسم', '2024-02-10', NULL, NULL),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'إنجاز رياضي', 'فاز في بطولة المدرسة', '2024-01-20', NULL, NULL);

-- ============================================================================
-- STEP 9: Add Sample Special Occasions
-- ============================================================================

INSERT INTO special_occasions (orphan_id, title, date)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عيد الميلاد', '2024-05-15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'عيد الميلاد', '2024-08-20'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عيد الميلاد', '2024-03-10');

-- ============================================================================
-- STEP 10: Add Sample Gifts
-- ============================================================================

INSERT INTO gifts (orphan_id, "from", item, date)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'عبدالله الراجحي', 'دراجة هوائية', '2024-01-15'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'فاطمة الأحمد', 'لعبة تعليمية', '2024-02-10'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'عبدالله الراجحي', 'كتب علمية', '2024-01-20');

-- ============================================================================
-- STEP 11: Add Sample Family Members
-- ============================================================================

INSERT INTO family_members (orphan_id, relationship, age)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'الجدة', 65),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'العم', 35),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'الخالة', 40),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأم', 38),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'الأخت', 12);

-- ============================================================================
-- STEP 12: Add Sample Program Participations
-- ============================================================================

INSERT INTO program_participations (orphan_id, program_type, status, details)
VALUES 
    -- Educational programs
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'educational', 'مكتمل', 'أكمل برنامج الدعم التعليمي'),
    -- Psychological support for children
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'psychological_child', 'ملتحق', 'جلسات دعم نفسي منتظمة'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'psychological_child', 'بحاجة للتقييم', 'يحتاج تقييم نفسي'),
    -- Psychological support for guardians
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'psychological_guardian', 'غير ملتحق', 'لم يبدأ بعد'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'psychological_guardian', 'ملتحق', 'جلسات دعم للوالدة')
ON CONFLICT (orphan_id, program_type) DO NOTHING;

-- ============================================================================
-- STEP 13: Add Sample Update Logs
-- ============================================================================

INSERT INTO update_logs (orphan_id, author_id, note)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'تمت زيارة اليتيم في المنزل. الوضع مستقر.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'تم التنسيق مع المدرسة لمتابعة الأداء الدراسي.'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'تم تحديث البيانات الصحية. الوضع جيد.');

-- ============================================================================
-- STEP 14: Add Sample Tasks
-- ============================================================================

INSERT INTO tasks (team_member_id, title, due_date, completed, orphan_id)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'متابعة حالة الدفعة المتأخرة لأحمد', '2024-03-15', FALSE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'زيارة منزلية ليوسف', '2024-03-20', FALSE, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    ('22222222-2222-2222-2222-222222222222', 'التنسيق مع المدرسة لمريم', '2024-03-18', FALSE, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('11111111-1111-1111-1111-111111111111', 'تحديث ملف أحمد', '2024-03-10', TRUE, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================================================
-- STEP 15: Add Sample Financial Transactions
-- ============================================================================

-- First, create some income transactions
INSERT INTO financial_transactions (
    organization_id, description, created_by_id, amount, status, type
)
VALUES 
    (
        '00000000-0000-0000-0000-000000000001',
        '[كفالة يتيم] - كفالة شهرية لشهر يناير',
        '11111111-1111-1111-1111-111111111111',
        100.00,
        'مكتملة',
        'إيرادات'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        '[كفالة يتيم] - كفالة شهرية لشهر يناير',
        '11111111-1111-1111-1111-111111111111',
        50.00,
        'مكتملة',
        'إيرادات'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        '[تبرع عام] - تبرع للمشاريع التعليمية',
        '11111111-1111-1111-1111-111111111111',
        500.00,
        'مكتملة',
        'إيرادات'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'مصروفات طبية - فحوصات دورية',
        '11111111-1111-1111-1111-111111111111',
        150.00,
        'مكتملة',
        'مصروفات'
    )
RETURNING id;

-- Now create receipts for the income transactions
-- Note: You'll need to get the transaction IDs from above and update these
-- For now, using placeholder logic - in practice, you'd use the RETURNING values

-- This is a template - you'll need to run this after getting the transaction IDs
-- INSERT INTO receipts (transaction_id, sponsor_id, donation_category, amount, date, description)
-- VALUES 
--     (
--         '<transaction_id_from_above>',
--         '33333333-3333-3333-3333-333333333333',
--         'كفالة يتيم',
--         100.00,
--         '2024-01-01',
--         'كفالة شهرية لشهر يناير'
--     );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

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

