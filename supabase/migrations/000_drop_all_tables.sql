-- Drop All Tables Script
-- WARNING: This will delete ALL data and tables!
-- Use this to start fresh before running the initial schema migration
-- 
-- INSTRUCTIONS:
-- 1. Run this script FIRST to drop all existing tables
-- 2. Then run 001_initial_schema.sql to recreate the schema
-- 3. Then run 003_quick_demo_setup.sql to populate with demo data

-- ============================================================================
-- DROP ALL TABLES (in reverse dependency order)
-- ============================================================================

-- Drop tables that have foreign key dependencies first
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS receipt_orphans CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
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
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
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
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- ============================================================================
-- DROP EXTENSIONS (optional - only if you want to remove UUID extension)
-- ============================================================================
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'All tables, functions, and policies have been dropped.';
    RAISE NOTICE 'You can now run 001_initial_schema.sql to recreate the schema.';
END $$;

