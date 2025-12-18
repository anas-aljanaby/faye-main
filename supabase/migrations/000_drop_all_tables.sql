-- Drop All Tables Script
-- WARNING: This will delete ALL data and tables!
-- Use this to start fresh before running the initial schema migration
-- 
-- INSTRUCTIONS:
-- 1. Run this script FIRST to drop all existing tables
-- 2. Then run 001_initial_schema.sql to recreate the schema (includes custom auth)
-- 3. Then run demo/005_complete_demo_setup.sql to populate with demo data and auth accounts
--    OR run demo/004_create_demo_auth_accounts.sql if demo data already exists

-- ============================================================================
-- DROP ALL TABLES (in reverse dependency order)
-- ============================================================================

-- Drop tables that have foreign key dependencies first
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
DROP TABLE IF EXISTS special_occasions CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sponsor_team_members CASCADE;
DROP TABLE IF EXISTS team_member_orphans CASCADE;
DROP TABLE IF EXISTS sponsor_orphans CASCADE;
DROP TABLE IF EXISTS orphans CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
-- Custom auth tables (drop before user_profiles since they reference it)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS custom_auth CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

-- Custom auth functions (drop first as other functions may depend on them)
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS clear_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS set_current_user_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_user_account(TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS authenticate_user(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS hash_password(TEXT) CASCADE;

-- General utility functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- RLS helper functions
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
DROP FUNCTION IF EXISTS check_receipt_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS check_transaction_has_sponsor_receipts(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_conversation_participant(UUID) CASCADE;

-- ============================================================================
-- DROP EXTENSIONS (optional - only if you want to remove extensions)
-- ============================================================================
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================

-- ============================================================================
-- DROP POLICIES (RLS policies are automatically dropped with tables)
-- ============================================================================
-- Note: RLS policies are automatically dropped when tables are dropped
-- Storage policies need to be dropped separately if they exist

-- Drop storage policies if they exist (for avatars bucket)
DO $$
BEGIN
    -- Drop storage policies
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Team members can manage orphan avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if storage.objects doesn't exist or policies don't exist
    NULL;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'All tables, functions, and policies have been dropped.';
    RAISE NOTICE 'You can now run 001_initial_schema.sql to recreate the schema.';
    RAISE NOTICE 'Then run demo/005_complete_demo_setup.sql for demo data with auth accounts.';
END $$;

