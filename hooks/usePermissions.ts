import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserPermissions {
  id: string;
  user_id: string;
  can_edit_orphans: boolean;
  can_edit_sponsors: boolean;
  can_edit_transactions: boolean;
  can_create_expense: boolean;
  can_approve_expense: boolean;
  can_view_financials: boolean;
  is_manager: boolean;
}

export interface TeamMemberWithPermissions {
  id: string;
  name: string;
  avatar_url: string | null;
  permissions: UserPermissions | null;
}

/**
 * Hook to manage permissions for team members.
 * Used primarily in the Team page for viewing and managing permissions.
 */
export const usePermissions = () => {
  const { userProfile, isSystemAdmin } = useAuth();
  const isSystemAdminFlag = isSystemAdmin();
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembersWithPermissions = async () => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    if (!isSystemAdminFlag) {
      setTeamMembers([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all team members in the organization (excluding system admin)
      const { data: teamMembersData, error: teamError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'team_member')
        .eq('is_system_admin', false);

      if (teamError) throw teamError;

      // Fetch permissions for all team members
      const { data: permissionsData, error: permError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permError) throw permError;

      // Combine team members with their permissions
      const membersWithPermissions = (teamMembersData || []).map(member => {
        const permissions = permissionsData?.find(p => p.user_id === member.id) || null;
        return {
          ...member,
          permissions,
        };
      });

      setTeamMembers(membersWithPermissions);
    } catch (err) {
      console.error('Error fetching team members with permissions:', err);
      setError('حدث خطأ أثناء تحميل بيانات الفريق');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembersWithPermissions();
  }, [isSystemAdminFlag, userProfile]);

  /**
   * Update permissions for a specific user.
   * Only managers can update permissions.
   */
  const updatePermissions = async (
    userId: string,
    newPermissions: Partial<Omit<UserPermissions, 'id' | 'user_id'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSystemAdminFlag) {
      console.warn('Permission denied: User is not a system admin');
      return { success: false, error: 'ليس لديك صلاحية لتعديل الصلاحيات' };
    }

    try {
      // Check if permissions exist for this user
      const { data: existingPermissions } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingPermissions) {
        // Update existing permissions
        const { error } = await supabase
          .from('user_permissions')
          .update(newPermissions)
          .eq('user_id', userId)
          .select();

        if (error) throw error;
      } else {
        // Insert new permissions
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            can_edit_orphans: false,
            can_edit_sponsors: false,
            can_edit_transactions: false,
            can_create_expense: false,
            can_approve_expense: false,
            can_view_financials: false,
            is_manager: false,
            ...newPermissions,
          })
          .select();

        if (error) throw error;
      }

      // Refresh the list
      await fetchTeamMembersWithPermissions();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating permissions:', err);
      const errorMessage = err?.message || err?.details || 'حدث خطأ أثناء تحديث الصلاحيات';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Toggle a specific permission for a user.
   */
  const togglePermission = async (
    userId: string,
    permissionKey: keyof Omit<UserPermissions, 'id' | 'user_id'>
  ): Promise<{ success: boolean; error?: string }> => {
    const member = teamMembers.find(m => m.id === userId);
    const currentValue = member?.permissions?.[permissionKey] ?? false;
    return updatePermissions(userId, { [permissionKey]: !currentValue });
  };

  return {
    teamMembers,
    loading,
    error,
    isManager: isSystemAdminFlag,
    updatePermissions,
    togglePermission,
    refetch: fetchTeamMembersWithPermissions,
  };
};

export default usePermissions;
