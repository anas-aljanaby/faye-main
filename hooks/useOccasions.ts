import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withUserContext } from '../lib/supabaseClient';
import { SpecialOccasion } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

export const useOccasions = () => {
  const [occasions, setOccasions] = useState<SpecialOccasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchOccasions();
  }, [userProfile]);

  const fetchOccasions = async (useCache = true, filters?: {
    orphanId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    occasionType?: 'orphan_specific' | 'organization_wide' | 'multi_orphan';
  }) => {
    if (!userProfile) return;

    const cacheKey = getCacheKey.occasions(userProfile.organization_id, userProfile.id, userProfile.role);
    
    // Check cache first
    if (useCache && !filters) {
      const cachedData = cache.get<SpecialOccasion[]>(cacheKey);
      if (cachedData) {
        setOccasions(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchOccasions(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Batch all queries into a single withUserContext call to avoid multiple RPC overhead
      const result = await withUserContext(async () => {
        // Fetch occasions based on user role and organization
        let occasionsQuery = supabase
          .from('special_occasions')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .order('date', { ascending: true });

        // Apply filters
        if (filters?.dateFrom) {
          occasionsQuery = occasionsQuery.gte('date', filters.dateFrom.toISOString().split('T')[0]);
        }
        if (filters?.dateTo) {
          occasionsQuery = occasionsQuery.lte('date', filters.dateTo.toISOString().split('T')[0]);
        }
        if (filters?.occasionType) {
          occasionsQuery = occasionsQuery.eq('occasion_type', filters.occasionType);
        }

        // Execute the base query
        const occasionsResult = await occasionsQuery;
        if (occasionsResult.error) throw occasionsResult.error;

        let finalOccasions = occasionsResult.data || [];

        // If user is a sponsor, filter to only show occasions for their sponsored orphans or organization-wide
        if (userProfile.role === 'sponsor') {
          const { data: sponsorOrphans } = await supabase
            .from('sponsor_orphans')
            .select('orphan_id')
            .eq('sponsor_id', userProfile.id);

          if (sponsorOrphans && sponsorOrphans.length > 0) {
            const orphanIds = sponsorOrphans.map(so => so.orphan_id);
            // Filter occasions that are organization-wide or linked to sponsored orphans
            finalOccasions = finalOccasions.filter((occ: any) => 
              occ.occasion_type === 'organization_wide' || 
              (occ.orphan_id && orphanIds.includes(occ.orphan_id))
            );
            // Also fetch multi-orphan occasions linked via junction table
            const { data: junctionOccasions } = await supabase
              .from('occasion_orphans')
              .select('occasion_id, occasion:special_occasions(*)')
              .in('orphan_id', orphanIds);
            
            if (junctionOccasions) {
              const junctionOccIds = new Set(finalOccasions.map((o: any) => o.id));
              junctionOccasions.forEach((j: any) => {
                if (j.occasion && typeof j.occasion === 'object' && !Array.isArray(j.occasion) && !junctionOccIds.has(j.occasion.id)) {
                  finalOccasions.push(j.occasion);
                }
              });
            }
          } else {
            // No sponsored orphans, only show organization-wide
            finalOccasions = finalOccasions.filter((occ: any) => occ.occasion_type === 'organization_wide');
          }
        }

        // If filtering by specific orphan
        if (filters?.orphanId) {
          finalOccasions = finalOccasions.filter((occ: any) => 
            occ.orphan_id === filters.orphanId || 
            occ.occasion_type === 'organization_wide'
          );
          // Also fetch multi-orphan occasions linked via junction table
          const { data: junctionOccasions } = await supabase
            .from('occasion_orphans')
            .select('occasion_id, occasion:special_occasions(*)')
            .eq('orphan_id', filters.orphanId);
          
          if (junctionOccasions) {
            const junctionOccIds = new Set(finalOccasions.map((o: any) => o.id));
            junctionOccasions.forEach((j: any) => {
              if (j.occasion && typeof j.occasion === 'object' && !Array.isArray(j.occasion) && !junctionOccIds.has(j.occasion.id)) {
                finalOccasions.push(j.occasion);
              }
            });
          }
        }

        const occasionsList: SpecialOccasion[] = finalOccasions;
        const occasionIds = occasionsList.map(o => o.id);

        // Fetch linked orphans for multi-orphan occasions (if any)
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

      // Group linked orphans by occasion
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
              name: orphan.name
            });
          }
        });
      }

      // Attach linked orphans to occasions
      occasionsList.forEach(occasion => {
        const linked = linkedOrphansByOccasion.get(occasion.id);
        if (linked && linked.length > 0) {
          occasion.linked_orphans = linked;
        }
      });

      // Convert date strings to Date objects
      const occasionsWithDates = occasionsList.map(occ => ({
        ...occ,
        date: new Date(occ.date),
        created_at: new Date(occ.created_at)
      }));

      setOccasions(occasionsWithDates);
      if (!filters) {
        cache.set(cacheKey, occasionsWithDates, 2 * 60 * 1000);
      }
    } catch (err: any) {
      console.error('Error fetching occasions:', err);
      setError(err.message || 'Failed to fetch occasions');
    } finally {
      setLoading(false);
    }
  };

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

      // Clear cache and refetch
      const cacheKey = getCacheKey.occasions?.(userProfile.organization_id, userProfile.id, userProfile.role) || 
                       `occasions_${userProfile.organization_id}_${userProfile.id}_${userProfile.role}`;
      cache.delete(cacheKey);
      await fetchOccasions(false);
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

      // Clear cache and refetch
      const cacheKey = getCacheKey.occasions?.(userProfile.organization_id, userProfile.id, userProfile.role) || 
                       `occasions_${userProfile.organization_id}_${userProfile.id}_${userProfile.role}`;
      cache.delete(cacheKey);
      await fetchOccasions(false);
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

      // Clear cache and refetch
      const cacheKey = getCacheKey.occasions?.(userProfile.organization_id, userProfile.id, userProfile.role) || 
                       `occasions_${userProfile.organization_id}_${userProfile.id}_${userProfile.role}`;
      cache.delete(cacheKey);
      await fetchOccasions(false);
    } catch (err: any) {
      console.error('Error deleting occasion:', err);
      throw err;
    }
  };

  return {
    occasions,
    loading,
    error,
    refetch: fetchOccasions,
    addOccasion,
    updateOccasion,
    deleteOccasion,
  };
};

