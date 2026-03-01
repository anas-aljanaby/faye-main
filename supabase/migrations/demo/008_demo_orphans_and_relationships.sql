-- ============================================================================
-- Demo: Orphans and Relationships
-- ============================================================================
-- Orphans with join dates: most Jan 2026, some Feb, fewer March.
-- Links: sponsor_orphans, team_member_orphans (assignments), sponsor_team_members.
--
-- Site components: Orphans list, Orphan profile, Sponsors list, Sponsor profile,
-- Dashboard (sponsored orphans, assignments), Payments (per-orphan).
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    team_khaled_id UUID := '11111111-1111-1111-1111-111111111111';
    team_noora_id  UUID := '22222222-2222-2222-2222-222222222222';
    sponsor_abdullah_id UUID := '33333333-3333-3333-3333-333333333333';
    sponsor_fatma_id    UUID := '44444444-4444-4444-444444444444';
    sponsor_mohammad_id UUID := '55555555-5555-5555-5555-555555555555';
    sponsor_muna_id     UUID := '66666666-6666-6666-6666-666666666666';
    sponsor_saad_id     UUID := '77777777-7777-7777-7777-777777777777';
    -- Orphan IDs: 12 Jan, 5 Feb, 3 March (20 total)
    orphan_ahmad_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    orphan_sara_id  UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    orphan_yusuf_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    orphan_layla_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    orphan_omar_id  UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    orphan_haya_id  UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    orphan_noor_id  UUID := 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
    orphan_rami_id  UUID := 'f1000001-0001-0001-0001-000000000001';
    orphan_mariam_id UUID := 'f1000002-0002-0002-0002-000000000002';
    orphan_kareem_id UUID := 'f1000003-0003-0003-0003-000000000003';
    orphan_dana_id  UUID := 'f1000004-0004-0004-0004-000000000004';
    orphan_fadi_id  UUID := 'f1000005-0005-0005-0005-000000000005';
    orphan_lama_id  UUID := 'f1000006-0006-0006-0006-000000000006';
    orphan_reem_id  UUID := 'f1000007-0007-0007-0007-000000000007';
    orphan_wael_id  UUID := 'f1000008-0008-0008-0008-000000000008';
    orphan_tala_id  UUID := 'f1000009-0009-0009-0009-000000000009';
    orphan_nasser_id UUID := 'f100000a-000a-000a-000a-00000000000a';
    orphan_jana_id  UUID := 'f100000b-000b-000b-000b-00000000000b';
    orphan_yasser_id UUID := 'f100000c-000c-000c-000c-00000000000c';
    orphan_lamia_id UUID := 'f100000d-000d-000d-000d-00000000000d';
BEGIN
    -- -------------------------------------------------------------------------
    -- Orphans: 20 total. 12 joined Jan, 5 Feb, 3 March
    -- -------------------------------------------------------------------------
    INSERT INTO orphans (
        id, organization_id, name, photo_url, date_of_birth, gender,
        health_status, grade, country, governorate, attendance, performance,
        family_status, housing_status, guardian, sponsorship_type, created_at, updated_at
    ) VALUES
        -- January 2026 (12)
        (orphan_ahmad_id, demo_org_id, 'أحمد خالد', 'https://picsum.photos/seed/ahmad/200/200', '2010-05-15', 'ذكر', 'جيد', 'الصف السابع', 'اليمن', 'صنعاء', 'منتظم', 'ممتاز', 'يتيم الأب', 'سكن مستأجر', 'الجدة فاطمة', 'كفالة كاملة', '2026-01-06 09:00:00+00', '2026-01-06 09:00:00+00'),
        (orphan_sara_id,  demo_org_id, 'سارة علي',  'https://picsum.photos/seed/sara/200/200',  '2012-08-20', 'أنثى', 'جيد', 'الصف الخامس', 'اليمن', 'تعز', 'منتظم', 'جيد جداً', 'يتيمة الأبوين', 'سكن مستأجر', 'الخالة سعاد', 'كفالة كاملة', '2026-01-07 09:00:00+00', '2026-01-07 09:00:00+00'),
        (orphan_yusuf_id, demo_org_id, 'يوسف محمد', 'https://picsum.photos/seed/yusuf/200/200', '2009-03-10', 'ذكر', 'ممتاز', 'الصف الثامن', 'اليمن', 'عدن', 'منتظم', 'ممتاز', 'يتيم الأب', 'سكن عائلي', 'الأم', 'كفالة جزئية', '2026-01-09 09:00:00+00', '2026-01-09 09:00:00+00'),
        (orphan_layla_id, demo_org_id, 'ليلى حسن',  'https://picsum.photos/seed/layla/200/200',  '2011-11-22', 'أنثى', 'جيد جداً', 'الصف السادس', 'اليمن', 'صنعاء', 'منتظم', 'جيد جداً', 'يتيمة الأب', 'سكن عائلي', 'العم', 'كفالة كاملة', '2026-01-14 09:00:00+00', '2026-01-14 09:00:00+00'),
        (orphan_rami_id,  demo_org_id, 'رامي سعد',  'https://picsum.photos/seed/rami/200/200',  '2010-01-10', 'ذكر', 'جيد', 'الصف السابع', 'اليمن', 'صنعاء', 'منتظم', 'جيد', 'يتيم الأب', 'سكن مستأجر', 'الأم', 'كفالة كاملة', '2026-01-11 09:00:00+00', '2026-01-11 09:00:00+00'),
        (orphan_mariam_id, demo_org_id, 'مريم حسين', 'https://picsum.photos/seed/mariam/200/200', '2012-04-18', 'أنثى', 'ممتاز', 'الصف الخامس', 'اليمن', 'تعز', 'منتظم', 'ممتاز', 'يتيمة الأبوين', 'سكن عائلي', 'الخالة', 'كفالة كاملة', '2026-01-12 09:00:00+00', '2026-01-12 09:00:00+00'),
        (orphan_kareem_id, demo_org_id, 'كريم علي', 'https://picsum.photos/seed/kareem/200/200', '2011-09-05', 'ذكر', 'جيد جداً', 'الصف السادس', 'اليمن', 'عدن', 'منتظم', 'جيد جداً', 'يتيم الأب', 'سكن مستأجر', 'الجدة', 'كفالة جزئية', '2026-01-13 09:00:00+00', '2026-01-13 09:00:00+00'),
        (orphan_dana_id,  demo_org_id, 'دانة عمر',  'https://picsum.photos/seed/dana/200/200',  '2013-06-22', 'أنثى', 'جيد', 'الصف الرابع', 'اليمن', 'صنعاء', 'منتظم', 'جيد', 'يتيمة الأب', 'سكن مستأجر', 'الأم', 'كفالة كاملة', '2026-01-15 09:00:00+00', '2026-01-15 09:00:00+00'),
        (orphan_fadi_id,  demo_org_id, 'فادي ناصر', 'https://picsum.photos/seed/fadi/200/200',  '2009-12-01', 'ذكر', 'ممتاز', 'الصف الثامن', 'اليمن', 'تعز', 'منتظم', 'ممتاز', 'يتيم الأبوين', 'سكن عائلي', 'العم', 'كفالة كاملة', '2026-01-16 09:00:00+00', '2026-01-16 09:00:00+00'),
        (orphan_lama_id,  demo_org_id, 'لمى وائل',  'https://picsum.photos/seed/lama/200/200',  '2014-02-14', 'أنثى', 'جيد جداً', 'الصف الثالث', 'اليمن', 'عدن', 'منتظم', 'جيد جداً', 'يتيمة الأب', 'سكن مستأجر', 'الجدة', 'كفالة جزئية', '2026-01-17 09:00:00+00', '2026-01-17 09:00:00+00'),
        (orphan_reem_id,  demo_org_id, 'ريم خالد',  'https://picsum.photos/seed/reem/200/200',  '2012-10-30', 'أنثى', 'جيد', 'الصف الخامس', 'اليمن', 'صنعاء', 'منتظم', 'جيد', 'يتيمة الأبوين', 'سكن عائلي', 'الخالة', 'كفالة كاملة', '2026-01-18 09:00:00+00', '2026-01-18 09:00:00+00'),
        (orphan_wael_id,  demo_org_id, 'وائل أحمد',  'https://picsum.photos/seed/wael/200/200',  '2010-07-12', 'ذكر', 'ممتاز', 'الصف السابع', 'اليمن', 'تعز', 'منتظم', 'ممتاز', 'يتيم الأب', 'سكن مستأجر', 'الأم', 'كفالة كاملة', '2026-01-19 09:00:00+00', '2026-01-19 09:00:00+00'),
        -- February 2026 (5)
        (orphan_omar_id,  demo_org_id, 'عمر إبراهيم', 'https://picsum.photos/seed/omar/200/200',  '2013-02-14', 'ذكر', 'جيد', 'الصف الرابع', 'اليمن', 'تعز', 'منتظم', 'جيد', 'يتيم الأبوين', 'سكن مستأجر', 'الجدة', 'كفالة كاملة', '2026-02-03 09:00:00+00', '2026-02-03 09:00:00+00'),
        (orphan_haya_id,  demo_org_id, 'هيا محمود',  'https://picsum.photos/seed/haya/200/200',  '2014-07-08', 'أنثى', 'ممتاز', 'الصف الثالث', 'اليمن', 'عدن', 'منتظم', 'ممتاز', 'يتيمة الأب', 'سكن مستأجر', 'الأم', 'كفالة جزئية', '2026-02-18 09:00:00+00', '2026-02-18 09:00:00+00'),
        (orphan_tala_id,  demo_org_id, 'تالا سامي',  'https://picsum.photos/seed/tala/200/200',  '2013-11-20', 'أنثى', 'جيد جداً', 'الصف الرابع', 'اليمن', 'صنعاء', 'منتظم', 'جيد جداً', 'يتيمة الأب', 'سكن عائلي', 'العم', 'كفالة كاملة', '2026-02-05 09:00:00+00', '2026-02-05 09:00:00+00'),
        (orphan_nasser_id, demo_org_id, 'ناصر محمود', 'https://picsum.photos/seed/nasser/200/200', '2011-05-03', 'ذكر', 'جيد', 'الصف السادس', 'اليمن', 'عدن', 'منتظم', 'جيد', 'يتيم الأبوين', 'سكن مستأجر', 'الجدة', 'كفالة جزئية', '2026-02-12 09:00:00+00', '2026-02-12 09:00:00+00'),
        (orphan_jana_id,  demo_org_id, 'جنى يوسف',  'https://picsum.photos/seed/jana/200/200',  '2014-08-15', 'أنثى', 'ممتاز', 'الصف الثالث', 'اليمن', 'تعز', 'منتظم', 'ممتاز', 'يتيمة الأب', 'سكن مستأجر', 'الأم', 'كفالة كاملة', '2026-02-20 09:00:00+00', '2026-02-20 09:00:00+00'),
        -- March 2026 (3)
        (orphan_noor_id,  demo_org_id, 'نور أحمد',   'https://picsum.photos/seed/noor/200/200',  '2015-04-01', 'أنثى', 'جيد', 'الصف الثاني', 'اليمن', 'صنعاء', 'منتظم', 'جيد جداً', 'يتيمة الأبوين', 'سكن مستأجر', 'الخالة', 'كفالة كاملة', '2026-03-05 09:00:00+00', '2026-03-05 09:00:00+00'),
        (orphan_yasser_id, demo_org_id, 'ياسر فهد', 'https://picsum.photos/seed/yasser/200/200', '2012-01-25', 'ذكر', 'جيد جداً', 'الصف الخامس', 'اليمن', 'صنعاء', 'منتظم', 'جيد جداً', 'يتيم الأب', 'سكن عائلي', 'الأم', 'كفالة كاملة', '2026-03-08 09:00:00+00', '2026-03-08 09:00:00+00'),
        (orphan_lamia_id, demo_org_id, 'لمياء كريم', 'https://picsum.photos/seed/lamia/200/200', '2015-09-10', 'أنثى', 'جيد', 'الصف الأول', 'اليمن', 'تعز', 'منتظم', 'جيد', 'يتيمة الأبوين', 'سكن مستأجر', 'الجدة', 'كفالة جزئية', '2026-03-15 09:00:00+00', '2026-03-15 09:00:00+00')
    ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        name = EXCLUDED.name,
        photo_url = EXCLUDED.photo_url,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        health_status = EXCLUDED.health_status,
        grade = EXCLUDED.grade,
        country = EXCLUDED.country,
        governorate = EXCLUDED.governorate,
        attendance = EXCLUDED.attendance,
        performance = EXCLUDED.performance,
        family_status = EXCLUDED.family_status,
        housing_status = EXCLUDED.housing_status,
        guardian = EXCLUDED.guardian,
        sponsorship_type = EXCLUDED.sponsorship_type,
        updated_at = EXCLUDED.updated_at;

    -- -------------------------------------------------------------------------
    -- Sponsor–Orphan links (all 20 orphans have at least one sponsor)
    -- -------------------------------------------------------------------------
    INSERT INTO sponsor_orphans (sponsor_id, orphan_id)
    VALUES
        (sponsor_abdullah_id, orphan_ahmad_id),
        (sponsor_abdullah_id, orphan_yusuf_id),
        (sponsor_abdullah_id, orphan_rami_id),
        (sponsor_abdullah_id, orphan_kareem_id),
        (sponsor_abdullah_id, orphan_wael_id),
        (sponsor_fatma_id,    orphan_sara_id),
        (sponsor_fatma_id,    orphan_mariam_id),
        (sponsor_fatma_id,    orphan_reem_id),
        (sponsor_muna_id,     orphan_layla_id),
        (sponsor_muna_id,     orphan_dana_id),
        (sponsor_muna_id,     orphan_lama_id),
        (sponsor_mohammad_id, orphan_omar_id),
        (sponsor_mohammad_id, orphan_haya_id),
        (sponsor_mohammad_id, orphan_fadi_id),
        (sponsor_mohammad_id, orphan_nasser_id),
        (sponsor_mohammad_id, orphan_jana_id),
        (sponsor_saad_id,     orphan_noor_id),
        (sponsor_saad_id,     orphan_tala_id),
        (sponsor_saad_id,     orphan_yasser_id),
        (sponsor_saad_id,     orphan_lamia_id)
    ON CONFLICT (sponsor_id, orphan_id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Team member–Orphan assignments (for tasks / “my orphans” views)
    -- -------------------------------------------------------------------------
    INSERT INTO team_member_orphans (team_member_id, orphan_id)
    VALUES
        (team_khaled_id, orphan_ahmad_id),
        (team_khaled_id, orphan_yusuf_id),
        (team_khaled_id, orphan_omar_id),
        (team_khaled_id, orphan_rami_id),
        (team_khaled_id, orphan_kareem_id),
        (team_khaled_id, orphan_fadi_id),
        (team_khaled_id, orphan_wael_id),
        (team_khaled_id, orphan_nasser_id),
        (team_khaled_id, orphan_yasser_id),
        (team_noora_id,  orphan_sara_id),
        (team_noora_id,  orphan_layla_id),
        (team_noora_id,  orphan_haya_id),
        (team_noora_id,  orphan_noor_id),
        (team_noora_id,  orphan_mariam_id),
        (team_noora_id,  orphan_dana_id),
        (team_noora_id,  orphan_lama_id),
        (team_noora_id,  orphan_reem_id),
        (team_noora_id,  orphan_tala_id),
        (team_noora_id,  orphan_jana_id),
        (team_noora_id,  orphan_lamia_id)
    ON CONFLICT (team_member_id, orphan_id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Sponsor–Team member (primary contact)
    -- -------------------------------------------------------------------------
    INSERT INTO sponsor_team_members (sponsor_id, team_member_id)
    VALUES
        (sponsor_abdullah_id, team_khaled_id),
        (sponsor_fatma_id,    team_noora_id),
        (sponsor_mohammad_id, team_khaled_id),
        (sponsor_muna_id,     team_noora_id),
        (sponsor_saad_id,     team_noora_id)
    ON CONFLICT (sponsor_id, team_member_id) DO NOTHING;

    RAISE NOTICE 'Demo orphans and relationships created. Run 009_demo_orphan_data.sql next.';
END $$;
