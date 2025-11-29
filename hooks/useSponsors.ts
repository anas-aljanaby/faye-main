import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sponsor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

export const useSponsors = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchSponsors();
  }, [userProfile]);

  const fetchSponsors = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = getCacheKey.sponsors(userProfile.organization_id);
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<Sponsor[]>(cacheKey);
      if (cachedData) {
        setSponsors(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchSponsors(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch sponsors from user_profiles
      const { data: sponsorsData, error: sponsorsError } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'sponsor');

      if (sponsorsError) throw sponsorsError;
      if (!sponsorsData) {
        setSponsors([]);
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

      const sponsorIds = sponsorsData.map(s => s.id);

      // Batch fetch all sponsor-orphan relationships at once
      const { data: allSponsorOrphans } = await supabase
        .from('sponsor_orphans')
        .select('sponsor_id, orphan_id')
        .in('sponsor_id', sponsorIds);

      // Group orphan IDs by sponsor
      const orphansBySponsor = new Map<string, string[]>();
      (allSponsorOrphans || []).forEach(so => {
        if (!orphansBySponsor.has(so.sponsor_id)) {
          orphansBySponsor.set(so.sponsor_id, []);
        }
        orphansBySponsor.get(so.sponsor_id)!.push(so.orphan_id);
      });

      // Build sponsors with their orphan IDs
      const sponsorsWithOrphans = sponsorsData.map((sponsor) => {
        const sponsoredOrphanIds = (orphansBySponsor.get(sponsor.id) || []).map(so => 
          uuidToNumber(so)
        );

        return {
          id: uuidToNumber(sponsor.id),
          uuid: sponsor.id, // Store UUID for database operations
          name: sponsor.name,
          avatarUrl: sponsor.avatar_url || '',
          sponsoredOrphanIds,
        } as Sponsor;
      });

      setSponsors(sponsorsWithOrphans);
      // Cache the result for 5 minutes
      cache.set(cacheKey, sponsorsWithOrphans, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sponsors');
    } finally {
      setLoading(false);
    }
  };

  return { sponsors, loading, error, refetch: fetchSponsors };
};

