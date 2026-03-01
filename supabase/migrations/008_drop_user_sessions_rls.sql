-- Drop dead user_sessions table and related functions.
-- RLS now uses request.headers (x-user-id) via get_current_user_id();
-- set_current_user_id() and user_sessions (pg_backend_pid) are no longer used.

DROP POLICY IF EXISTS "System manages sessions" ON user_sessions;
DROP FUNCTION IF EXISTS set_current_user_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS clear_current_user_id() CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
