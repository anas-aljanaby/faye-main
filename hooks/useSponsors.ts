import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sponsor } from '../types';
import { useAuth } from '../contexts/AuthContext';

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

  const fetchSponsors = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch sponsors from user_profiles
      const { data: sponsorsData, error: sponsorsError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('organization_id', userProfile.organization_id)
        .eq('role', 'sponsor');

      if (sponsorsError) throw sponsorsError;
      if (!sponsorsData) {
        setSponsors([]);
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

      // Fetch sponsored orphan IDs for each sponsor
      const sponsorsWithOrphans = await Promise.all(
        sponsorsData.map(async (sponsor) => {
          const { data: sponsorOrphansData } = await supabase
            .from('sponsor_orphans')
            .select('orphan_id')
            .eq('sponsor_id', sponsor.id);

          const sponsoredOrphanIds = (sponsorOrphansData || []).map(so => 
            uuidToNumber(so.orphan_id)
          );

          return {
            id: uuidToNumber(sponsor.id),
            name: sponsor.name,
            sponsoredOrphanIds,
          } as Sponsor;
        })
      );

      setSponsors(sponsorsWithOrphans);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sponsors');
    } finally {
      setLoading(false);
    }
  };

  return { sponsors, loading, error, refetch: fetchSponsors };
};

