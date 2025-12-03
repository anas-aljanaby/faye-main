-- Faye Database Schema Migration
-- This migration creates all tables, indexes, RLS policies, and triggers for the Faye orphan care management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN ('team_member', 'sponsor')),
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Orphans table
CREATE TABLE orphans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    photo_url TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('ذكر', 'أنثى')),
    health_status TEXT,
    grade TEXT,
    country TEXT,
    governorate TEXT,
    attendance TEXT,
    performance TEXT,
    family_status TEXT,
    housing_status TEXT,
    guardian TEXT,
    sponsorship_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Sponsor-Orphan junction table (many-to-many)
CREATE TABLE sponsor_orphans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (sponsor_id, orphan_id)
);

-- 5. Team Member-Orphan junction table (many-to-many)
CREATE TABLE team_member_orphans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (team_member_id, orphan_id)
);

-- ============================================================================
-- ORPHAN-RELATED TABLES
-- ============================================================================

-- 6. Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT NOT NULL CHECK (status IN ('مدفوع', 'مستحق', 'متأخر')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Special occasions table
CREATE TABLE special_occasions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Gifts table
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    "from" TEXT NOT NULL,
    item TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Update logs table
CREATE TABLE update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Family members table
CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    age INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Program participations table
CREATE TABLE program_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    program_type TEXT NOT NULL CHECK (program_type IN ('educational', 'psychological_child', 'psychological_guardian')),
    status TEXT NOT NULL CHECK (status IN ('ملتحق', 'غير ملتحق', 'مكتمل', 'بحاجة للتقييم')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (orphan_id, program_type)
);

-- ============================================================================
-- FINANCIAL SYSTEM TABLES
-- ============================================================================

-- 13. Financial transactions table
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description TEXT NOT NULL,
    created_by_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('مكتملة', 'قيد المراجعة', 'مرفوضة')),
    type TEXT NOT NULL CHECK (type IN ('إيرادات', 'مصروفات')),
    orphan_id UUID REFERENCES orphans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE REFERENCES financial_transactions(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    donation_category TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. Receipt orphans junction table
CREATE TABLE receipt_orphans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    orphan_id UUID NOT NULL REFERENCES orphans(id) ON DELETE CASCADE,
    amount NUMERIC(10,2),
    UNIQUE (receipt_id, orphan_id)
);

-- ============================================================================
-- TEAM MEMBER TABLES
-- ============================================================================

-- 16. Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    orphan_id UUID REFERENCES orphans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_user_profiles_organization_role ON user_profiles(organization_id, role);
CREATE INDEX idx_orphans_organization ON orphans(organization_id);
CREATE INDEX idx_sponsor_orphans_sponsor ON sponsor_orphans(sponsor_id);
CREATE INDEX idx_sponsor_orphans_orphan ON sponsor_orphans(orphan_id);
CREATE INDEX idx_team_member_orphans_member ON team_member_orphans(team_member_id);
CREATE INDEX idx_team_member_orphans_orphan ON team_member_orphans(orphan_id);
CREATE INDEX idx_payments_orphan_status ON payments(orphan_id, status);
CREATE INDEX idx_financial_transactions_org_date_type ON financial_transactions(organization_id, date, type);
CREATE INDEX idx_tasks_member_completed_due ON tasks(team_member_id, completed, due_date);
CREATE INDEX idx_update_logs_orphan ON update_logs(orphan_id);
CREATE INDEX idx_update_logs_author ON update_logs(author_id);
CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipt_orphans_receipt ON receipt_orphans(receipt_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orphans_updated_at BEFORE UPDATE ON orphans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_participations_updated_at BEFORE UPDATE ON program_participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is team member
CREATE OR REPLACE FUNCTION is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'team_member'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is sponsor
CREATE OR REPLACE FUNCTION is_sponsor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'sponsor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if an orphan belongs to user's organization (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION check_orphan_organization(orphan_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_org_id UUID;
    orphan_org_id UUID;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO user_org_id
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Get orphan's organization (bypasses RLS due to SECURITY DEFINER)
    SELECT organization_id INTO orphan_org_id
    FROM orphans
    WHERE id = orphan_uuid;
    
    -- Return true if they match
    RETURN user_org_id IS NOT NULL AND orphan_org_id IS NOT NULL AND user_org_id = orphan_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

-- User profiles policies
CREATE POLICY "Users can view profiles in their organization"
    ON user_profiles FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- Orphans policies
CREATE POLICY "Team members can view all orphans in their organization"
    ON orphans FOR SELECT
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view their sponsored orphans"
    ON orphans FOR SELECT
    USING (
        id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

CREATE POLICY "Team members can insert orphans in their organization"
    ON orphans FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_team_member()
    );

CREATE POLICY "Team members can update orphans in their organization"
    ON orphans FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
    );

CREATE POLICY "Team members can delete orphans in their organization"
    ON orphans FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
    );

-- Sponsor-Orphan junction policies
CREATE POLICY "Team members can manage sponsor-orphan relationships"
    ON sponsor_orphans FOR ALL
    USING (
        check_orphan_organization(sponsor_orphans.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view their own sponsor-orphan relationships"
    ON sponsor_orphans FOR SELECT
    USING (sponsor_id = auth.uid());

-- Team Member-Orphan junction policies
CREATE POLICY "Team members can manage their own assignments"
    ON team_member_orphans FOR ALL
    USING (
        team_member_id = auth.uid() 
        OR (
            check_orphan_organization(team_member_orphans.orphan_id)
            AND is_team_member()
        )
    );

-- Payments policies
CREATE POLICY "Team members can manage payments for orphans in their organization"
    ON payments FOR ALL
    USING (
        check_orphan_organization(payments.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view payments for their sponsored orphans"
    ON payments FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Achievements policies
CREATE POLICY "Team members can manage achievements for orphans in their organization"
    ON achievements FOR ALL
    USING (
        check_orphan_organization(achievements.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view achievements for their sponsored orphans"
    ON achievements FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Special occasions policies
CREATE POLICY "Team members can manage special occasions for orphans in their organization"
    ON special_occasions FOR ALL
    USING (
        check_orphan_organization(special_occasions.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view special occasions for their sponsored orphans"
    ON special_occasions FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Gifts policies
CREATE POLICY "Team members can manage gifts for orphans in their organization"
    ON gifts FOR ALL
    USING (
        check_orphan_organization(gifts.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view gifts for their sponsored orphans"
    ON gifts FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Update logs policies
CREATE POLICY "Team members can manage update logs for orphans in their organization"
    ON update_logs FOR ALL
    USING (
        check_orphan_organization(update_logs.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view update logs for their sponsored orphans"
    ON update_logs FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Family members policies
CREATE POLICY "Team members can manage family members for orphans in their organization"
    ON family_members FOR ALL
    USING (
        check_orphan_organization(family_members.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view family members for their sponsored orphans"
    ON family_members FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Program participations policies
CREATE POLICY "Team members can manage program participations for orphans in their organization"
    ON program_participations FOR ALL
    USING (
        check_orphan_organization(program_participations.orphan_id)
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view program participations for their sponsored orphans"
    ON program_participations FOR SELECT
    USING (
        orphan_id IN (
            SELECT orphan_id FROM sponsor_orphans 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Financial transactions policies
CREATE POLICY "Team members can manage financial transactions in their organization"
    ON financial_transactions FOR ALL
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
    );

CREATE POLICY "Sponsors can view their own financial transactions"
    ON financial_transactions FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND (
            created_by_id = auth.uid()
            OR id IN (
                SELECT transaction_id FROM receipts 
                WHERE sponsor_id = auth.uid()
            )
        )
    );

-- Receipts policies
CREATE POLICY "Team members can manage receipts in their organization"
    ON receipts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM financial_transactions ft
            WHERE ft.id = receipts.transaction_id
            AND ft.organization_id = get_user_organization_id()
            AND is_team_member()
        )
    );

CREATE POLICY "Sponsors can view their own receipts"
    ON receipts FOR SELECT
    USING (sponsor_id = auth.uid());

-- Receipt orphans policies
CREATE POLICY "Team members can manage receipt orphans in their organization"
    ON receipt_orphans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM receipts r
            JOIN financial_transactions ft ON ft.id = r.transaction_id
            WHERE r.id = receipt_orphans.receipt_id
            AND ft.organization_id = get_user_organization_id()
            AND is_team_member()
        )
    );

CREATE POLICY "Sponsors can view receipt orphans for their receipts"
    ON receipt_orphans FOR SELECT
    USING (
        receipt_id IN (
            SELECT id FROM receipts 
            WHERE sponsor_id = auth.uid()
        )
    );

-- Tasks policies
CREATE POLICY "Team members can manage their own tasks"
    ON tasks FOR ALL
    USING (
        team_member_id = auth.uid() 
        AND is_team_member()
    );

CREATE POLICY "Team members can view tasks for orphans they're assigned to"
    ON tasks FOR SELECT
    USING (
        is_team_member()
        AND (
            team_member_id = auth.uid()
            OR orphan_id IN (
                SELECT orphan_id FROM team_member_orphans 
                WHERE team_member_id = auth.uid()
            )
        )
    );