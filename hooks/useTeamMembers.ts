import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchTeamMembers();
  }, [userProfile]);

  const fetchTeamMembers = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch team members from user_profiles
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'team_member');

      if (teamMembersError) throw teamMembersError;
      if (!teamMembersData) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Helper function to convert UUID to numeric ID for compatibility
      const uuidToNumber = (uuid: string): number => {
        let hash = 0;
        for (let i = 0; i < uuid.length; i++) {
          const char = uuid.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash) % 1000000;
      };

      // Fetch assigned orphans and tasks for each team member
      const teamMembersWithData = await Promise.all(
        teamMembersData.map(async (member) => {
          // Fetch assigned orphan IDs
          const { data: assignedOrphansData } = await supabase
            .from('team_member_orphans')
            .select('orphan_id')
            .eq('team_member_id', member.id);

          const assignedOrphanIds = (assignedOrphansData || []).map(ao =>
            uuidToNumber(ao.orphan_id)
          );

          // Fetch tasks
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('team_member_id', member.id)
            .order('due_date', { ascending: false });

          const tasks: Task[] = (tasksData || []).map(t => ({
            id: uuidToNumber(t.id),
            title: t.title,
            dueDate: new Date(t.due_date),
            completed: t.completed,
            orphanId: t.orphan_id ? uuidToNumber(t.orphan_id) : undefined,
          }));

          return {
            id: uuidToNumber(member.id),
            name: member.name,
            avatarUrl: member.avatar_url || '',
            assignedOrphanIds,
            tasks,
          } as TeamMember;
        })
      );

      setTeamMembers(teamMembersWithData);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  return { teamMembers, loading, error, refetch: fetchTeamMembers };
};

