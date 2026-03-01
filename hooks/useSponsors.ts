import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Sponsor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { findById, uuidToNumber } from '../utils/idMapper';

export const useSponsors = () => {
  const { userProfile } = useAuth();
  const {
    data: sponsors = EMPTY_SPONSORS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sponsors', userProfile?.organization_id],
    queryFn: () => fetchSponsorsData(userProfile!.organization_id),
    enabled: !!userProfile,
  });

  const fetchSponsors = useCallback(async (_useCache = true, _silent = false) => {
    await refetch();
  }, [refetch]);

  return {
    sponsors,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch sponsors') : null,
    refetch: fetchSponsors,
  };
};

async function fetchSponsorsData(organizationId: string): Promise<Sponsor[]> {
  const { data: sponsorsData, error: sponsorsError } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('organization_id', organizationId)
    .eq('role', 'sponsor')
    .eq('is_system_admin', false);

  if (sponsorsError) throw sponsorsError;
  if (!sponsorsData || sponsorsData.length === 0) return [];

  const sponsorIds = sponsorsData.map(s => s.id);
  const { data: allSponsorOrphans } = await supabase
    .from('sponsor_orphans')
    .select('sponsor_id, orphan_id')
    .in('sponsor_id', sponsorIds);

  const orphansBySponsor = new Map<string, string[]>();
  (allSponsorOrphans || []).forEach(so => {
    if (!orphansBySponsor.has(so.sponsor_id)) {
      orphansBySponsor.set(so.sponsor_id, []);
    }
    orphansBySponsor.get(so.sponsor_id)!.push(so.orphan_id);
  });

  return sponsorsData.map((sponsor) => {
    const sponsoredOrphanIds = (orphansBySponsor.get(sponsor.id) || []).map(so =>
      uuidToNumber(so)
    );

    return {
      id: uuidToNumber(sponsor.id),
      uuid: sponsor.id,
      name: sponsor.name,
      avatarUrl: sponsor.avatar_url || '',
      sponsoredOrphanIds,
    } as Sponsor;
  });
}

/** Fetches basic sponsors data (for lists/dashboards). Used by useSponsorsBasic with React Query. */
export async function fetchSponsorsBasicData(organizationId: string): Promise<Sponsor[]> {
  const { data: sponsorsData, error: sponsorsError } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url')
    .eq('organization_id', organizationId)
    .eq('role', 'sponsor')
    .eq('is_system_admin', false);

  if (sponsorsError) throw sponsorsError;
  if (!sponsorsData) return [];

  const sponsorIds = sponsorsData.map(s => s.id);

  const { data: allSponsorOrphans } = await supabase
    .from('sponsor_orphans')
    .select('sponsor_id, orphan_id')
    .in('sponsor_id', sponsorIds);

  const orphansBySponsor = new Map<string, string[]>();
  (allSponsorOrphans || []).forEach(so => {
    if (!orphansBySponsor.has(so.sponsor_id)) {
      orphansBySponsor.set(so.sponsor_id, []);
    }
    orphansBySponsor.get(so.sponsor_id)!.push(so.orphan_id);
  });

  return sponsorsData.map((sponsor) => {
    const sponsoredOrphanIds = (orphansBySponsor.get(sponsor.id) || []).map(so =>
      uuidToNumber(so)
    );

    return {
      id: uuidToNumber(sponsor.id),
      uuid: sponsor.id,
      name: sponsor.name,
      avatarUrl: sponsor.avatar_url || '',
      sponsoredOrphanIds,
    } as Sponsor;
  });
}

// Stable empty array to avoid new references on every render while loading
const EMPTY_SPONSORS: Sponsor[] = [];

// Lightweight hook for lists/dashboards - uses React Query for shared cache and request deduplication
export const useSponsorsBasic = () => {
  const { userProfile } = useAuth();
  const {
    data: sponsors = EMPTY_SPONSORS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sponsors-basic', userProfile?.organization_id],
    queryFn: () => fetchSponsorsBasicData(userProfile!.organization_id),
    enabled: !!userProfile,
  });

  return {
    sponsors,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch sponsors') : null,
    refetch,
  };
};

// Single sponsor detail: resolve by id, then fetch assigned orphan UUIDs only for this sponsor
export const useSponsorDetail = (sponsorId: string | undefined) => {
  const { sponsors, loading: sponsorsLoading, refetch: refetchSponsors } = useSponsorsBasic();
  const sponsor = useMemo(() => findById(sponsors, sponsorId || ''), [sponsors, sponsorId]);
  const [assignedOrphanIds, setAssignedOrphanIds] = useState<string[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [errorAssigned, setErrorAssigned] = useState<string | null>(null);

  const fetchAssignedOrphans = useCallback(async () => {
    if (!sponsor?.uuid) {
      setAssignedOrphanIds([]);
      return;
    }
    try {
      setLoadingAssigned(true);
      setErrorAssigned(null);
      const { data, error } = await supabase
        .from('sponsor_orphans')
        .select('orphan_id')
        .eq('sponsor_id', sponsor.uuid);
      if (error) throw error;
      setAssignedOrphanIds((data || []).map((row) => row.orphan_id));
    } catch (err) {
      console.error('Error fetching assigned orphans:', err);
      setErrorAssigned(err instanceof Error ? err.message : 'Failed to fetch assigned orphans');
    } finally {
      setLoadingAssigned(false);
    }
  }, [sponsor?.uuid]);

  useEffect(() => {
    fetchAssignedOrphans();
  }, [fetchAssignedOrphans]);

  const refetch = useCallback(() => {
    refetchSponsors();
    fetchAssignedOrphans();
  }, [refetchSponsors, fetchAssignedOrphans]);

  const loading = sponsorsLoading || (!!sponsor && loadingAssigned);
  const error = errorAssigned;

  return { sponsor, assignedOrphanIds, setAssignedOrphanIds, loading, error, refetch };
};

