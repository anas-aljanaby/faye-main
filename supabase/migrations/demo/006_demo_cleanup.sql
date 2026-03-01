-- ============================================================================
-- Demo Cleanup Script
-- ============================================================================
-- Removes all data for the demo organization so a fresh seed can be applied.
-- Run this before re-running the demo seed scripts (007–011).
--
-- Prerequisites: Initial schema (001_initial_schema.sql) applied.
-- Safe to run: Only deletes rows belonging to the demo organization.
-- ============================================================================

DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    deleted_count BIGINT;
BEGIN
    -- Delete in reverse dependency order to satisfy foreign keys.

    -- Messaging
    DELETE FROM messages
    WHERE conversation_id IN (SELECT id FROM conversations WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % messages', deleted_count;

    DELETE FROM conversations WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % conversations', deleted_count;

    -- Receipts (depend on financial_transactions and user_profiles)
    DELETE FROM receipt_orphans
    WHERE receipt_id IN (
        SELECT r.id FROM receipts r
        JOIN financial_transactions ft ON ft.id = r.transaction_id
        WHERE ft.organization_id = demo_org_id
    );
    DELETE FROM receipts
    WHERE transaction_id IN (SELECT id FROM financial_transactions WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % receipts', deleted_count;

    DELETE FROM financial_transactions WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % financial_transactions', deleted_count;

    DELETE FROM sponsor_notes
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % sponsor_notes', deleted_count;

    DELETE FROM tasks
    WHERE team_member_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % tasks', deleted_count;

    DELETE FROM delegates WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % delegates', deleted_count;

    DELETE FROM update_logs
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % update_logs', deleted_count;

    DELETE FROM gifts
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % gifts', deleted_count;

    DELETE FROM occasion_orphans
    WHERE occasion_id IN (SELECT id FROM special_occasions WHERE organization_id = demo_org_id);
    DELETE FROM special_occasions WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % special_occasions', deleted_count;

    DELETE FROM achievements
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % achievements', deleted_count;

    DELETE FROM payments
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % payments', deleted_count;

    DELETE FROM program_participations
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % program_participations', deleted_count;

    DELETE FROM family_members
    WHERE orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % family_members', deleted_count;

    DELETE FROM sponsor_team_members
    WHERE sponsor_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id)
       OR team_member_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % sponsor_team_members', deleted_count;

    DELETE FROM team_member_orphans
    WHERE team_member_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id)
       OR orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % team_member_orphans', deleted_count;

    DELETE FROM sponsor_orphans
    WHERE sponsor_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id)
       OR orphan_id IN (SELECT id FROM orphans WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % sponsor_orphans', deleted_count;

    DELETE FROM orphans WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % orphans', deleted_count;

    DELETE FROM user_permissions
    WHERE user_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_permissions', deleted_count;

    DELETE FROM custom_auth
    WHERE user_profile_id IN (SELECT id FROM user_profiles WHERE organization_id = demo_org_id);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % custom_auth', deleted_count;

    DELETE FROM user_profiles WHERE organization_id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % user_profiles', deleted_count;

    DELETE FROM organizations WHERE id = demo_org_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % organizations', deleted_count;

    RAISE NOTICE 'Demo cleanup completed.';
END $$;
