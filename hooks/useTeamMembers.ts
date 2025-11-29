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

      // Fetch tasks for each team member
      // Note: Team members don't have direct relationships with orphans - they can see all orphans
      const teamMembersWithData = await Promise.all(
        teamMembersData.map(async (member) => {
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
            uuid: member.id, // Store UUID for database operations
            name: member.name,
            avatarUrl: member.avatar_url || '',
            assignedOrphanIds: [], // Team members don't have direct relationships with orphans
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

