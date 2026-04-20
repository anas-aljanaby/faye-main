-- System admin profile + permissions for organization "منصة يتيم"
-- Run after 003_import_yetim_data.sql (or whenever org data exists).
--
-- Supabase Auth user creation is NOT done here (requires Auth Admin API or Dashboard).
-- After creating a user in Authentication (e.g. email admin@yetim.org), link the profile:
--   UPDATE user_profiles SET auth_user_id = '<auth.users.id>' WHERE id = '<admin_profile_id>';
-- A future Edge Function can automate admin/user provisioning (out of scope).

DO $$
DECLARE
    org_id UUID;
    admin_profile_id UUID;
BEGIN
    SELECT id
    INTO org_id
    FROM organizations
    WHERE name = 'منصة يتيم'
    LIMIT 1;

    IF org_id IS NULL THEN
        RAISE NOTICE '⚠ Organization "منصة يتيم" not found. Skipping admin creation.';
        RETURN;
    END IF;

    SELECT id
    INTO admin_profile_id
    FROM user_profiles
    WHERE organization_id = org_id
      AND role = 'team_member'
      AND name = 'System Admin'
    LIMIT 1;

    IF admin_profile_id IS NULL THEN
        INSERT INTO user_profiles (organization_id, role, name, is_system_admin)
        VALUES (org_id, 'team_member', 'System Admin', TRUE)
        RETURNING id INTO admin_profile_id;
    ELSE
        UPDATE user_profiles
        SET is_system_admin = TRUE
        WHERE id = admin_profile_id;
    END IF;

    IF admin_profile_id IS NULL THEN
        RAISE NOTICE '⚠ Could not determine admin profile ID. Skipping.';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = admin_profile_id) THEN
        INSERT INTO user_permissions (
            user_id,
            can_edit_orphans,
            can_edit_sponsors,
            can_edit_transactions,
            can_create_expense,
            can_approve_expense,
            can_view_financials,
            is_manager
        )
        VALUES (
            admin_profile_id,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            TRUE,
            TRUE
        );
    END IF;

    RAISE NOTICE '✓ Admin profile ready (id: %). Create Auth user in Dashboard and set auth_user_id.', admin_profile_id;
END;
$$;
