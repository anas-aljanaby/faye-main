-- Create a global admin user with full permissions
DO $$
DECLARE
    org_id UUID;
    admin_profile_id UUID;
    auth_id UUID;
BEGIN
    -- Find the main organization (منظمة فيء)
    SELECT id
    INTO org_id
    FROM organizations
    WHERE name = 'منظمة فيء'
    LIMIT 1;

    IF org_id IS NULL THEN
        RAISE NOTICE '⚠ Organization "منظمة فيء" not found. Skipping admin creation.';
        RETURN;
    END IF;

    -- Create (or reuse) an admin profile as a team member with system admin flag
    INSERT INTO user_profiles (organization_id, role, name, is_system_admin)
    VALUES (org_id, 'team_member', 'System Admin', TRUE)
    ON CONFLICT DO NOTHING
    RETURNING id INTO admin_profile_id;

    -- If profile already existed, fetch its ID and update it to be system admin
    IF admin_profile_id IS NULL THEN
        SELECT id
        INTO admin_profile_id
        FROM user_profiles
        WHERE organization_id = org_id
          AND role = 'team_member'
          AND name = 'System Admin'
        LIMIT 1;
        
        -- Update existing admin to have system admin flag
        IF admin_profile_id IS NOT NULL THEN
            UPDATE user_profiles
            SET is_system_admin = TRUE
            WHERE id = admin_profile_id;
        END IF;
    END IF;

    IF admin_profile_id IS NULL THEN
        RAISE NOTICE '⚠ Could not determine admin profile ID. Skipping.';
        RETURN;
    END IF;

    -- Give the admin all permissions (including manager flag)
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

    -- Create auth account for the admin (username/password login)
    BEGIN
        SELECT create_user_account(
            'faye_admin',          -- username
            'admin@faye.org',      -- email
            'FayeAdmin!2025',      -- password
            admin_profile_id       -- linked member profile
        )
        INTO auth_id;

        RAISE NOTICE '✓ Created admin user (username: faye_admin)';
    EXCEPTION WHEN OTHERS THEN
        -- If account already exists, just log and continue
        RAISE NOTICE '⚠ Admin account may already exist: %', SQLERRM;
    END;
END;
$$;

