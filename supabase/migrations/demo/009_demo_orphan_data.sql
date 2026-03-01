-- ============================================================================
-- Demo: Orphan-Related Data (Payments, Achievements, Occasions, Gifts, etc.)
-- ============================================================================
-- Payments: most paid Jan/Feb; March = mix (paid, pending, late, قيد المعالجة).
-- Edge cases: one orphan (نور) with no payments paid; one (سارة) with late.
-- Occasions: orphan_specific, organization_wide, multi_orphan with occasion_orphans.
--
-- Site components: Orphan profile (payments, achievements, occasions, gifts,
-- family, programs, update log), Dashboard (upcoming occasions, payments).
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    team_khaled_id UUID := '11111111-1111-1111-1111-111111111111';
    team_noora_id  UUID := '22222222-2222-2222-2222-222222222222';
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
    -- Payments: timeline 2026-01-01 .. 2026-03-31. Most paid Jan/Feb; March mix
    -- -------------------------------------------------------------------------
    INSERT INTO payments (orphan_id, amount, due_date, paid_date, status)
    VALUES
        -- أحمد: all three months; Jan/Feb paid, Mar paid
        (orphan_ahmad_id, 50.00, '2026-01-01', '2026-01-05', 'مدفوع'),
        (orphan_ahmad_id, 50.00, '2026-02-01', '2026-02-03', 'مدفوع'),
        (orphan_ahmad_id, 50.00, '2026-03-01', '2026-03-02', 'مدفوع'),
        -- سارة: Jan paid, Feb late (متأخر), Mar مستحق – late sponsor case
        (orphan_sara_id, 50.00, '2026-01-01', '2026-01-10', 'مدفوع'),
        (orphan_sara_id, 50.00, '2026-02-01', NULL, 'متأخر'),
        (orphan_sara_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        -- يوسف: Jan/Feb paid, Mar pending
        (orphan_yusuf_id, 50.00, '2026-01-01', '2026-01-08', 'مدفوع'),
        (orphan_yusuf_id, 50.00, '2026-02-01', '2026-02-10', 'مدفوع'),
        (orphan_yusuf_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        -- ليلى: Jan/Feb paid, Mar قيد المعالجة
        (orphan_layla_id, 50.00, '2026-01-01', '2026-01-12', 'مدفوع'),
        (orphan_layla_id, 50.00, '2026-02-01', '2026-02-14', 'مدفوع'),
        (orphan_layla_id, 50.00, '2026-03-01', NULL, 'قيد المعالجة'),
        -- عمر (joined Feb): Feb paid, Mar paid
        (orphan_omar_id, 50.00, '2026-02-01', '2026-02-20', 'مدفوع'),
        (orphan_omar_id, 50.00, '2026-03-01', '2026-03-05', 'مدفوع'),
        -- هيا: Feb paid, Mar pending
        (orphan_haya_id, 50.00, '2026-02-01', '2026-02-22', 'مدفوع'),
        (orphan_haya_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        -- نور (sponsor سعد – “paid nothing” edge case): March only, مستحق
        (orphan_noor_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        -- New orphans (Jan join): Jan/Feb/Mar payments – most paid
        (orphan_rami_id, 50.00, '2026-01-01', '2026-01-14', 'مدفوع'),
        (orphan_rami_id, 50.00, '2026-02-01', '2026-02-05', 'مدفوع'),
        (orphan_rami_id, 50.00, '2026-03-01', '2026-03-04', 'مدفوع'),
        (orphan_mariam_id, 50.00, '2026-01-01', '2026-01-16', 'مدفوع'),
        (orphan_mariam_id, 50.00, '2026-02-01', '2026-02-08', 'مدفوع'),
        (orphan_mariam_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        (orphan_kareem_id, 50.00, '2026-01-01', '2026-01-18', 'مدفوع'),
        (orphan_kareem_id, 50.00, '2026-02-01', '2026-02-12', 'مدفوع'),
        (orphan_kareem_id, 50.00, '2026-03-01', NULL, 'قيد المعالجة'),
        (orphan_dana_id, 50.00, '2026-01-01', '2026-01-20', 'مدفوع'),
        (orphan_dana_id, 50.00, '2026-02-01', '2026-02-15', 'مدفوع'),
        (orphan_dana_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        (orphan_fadi_id, 50.00, '2026-01-01', '2026-01-22', 'مدفوع'),
        (orphan_fadi_id, 50.00, '2026-02-01', '2026-02-18', 'مدفوع'),
        (orphan_fadi_id, 50.00, '2026-03-01', '2026-03-06', 'مدفوع'),
        (orphan_lama_id, 50.00, '2026-01-01', '2026-01-25', 'مدفوع'),
        (orphan_lama_id, 50.00, '2026-02-01', NULL, 'متأخر'),
        (orphan_lama_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        (orphan_reem_id, 50.00, '2026-01-01', '2026-01-28', 'مدفوع'),
        (orphan_reem_id, 50.00, '2026-02-01', '2026-02-22', 'مدفوع'),
        (orphan_reem_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        (orphan_wael_id, 50.00, '2026-01-01', '2026-01-30', 'مدفوع'),
        (orphan_wael_id, 50.00, '2026-02-01', '2026-02-25', 'مدفوع'),
        (orphan_wael_id, 50.00, '2026-03-01', '2026-03-08', 'مدفوع'),
        -- Feb join
        (orphan_tala_id, 50.00, '2026-02-01', '2026-02-28', 'مدفوع'),
        (orphan_tala_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        (orphan_nasser_id, 50.00, '2026-02-01', '2026-02-14', 'مدفوع'),
        (orphan_nasser_id, 50.00, '2026-03-01', '2026-03-12', 'مدفوع'),
        (orphan_jana_id, 50.00, '2026-02-01', '2026-02-24', 'مدفوع'),
        (orphan_jana_id, 50.00, '2026-03-01', NULL, 'مستحق'),
        -- Mar join
        (orphan_yasser_id, 50.00, '2026-03-01', NULL, 'قيد المعالجة'),
        (orphan_lamia_id, 50.00, '2026-03-01', NULL, 'مستحق')
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Achievements (varied dates in 2026)
    -- -------------------------------------------------------------------------
    INSERT INTO achievements (orphan_id, title, description, date)
    VALUES
        (orphan_ahmad_id, 'تفوق دراسي', 'حصل على المركز الأول في الصف', '2026-01-15'),
        (orphan_sara_id,  'مشاركة في مسابقة', 'شاركت في مسابقة الرسم', '2026-02-10'),
        (orphan_yusuf_id, 'إنجاز رياضي', 'فاز في بطولة المدرسة', '2026-01-20'),
        (orphan_layla_id, 'تميز في القراءة', 'أتمت برنامج القراءة الشهرية', '2026-02-25'),
        (orphan_omar_id,  'تحسن في السلوك', 'تقييم إيجابي من المعلمين', '2026-03-10'),
        (orphan_haya_id,  'مشاركة في نشاط جماعي', 'يوم ترفيهي مع الأقران', '2026-03-15'),
        (orphan_rami_id,  'تفوق في الرياضيات', 'أفضل علامة في الفصل', '2026-02-01'),
        (orphan_mariam_id, 'مسابقة إلقاء', 'المركز الثاني على المدرسة', '2026-02-14'),
        (orphan_kareem_id, 'إنجاز في العلوم', 'مشروع معرض المدرسة', '2026-01-28'),
        (orphan_dana_id,  'تحسن الملاحظة', 'تقييم معلمة إيجابي', '2026-03-05'),
        (orphan_fadi_id,  'قائد صف', 'تم اختياره قائداً للصف', '2026-02-20'),
        (orphan_reem_id,  'رسم حر', 'لوحة معرض المدرسة', '2026-03-01'),
        (orphan_wael_id,  'بطولة شطرنج', 'فوز في مسابقة الشطرنج', '2026-02-28'),
        (orphan_tala_id,  'انضباط شهري', 'حضور كامل لشهر فبراير', '2026-03-10'),
        (orphan_nasser_id, 'قراءة إضافية', 'إتمام 5 كتب الشهر', '2026-03-12'),
        (orphan_jana_id,  'مشاركة مسرحية', 'دور في نشاط المدرسة', '2026-03-18')
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Special occasions: orphan_specific, organization_wide, multi_orphan
    -- -------------------------------------------------------------------------
    INSERT INTO special_occasions (id, organization_id, title, date, occasion_type, orphan_id, created_at)
    VALUES
        ('b1000001-0001-0001-0001-000000000001', demo_org_id, 'عيد ميلاد أحمد', '2026-05-15', 'orphan_specific', orphan_ahmad_id, '2026-01-06 09:00:00+00'),
        ('b1000002-0002-0002-0002-000000000002', demo_org_id, 'عيد ميلاد سارة', '2026-08-20', 'orphan_specific', orphan_sara_id, '2026-01-07 09:00:00+00'),
        ('b1000003-0003-0003-0003-000000000003', demo_org_id, 'عيد ميلاد يوسف', '2026-03-10', 'orphan_specific', orphan_yusuf_id, '2026-01-09 09:00:00+00'),
        ('b2000000-2000-2000-2000-200000000000', demo_org_id, 'يوم اليتيم العالمي', '2026-04-07', 'organization_wide', NULL, '2026-01-10 09:00:00+00'),
        ('b3000000-3000-3000-3000-300000000000', demo_org_id, 'رحلة ترفيهية جماعية', '2026-03-20', 'multi_orphan', NULL, '2026-02-01 09:00:00+00')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO occasion_orphans (occasion_id, orphan_id)
    SELECT 'b3000000-3000-3000-3000-300000000000'::UUID, unnest(ARRAY[
        orphan_ahmad_id, orphan_sara_id, orphan_yusuf_id, orphan_layla_id,
        orphan_rami_id, orphan_mariam_id, orphan_omar_id, orphan_haya_id
    ])
    ON CONFLICT (occasion_id, orphan_id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Gifts
    -- -------------------------------------------------------------------------
    INSERT INTO gifts (orphan_id, "from", item, date)
    VALUES
        (orphan_ahmad_id, 'عبدالله الراجحي', 'دراجة هوائية', '2026-01-15'),
        (orphan_sara_id,  'فاطمة الأحمد', 'لعبة تعليمية', '2026-02-10'),
        (orphan_yusuf_id, 'عبدالله الراجحي', 'كتب علمية', '2026-01-20'),
        (orphan_layla_id, 'منى العتيبي', 'حقيبة مدرسية', '2026-02-20'),
        (orphan_rami_id,  'عبدالله الراجحي', 'ساعة يد', '2026-02-01'),
        (orphan_mariam_id, 'فاطمة الأحمد', 'قاموس عربي', '2026-02-15'),
        (orphan_fadi_id,  'محمد الشمري', 'أدوات رسم', '2026-03-01'),
        (orphan_dana_id,  'منى العتيبي', 'دمية', '2026-02-22'),
        (orphan_tala_id,  'سعد الدوسري', 'قصص مصورة', '2026-03-05')
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Update logs
    -- -------------------------------------------------------------------------
    INSERT INTO update_logs (orphan_id, author_id, note, date)
    VALUES
        (orphan_ahmad_id, team_khaled_id, 'تمت زيارة اليتيم في المنزل. الوضع مستقر.', '2026-01-20 14:00:00+00'),
        (orphan_sara_id,  team_noora_id,  'تم التنسيق مع المدرسة لمتابعة الأداء الدراسي.', '2026-02-05 10:00:00+00'),
        (orphan_yusuf_id, team_khaled_id, 'تم تحديث البيانات الصحية. الوضع جيد.', '2026-01-25 11:00:00+00'),
        (orphan_layla_id, team_noora_id,  'متابعة الدفعة الشهرية. تم الاستلام.', '2026-02-18 09:00:00+00'),
        (orphan_omar_id,  team_khaled_id,  'زيارة منزلية. الأسرة بحاجة لدعم إضافي.', '2026-03-01 16:00:00+00'),
        (orphan_noor_id,  team_noora_id,  'استقبال جديد. تم فتح الملف.', '2026-03-06 10:00:00+00'),
        (orphan_rami_id,  team_khaled_id,  'متابعة دراسية. التحصيل جيد.', '2026-02-10 10:00:00+00'),
        (orphan_mariam_id, team_noora_id,  'تنسيق مع معلمة الصف. لا ملاحظات.', '2026-02-20 11:00:00+00'),
        (orphan_kareem_id, team_khaled_id, 'زيارة منزلية. الوضع المعيشي مقبول.', '2026-01-30 14:00:00+00'),
        (orphan_fadi_id,  team_khaled_id,  'تحديث بيانات الأسرة.', '2026-03-05 09:00:00+00'),
        (orphan_tala_id,  team_noora_id,  'استقبال. تم إعداد الملف.', '2026-02-08 10:00:00+00'),
        (orphan_yasser_id, team_noora_id, 'فتح ملف جديد. زيارة أولى مخططة.', '2026-03-10 10:00:00+00'),
        (orphan_lamia_id, team_noora_id,  'تسجيل. انتظار زيارة التقييم.', '2026-03-16 10:00:00+00')
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Family members
    -- -------------------------------------------------------------------------
    INSERT INTO family_members (orphan_id, relationship, age)
    VALUES
        (orphan_ahmad_id, 'الجدة', 65),
        (orphan_ahmad_id, 'العم', 35),
        (orphan_sara_id,  'الخالة', 40),
        (orphan_yusuf_id, 'الأم', 38),
        (orphan_yusuf_id, 'الأخت', 12),
        (orphan_layla_id, 'العم', 42),
        (orphan_omar_id,  'الجدة', 70),
        (orphan_haya_id,  'الأم', 35),
        (orphan_noor_id,  'الخالة', 45),
        (orphan_rami_id,  'الأم', 36),
        (orphan_mariam_id, 'الخالة', 38),
        (orphan_kareem_id, 'الجدة', 68),
        (orphan_dana_id,  'الأم', 32),
        (orphan_fadi_id,  'العم', 40),
        (orphan_lama_id,  'الجدة', 72),
        (orphan_reem_id,  'الخالة', 42),
        (orphan_wael_id,  'الأم', 39),
        (orphan_tala_id,  'العم', 44),
        (orphan_nasser_id, 'الجدة', 66),
        (orphan_jana_id,  'الأم', 34),
        (orphan_yasser_id, 'الأم', 37),
        (orphan_lamia_id, 'الجدة', 70)
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Program participations (educational, psychological_child, psychological_guardian)
    -- -------------------------------------------------------------------------
    INSERT INTO program_participations (orphan_id, program_type, status, details)
    VALUES
        (orphan_ahmad_id, 'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
        (orphan_sara_id,  'educational', 'ملتحق', 'يشارك في برنامج الدعم التعليمي'),
        (orphan_yusuf_id, 'educational', 'مكتمل', 'أكمل برنامج الدعم التعليمي'),
        (orphan_layla_id, 'educational', 'ملتحق', 'دعم في الرياضيات'),
        (orphan_omar_id,  'educational', 'بحاجة للتقييم', 'يحتاج تقييم قبلي'),
        (orphan_haya_id,  'educational', 'ملتحق', 'برنامج قراءة'),
        (orphan_ahmad_id, 'psychological_child', 'ملتحق', 'جلسات دعم نفسي منتظمة'),
        (orphan_sara_id,  'psychological_child', 'بحاجة للتقييم', 'يحتاج تقييم نفسي'),
        (orphan_ahmad_id, 'psychological_guardian', 'غير ملتحق', 'لم يبدأ بعد'),
        (orphan_yusuf_id, 'psychological_guardian', 'ملتحق', 'جلسات دعم للوالدة'),
        (orphan_layla_id, 'psychological_child', 'غير ملتحق', 'متابعة لاحقاً'),
        (orphan_rami_id,  'educational', 'ملتحق', 'دعم رياضيات'),
        (orphan_mariam_id, 'educational', 'ملتحق', 'برنامج لغة عربية'),
        (orphan_kareem_id, 'educational', 'مكتمل', 'أكمل دعم العلوم'),
        (orphan_dana_id,  'educational', 'ملتحق', 'مرحلة أولى'),
        (orphan_fadi_id,  'educational', 'ملتحق', 'قائد صف'),
        (orphan_lama_id,  'educational', 'غير ملتحق', 'قيد التقييم'),
        (orphan_reem_id,  'educational', 'ملتحق', 'فنون'),
        (orphan_wael_id,  'educational', 'ملتحق', 'شطرنج وأنشطة عقلية'),
        (orphan_tala_id,  'educational', 'بحاجة للتقييم', 'تسجيل حديث'),
        (orphan_nasser_id, 'educational', 'ملتحق', 'برنامج قراءة'),
        (orphan_jana_id,  'educational', 'ملتحق', 'أنشطة مسرحية'),
        (orphan_yasser_id, 'educational', 'بحاجة للتقييم', 'ملف جديد'),
        (orphan_lamia_id, 'educational', 'غير ملتحق', 'قيد التسجيل'),
        (orphan_rami_id,  'psychological_child', 'غير ملتحق', NULL),
        (orphan_mariam_id, 'psychological_child', 'ملتحق', 'جلسات أسبوعية')
    ON CONFLICT (orphan_id, program_type) DO NOTHING;

    RAISE NOTICE 'Demo orphan data created. Run 010_demo_financials.sql next.';
END $$;
