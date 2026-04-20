-- Expand notifications for messaging, critical financial events, and web push delivery.
-- Depends on 007_payment_notifications_system.sql

-- ============================================================================
-- NOTIFICATION DATA MODEL
-- ============================================================================

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS action_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_push_error TEXT;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
        'payment_due',
        'payment_overdue',
        'payment_received',
        'payment_reminder',
        'payment_status_changed',
        'message_received',
        'financial_transaction_pending_approval',
        'financial_transaction_approved',
        'financial_transaction_rejected',
        'general'
    ));

ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS message_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS financial_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS payment_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO notification_preferences (user_id)
SELECT id FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- Automatically create default preferences for any future user profile.
CREATE OR REPLACE FUNCTION ensure_notification_preferences_for_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_insert_notification_preferences ON user_profiles;
CREATE TRIGGER on_user_profile_insert_notification_preferences
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_notification_preferences_for_user_profile();

-- ============================================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    expiration_time TIMESTAMPTZ,
    user_agent TEXT,
    installed_via_pwa BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
    ON push_subscriptions(user_id, last_seen_at DESC)
    WHERE disabled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org_active
    ON push_subscriptions(organization_id, last_seen_at DESC)
    WHERE disabled_at IS NULL;

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (user_id = get_current_user_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION notification_type_category(p_type TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_type = 'message_received' THEN
        RETURN 'message';
    END IF;

    IF p_type IN (
        'financial_transaction_pending_approval',
        'financial_transaction_approved',
        'financial_transaction_rejected'
    ) THEN
        RETURN 'financial';
    END IF;

    IF p_type LIKE 'payment_%' THEN
        RETURN 'payment';
    END IF;

    RETURN 'general';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION is_notification_type_enabled(
    p_user_id UUID,
    p_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    pref_row notification_preferences%ROWTYPE;
BEGIN
    SELECT *
    INTO pref_row
    FROM notification_preferences
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    CASE notification_type_category(p_type)
        WHEN 'message' THEN
            RETURN pref_row.message_notifications_enabled;
        WHEN 'financial' THEN
            RETURN pref_row.financial_notifications_enabled;
        WHEN 'payment' THEN
            RETURN pref_row.payment_notifications_enabled;
        ELSE
            RETURN TRUE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enqueue_user_notification(
    p_user_id UUID,
    p_org_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_related_type TEXT DEFAULT NULL,
    p_related_id UUID DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    IF p_user_id IS NULL OR p_org_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF NOT is_notification_type_enabled(p_user_id, p_type) THEN
        RETURN NULL;
    END IF;

    INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_entity_type,
        related_entity_id,
        action_url,
        metadata
    )
    VALUES (
        p_user_id,
        p_org_id,
        p_type,
        p_title,
        p_body,
        p_related_type,
        p_related_id,
        p_action_url,
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enqueue_payment_notification(
    p_user_id UUID,
    p_org_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_related_type TEXT,
    p_related_id UUID
)
RETURNS VOID AS $$
BEGIN
    PERFORM enqueue_user_notification(
        p_user_id,
        p_org_id,
        p_type,
        p_title,
        p_body,
        p_related_type,
        p_related_id,
        CASE
            WHEN p_related_type = 'payment' THEN '/payments'
            WHEN p_related_type = 'orphan' AND p_related_id IS NOT NULL THEN '/orphan/' || p_related_id::TEXT
            ELSE NULL
        END,
        jsonb_strip_nulls(jsonb_build_object(
            'notification_type', p_type,
            'payment_id', CASE WHEN p_related_type = 'payment' THEN p_related_id ELSE NULL END,
            'orphan_id', CASE WHEN p_related_type = 'orphan' THEN p_related_id ELSE NULL END
        ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PAYMENT REMINDERS
-- ============================================================================

CREATE OR REPLACE FUNCTION send_payment_reminders()
RETURNS VOID AS $$
BEGIN
    -- Upcoming due reminders
    PERFORM enqueue_user_notification(
        p.sponsor_id,
        o.organization_id,
        'payment_reminder',
        'تذكير بموعد دفعة قريب',
        'تذكير: دفعة اليتيم ' || o.name || ' ستكون مستحقة بتاريخ ' || p.due_date::TEXT,
        'payment',
        p.id,
        '/payments',
        jsonb_build_object('payment_id', p.id, 'orphan_id', o.id)
    )
    FROM payments p
    JOIN orphans o ON o.id = p.orphan_id
    JOIN notification_preferences np ON np.user_id = p.sponsor_id
    WHERE p.status = 'مستحق'
      AND p.sponsor_id IS NOT NULL
      AND p.reminder_sent_at IS NULL
      AND (p.due_date - CURRENT_DATE) BETWEEN 0 AND np.payment_due_reminder_days
      AND np.payment_notifications_enabled = TRUE;

    UPDATE payments p
    SET reminder_sent_at = NOW()
    FROM notification_preferences np
    WHERE p.sponsor_id = np.user_id
      AND p.status = 'مستحق'
      AND p.reminder_sent_at IS NULL
      AND (p.due_date - CURRENT_DATE) BETWEEN 0 AND np.payment_due_reminder_days
      AND np.payment_notifications_enabled = TRUE;

    -- Overdue recurring reminders
    PERFORM enqueue_user_notification(
        p.sponsor_id,
        o.organization_id,
        'payment_reminder',
        'تذكير دفعة متأخرة',
        'تنبيه: دفعة اليتيم ' || o.name || ' ما زالت متأخرة. نرجو السداد في أقرب وقت.',
        'payment',
        p.id,
        '/payments',
        jsonb_build_object('payment_id', p.id, 'orphan_id', o.id)
    )
    FROM payments p
    JOIN orphans o ON o.id = p.orphan_id
    JOIN notification_preferences np ON np.user_id = p.sponsor_id
    WHERE p.status = 'متأخر'
      AND p.sponsor_id IS NOT NULL
      AND np.payment_notifications_enabled = TRUE
      AND (
        p.overdue_notified_at IS NULL
        OR p.overdue_notified_at <= NOW() - make_interval(days => np.overdue_reminder_frequency_days)
      );

    UPDATE payments p
    SET overdue_notified_at = NOW()
    FROM notification_preferences np
    WHERE p.sponsor_id = np.user_id
      AND p.status = 'متأخر'
      AND np.payment_notifications_enabled = TRUE
      AND (
        p.overdue_notified_at IS NULL
        OR p.overdue_notified_at <= NOW() - make_interval(days => np.overdue_reminder_frequency_days)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MESSAGE NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_message_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    org_id UUID;
    sender_name TEXT;
    message_preview TEXT;
BEGIN
    SELECT
        CASE
            WHEN c.user1_id = NEW.sender_id THEN c.user2_id
            ELSE c.user1_id
        END,
        c.organization_id
    INTO recipient_id, org_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id
    LIMIT 1;

    IF recipient_id IS NULL OR recipient_id = NEW.sender_id OR org_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT name
    INTO sender_name
    FROM user_profiles
    WHERE id = NEW.sender_id
    LIMIT 1;

    message_preview := CASE
        WHEN char_length(NEW.content) > 120 THEN left(NEW.content, 117) || '...'
        ELSE NEW.content
    END;

    PERFORM enqueue_user_notification(
        recipient_id,
        org_id,
        'message_received',
        'رسالة جديدة من ' || COALESCE(sender_name, 'مستخدم'),
        message_preview,
        'conversation',
        NEW.conversation_id,
        '/messages?conversation=' || NEW.conversation_id::TEXT,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'sender_id', NEW.sender_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_insert_notification ON messages;
CREATE TRIGGER on_message_insert_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_insert_notification();

-- ============================================================================
-- CRITICAL FINANCIAL NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_pending_expense_notification()
RETURNS TRIGGER AS $$
DECLARE
    creator_name TEXT;
    approval_body TEXT;
BEGIN
    IF NEW.type <> 'مصروفات' OR NEW.status <> 'قيد المراجعة' THEN
        RETURN NEW;
    END IF;

    SELECT name
    INTO creator_name
    FROM user_profiles
    WHERE id = NEW.created_by_id
    LIMIT 1;

    approval_body := 'قام ' || COALESCE(creator_name, 'أحد أعضاء الفريق')
        || ' بإضافة مصروف "' || NEW.description || '" بقيمة ' || NEW.amount::TEXT
        || ' وهو بانتظار المراجعة.';

    PERFORM enqueue_user_notification(
        up.id,
        NEW.organization_id,
        'financial_transaction_pending_approval',
        'مصروف جديد بانتظار المراجعة',
        approval_body,
        'financial_transaction',
        NEW.id,
        '/financial-system',
        jsonb_build_object(
            'transaction_id', NEW.id,
            'transaction_status', NEW.status
        )
    )
    FROM user_profiles up
    LEFT JOIN user_permissions perm ON perm.user_id = up.id
    WHERE up.organization_id = NEW.organization_id
      AND up.role = 'team_member'
      AND up.id <> NEW.created_by_id
      AND (
        COALESCE(perm.can_approve_expense, FALSE) = TRUE
        OR COALESCE(perm.is_manager, FALSE) = TRUE
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pending_expense_insert_notification ON financial_transactions;
CREATE TRIGGER on_pending_expense_insert_notification
    AFTER INSERT ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_pending_expense_notification();

CREATE OR REPLACE FUNCTION handle_expense_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    actor_id UUID;
    actor_name TEXT;
    notification_title TEXT;
    notification_body TEXT;
BEGIN
    IF NEW.type <> 'مصروفات' THEN
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('مكتملة', 'مرفوضة') THEN
        RETURN NEW;
    END IF;

    actor_id := get_current_user_id();

    IF actor_id IS NOT NULL THEN
        SELECT name
        INTO actor_name
        FROM user_profiles
        WHERE id = actor_id
        LIMIT 1;
    END IF;

    IF NEW.status = 'مكتملة' THEN
        notification_title := 'تمت الموافقة على المصروف';
        notification_body := 'تمت الموافقة على المصروف "' || NEW.description || '" بقيمة '
            || NEW.amount::TEXT
            || CASE
                WHEN actor_name IS NOT NULL THEN ' بواسطة ' || actor_name
                ELSE ''
            END
            || '.';
    ELSE
        notification_title := 'تم رفض المصروف';
        notification_body := 'تم رفض المصروف "' || NEW.description || '"'
            || CASE
                WHEN NEW.rejection_reason IS NOT NULL AND btrim(NEW.rejection_reason) <> '' THEN
                    '. السبب: ' || NEW.rejection_reason
                ELSE '.'
            END;
    END IF;

    IF NEW.created_by_id IS NOT NULL AND (actor_id IS NULL OR NEW.created_by_id <> actor_id) THEN
        PERFORM enqueue_user_notification(
            NEW.created_by_id,
            NEW.organization_id,
            CASE
                WHEN NEW.status = 'مكتملة' THEN 'financial_transaction_approved'
                ELSE 'financial_transaction_rejected'
            END,
            notification_title,
            notification_body,
            'financial_transaction',
            NEW.id,
            '/financial-system',
            jsonb_strip_nulls(jsonb_build_object(
                'transaction_id', NEW.id,
                'transaction_status', NEW.status,
                'acted_by', actor_id,
                'rejection_reason', NEW.rejection_reason
            ))
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_expense_status_change_notification ON financial_transactions;
CREATE TRIGGER on_expense_status_change_notification
    AFTER UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_expense_status_notification();
