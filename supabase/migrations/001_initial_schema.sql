-- Faye Database Schema Migration
-- This migration creates all tables, indexes, RLS policies, and triggers for the Faye orphan care management system

-- Note: To enable real-time for messages table, run this in Supabase SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
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

-- 2b. User permissions table (stores permission flags per user)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    can_edit_orphans BOOLEAN DEFAULT FALSE NOT NULL,
    can_edit_sponsors BOOLEAN DEFAULT FALSE NOT NULL,
    can_edit_transactions BOOLEAN DEFAULT FALSE NOT NULL,
    can_create_expense BOOLEAN DEFAULT FALSE NOT NULL,
    can_approve_expense BOOLEAN DEFAULT FALSE NOT NULL,
    can_view_financials BOOLEAN DEFAULT FALSE NOT NULL,
    is_manager BOOLEAN DEFAULT FALSE NOT NULL,
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

-- 5b. Sponsor-Team Member junction table (many-to-many)
CREATE TABLE sponsor_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (sponsor_id, team_member_id)
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
    status TEXT NOT NULL CHECK (status IN ('مدفوع', 'مستحق', 'متأخر', 'قيد المعالجة')),
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
    -- Approval workflow columns
    approved_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    rejected_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
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
-- MESSAGING SYSTEM TABLES
-- ============================================================================

-- 17. Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user1_id, user2_id),
    CHECK (user1_id != user2_id)
);

-- 18. Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_user_profiles_organization_role ON user_profiles(organization_id, role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_orphans_organization ON orphans(organization_id);
CREATE INDEX idx_sponsor_orphans_sponsor ON sponsor_orphans(sponsor_id);
CREATE INDEX idx_sponsor_orphans_orphan ON sponsor_orphans(orphan_id);
CREATE INDEX idx_team_member_orphans_member ON team_member_orphans(team_member_id);
CREATE INDEX idx_team_member_orphans_orphan ON team_member_orphans(orphan_id);
CREATE INDEX idx_sponsor_team_members_sponsor ON sponsor_team_members(sponsor_id);
CREATE INDEX idx_sponsor_team_members_team_member ON sponsor_team_members(team_member_id);
CREATE INDEX idx_payments_orphan_status ON payments(orphan_id, status);
CREATE INDEX idx_financial_transactions_org_date_type ON financial_transactions(organization_id, date, type);
CREATE INDEX idx_tasks_member_completed_due ON tasks(team_member_id, completed, due_date);
CREATE INDEX idx_update_logs_orphan ON update_logs(orphan_id);
CREATE INDEX idx_update_logs_author ON update_logs(author_id);
CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipt_orphans_receipt ON receipt_orphans(receipt_id);
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_organization ON conversations(organization_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

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

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
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

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation's last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_on_insert
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_orphans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_team_members ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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

-- Helper function to check if user is a manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND is_manager = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit orphans
CREATE OR REPLACE FUNCTION can_edit_orphans()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_edit_orphans = TRUE OR is_manager = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit sponsors
CREATE OR REPLACE FUNCTION can_edit_sponsors()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_edit_sponsors = TRUE OR is_manager = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit transactions
CREATE OR REPLACE FUNCTION can_edit_transactions()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_edit_transactions = TRUE OR is_manager = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can create expense directly (not as pending)
CREATE OR REPLACE FUNCTION can_create_expense()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_create_expense = TRUE OR is_manager = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can approve expenses
CREATE OR REPLACE FUNCTION can_approve_expense()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_approve_expense = TRUE OR is_manager = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can view financials
CREATE OR REPLACE FUNCTION can_view_financials()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = auth.uid() AND (can_view_financials = TRUE OR is_manager = TRUE)
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

-- Helper function to check if a receipt belongs to user's organization (bypasses RLS to prevent recursion)
-- Drop existing function if it exists with different parameter name
DROP FUNCTION IF EXISTS check_receipt_organization(UUID);
CREATE OR REPLACE FUNCTION check_receipt_organization(receipt_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_org_id UUID;
    transaction_org_id UUID;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO user_org_id
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Get transaction's organization (bypasses RLS due to SECURITY DEFINER)
    SELECT organization_id INTO transaction_org_id
    FROM financial_transactions
    WHERE id = receipt_transaction_id;
    
    -- Return true if they match
    RETURN user_org_id IS NOT NULL AND transaction_org_id IS NOT NULL AND user_org_id = transaction_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a financial transaction has receipts for the current sponsor (bypasses RLS to prevent recursion)
-- Drop existing function if it exists with different parameter name
DROP FUNCTION IF EXISTS check_transaction_has_sponsor_receipts(UUID);
CREATE OR REPLACE FUNCTION check_transaction_has_sponsor_receipts(transaction_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if transaction has receipts for current sponsor (bypasses RLS due to SECURITY DEFINER)
    RETURN EXISTS (
        SELECT 1 FROM receipts
        WHERE transaction_id = transaction_uuid
        AND sponsor_id = auth.uid()
    );
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

-- User permissions policies
CREATE POLICY "Users can view permissions in their organization"
    ON user_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up1
            JOIN user_profiles up2 ON up1.organization_id = up2.organization_id
            WHERE up1.id = auth.uid() AND up2.id = user_permissions.user_id
        )
    );

CREATE POLICY "Managers can insert permissions"
    ON user_permissions FOR INSERT
    WITH CHECK (is_manager());

CREATE POLICY "Managers can update permissions"
    ON user_permissions FOR UPDATE
    USING (is_manager());

CREATE POLICY "Managers can delete permissions"
    ON user_permissions FOR DELETE
    USING (is_manager());

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

CREATE POLICY "Team members with permission can insert orphans in their organization"
    ON orphans FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND can_edit_orphans()
    );

CREATE POLICY "Team members with permission can update orphans in their organization"
    ON orphans FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND can_edit_orphans()
    );

CREATE POLICY "Team members with permission can delete orphans in their organization"
    ON orphans FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND can_edit_orphans()
    );

-- Sponsor-Orphan junction policies
CREATE POLICY "Team members with permission can manage sponsor-orphan relationships"
    ON sponsor_orphans FOR ALL
    USING (
        check_orphan_organization(sponsor_orphans.orphan_id)
        AND is_team_member()
        AND can_edit_sponsors()
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
-- Team members with view permission can see transactions
CREATE POLICY "Team members with permission can view financial transactions"
    ON financial_transactions FOR SELECT
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND can_view_financials()
    );

-- All team members can create income transactions
-- For expenses: users with can_create_expense can create completed, others create as pending
CREATE POLICY "Team members can insert financial transactions"
    ON financial_transactions FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND (
            -- Income: anyone can create
            type = 'إيرادات'
            OR
            -- Expense with can_create_expense: can create as completed
            (type = 'مصروفات' AND can_create_expense() AND status IN ('مكتملة', 'قيد المراجعة'))
            OR
            -- Expense without permission: must be pending
            (type = 'مصروفات' AND NOT can_create_expense() AND status = 'قيد المراجعة')
        )
    );

-- Users with can_edit_transactions can update, or users with can_approve_expense can change status
CREATE POLICY "Team members with permission can update financial transactions"
    ON financial_transactions FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND (
            can_edit_transactions()
            OR can_approve_expense()
            OR created_by_id = auth.uid()
        )
    );

-- Only users with can_edit_transactions can delete
CREATE POLICY "Team members with permission can delete financial transactions"
    ON financial_transactions FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND is_team_member()
        AND can_edit_transactions()
    );

CREATE POLICY "Sponsors can view their own financial transactions"
    ON financial_transactions FOR SELECT
    USING (
        organization_id = get_user_organization_id()
        AND (
            created_by_id = auth.uid()
            OR check_transaction_has_sponsor_receipts(id)
        )
    );

-- Receipts policies
CREATE POLICY "Team members can manage receipts in their organization"
    ON receipts FOR ALL
    USING (
        check_receipt_organization(receipts.transaction_id)
        AND is_team_member()
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
            WHERE r.id = receipt_orphans.receipt_id
            AND check_receipt_organization(r.transaction_id)
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

-- Sponsor-Team Member junction policies
CREATE POLICY "Team members can view sponsor-team member relationships in their organization"
    ON sponsor_team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up1
            JOIN user_profiles up2 ON up1.organization_id = up2.organization_id
            WHERE (up1.id = auth.uid() OR up2.id = auth.uid())
            AND (up1.id = sponsor_team_members.sponsor_id OR up2.id = sponsor_team_members.team_member_id)
        )
    );

CREATE POLICY "Managers and users with permission can manage sponsor-team member relationships"
    ON sponsor_team_members FOR ALL
    USING (
        is_team_member()
        AND (
            is_manager()
            OR can_edit_sponsors()
        )
        AND EXISTS (
            SELECT 1 FROM user_profiles up1
            JOIN user_profiles up2 ON up1.organization_id = up2.organization_id
            WHERE up1.organization_id = get_user_organization_id()
            AND (up1.id = sponsor_team_members.sponsor_id OR up2.id = sponsor_team_members.team_member_id)
        )
    );

-- ============================================================================
-- MESSAGING SYSTEM POLICIES
-- ============================================================================

-- Helper function to check if user is part of a conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversations
        WHERE id = conv_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversations policies
CREATE POLICY "Users can view conversations they're part of"
    ON conversations FOR SELECT
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations with users in their organization"
    ON conversations FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id IN (user1_id, user2_id)
            AND organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can update conversations they're part of"
    ON conversations FOR UPDATE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in conversations they're part of"
    ON messages FOR SELECT
    USING (is_conversation_participant(conversation_id));

CREATE POLICY "Users can insert messages in conversations they're part of"
    ON messages FOR INSERT
    WITH CHECK (
        is_conversation_participant(conversation_id)
        AND sender_id = auth.uid()
    );

CREATE POLICY "Users can update read_at for messages they received"
    ON messages FOR UPDATE
    USING (
        is_conversation_participant(conversation_id)
        AND sender_id != auth.uid()
    )
    WITH CHECK (
        is_conversation_participant(conversation_id)
        AND sender_id != auth.uid()
    );

-- Note: To enable real-time for messages table, run this in Supabase SQL Editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;