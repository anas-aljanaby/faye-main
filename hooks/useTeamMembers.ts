import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { TeamMember, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { uuidToNumber } from '../utils/idMapper';

export const useTeamMembers = () => {
  const { userProfile } = useAuth();
  const {
    data: teamMembers = EMPTY_TEAM_MEMBERS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['team-members', userProfile?.organization_id],
    queryFn: () => fetchTeamMembersData(userProfile!.organization_id),
    enabled: !!userProfile,
  });

  // Keep the legacy refetch signature stable for existing callsites.
  const refetchTeamMembers = useCallback(async (_useCache = true, _silent = false) => {
    await refetch();
  }, [refetch]);

  return {
    teamMembers,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch team members') : null,
    refetch: refetchTeamMembers,
  };
};

const EMPTY_TEAM_MEMBERS: TeamMember[] = [];

async function fetchTeamMembersData(organizationId: string): Promise<TeamMember[]> {
  const { data: teamMembersData, error: teamMembersError } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('organization_id', organizationId)
    .eq('role', 'team_member')
    .eq('is_system_admin', false);

  if (teamMembersError) throw teamMembersError;
  if (!teamMembersData || teamMembersData.length === 0) return [];

  const teamMemberIds = teamMembersData.map(m => m.id);
  const { data: allTasksData } = await supabase
    .from('tasks')
    .select('*')
    .in('team_member_id', teamMemberIds)
    .order('due_date', { ascending: false });

  const tasksByMember = new Map<string, any[]>();
  (allTasksData || []).forEach(t => {
    if (!tasksByMember.has(t.team_member_id)) {
      tasksByMember.set(t.team_member_id, []);
    }
    tasksByMember.get(t.team_member_id)!.push(t);
  });

  return teamMembersData.map((member) => {
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
      uuid: member.id,
      name: member.name,
      avatarUrl: member.avatar_url || '',
      assignedOrphanIds: [],
      tasks,
    } as TeamMember;
  });
}

async function fetchTeamMembersBasicData(organizationId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('organization_id', organizationId)
    .eq('role', 'team_member')
    .eq('is_system_admin', false);

  if (error) throw error;
  if (!data) return [];

  return data.map((member) => ({
    id: uuidToNumber(member.id),
    uuid: member.id,
    name: member.name,
    avatarUrl: member.avatar_url || '',
    assignedOrphanIds: [],
    tasks: [],
  }));
}

// Lightweight hook for lists/dashboards - no tasks fetched
export const useTeamMembersBasic = () => {
  const { userProfile } = useAuth();
  const {
    data: teamMembers = EMPTY_TEAM_MEMBERS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['team-members-basic', userProfile?.organization_id],
    queryFn: () => fetchTeamMembersBasicData(userProfile!.organization_id),
    enabled: !!userProfile,
  });

  return {
    teamMembers,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch team members') : null,
    refetch,
  };
};