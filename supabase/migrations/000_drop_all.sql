-- Drop All Tables Script
-- WARNING: This will delete ALL data and tables in the public schema used by Faye!
-- Run order after reset:
--   1. 000_drop_all.sql (this file)
--   2. 001_initial_schema.sql
--   3. 002_storage.sql
--   4. 003_import_faye_data.sql (real org data)
--   5. 004_add_admin_user.sql

-- ============================================================================
-- DROP ALL TABLES (reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS receipt_orphans CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS sponsor_notes CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS delegates CASCADE;
DROP TABLE IF EXISTS program_participations CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS update_logs CASCADE;
DROP TABLE IF EXISTS gifts CASCADE;
DROP TABLE IF EXISTS occasion_orphans CASCADE;
DROP TABLE IF EXISTS special_occasions CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sponsor_team_members CASCADE;
DROP TABLE IF EXISTS team_member_orphans CASCADE;
DROP TABLE IF EXISTS sponsor_orphans CASCADE;
DROP TABLE IF EXISTS orphans CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS custom_auth CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS clear_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS set_current_user_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_user_account(TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS hash_password(TEXT) CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

DROP FUNCTION IF EXISTS get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS is_team_member() CASCADE;
DROP FUNCTION IF EXISTS is_sponsor() CASCADE;
DROP FUNCTION IF EXISTS is_manager() CASCADE;
DROP FUNCTION IF EXISTS can_edit_orphans() CASCADE;
DROP FUNCTION IF EXISTS can_edit_sponsors() CASCADE;
DROP FUNCTION IF EXISTS can_edit_transactions() CASCADE;
DROP FUNCTION IF EXISTS can_create_expense() CASCADE;
DROP FUNCTION IF EXISTS can_approve_expense() CASCADE;
DROP FUNCTION IF EXISTS can_view_financials() CASCADE;
DROP FUNCTION IF EXISTS check_orphan_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_occasion_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_organization_match(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_receipt_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_transaction_has_sponsor_receipts(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_conversation_participant(UUID) CASCADE;

-- ============================================================================
-- STORAGE POLICIES (avatars bucket)
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Team members can manage orphan avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Optional: remove bucket (002_storage.sql recreates it)
DO $$
BEGIN
    DELETE FROM storage.buckets WHERE id = 'avatars';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not delete avatars bucket (skip if no access): %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Drop complete. Run 001_initial_schema.sql, then 002_storage.sql, 003_import_faye_data.sql, 004_add_admin_user.sql.';
END $$;
