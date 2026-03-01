-- ============================================================================
-- Demo: Financial Transactions, Receipts, Sponsor Notes
-- ============================================================================
-- Transactions: إيرادات + مصروفات; statuses مكتملة, قيد المراجعة, مرفوضة.
-- Dates spread Jan–Mar 2026. Receipts link income to sponsors; receipt_orphans
-- split amounts per orphan where applicable.
--
-- Site components: Financial System (transactions list, filters, approval),
-- Sponsor receipts, Sponsor profile (notes on orphans).
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
    orphan_ahmad_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    orphan_sara_id  UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    orphan_yusuf_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    orphan_layla_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    orphan_omar_id  UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    tx_id UUID;
    rec_id UUID;
BEGIN
    -- -------------------------------------------------------------------------
    -- Income (إيرادات): completed + one pending
    -- -------------------------------------------------------------------------
    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-01-10 10:00:00+00', '[كفالة يتيم] دفعة يناير - عبدالله', team_khaled_id, 150.00, 'مكتملة', 'إيرادات')
    RETURNING id INTO tx_id;
    INSERT INTO receipts (transaction_id, sponsor_id, donation_category, amount, date, description)
    VALUES (tx_id, sponsor_abdullah_id, 'كفالة يتيم', 150.00, '2026-01-10', 'دفعة يناير - أحمد ويوسف');
    SELECT id INTO rec_id FROM receipts WHERE transaction_id = tx_id;
    INSERT INTO receipt_orphans (receipt_id, orphan_id, amount) VALUES (rec_id, orphan_ahmad_id, 75.00), (rec_id, orphan_yusuf_id, 75.00) ON CONFLICT (receipt_id, orphan_id) DO NOTHING;

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-01-15 10:00:00+00', '[كفالة يتيم] دفعة يناير - فاطمة', team_khaled_id, 50.00, 'مكتملة', 'إيرادات')
    RETURNING id INTO tx_id;
    INSERT INTO receipts (transaction_id, sponsor_id, donation_category, amount, date, description)
    VALUES (tx_id, sponsor_fatma_id, 'كفالة يتيم', 50.00, '2026-01-15', 'دفعة يناير - سارة');
    SELECT id INTO rec_id FROM receipts WHERE transaction_id = tx_id;
    INSERT INTO receipt_orphans (receipt_id, orphan_id) VALUES (rec_id, orphan_sara_id) ON CONFLICT (receipt_id, orphan_id) DO NOTHING;

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-02-05 10:00:00+00', '[كفالة يتيم] دفعة فبراير - منى العتيبي', team_noora_id, 50.00, 'مكتملة', 'إيرادات')
    RETURNING id INTO tx_id;
    INSERT INTO receipts (transaction_id, sponsor_id, donation_category, amount, date, description)
    VALUES (tx_id, sponsor_muna_id, 'كفالة يتيم', 50.00, '2026-02-05', 'دفعة فبراير - ليلى');
    SELECT id INTO rec_id FROM receipts WHERE transaction_id = tx_id;
    INSERT INTO receipt_orphans (receipt_id, orphan_id) VALUES (rec_id, orphan_layla_id) ON CONFLICT (receipt_id, orphan_id) DO NOTHING;

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-02-20 10:00:00+00', '[تبرع عام] دعم من جهة خيرية', team_khaled_id, 1000.00, 'مكتملة', 'إيرادات')
    RETURNING id INTO tx_id;
    -- No receipt: general donation

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-03-10 10:00:00+00', '[كفالة يتيم] دفعة مارس - محمد الشمري', team_khaled_id, 100.00, 'قيد المراجعة', 'إيرادات')
    RETURNING id INTO tx_id;
    INSERT INTO receipts (transaction_id, sponsor_id, donation_category, amount, date, description)
    VALUES (tx_id, sponsor_mohammad_id, 'كفالة يتيم', 100.00, '2026-03-10', 'دفعة مارس - عمر وهيا');
    SELECT id INTO rec_id FROM receipts WHERE transaction_id = tx_id;
    INSERT INTO receipt_orphans (receipt_id, orphan_id, amount) VALUES (rec_id, orphan_omar_id, 50.00), (rec_id, orphan_haya_id, 50.00) ON CONFLICT (receipt_id, orphan_id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Expenses (مصروفات): completed, pending, rejected
    -- -------------------------------------------------------------------------
    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type, orphan_id)
    VALUES (demo_org_id, '2026-01-12 11:00:00+00', 'مصاريف صيانة سكن أسرة أحمد', team_khaled_id, 200.00, 'مكتملة', 'مصروفات', orphan_ahmad_id);

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type, orphan_id)
    VALUES (demo_org_id, '2026-01-25 11:00:00+00', 'رسوم دراسية - يوسف', team_khaled_id, 350.00, 'مكتملة', 'مصروفات', orphan_yusuf_id);

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-02-01 11:00:00+00', 'شراء وجبات للرحلة الترفيهية', team_noora_id, 120.00, 'مرفوضة', 'مصروفات');

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type, orphan_id)
    VALUES (demo_org_id, '2026-02-15 11:00:00+00', 'فحوصات طبية - سارة', team_noora_id, 80.00, 'مكتملة', 'مصروفات', orphan_sara_id);

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type, orphan_id)
    VALUES (demo_org_id, '2026-02-28 11:00:00+00', 'شراء ملابس عيد - ليلى', team_noora_id, 180.00, 'قيد المراجعة', 'مصروفات', orphan_layla_id);

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type, orphan_id)
    VALUES (demo_org_id, '2026-03-05 11:00:00+00', 'مستلزمات مدرسية - عمر وهيا', team_khaled_id, 250.00, 'مكتملة', 'مصروفات', orphan_omar_id);

    INSERT INTO financial_transactions (organization_id, date, description, created_by_id, amount, status, type)
    VALUES (demo_org_id, '2026-03-15 11:00:00+00', 'إيجار مكتب - شهر مارس', team_khaled_id, 500.00, 'قيد المراجعة', 'مصروفات');

    -- -------------------------------------------------------------------------
    -- Sponsor notes (sponsors’ private notes on their sponsored orphans)
    -- -------------------------------------------------------------------------
    INSERT INTO sponsor_notes (orphan_id, sponsor_id, note)
    VALUES
        (orphan_ahmad_id, sponsor_abdullah_id, 'أتمنى له التوفيق في الدراسة. سأرسل هدية عيد الميلاد.'),
        (orphan_yusuf_id, sponsor_abdullah_id, 'متابعة الرياضة والتحصيل.'),
        (orphan_sara_id, sponsor_fatma_id, 'ملاحظة: الدفعة ستتأخر هذا الشهر.'),
        (orphan_layla_id, sponsor_muna_id, 'تواصلت مع الأسرة. كل شيء جيد.')
    ON CONFLICT (orphan_id, sponsor_id) DO UPDATE SET note = EXCLUDED.note;

    RAISE NOTICE 'Demo financials created. Run 011_demo_hr_and_messaging.sql next.';
END $$;
