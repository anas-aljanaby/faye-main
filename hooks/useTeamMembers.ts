import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

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

  const fetchTeamMembers = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = getCacheKey.teamMembers(userProfile.organization_id);
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<TeamMember[]>(cacheKey);
      if (cachedData) {
        setTeamMembers(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchTeamMembers(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch team members from user_profiles (excluding system admin)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'team_member')
        .eq('is_system_admin', false);


      if (teamMembersError) throw teamMembersError;
      if (!teamMembersData) {
        setTeamMembers([]);
        setLoading(false);
        cache.set(cacheKey, [], 2 * 60 * 1000);
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

      const teamMemberIds = teamMembersData.map(m => m.id);

      // Batch fetch all tasks for all team members at once
      const { data: allTasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('team_member_id', teamMemberIds)
        .order('due_date', { ascending: false });

      // Group tasks by team member
      const tasksByMember = new Map<string, any[]>();
      (allTasksData || []).forEach(t => {
        if (!tasksByMember.has(t.team_member_id)) {
          tasksByMember.set(t.team_member_id, []);
        }
        tasksByMember.get(t.team_member_id)!.push(t);
      });

      // Build team members with their tasks
      const teamMembersWithData = teamMembersData.map((member) => {
        const memberTasks = tasksByMember.get(member.id) || [];
        const tasks: Task[] = memberTasks.map(t => ({
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
      });

      setTeamMembers(teamMembersWithData);
      // Cache the result for 5 minutes
      cache.set(cacheKey, teamMembersWithData, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  return { teamMembers, loading, error, refetch: fetchTeamMembers };
};

// Lightweight hook for lists/dashboards - no tasks fetched
export const useTeamMembersBasic = () => {
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

  const fetchTeamMembers = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = `team-members-basic:${userProfile.organization_id}`;

    if (useCache) {
      const cachedData = cache.get<TeamMember[]>(cacheKey);
      if (cachedData) {
        setTeamMembers(cachedData);
        setLoading(false);
        fetchTeamMembers(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'team_member')
        .eq('is_system_admin', false);

      if (teamMembersError) throw teamMembersError;
      if (!teamMembersData) {
        setTeamMembers([]);
        setLoading(false);
        cache.set(cacheKey, [], 2 * 60 * 1000);
        return;
      }

      const uuidToNumber = (uuid: string): number => {
        let hash = 0;
        for (let i = 0; i < uuid.length; i++) {
          const char = uuid.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash) % 1000000;
      };      const basicMembers: TeamMember[] = teamMembersData.map((member) => ({
        id: uuidToNumber(member.id),
        uuid: member.id,
        name: member.name,
        avatarUrl: member.avatar_url || '',
        assignedOrphanIds: [],
        tasks: [],
      }));

      setTeamMembers(basicMembers);
      cache.set(cacheKey, basicMembers, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching basic team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };  return { teamMembers, loading, error, refetch: fetchTeamMembers };
};
