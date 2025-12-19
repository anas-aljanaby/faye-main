import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { withUserContext } from '../lib/supabaseClient';
import { Orphan, Payment, Achievement, SpecialOccasion, Gift, UpdateLog, ProgramParticipation, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

export const useOrphans = () => {
  const [orphans, setOrphans] = useState<Orphan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchOrphans();
  }, [userProfile]);

  const fetchOrphans = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = getCacheKey.orphans(userProfile.organization_id, userProfile.id, userProfile.role);
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<Orphan[]>(cacheKey);
      if (cachedData) {
        setOrphans(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchOrphans(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch orphans based on user role and organization
      // Use withUserContext to ensure RLS policies work correctly
      const { data: orphansData, error: orphansError } = await withUserContext(async () => {
        let orphansQuery = supabase
          .from('orphans')
          .select('*')
          .eq('organization_id', userProfile.organization_id);

        // If user is a sponsor, only show their sponsored orphans
        // Team members can see all orphans in their organization
        if (userProfile.role === 'sponsor') {
          const { data: sponsorOrphans } = await supabase
            .from('sponsor_orphans')
            .select('orphan_id')
            .eq('sponsor_id', userProfile.id);

          if (!sponsorOrphans || sponsorOrphans.length === 0) {
            return { data: [], error: null };
          }

          const orphanIds = sponsorOrphans.map(so => so.orphan_id);
          orphansQuery = orphansQuery.in('id', orphanIds);
        }

        return await orphansQuery;
      });

      if (!orphansData || orphansData.length === 0) {
        setOrphans([]);
        setLoading(false);
        cache.set(cacheKey, [], 2 * 60 * 1000);
        return;
      }

      if (orphansError) throw orphansError;

      const orphanIds = orphansData.map(o => o.id);

      // Batch fetch all related data at once instead of per-orphan queries
      // Use withUserContext to ensure RLS policies work correctly
      const [paymentsData, achievementsData, occasionsData, giftsData, logsData, familyData, programsData, sponsorOrphansData] = await withUserContext(async () => {
        return await Promise.all([
          // Fetch all payments for all orphans
          supabase.from('payments').select('*').in('orphan_id', orphanIds),
          // Fetch all achievements
          supabase.from('achievements').select('*').in('orphan_id', orphanIds),
          // Fetch all special occasions
          supabase.from('special_occasions').select('*').in('orphan_id', orphanIds),
          // Fetch all gifts
          supabase.from('gifts').select('*').in('orphan_id', orphanIds),
          // Fetch all update logs
          supabase.from('update_logs').select('*, user_profiles(name)').in('orphan_id', orphanIds),
          // Fetch all family members
          supabase.from('family_members').select('*').in('orphan_id', orphanIds),
          // Fetch all program participations
          supabase.from('program_participations').select('*').in('orphan_id', orphanIds),
          // Fetch all sponsor relationships
          supabase.from('sponsor_orphans').select('orphan_id, sponsor_id').in('orphan_id', orphanIds),
        ]);
      });

      // Group related data by orphan_id for O(1) lookup
      const paymentsByOrphan = new Map<string, any[]>();
      (paymentsData.data || []).forEach(p => {
        if (!paymentsByOrphan.has(p.orphan_id)) {
          paymentsByOrphan.set(p.orphan_id, []);
        }
        paymentsByOrphan.get(p.orphan_id)!.push(p);
      });

      const achievementsByOrphan = new Map<string, any[]>();
      (achievementsData.data || []).forEach(a => {
        if (!achievementsByOrphan.has(a.orphan_id)) {
          achievementsByOrphan.set(a.orphan_id, []);
        }
        achievementsByOrphan.get(a.orphan_id)!.push(a);
      });

      const occasionsByOrphan = new Map<string, any[]>();
      (occasionsData.data || []).forEach(o => {
        if (!occasionsByOrphan.has(o.orphan_id)) {
          occasionsByOrphan.set(o.orphan_id, []);
        }
        occasionsByOrphan.get(o.orphan_id)!.push(o);
      });

      const giftsByOrphan = new Map<string, any[]>();
      (giftsData.data || []).forEach(g => {
        if (!giftsByOrphan.has(g.orphan_id)) {
          giftsByOrphan.set(g.orphan_id, []);
        }
        giftsByOrphan.get(g.orphan_id)!.push(g);
      });

      const logsByOrphan = new Map<string, any[]>();
      (logsData.data || []).forEach(l => {
        if (!logsByOrphan.has(l.orphan_id)) {
          logsByOrphan.set(l.orphan_id, []);
        }
        logsByOrphan.get(l.orphan_id)!.push(l);
      });

      const familyByOrphan = new Map<string, any[]>();
      (familyData.data || []).forEach(f => {
        if (!familyByOrphan.has(f.orphan_id)) {
          familyByOrphan.set(f.orphan_id, []);
        }
        familyByOrphan.get(f.orphan_id)!.push(f);
      });

      const programsByOrphan = new Map<string, any[]>();
      (programsData.data || []).forEach(p => {
        if (!programsByOrphan.has(p.orphan_id)) {
          programsByOrphan.set(p.orphan_id, []);
        }
        programsByOrphan.get(p.orphan_id)!.push(p);
      });

      const sponsorByOrphan = new Map<string, string>();
      (sponsorOrphansData.data || []).forEach(so => {
        if (!sponsorByOrphan.has(so.orphan_id)) {
          sponsorByOrphan.set(so.orphan_id, so.sponsor_id);
        }
      });

      // Process orphans with grouped data
      const enrichedOrphans = orphansData.map((orphan) => {
        const orphanId = orphan.id;

        // Get related data from maps
        const orphanPayments = paymentsByOrphan.get(orphanId) || [];
        const orphanAchievements = achievementsByOrphan.get(orphanId) || [];
        const orphanOccasions = occasionsByOrphan.get(orphanId) || [];
        const orphanGifts = giftsByOrphan.get(orphanId) || [];
        const orphanLogs = logsByOrphan.get(orphanId) || [];
        const orphanFamily = familyByOrphan.get(orphanId) || [];
        const orphanPrograms = programsByOrphan.get(orphanId) || [];
        const sponsorId = sponsorByOrphan.get(orphanId);

          // Helper function to convert UUID to numeric ID for compatibility
          const uuidToNumber = (uuid: string): number => {
            // Use a simple hash of the UUID to get a consistent number
            let hash = 0;
            for (let i = 0; i < uuid.length; i++) {
              const char = uuid.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash) % 1000000;
          };

        // Transform data to match Orphan type
        const payments: Payment[] = orphanPayments
          .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
          .map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            dueDate: new Date(p.due_date),
            paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
            status: p.status as PaymentStatus,
          }));

        const achievements = orphanAchievements
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(a => ({
            id: a.id,
            title: a.title,
            description: a.description || '',
            date: new Date(a.date),
            mediaUrl: a.media_url || undefined,
            mediaType: a.media_type as 'image' | 'video' | undefined,
          }));

        const specialOccasions = orphanOccasions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(o => ({
            id: o.id,
            title: o.title,
            date: new Date(o.date),
          }));

        const gifts = orphanGifts
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(g => ({
            id: g.id,
            from: g.from,
            item: g.item,
            date: new Date(g.date),
          }));

        const updateLogs: UpdateLog[] = orphanLogs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(l => ({
            id: l.id,
            date: new Date(l.date),
            author: (l.user_profiles as any)?.name || 'غير معروف',
            note: l.note,
          }));

        const familyMembers = orphanFamily.map(f => ({
            relationship: f.relationship,
            age: f.age || undefined,
          }));

        // Transform program participations
        const educationalProgram = orphanPrograms.find(p => p.program_type === 'educational') || null;
        const psychologicalChild = orphanPrograms.find(p => p.program_type === 'psychological_child') || null;
        const psychologicalGuardian = orphanPrograms.find(p => p.program_type === 'psychological_guardian') || null;

        // Calculate age from date_of_birth
        const today = new Date();
        const birthDate = new Date(orphan.date_of_birth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

        return {
          id: uuidToNumber(orphan.id), // Convert UUID to number for compatibility
          uuid: orphan.id, // Store UUID for database operations
          name: orphan.name,
          photoUrl: orphan.photo_url || '',
          age: adjustedAge,
          dateOfBirth: new Date(orphan.date_of_birth),
          gender: orphan.gender as 'ذكر' | 'أنثى',
          healthStatus: orphan.health_status || '',
          grade: orphan.grade || '',
          country: orphan.country || '',
          governorate: orphan.governorate || '',
          attendance: orphan.attendance || '',
          performance: orphan.performance || '',
          familyStatus: orphan.family_status || '',
          housingStatus: orphan.housing_status || '',
          guardian: orphan.guardian || '',
          sponsorId: sponsorId ? uuidToNumber(sponsorId) : 0,
          sponsorshipType: orphan.sponsorship_type || '',
          teamMemberId: 0, // Team members don't have direct relationships with orphans
          familyMembers,
          hobbies: [], // Not stored in DB yet
          needsAndWishes: [], // Not stored in DB yet
          updateLogs,
          educationalProgram: educationalProgram ? {
            status: educationalProgram.status as ProgramParticipation['status'],
            details: educationalProgram.details || '',
          } : { status: 'غير ملتحق', details: '' },
          psychologicalSupport: {
            child: psychologicalChild ? {
              status: psychologicalChild.status as ProgramParticipation['status'],
              details: psychologicalChild.details || '',
            } : { status: 'غير ملتحق', details: '' },
            guardian: psychologicalGuardian ? {
              status: psychologicalGuardian.status as ProgramParticipation['status'],
              details: psychologicalGuardian.details || '',
            } : { status: 'غير ملتحق', details: '' },
          },
          payments,
          achievements,
          specialOccasions,
          gifts,
        } as Orphan;
      });

      setOrphans(enrichedOrphans);
      // Cache the result for 5 minutes
      cache.set(cacheKey, enrichedOrphans, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching orphans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orphans');
    } finally {
      setLoading(false);
    }
  };

  const updateOrphan = async (orphanId: string, updates: Partial<{
    name: string;
    date_of_birth: string;
    gender: 'ذكر' | 'أنثى';
    health_status: string;
    grade: string;
    country: string;
    governorate: string;
    attendance: string;
    performance: string;
    family_status: string;
    housing_status: string;
    guardian: string;
    sponsorship_type: string;
  }>) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: updateError } = await supabase
        .from('orphans')
        .update(updates)
        .eq('id', orphanId)
        .eq('organization_id', userProfile.organization_id);

      if (updateError) throw updateError;

      // Clear cache and refetch orphans to get updated data
      const cacheKey = getCacheKey.orphans(userProfile.organization_id, userProfile.id, userProfile.role);
      cache.delete(cacheKey);
      await fetchOrphans(false);
    } catch (err) {
      console.error('Error updating orphan:', err);
      throw err;
    }
  };

  const addSpecialOccasion = async (orphanUuid: string, title: string, date: Date) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: insertError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .insert({
            orphan_id: orphanUuid,
            title: title,
            date: date.toISOString().split('T')[0],
          });
      });

      if (insertError) throw insertError;

      // Clear cache and refetch orphans to get updated data
      const cacheKey = getCacheKey.orphans(userProfile.organization_id, userProfile.id, userProfile.role);
      cache.delete(cacheKey);
      await fetchOrphans(false);
    } catch (err) {
      console.error('Error adding special occasion:', err);
      throw err;
    }
  };

  const updateSpecialOccasion = async (occasionId: string, title: string) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: updateError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .update({ title })
          .eq('id', occasionId);
      });

      if (updateError) throw updateError;

      // Clear cache and refetch orphans to get updated data
      const cacheKey = getCacheKey.orphans(userProfile.organization_id, userProfile.id, userProfile.role);
      cache.delete(cacheKey);
      await fetchOrphans(false);
    } catch (err) {
      console.error('Error updating special occasion:', err);
      throw err;
    }
  };

  const deleteSpecialOccasion = async (occasionId: string) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await withUserContext(async () => {
        return await supabase
          .from('special_occasions')
          .delete()
          .eq('id', occasionId);
      });

      if (deleteError) throw deleteError;

      // Clear cache and refetch orphans to get updated data
      const cacheKey = getCacheKey.orphans(userProfile.organization_id, userProfile.id, userProfile.role);
      cache.delete(cacheKey);
      await fetchOrphans(false);
    } catch (err) {
      console.error('Error deleting special occasion:', err);
      throw err;
    }
  };

  return { orphans, loading, error, refetch: fetchOrphans, updateOrphan, addSpecialOccasion, updateSpecialOccasion, deleteSpecialOccasion };
};

