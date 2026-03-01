-- ============================================================================
-- Demo: HR (Tasks, Delegates) and Messaging (Conversations, Messages)
-- ============================================================================
-- Tasks for team members (completed + pending), delegates for the org,
-- conversations between team and sponsors, sample messages.
--
-- Site components: Human Resources (Tasks, Delegates), Messages (inbox/chat).
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    team_khaled_id UUID := '11111111-1111-1111-1111-111111111111';
    team_noora_id  UUID := '22222222-2222-2222-2222-222222222222';
    sponsor_abdullah_id UUID := '33333333-3333-3333-3333-333333333333';
    sponsor_fatma_id    UUID := '44444444-4444-4444-444444444444';
    sponsor_muna_id     UUID := '66666666-6666-6666-6666-666666666666';
    orphan_ahmad_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    orphan_sara_id  UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    orphan_yusuf_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    orphan_noor_id  UUID := 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
    conv1_id UUID;
    conv2_id UUID;
BEGIN
    -- -------------------------------------------------------------------------
    -- Tasks (team member assignments; some completed, some pending)
    -- -------------------------------------------------------------------------
    INSERT INTO tasks (team_member_id, title, due_date, completed, orphan_id)
    VALUES
        (team_khaled_id, 'متابعة الدفعة المتأخرة لسارة', '2026-03-15', FALSE, orphan_sara_id),
        (team_khaled_id, 'زيارة منزلية ليوسف', '2026-03-20', FALSE, orphan_yusuf_id),
        (team_khaled_id, 'تحديث ملف أحمد', '2026-03-10', TRUE, orphan_ahmad_id),
        (team_noora_id,  'التنسيق مع المدرسة لسارة', '2026-03-18', FALSE, orphan_sara_id),
        (team_noora_id,  'استقبال ملف نور الجديد', '2026-03-08', TRUE, orphan_noor_id),
        (team_noora_id,  'إرسال تقرير شهري للكفلاء', '2026-03-25', FALSE, NULL)
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Delegates (HR: مندوبين)
    -- -------------------------------------------------------------------------
    INSERT INTO delegates (organization_id, name, task, address, emails, phones)
    VALUES
        (demo_org_id, 'سالم الزهراني', 'متابعة الأسر في صنعاء', 'صنعاء - حي الروضة', ARRAY['s.zohrani@example.com'], ARRAY['+967 771 000 001']),
        (demo_org_id, 'أميرة مهدي', 'التنسيق مع المدارس في تعز', 'تعز - شارع الزهراء', ARRAY['a.mahdi@example.com'], ARRAY['+967 772 000 002']),
        (demo_org_id, 'فهد القاضي', 'المتابعة الميدانية - عدن', NULL, ARRAY['f.algadi@example.com'], ARRAY['+967 773 000 003'])
    ON CONFLICT DO NOTHING;

    -- -------------------------------------------------------------------------
    -- Conversations (pair user1_id < user2_id to avoid duplicate pairs)
    -- -------------------------------------------------------------------------
    INSERT INTO conversations (id, user1_id, user2_id, organization_id, last_message_at, created_at, updated_at)
    VALUES
        ('c1000001-0001-0001-0001-000000000001', team_khaled_id, sponsor_abdullah_id, demo_org_id, '2026-02-20 14:30:00+00', '2026-01-15 10:00:00+00', '2026-02-20 14:30:00+00'),
        ('c1000002-0002-0002-0002-000000000002', team_noora_id, sponsor_fatma_id, demo_org_id, '2026-03-01 11:00:00+00', '2026-01-20 10:00:00+00', '2026-03-01 11:00:00+00'),
        ('c1000003-0003-0003-0003-000000000003', team_noora_id, sponsor_muna_id, demo_org_id, NULL, '2026-02-10 10:00:00+00', '2026-02-10 10:00:00+00')
    ON CONFLICT (user1_id, user2_id) DO UPDATE SET last_message_at = EXCLUDED.last_message_at, updated_at = EXCLUDED.updated_at;

    -- Use fixed conversation IDs for messages
    conv1_id := 'c1000001-0001-0001-0001-000000000001';
    conv2_id := 'c1000002-0002-0002-0002-000000000002';

    -- -------------------------------------------------------------------------
    -- Messages (Khaled–Abdullah and Noora–Fatma threads)
    -- -------------------------------------------------------------------------
    INSERT INTO messages (conversation_id, sender_id, content, read_at, created_at)
    VALUES
        (conv1_id, sponsor_abdullah_id, 'السلام عليكم، هل يمكن إرسال صورة حديثة لأحمد؟', '2026-01-16 09:00:00+00', '2026-01-15 14:00:00+00'),
        (conv1_id, team_khaled_id, 'وعليكم السلام. سأطلب من الميدان وإرسالها لكم قريباً.', NULL, '2026-01-16 09:15:00+00'),
        (conv1_id, team_khaled_id, 'تم إرفاق الصورة في ملف أحمد. شكراً لكم.', NULL, '2026-02-20 14:30:00+00'),
        (conv2_id, sponsor_fatma_id, 'السلام عليكم، متى موعد الدفعة القادمة لسارة؟', '2026-01-21 10:00:00+00', '2026-01-20 16:00:00+00'),
        (conv2_id, team_noora_id, 'وعليكم السلام. المستحق في أول مارس. سنتصل بكم قبل الموعد.', NULL, '2026-01-21 10:05:00+00'),
        (conv2_id, sponsor_fatma_id, 'سأتأخر قليلاً هذا الشهر بسبب السفر. أرجو المتابعة مع الأسرة.', NULL, '2026-03-01 11:00:00+00')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Demo HR and messaging created. Demo seed complete.';
END $$;
