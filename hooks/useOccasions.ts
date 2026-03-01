import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { withUserContext } from '../lib/supabaseClient';
import { SpecialOccasion } from '../types';
import { useAuth } from '../contexts/AuthContext';

type OccasionFilters = {
  orphanId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  occasionType?: 'orphan_specific' | 'organization_wide' | 'multi_orphan';
};

type OccasionProfile = {
  organization_id: string;
  id: string;
  role: string;
};

const EMPTY_OCCASIONS: SpecialOccasion[] = [];

export const useOccasions = () => {
  const [filteredOccasions, setFilteredOccasions] = useState<SpecialOccasion[] | null>(null);
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: baseOccasions = EMPTY_OCCASIONS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['occasions', userProfile?.organization_id, userProfile?.id, userProfile?.role],
    queryFn: () => fetchOccasionsData(userProfile as OccasionProfile),
    enabled: !!userProfile,
  });

  const fetchOccasions = useCallback(
    async (_useCache = true, filters?: OccasionFilters, _silent = false) => {
      if (!userProfile) return;
      if (!filters) {
        setFilteredOccasions(null);
        await refetch();
        return;
      }
      const filtered = await fetchOccasionsData(userProfile as OccasionProfile, filters);
      setFilteredOccasions(filtered);
    },
    [refetch, userProfile]
  );

  const addOccasion = async (
    title: string,
    date: Date,
    occasionType: 'orphan_specific' | 'organization_wide' | 'multi_orphan',
    orphanIds?: string[]
  ) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      // Determine orphan_id based on type
      let orphanId: string | null = null;
      if (occasionType === 'orphan_specific' && orphanIds && orphanIds.length > 0) {
        orphanId = orphanIds[0];
      }

      const { data: newOccasion, error: insertError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .insert({
            organization_id: userProfile.organization_id,
            title: title,
            date: date.toISOString().split('T')[0],
            occasion_type: occasionType,
            orphan_id: orphanId,
          })
          .select()
          .single();
      });

      if (insertError) throw insertError;

      // If multi-orphan, create junction table entries
      if (occasionType === 'multi_orphan' && orphanIds && orphanIds.length > 0) {
        const { error: junctionError } = await withUserContext(async () => {
          return await supabase
            .from('occasion_orphans')
            .insert(
              orphanIds.map(orphanId => ({
                occasion_id: newOccasion.id,
                orphan_id: orphanId,
              }))
            );
        });

        if (junctionError) throw junctionError;
      }

      setFilteredOccasions(null);
      await queryClient.invalidateQueries({ queryKey: ['occasions'] });
    } catch (err: any) {
      console.error('Error adding occasion:', err);
      throw err;
    }
  };

  const updateOccasion = async (
    occasionId: string,
    updates: {
      title?: string;
      date?: Date;
      occasionType?: 'orphan_specific' | 'organization_wide' | 'multi_orphan';
      orphanIds?: string[];
    }
  ) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.occasionType !== undefined) {
        updateData.occasion_type = updates.occasionType;
        // Update orphan_id based on type
        if (updates.occasionType === 'organization_wide') {
          updateData.orphan_id = null;
        } else if (updates.occasionType === 'orphan_specific' && updates.orphanIds && updates.orphanIds.length > 0) {
          updateData.orphan_id = updates.orphanIds[0];
        }
      }

      const { error: updateError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .update(updateData)
          .eq('id', occasionId);
      });

      if (updateError) throw updateError;

      // Handle junction table for multi-orphan occasions
      if (updates.occasionType === 'multi_orphan' && updates.orphanIds) {
        // Delete existing links
        await withUserContext(async () => {
          return await supabase
            .from('occasion_orphans')
            .delete()
            .eq('occasion_id', occasionId);
        });

        // Insert new links
        if (updates.orphanIds.length > 0) {
          const { error: junctionError } = await withUserContext(async () => {
            return await supabase
              .from('occasion_orphans')
              .insert(
                updates.orphanIds.map(orphanId => ({
                  occasion_id: occasionId,
                  orphan_id: orphanId,
                }))
              );
          });

          if (junctionError) throw junctionError;
        }
      } else if (updates.occasionType && updates.occasionType !== 'multi_orphan') {
        // Remove junction table entries if changing from multi-orphan
        await withUserContext(async () => {
          return await supabase
            .from('occasion_orphans')
            .delete()
            .eq('occasion_id', occasionId);
        });
      }

      setFilteredOccasions(null);
      await queryClient.invalidateQueries({ queryKey: ['occasions'] });
    } catch (err: any) {
      console.error('Error updating occasion:', err);
      throw err;
    }
  };

  const deleteOccasion = async (occasionId: string) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      // Junction table entries will be deleted automatically due to CASCADE
      const { error: deleteError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .delete()
          .eq('id', occasionId);
      });

      if (deleteError) throw deleteError;

      setFilteredOccasions(null);
      await queryClient.invalidateQueries({ queryKey: ['occasions'] });
    } catch (err: any) {
      console.error('Error deleting occasion:', err);
      throw err;
    }
  };

  return {
    occasions: filteredOccasions ?? baseOccasions,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch occasions') : null,
    refetch: fetchOccasions,
    addOccasion,
    updateOccasion,
    deleteOccasion,
  };
};

async function fetchOccasionsData(
  userProfile: OccasionProfile,
  filters?: OccasionFilters
): Promise<SpecialOccasion[]> {
  // Batch all queries into a single withUserContext call.
  const result = await withUserContext(async () => {
    let occasionsQuery = supabase
      .from('special_occasions')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('date', { ascending: true });

    if (filters?.dateFrom) {
      occasionsQuery = occasionsQuery.gte('date', filters.dateFrom.toISOString().split('T')[0]);
    }
    if (filters?.dateTo) {
      occasionsQuery = occasionsQuery.lte('date', filters.dateTo.toISOString().split('T')[0]);
    }
    if (filters?.occasionType) {
      occasionsQuery = occasionsQuery.eq('occasion_type', filters.occasionType);
    }

    const occasionsResult = await occasionsQuery;
    if (occasionsResult.error) throw occasionsResult.error;

    let finalOccasions = occasionsResult.data || [];

    if (userProfile.role === 'sponsor') {
      const { data: sponsorOrphans } = await supabase
        .from('sponsor_orphans')
        .select('orphan_id')
        .eq('sponsor_id', userProfile.id);

      if (sponsorOrphans && sponsorOrphans.length > 0) {
        const orphanIds = sponsorOrphans.map(so => so.orphan_id);
        finalOccasions = finalOccasions.filter((occ: any) =>
          occ.occasion_type === 'organization_wide' ||
          (occ.orphan_id && orphanIds.includes(occ.orphan_id))
        );

        const { data: junctionOccasions } = await supabase
          .from('occasion_orphans')
          .select('occasion_id, occasion:special_occasions(*)')
          .in('orphan_id', orphanIds);

        if (junctionOccasions) {
          const junctionOccIds = new Set(finalOccasions.map((o: any) => o.id));
          junctionOccasions.forEach((j: any) => {
            if (
              j.occasion &&
              typeof j.occasion === 'object' &&
              !Array.isArray(j.occasion) &&
              !junctionOccIds.has(j.occasion.id)
            ) {
              finalOccasions.push(j.occasion);
            }
          });
        }
      } else {
        finalOccasions = finalOccasions.filter((occ: any) => occ.occasion_type === 'organization_wide');
      }
    }

    if (filters?.orphanId) {
      finalOccasions = finalOccasions.filter((occ: any) =>
        occ.orphan_id === filters.orphanId ||
        occ.occasion_type === 'organization_wide'
      );
      const { data: junctionOccasions } = await supabase
        .from('occasion_orphans')
        .select('occasion_id, occasion:special_occasions(*)')
        .eq('orphan_id', filters.orphanId);

      if (junctionOccasions) {
        const junctionOccIds = new Set(finalOccasions.map((o: any) => o.id));
        junctionOccasions.forEach((j: any) => {
          if (
            j.occasion &&
            typeof j.occasion === 'object' &&
            !Array.isArray(j.occasion) &&
            !junctionOccIds.has(j.occasion.id)
          ) {
            finalOccasions.push(j.occasion);
          }
        });
      }
    }

    const occasionsList: SpecialOccasion[] = finalOccasions;
    const occasionIds = occasionsList.map(o => o.id);

    let occasionOrphansData = null;
    if (occasionIds.length > 0) {
      const { data } = await supabase
        .from('occasion_orphans')
        .select('occasion_id, orphan:orphans(id, name)')
        .in('occasion_id', occasionIds);
      occasionOrphansData = data;
    }

    return { occasionsList, occasionOrphansData };
  });

  const occasionsList: SpecialOccasion[] = result.occasionsList || [];
  const occasionOrphansData = result.occasionOrphansData;

  const linkedOrphansByOccasion = new Map<string, Array<{ id: string; name: string }>>();
  if (occasionOrphansData) {
    occasionOrphansData.forEach((item: any) => {
      const occasionId = item.occasion_id;
      const orphan = item.orphan;
      if (orphan && typeof orphan === 'object' && !Array.isArray(orphan)) {
        if (!linkedOrphansByOccasion.has(occasionId)) {
          linkedOrphansByOccasion.set(occasionId, []);
        }
        linkedOrphansByOccasion.get(occasionId)!.push({
          id: orphan.id,
          name: orphan.name,
        });
      }
    });
  }

  occasionsList.forEach(occasion => {
    const linked = linkedOrphansByOccasion.get(occasion.id);
    if (linked && linked.length > 0) {
      occasion.linked_orphans = linked;
    }
  });

  return occasionsList.map(occ => ({
    ...occ,
    date: new Date(occ.date),
    created_at: new Date(occ.created_at),
  }));
}

