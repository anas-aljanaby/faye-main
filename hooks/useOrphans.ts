import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Orphan, Payment, Achievement, SpecialOccasion, Gift, UpdateLog, ProgramParticipation, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

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

  const fetchOrphans = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch orphans based on user role and organization
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
          setOrphans([]);
          setLoading(false);
          return;
        }

        const orphanIds = sponsorOrphans.map(so => so.orphan_id);
        orphansQuery = orphansQuery.in('id', orphanIds);
      }

      const { data: orphansData, error: orphansError } = await orphansQuery;

      if (orphansError) throw orphansError;
      if (!orphansData) {
        setOrphans([]);
        setLoading(false);
        return;
      }

      // Fetch related data for each orphan
      const enrichedOrphans = await Promise.all(
        orphansData.map(async (orphan) => {
          const orphanId = orphan.id;

          // Fetch payments
          const { data: paymentsData } = await supabase
            .from('payments')
            .select('*')
            .eq('orphan_id', orphanId)
            .order('due_date', { ascending: false });

          // Fetch achievements
          const { data: achievementsData } = await supabase
            .from('achievements')
            .select('*')
            .eq('orphan_id', orphanId)
            .order('date', { ascending: false });

          // Fetch special occasions
          const { data: occasionsData } = await supabase
            .from('special_occasions')
            .select('*')
            .eq('orphan_id', orphanId)
            .order('date', { ascending: false });

          // Fetch gifts
          const { data: giftsData } = await supabase
            .from('gifts')
            .select('*')
            .eq('orphan_id', orphanId)
            .order('date', { ascending: false });

          // Fetch update logs
          const { data: logsData } = await supabase
            .from('update_logs')
            .select('*, user_profiles(name)')
            .eq('orphan_id', orphanId)
            .order('date', { ascending: false });

          // Fetch family members
          const { data: familyData } = await supabase
            .from('family_members')
            .select('*')
            .eq('orphan_id', orphanId);

          // Fetch program participations
          const { data: programsData } = await supabase
            .from('program_participations')
            .select('*')
            .eq('orphan_id', orphanId);

          // Fetch sponsor relationship
          const { data: sponsorData } = await supabase
            .from('sponsor_orphans')
            .select('sponsor_id')
            .eq('orphan_id', orphanId)
            .limit(1)
            .single();

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
          const payments: Payment[] = (paymentsData || []).map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            dueDate: new Date(p.due_date),
            paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
            status: p.status as PaymentStatus,
          }));

          const achievements = (achievementsData || []).map(a => ({
            id: a.id,
            title: a.title,
            description: a.description || '',
            date: new Date(a.date),
            mediaUrl: a.media_url || undefined,
            mediaType: a.media_type as 'image' | 'video' | undefined,
          }));

          const specialOccasions = (occasionsData || []).map(o => ({
            id: o.id,
            title: o.title,
            date: new Date(o.date),
          }));

          const gifts = (giftsData || []).map(g => ({
            id: g.id,
            from: g.from,
            item: g.item,
            date: new Date(g.date),
          }));

          const updateLogs: UpdateLog[] = (logsData || []).map(l => ({
            id: l.id,
            date: new Date(l.date),
            author: (l.user_profiles as any)?.name || 'غير معروف',
            note: l.note,
          }));

          const familyMembers = (familyData || []).map(f => ({
            relationship: f.relationship,
            age: f.age || undefined,
          }));

          // Transform program participations
          const educationalProgram = programsData?.find(p => p.program_type === 'educational') || null;
          const psychologicalChild = programsData?.find(p => p.program_type === 'psychological_child') || null;
          const psychologicalGuardian = programsData?.find(p => p.program_type === 'psychological_guardian') || null;

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
            sponsorId: sponsorData?.sponsor_id ? uuidToNumber(sponsorData.sponsor_id) : 0,
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
        })
      );

      setOrphans(enrichedOrphans);
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

      // Refetch orphans to get updated data
      await fetchOrphans();
    } catch (err) {
      console.error('Error updating orphan:', err);
      throw err;
    }
  };

  return { orphans, loading, error, refetch: fetchOrphans, updateOrphan };
};

