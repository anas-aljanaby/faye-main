-- Payment lifecycle + notifications system
-- Depends on 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- PAYMENTS ENHANCEMENTS
-- ============================================================================

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS month INTEGER CHECK (month BETWEEN 1 AND 12),
    ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year BETWEEN 2000 AND 2100),
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS overdue_notified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill sponsor/month/year for existing rows
UPDATE payments p
SET sponsor_id = so.sponsor_id
FROM sponsor_orphans so
WHERE so.orphan_id = p.orphan_id
  AND p.sponsor_id IS NULL;

UPDATE payments
SET month = EXTRACT(MONTH FROM due_date)::INTEGER,
    year = EXTRACT(YEAR FROM due_date)::INTEGER
WHERE month IS NULL OR year IS NULL;

ALTER TABLE payments
    ALTER COLUMN month SET NOT NULL,
    ALTER COLUMN year SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_monthly
    ON payments(orphan_id, sponsor_id, month, year)
    WHERE sponsor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_due_date ON payments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_sponsor_status ON payments(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(year, month);

-- ============================================================================
-- NEW TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    old_status TEXT CHECK (old_status IN ('مدفوع', 'مستحق', 'متأخر', 'قيد المعالجة')),
    new_status TEXT NOT NULL CHECK (new_status IN ('مدفوع', 'مستحق', 'متأخر', 'قيد المعالجة')),
    changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    changed_by_source TEXT NOT NULL DEFAULT 'system' CHECK (changed_by_source IN ('system', 'user')),
    notes TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_status_history_payment_changed_at
    ON payment_status_history(payment_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN (
        'payment_due',
        'payment_overdue',
        'payment_received',
        'payment_reminder',
        'payment_status_changed',
        'general'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    read_at TIMESTAMPTZ,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
    ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related
    ON notifications(related_entity_type, related_entity_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    payment_due_reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (payment_due_reminder_days BETWEEN 1 AND 30),
    overdue_reminder_frequency_days INTEGER NOT NULL DEFAULT 3 CHECK (overdue_reminder_frequency_days BETWEEN 1 AND 30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO notification_preferences (user_id)
SELECT id FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- RLS FOR NEW TABLES
-- ============================================================================

ALTER TABLE payment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view payment status history in org"
    ON payment_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM payments p
            JOIN orphans o ON o.id = p.orphan_id
            WHERE p.id = payment_status_history.payment_id
              AND o.organization_id = get_user_organization_id()
              AND is_team_member()
        )
    );

CREATE POLICY "Sponsors can view payment status history for their payments"
    ON payment_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM payments p
            WHERE p.id = payment_status_history.payment_id
              AND p.sponsor_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = get_current_user_id());

CREATE POLICY "Users can mark own notifications as read"
    ON notifications FOR UPDATE
    USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = get_current_user_id());

CREATE POLICY "Users can upsert own notification preferences"
    ON notification_preferences FOR ALL
    USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- ============================================================================
-- TRIGGER HELPERS
-- ============================================================================

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
    IF p_user_id IS NULL OR p_org_id IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM notification_preferences np
        WHERE np.user_id = p_user_id
          AND np.in_app_enabled = FALSE
    ) THEN
        RETURN;
    END IF;

    INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_entity_type,
        related_entity_id
    )
    VALUES (
        p_user_id,
        p_org_id,
        p_type,
        p_title,
        p_body,
        p_related_type,
        p_related_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_payment_organization_id(payment_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT o.organization_id
        FROM payments p
        JOIN orphans o ON o.id = p.orphan_id
        WHERE p.id = payment_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_payment_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    orphan_name TEXT;
BEGIN
    org_id := get_payment_organization_id(NEW.id);
    SELECT name INTO orphan_name FROM orphans WHERE id = NEW.orphan_id LIMIT 1;

    PERFORM enqueue_payment_notification(
        NEW.sponsor_id,
        org_id,
        'payment_due',
        'دفعة شهرية مستحقة',
        'لديك دفعة مستحقة لليتيم ' || COALESCE(orphan_name, '') || ' بتاريخ ' || NEW.due_date::TEXT,
        'payment',
        NEW.id
    );

    INSERT INTO payment_status_history (
        payment_id,
        old_status,
        new_status,
        changed_by,
        changed_by_source,
        notes
    ) VALUES (
        NEW.id,
        NULL,
        NEW.status,
        NEW.sponsor_id,
        'system',
        'Initial status'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_payment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    actor_id UUID;
    actor_source TEXT;
    orphan_name TEXT;
    n_type TEXT;
    n_title TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    org_id := get_payment_organization_id(NEW.id);
    SELECT name INTO orphan_name FROM orphans WHERE id = NEW.orphan_id LIMIT 1;
    actor_id := get_current_user_id();
    actor_source := CASE WHEN actor_id IS NULL THEN 'system' ELSE 'user' END;

    INSERT INTO payment_status_history (
        payment_id,
        old_status,
        new_status,
        changed_by,
        changed_by_source
    ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        actor_id,
        actor_source
    );

    n_type := CASE
        WHEN NEW.status = 'متأخر' THEN 'payment_overdue'
        WHEN NEW.status = 'مدفوع' THEN 'payment_received'
        WHEN NEW.status = 'مستحق' THEN 'payment_due'
        ELSE 'payment_status_changed'
    END;

    n_title := CASE
        WHEN NEW.status = 'متأخر' THEN 'تم تغيير حالة الدفعة إلى متأخر'
        WHEN NEW.status = 'مدفوع' THEN 'تم تسجيل الدفعة كمدفوعة'
        WHEN NEW.status = 'مستحق' THEN 'الدفعة الآن مستحقة'
        ELSE 'تغيير في حالة الدفعة'
    END;

    PERFORM enqueue_payment_notification(
        NEW.sponsor_id,
        org_id,
        n_type,
        n_title,
        'دفعة اليتيم ' || COALESCE(orphan_name, '') || ' أصبحت: ' || NEW.status,
        'payment',
        NEW.id
    );

    IF NEW.status = 'متأخر' AND NEW.overdue_notified_at IS NULL THEN
        NEW.overdue_notified_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payment_insert ON payments;
CREATE TRIGGER on_payment_insert
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_insert_notification();

DROP TRIGGER IF EXISTS on_payment_status_change ON payments;
CREATE TRIGGER on_payment_status_change
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_status_change();

-- Optional async email dispatch via edge function hook
CREATE OR REPLACE FUNCTION trigger_notification_dispatch()
RETURNS TRIGGER AS $$
DECLARE
    project_url TEXT;
    service_key TEXT;
BEGIN
    project_url := current_setting('app.settings.supabase_url', true);
    service_key := current_setting('app.settings.service_role_key', true);

    IF project_url IS NULL OR service_key IS NULL OR project_url = '' OR service_key = '' THEN
        RETURN NEW;
    END IF;

    PERFORM net.http_post(
        url := project_url || '/functions/v1/notification-dispatcher',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object('notification_id', NEW.id)
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
CREATE TRIGGER on_notification_insert
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_notification_dispatch();

-- ============================================================================
-- SCHEDULED JOBS (pg_cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_payments()
RETURNS VOID AS $$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
BEGIN
    INSERT INTO payments (orphan_id, sponsor_id, amount, due_date, month, year, status)
    SELECT
        so.orphan_id,
        so.sponsor_id,
        COALESCE(
            (
                SELECT p.amount
                FROM payments p
                WHERE p.orphan_id = so.orphan_id
                  AND p.sponsor_id = so.sponsor_id
                ORDER BY p.due_date DESC
                LIMIT 1
            ),
            100
        ) AS amount,
        make_date(current_year, current_month, 5) AS due_date,
        current_month,
        current_year,
        'مستحق'
    FROM sponsor_orphans so
    WHERE NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.orphan_id = so.orphan_id
          AND p.sponsor_id = so.sponsor_id
          AND p.month = current_month
          AND p.year = current_year
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS VOID AS $$
BEGIN
    UPDATE payments
    SET status = 'متأخر'
    WHERE status = 'مستحق'
      AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_payment_reminders()
RETURNS VOID AS $$
BEGIN
    -- Upcoming due reminders
    INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_entity_type,
        related_entity_id
    )
    SELECT
        p.sponsor_id,
        o.organization_id,
        'payment_reminder',
        'تذكير بموعد دفعة قريب',
        'تذكير: دفعة اليتيم ' || o.name || ' ستكون مستحقة بتاريخ ' || p.due_date::TEXT,
        'payment',
        p.id
    FROM payments p
    JOIN orphans o ON o.id = p.orphan_id
    JOIN notification_preferences np ON np.user_id = p.sponsor_id
    WHERE p.status = 'مستحق'
      AND p.sponsor_id IS NOT NULL
      AND p.reminder_sent_at IS NULL
      AND (p.due_date - CURRENT_DATE) BETWEEN 0 AND np.payment_due_reminder_days
      AND np.in_app_enabled = TRUE;

    UPDATE payments p
    SET reminder_sent_at = NOW()
    FROM notification_preferences np
    WHERE p.sponsor_id = np.user_id
      AND p.status = 'مستحق'
      AND p.reminder_sent_at IS NULL
      AND (p.due_date - CURRENT_DATE) BETWEEN 0 AND np.payment_due_reminder_days;

    -- Overdue recurring reminders
    INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_entity_type,
        related_entity_id
    )
    SELECT
        p.sponsor_id,
        o.organization_id,
        'payment_reminder',
        'تذكير دفعة متأخرة',
        'تنبيه: دفعة اليتيم ' || o.name || ' ما زالت متأخرة. نرجو السداد في أقرب وقت.',
        'payment',
        p.id
    FROM payments p
    JOIN orphans o ON o.id = p.orphan_id
    JOIN notification_preferences np ON np.user_id = p.sponsor_id
    WHERE p.status = 'متأخر'
      AND p.sponsor_id IS NOT NULL
      AND np.in_app_enabled = TRUE
      AND (
        p.overdue_notified_at IS NULL
        OR p.overdue_notified_at <= NOW() - make_interval(days => np.overdue_reminder_frequency_days)
      );

    UPDATE payments p
    SET overdue_notified_at = NOW()
    FROM notification_preferences np
    WHERE p.sponsor_id = np.user_id
      AND p.status = 'متأخر'
      AND (
        p.overdue_notified_at IS NULL
        OR p.overdue_notified_at <= NOW() - make_interval(days => np.overdue_reminder_frequency_days)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate_monthly_payments') THEN
        PERFORM cron.schedule(
            'generate_monthly_payments',
            '0 0 1 * *',
            $$SELECT generate_monthly_payments();$$
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark_overdue_payments') THEN
        PERFORM cron.schedule(
            'mark_overdue_payments',
            '0 8 * * *',
            $$SELECT mark_overdue_payments();$$
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send_payment_reminders') THEN
        PERFORM cron.schedule(
            'send_payment_reminders',
            '0 9 * * *',
            $$SELECT send_payment_reminders();$$
        );
    END IF;
END
$$;
