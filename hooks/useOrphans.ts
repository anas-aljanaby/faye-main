import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Orphan, Payment, Achievement, SpecialOccasion, Gift, UpdateLog, ProgramParticipation, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { uuidToNumber } from '../utils/idMapper';
import { getFriendlyDataError } from '../utils/networkErrors';

/** Profile shape needed for orphans basic fetch (from AuthContext userProfile) */
type OrphansBasicProfile = { organization_id: string; id: string; role: 'team_member' | 'sponsor' };

export type CreateOrphanInput = {
  organizationId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'ذكر' | 'أنثى';
  grade?: string;
  country?: string;
  governorate?: string;
};

// Simple helper to create a new orphan row
export async function createOrphan(input: CreateOrphanInput) {
  const { data, error } = await supabase
    .from('orphans')
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      date_of_birth: input.dateOfBirth.toISOString().slice(0, 10),
      gender: input.gender,
      grade: input.grade ?? null,
      country: input.country ?? null,
      governorate: input.governorate ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating orphan:', error);
    throw error;
  }

  return data;
}

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

  const fetchOrphans = async (useCache = true, silent = false) => {
    if (!userProfile) return;

    try {
      if (!silent) setLoading(true);
      setError(null);

      // Fetch orphans based on user role and organization
      const result = await (async () => {
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
            return { 
              orphansData: [], 
              orphansError: null,
              relatedData: null
            };
          }

          const orphanIds = sponsorOrphans.map(so => so.orphan_id);
          orphansQuery = orphansQuery.in('id', orphanIds);
        }

        const { data: orphansData, error: orphansError } = await orphansQuery;

        if (orphansError) {
          return { orphansData: null, orphansError, relatedData: null };
        }

        if (!orphansData || orphansData.length === 0) {
          return { orphansData: [], orphansError: null, relatedData: null };
        }

        const orphanIds = orphansData.map(o => o.id);

        // Batch fetch all related data; use allSettled so one failure doesn't lose the whole batch
        const queryNames = ['payments', 'achievements', 'occasions', 'occasion_orphans', 'gifts', 'update_logs', 'family_members', 'program_participations', 'sponsor_orphans'];
        const settled = await Promise.allSettled([
          supabase.from('payments').select('*').in('orphan_id', orphanIds),
          supabase.from('achievements').select('*').in('orphan_id', orphanIds),
          supabase.from('special_occasions').select('*').in('orphan_id', orphanIds).not('orphan_id', 'is', null),
          supabase.from('occasion_orphans').select('occasion_id, orphan_id, occasion:special_occasions(*)').in('orphan_id', orphanIds),
          supabase.from('gifts').select('*').in('orphan_id', orphanIds),
          supabase.from('update_logs').select('*, user_profiles(name)').in('orphan_id', orphanIds),
          supabase.from('family_members').select('*').in('orphan_id', orphanIds),
          supabase.from('program_participations').select('*').in('orphan_id', orphanIds),
          supabase.from('sponsor_orphans').select('orphan_id, sponsor_id').in('orphan_id', orphanIds),
        ]);
        const [paymentsData, achievementsData, occasionsData, occasionOrphansData, giftsData, logsData, familyData, programsData, sponsorOrphansData] = settled.map((outcome, i) => {
          if (outcome.status === 'fulfilled') return outcome.value;
          console.warn(`Orphans related fetch failed (${queryNames[i]}):`, outcome.reason);
          return { data: null, error: outcome.reason };
        });

        return {
          orphansData,
          orphansError: null,
          relatedData: {
            paymentsData,
            achievementsData,
            occasionsData,
            occasionOrphansData,
            giftsData,
            logsData,
            familyData,
            programsData,
            sponsorOrphansData,
          }
        };
      })();

      if (result.orphansError) throw result.orphansError;

      if (!result.orphansData || result.orphansData.length === 0) {
        setOrphans([]);
        setLoading(false);
        return;
      }

      const { orphansData, relatedData } = result;
      if (!relatedData) {
        setOrphans([]);
        setLoading(false);
        return;
      }

      const { paymentsData, achievementsData, occasionsData, occasionOrphansData, giftsData, logsData, familyData, programsData, sponsorOrphansData } = relatedData;

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
      // Add occasions linked via orphan_id
      (occasionsData.data || []).forEach(o => {
        if (o.orphan_id) {
          if (!occasionsByOrphan.has(o.orphan_id)) {
            occasionsByOrphan.set(o.orphan_id, []);
          }
          occasionsByOrphan.get(o.orphan_id)!.push(o);
        }
      });
      // Add occasions linked via junction table
      (occasionOrphansData.data || []).forEach((item: any) => {
        const orphanId = item.orphan_id;
        const occasion = item.occasion;
        if (occasion && typeof occasion === 'object' && !Array.isArray(occasion)) {
          if (!occasionsByOrphan.has(orphanId)) {
            occasionsByOrphan.set(orphanId, []);
          }
          // Avoid duplicates
          const existing = occasionsByOrphan.get(orphanId)!.find(o => o.id === occasion.id);
          if (!existing) {
            occasionsByOrphan.get(orphanId)!.push(occasion);
          }
        }
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

        // Transform data to match Orphan type
        const payments: Payment[] = orphanPayments
          .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
          .map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            dueDate: new Date(p.due_date),
            paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
            status: p.status as PaymentStatus,
            sponsorId: p.sponsor_id ?? undefined,
            month: p.month ?? undefined,
            year: p.year ?? undefined,
            reminderSentAt: p.reminder_sent_at ? new Date(p.reminder_sent_at) : undefined,
            overdueNotifiedAt: p.overdue_notified_at ? new Date(p.overdue_notified_at) : undefined,
            notes: p.notes ?? undefined,
            paidTransactionId: p.paid_transaction_id ?? undefined,
            createdByTransactionId: p.created_by_transaction_id ?? undefined,
            previousStatusBeforePaid: p.previous_status_before_paid ?? undefined,
            previousAmountBeforePaid: p.previous_amount_before_paid !== null && p.previous_amount_before_paid !== undefined
              ? parseFloat(p.previous_amount_before_paid)
              : undefined,
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
            organization_id: o.organization_id,
            occasion_type: o.occasion_type,
            orphan_id: o.orphan_id,
            created_at: new Date(o.created_at),
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
            id: f.id,
            relationship: f.relationship,
            age: f.age ?? undefined,
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
          hobbies: Array.isArray((orphan as { hobbies?: string[] }).hobbies)
            ? [...(orphan as { hobbies: string[] }).hobbies]
            : [],
          needsAndWishes: Array.isArray((orphan as { needs_wishes?: string[] }).needs_wishes)
            ? [...(orphan as { needs_wishes: string[] }).needs_wishes]
            : [],
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
    } catch (err) {
      console.error('Error fetching orphans:', err);
      setError(getFriendlyDataError(err));
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
      await fetchOrphans(false);
    } catch (err) {
      console.error('Error updating orphan:', err);
      throw err;
    }
  };

  return { orphans, loading, error, refetch: fetchOrphans, updateOrphan };
};

/** Fetches basic orphans data (for lists/dashboards). Used by useOrphansBasic with React Query. Uses Supabase relationship syntax (orphans + payments in one query). */
export async function fetchOrphansBasicData(profile: OrphansBasicProfile): Promise<Orphan[]> {
  const result = await (async () => {
    let orphansQuery = supabase
      .from('orphans')
      .select('id, name, photo_url, date_of_birth, country, performance, payments(*)')
      .eq('organization_id', profile.organization_id);

    if (profile.role === 'sponsor') {
      const { data: sponsorOrphans } = await supabase
        .from('sponsor_orphans')
        .select('orphan_id')
        .eq('sponsor_id', profile.id);

      if (!sponsorOrphans || sponsorOrphans.length === 0) {
        return { orphansData: [], orphansError: null };
      }

      const orphanIds = sponsorOrphans.map(so => so.orphan_id);
      orphansQuery = orphansQuery.in('id', orphanIds);
    }

    const { data: orphansData, error: orphansError } = await orphansQuery;

    if (orphansError) {
      return { orphansData: null, orphansError };
    }

    if (!orphansData || orphansData.length === 0) {
      return { orphansData: [], orphansError: null };
    }

    return { orphansData, orphansError: null };
  })();

  if (result.orphansError) throw result.orphansError;
  if (!result.orphansData || result.orphansData.length === 0) return [];

  return result.orphansData.map((orphan) => {
    const orphanPayments = Array.isArray(orphan.payments) ? (orphan.payments as any[]) : [];
    const today = new Date();
    const birthDate = new Date(orphan.date_of_birth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    const payments: Payment[] = orphanPayments
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        dueDate: new Date(p.due_date),
        paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
        status: p.status as PaymentStatus,
        sponsorId: p.sponsor_id ?? undefined,
        month: p.month ?? undefined,
        year: p.year ?? undefined,
        reminderSentAt: p.reminder_sent_at ? new Date(p.reminder_sent_at) : undefined,
        overdueNotifiedAt: p.overdue_notified_at ? new Date(p.overdue_notified_at) : undefined,
        notes: p.notes ?? undefined,
        paidTransactionId: p.paid_transaction_id ?? undefined,
        createdByTransactionId: p.created_by_transaction_id ?? undefined,
        previousStatusBeforePaid: p.previous_status_before_paid ?? undefined,
        previousAmountBeforePaid: p.previous_amount_before_paid !== null && p.previous_amount_before_paid !== undefined
          ? parseFloat(p.previous_amount_before_paid)
          : undefined,
      }));

    return {
      id: uuidToNumber(orphan.id),
      uuid: orphan.id,
      name: orphan.name,
      photoUrl: orphan.photo_url || '',
      age: adjustedAge,
      dateOfBirth: new Date(orphan.date_of_birth),
      gender: 'ذكر' as 'ذكر' | 'أنثى',
      healthStatus: '',
      grade: '',
      country: orphan.country || '',
      governorate: '',
      attendance: '',
      performance: orphan.performance || '',
      familyStatus: '',
      housingStatus: '',
      guardian: '',
      sponsorId: 0,
      sponsorshipType: '',
      teamMemberId: 0,
      familyMembers: [],
      hobbies: [],
      needsAndWishes: [],
      updateLogs: [],
      educationalProgram: { status: 'غير ملتحق', details: '' },
      psychologicalSupport: {
        child: { status: 'غير ملتحق', details: '' },
        guardian: { status: 'غير ملتحق', details: '' },
      },
      payments,
      achievements: [],
      specialOccasions: [],
      gifts: [],
    } as Orphan;
  });
}

// Stable empty array to avoid new references on every render while loading
const EMPTY_ORPHANS: Orphan[] = [];

export type OrphansPaginatedFilters = {
  page: number;
  pageSize: number;
  search?: string;
  performanceFilter?: string;
  sortBy?: string;
};

export type OrphansPaginatedResult = {
  orphans: Orphan[];
  totalCount: number;
};

/** Fetches one page of orphans for list view (server-side pagination). */
export async function fetchOrphansPaginatedData(
  profile: OrphansBasicProfile,
  filters: OrphansPaginatedFilters
): Promise<OrphansPaginatedResult> {
  const { page, pageSize, search, performanceFilter = 'all', sortBy = 'name-asc' } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const result = await (async () => {
    let orphansQuery = supabase
      .from('orphans')
      .select('id, name, photo_url, date_of_birth, country, governorate, grade, performance, payments(*)', { count: 'exact' })
      .eq('organization_id', profile.organization_id);

    if (profile.role === 'sponsor') {
      const { data: sponsorOrphans } = await supabase
        .from('sponsor_orphans')
        .select('orphan_id')
        .eq('sponsor_id', profile.id);

      if (!sponsorOrphans || sponsorOrphans.length === 0) {
        return { orphansData: [], totalCount: 0 };
      }
      const orphanIds = sponsorOrphans.map(so => so.orphan_id);
      orphansQuery = orphansQuery.in('id', orphanIds);
    }

    if (search && search.trim()) {
      orphansQuery = orphansQuery.or(`name.ilike.%${search.trim()}%,country.ilike.%${search.trim()}%,governorate.ilike.%${search.trim()}%`);
    }
    if (performanceFilter !== 'all') {
      orphansQuery = orphansQuery.eq('performance', performanceFilter);
    }
    if (sortBy === 'age-asc') {
      orphansQuery = orphansQuery.order('date_of_birth', { ascending: false });
    } else if (sortBy === 'performance-desc') {
      orphansQuery = orphansQuery.order('performance', { ascending: true });
    } else {
      orphansQuery = orphansQuery.order('name', { ascending: true });
    }

    const { data: orphansData, error: orphansError, count } = await orphansQuery.range(from, to);

    if (orphansError) {
      return { orphansData: null, orphansError, totalCount: 0 };
    }
    if (!orphansData || orphansData.length === 0) {
      return { orphansData: [], totalCount: count ?? 0 };
    }

    return { orphansData, totalCount: count ?? orphansData.length };
  })();

  if (result.orphansError) throw result.orphansError;
  if (!result.orphansData || result.orphansData.length === 0) {
    return { orphans: [], totalCount: result.totalCount };
  }

  const orphans = result.orphansData.map((orphan) => {
    const orphanPayments = Array.isArray(orphan.payments) ? (orphan.payments as any[]) : [];
    const today = new Date();
    const birthDate = new Date(orphan.date_of_birth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    const payments: Payment[] = orphanPayments
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        dueDate: new Date(p.due_date),
        paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
        status: p.status as PaymentStatus,
        sponsorId: p.sponsor_id ?? undefined,
        month: p.month ?? undefined,
        year: p.year ?? undefined,
        reminderSentAt: p.reminder_sent_at ? new Date(p.reminder_sent_at) : undefined,
        overdueNotifiedAt: p.overdue_notified_at ? new Date(p.overdue_notified_at) : undefined,
        notes: p.notes ?? undefined,
        paidTransactionId: p.paid_transaction_id ?? undefined,
        createdByTransactionId: p.created_by_transaction_id ?? undefined,
        previousStatusBeforePaid: p.previous_status_before_paid ?? undefined,
        previousAmountBeforePaid: p.previous_amount_before_paid !== null && p.previous_amount_before_paid !== undefined
          ? parseFloat(p.previous_amount_before_paid)
          : undefined,
      }));

    return {
      id: uuidToNumber(orphan.id),
      uuid: orphan.id,
      name: orphan.name,
      photoUrl: orphan.photo_url || '',
      age: adjustedAge,
      dateOfBirth: new Date(orphan.date_of_birth),
      gender: 'ذكر' as 'ذكر' | 'أنثى',
      healthStatus: '',
      grade: orphan.grade || '',
      country: orphan.country || '',
      governorate: orphan.governorate || '',
      attendance: '',
      performance: orphan.performance || '',
      familyStatus: '',
      housingStatus: '',
      guardian: '',
      sponsorId: 0,
      sponsorshipType: '',
      teamMemberId: 0,
      familyMembers: [],
      hobbies: [],
      needsAndWishes: [],
      updateLogs: [],
      educationalProgram: { status: 'غير ملتحق', details: '' },
      psychologicalSupport: { child: { status: 'غير ملتحق', details: '' }, guardian: { status: 'غير ملتحق', details: '' } },
      payments,
      achievements: [],
      specialOccasions: [],
      gifts: [],
    } as Orphan;
  });

  return { orphans, totalCount: result.totalCount };
}

/** Persisted React Query cache (localStorage) stores Dates as strings — coerce back for UI. */
function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function asOptionalDate(value: Date | string | undefined | null): Date | undefined {
  if (value == null) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function normalizeOrphansBasicFromCache(orphans: Orphan[]): Orphan[] {
  return orphans.map((o) => ({
    ...o,
    dateOfBirth: asDate(o.dateOfBirth as Date | string),
    payments: o.payments.map((p) => ({
      ...p,
      dueDate: asDate(p.dueDate as Date | string),
      paidDate: asOptionalDate(p.paidDate as Date | string | undefined | null),
    })),
  }));
}

// Lightweight hook for lists/dashboards - uses React Query for shared cache and request deduplication
export const useOrphansBasic = () => {
  const { userProfile } = useAuth();
  const {
    data: orphans = EMPTY_ORPHANS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orphans-basic', userProfile?.organization_id, userProfile?.id, userProfile?.role],
    queryFn: () => fetchOrphansBasicData(userProfile!),
    enabled: !!userProfile,
    select: normalizeOrphansBasicFromCache,
  });

  return {
    orphans,
    loading,
    error: error ? getFriendlyDataError(error) : null,
    refetch,
  };
};

/** Paginated orphans list (server-side). Use in OrphansList for large datasets. */
export const useOrphansPaginated = (filters: OrphansPaginatedFilters) => {
  const { userProfile } = useAuth();
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orphans-paginated', userProfile?.organization_id, userProfile?.id, userProfile?.role, filters],
    queryFn: () => fetchOrphansPaginatedData(userProfile!, filters),
    enabled: !!userProfile,
  });

  return {
    orphans: data?.orphans ?? EMPTY_ORPHANS,
    totalCount: data?.totalCount ?? 0,
    loading,
    error: error ? getFriendlyDataError(error) : null,
    refetch,
  };
};

/** Fetches a single orphan with all related data. Used by useOrphanDetail with React Query. */
export async function fetchOrphanDetailData(organizationId: string, orphanId: string): Promise<Orphan> {
  const result = await (async () => {
    const { data: orphanRow, error: orphanError } = await supabase
      .from('orphans')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', orphanId)
      .single();

    if (orphanError || !orphanRow) {
      return {
        orphanRow: null,
        orphanError: orphanError || new Error('Orphan not found'),
        relatedData: null,
      };
    }

    const detailQueryNames = ['payments', 'achievements', 'occasions', 'occasion_orphans', 'gifts', 'update_logs', 'family_members', 'program_participations', 'sponsor_orphans'];
    const detailSettled = await Promise.allSettled([
      supabase.from('payments').select('*').eq('orphan_id', orphanId),
      supabase.from('achievements').select('*').eq('orphan_id', orphanId),
      supabase.from('special_occasions').select('*').eq('orphan_id', orphanId).not('orphan_id', 'is', null),
      supabase.from('occasion_orphans').select('occasion_id, orphan_id, occasion:special_occasions(*)').eq('orphan_id', orphanId),
      supabase.from('gifts').select('*').eq('orphan_id', orphanId),
      supabase.from('update_logs').select('*, user_profiles(name)').eq('orphan_id', orphanId),
      supabase.from('family_members').select('*').eq('orphan_id', orphanId),
      supabase.from('program_participations').select('*').eq('orphan_id', orphanId),
      supabase.from('sponsor_orphans').select('orphan_id, sponsor_id').eq('orphan_id', orphanId),
    ]);
    const [paymentsData, achievementsData, occasionsData, occasionOrphansData, giftsData, logsData, familyData, programsData, sponsorOrphansData] = detailSettled.map((outcome, i) => {
      if (outcome.status === 'fulfilled') return outcome.value;
      console.warn(`Orphan detail fetch failed (${detailQueryNames[i]}):`, outcome.reason);
      return { data: null, error: outcome.reason };
    });

    return {
      orphanRow,
      orphanError: null,
      relatedData: {
        paymentsData,
        achievementsData,
        occasionsData,
        occasionOrphansData,
        giftsData,
        logsData,
        familyData,
        programsData,
        sponsorOrphansData,
      },
    };
  })();

  if (result.orphanError || !result.orphanRow) {
    throw result.orphanError || new Error('Orphan not found');
  }

  const {
    orphanRow,
    relatedData: {
      paymentsData,
      achievementsData,
      occasionsData,
      occasionOrphansData,
      giftsData,
      logsData,
      familyData,
      programsData,
      sponsorOrphansData,
    },
  } = result;

  const orphanPayments = (paymentsData.data || []).map(p => ({
    id: p.id,
    amount: parseFloat(p.amount),
    dueDate: new Date(p.due_date),
    paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
    status: p.status as PaymentStatus,
    sponsorId: p.sponsor_id ?? undefined,
    month: p.month ?? undefined,
    year: p.year ?? undefined,
    reminderSentAt: p.reminder_sent_at ? new Date(p.reminder_sent_at) : undefined,
    overdueNotifiedAt: p.overdue_notified_at ? new Date(p.overdue_notified_at) : undefined,
    notes: p.notes ?? undefined,
    paidTransactionId: p.paid_transaction_id ?? undefined,
    createdByTransactionId: p.created_by_transaction_id ?? undefined,
    previousStatusBeforePaid: p.previous_status_before_paid ?? undefined,
    previousAmountBeforePaid: p.previous_amount_before_paid !== null && p.previous_amount_before_paid !== undefined
      ? parseFloat(p.previous_amount_before_paid)
      : undefined,
  })).sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

  const orphanAchievements = (achievementsData.data || []).map(a => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    date: new Date(a.date),
    mediaUrl: a.media_url || undefined,
    mediaType: a.media_type as 'image' | 'video' | undefined,
  })).sort((a, b) => b.date.getTime() - a.date.getTime());

  const orphanOccasionsFromDirect = (occasionsData.data || []).map(o => ({
    id: o.id,
    title: o.title,
    date: new Date(o.date),
    organization_id: o.organization_id,
    occasion_type: o.occasion_type,
    orphan_id: o.orphan_id,
    created_at: new Date(o.created_at),
  }));

  const orphanOccasionsFromJunction: any[] = [];
  (occasionOrphansData.data || []).forEach((item: any) => {
    const occ = item.occasion;
    if (occ && typeof occ === 'object' && !Array.isArray(occ)) {
      const exists = orphanOccasionsFromJunction.find(o => o.id === occ.id);
      if (!exists) {
        orphanOccasionsFromJunction.push({
          id: occ.id,
          title: occ.title,
          date: new Date(occ.date),
          organization_id: occ.organization_id,
          occasion_type: occ.occasion_type,
          orphan_id: occ.orphan_id,
          created_at: new Date(occ.created_at),
        });
      }
    }
  });

  const specialOccasions = [...orphanOccasionsFromDirect, ...orphanOccasionsFromJunction]
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const gifts = (giftsData.data || []).map(g => ({
    id: g.id,
    from: g.from,
    item: g.item,
    date: new Date(g.date),
  })).sort((a, b) => b.date.getTime() - a.date.getTime());

  const updateLogs: UpdateLog[] = (logsData.data || []).map(l => ({
    id: l.id,
    date: new Date(l.date),
    author: (l.user_profiles as any)?.name || 'غير معروف',
    note: l.note,
  })).sort((a, b) => b.date.getTime() - a.date.getTime());

  const familyMembers = (familyData.data || []).map(f => ({
    id: f.id,
    relationship: f.relationship,
    age: f.age ?? undefined,
  }));

  const educationalProgramRow = (programsData.data || []).find(p => p.program_type === 'educational') || null;
  const psychologicalChildRow = (programsData.data || []).find(p => p.program_type === 'psychological_child') || null;
  const psychologicalGuardianRow = (programsData.data || []).find(p => p.program_type === 'psychological_guardian') || null;

  const today = new Date();
  const birthDate = new Date(orphanRow.date_of_birth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const adjustedAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

  const sponsorIdRow = (sponsorOrphansData.data || [])[0]?.sponsor_id as string | undefined;

  return {
    id: uuidToNumber(orphanRow.id),
    uuid: orphanRow.id,
    name: orphanRow.name,
    photoUrl: orphanRow.photo_url || '',
    age: adjustedAge,
    dateOfBirth: new Date(orphanRow.date_of_birth),
    gender: orphanRow.gender as 'ذكر' | 'أنثى',
    healthStatus: orphanRow.health_status || '',
    grade: orphanRow.grade || '',
    country: orphanRow.country || '',
    governorate: orphanRow.governorate || '',
    attendance: orphanRow.attendance || '',
    performance: orphanRow.performance || '',
    familyStatus: orphanRow.family_status || '',
    housingStatus: orphanRow.housing_status || '',
    guardian: orphanRow.guardian || '',
    sponsorId: sponsorIdRow ? uuidToNumber(sponsorIdRow) : 0,
    sponsorshipType: orphanRow.sponsorship_type || '',
    teamMemberId: 0,
    familyMembers,
    hobbies: Array.isArray((orphanRow as { hobbies?: string[] }).hobbies)
      ? [...(orphanRow as { hobbies: string[] }).hobbies]
      : [],
    needsAndWishes: Array.isArray((orphanRow as { needs_wishes?: string[] }).needs_wishes)
      ? [...(orphanRow as { needs_wishes: string[] }).needs_wishes]
      : [],
    updateLogs,
    educationalProgram: educationalProgramRow
      ? {
          status: educationalProgramRow.status as ProgramParticipation['status'],
          details: educationalProgramRow.details || '',
        }
      : { status: 'غير ملتحق', details: '' },
    psychologicalSupport: {
      child: psychologicalChildRow
        ? {
            status: psychologicalChildRow.status as ProgramParticipation['status'],
            details: psychologicalChildRow.details || '',
          }
        : { status: 'غير ملتحق', details: '' },
      guardian: psychologicalGuardianRow
        ? {
            status: psychologicalGuardianRow.status as ProgramParticipation['status'],
            details: psychologicalGuardianRow.details || '',
          }
        : { status: 'غير ملتحق', details: '' },
    },
    payments: orphanPayments,
    achievements: orphanAchievements,
    specialOccasions,
    gifts,
  };
}

// Detail hook - fetches a single orphan with all related data (React Query)
export const useOrphanDetail = (orphanId?: string | null) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: orphan = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orphan-detail', userProfile?.organization_id, orphanId],
    queryFn: () => fetchOrphanDetailData(userProfile!.organization_id, orphanId!),
    enabled: !!userProfile && !!orphanId,
  });

  const invalidateDetail = useCallback(async () => {
    if (!userProfile?.organization_id || !orphanId) return;
    await queryClient.invalidateQueries({
      queryKey: ['orphan-detail', userProfile.organization_id, orphanId],
    });
  }, [userProfile?.organization_id, orphanId, queryClient]);

  const updateOrphan = useCallback(
    async (updates: Partial<{
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
      hobbies: string[];
      needs_wishes: string[];
    }>) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }

      const { error: updateError } = await supabase
        .from('orphans')
        .update(updates)
        .eq('id', orphanId)
        .eq('organization_id', userProfile.organization_id);

      if (updateError) throw updateError;

      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const insertUpdateLog = useCallback(
    async (note: string) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: insertError } = await supabase.from('update_logs').insert({
        orphan_id: orphanId,
        author_id: userProfile.id,
        note,
      });
      if (insertError) throw insertError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const updateUpdateLog = useCallback(
    async (logId: string, updates: { note?: string; date?: string }) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const patch: Record<string, unknown> = {};
      if (updates.note !== undefined) patch.note = updates.note;
      if (updates.date !== undefined) patch.date = updates.date;
      const { error } = await supabase
        .from('update_logs')
        .update(patch)
        .eq('id', logId)
        .eq('orphan_id', orphanId);
      if (error) throw error;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const deleteUpdateLog = useCallback(
    async (logId: string) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error } = await supabase
        .from('update_logs')
        .delete()
        .eq('id', logId)
        .eq('orphan_id', orphanId);
      if (error) throw error;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const insertAchievement = useCallback(
    async (payload: {
      title: string;
      description: string;
      date: string;
      mediaUrl?: string | null;
      mediaType?: 'image' | 'video' | null;
    }) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: insertError } = await supabase.from('achievements').insert({
        orphan_id: orphanId,
        title: payload.title,
        description: payload.description || null,
        date: payload.date,
        media_url: payload.mediaUrl ?? null,
        media_type: payload.mediaType ?? null,
      });
      if (insertError) throw insertError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const updateAchievement = useCallback(
    async (
      achievementId: string,
      updates: {
        title?: string;
        description?: string | null;
        date?: string;
        media_url?: string | null;
        media_type?: string | null;
      }
    ) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const patch: Record<string, unknown> = {};
      if (updates.title !== undefined) patch.title = updates.title;
      if (updates.description !== undefined) patch.description = updates.description;
      if (updates.date !== undefined) patch.date = updates.date;
      if (updates.media_url !== undefined) patch.media_url = updates.media_url;
      if (updates.media_type !== undefined) patch.media_type = updates.media_type;
      const { error } = await supabase
        .from('achievements')
        .update(patch)
        .eq('id', achievementId)
        .eq('orphan_id', orphanId);
      if (error) throw error;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const deleteAchievement = useCallback(
    async (achievementId: string) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId)
        .eq('orphan_id', orphanId);
      if (error) throw error;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const upsertProgramParticipation = useCallback(
    async (input: {
      program_type: 'educational' | 'psychological_child' | 'psychological_guardian';
      status: ProgramParticipation['status'];
      details: string;
    }) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: upsertError } = await supabase.from('program_participations').upsert(
        {
          orphan_id: orphanId,
          program_type: input.program_type,
          status: input.status,
          details: input.details.trim() ? input.details : null,
        },
        { onConflict: 'orphan_id,program_type' }
      );
      if (upsertError) throw upsertError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const insertFamilyMember = useCallback(
    async (relationship: string, age: number | null) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: insertError } = await supabase.from('family_members').insert({
        orphan_id: orphanId,
        relationship,
        age,
      });
      if (insertError) throw insertError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const updateFamilyMember = useCallback(
    async (memberId: string, relationship: string, age: number | null) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ relationship, age })
        .eq('id', memberId)
        .eq('orphan_id', orphanId);
      if (updateError) throw updateError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const deleteFamilyMember = useCallback(
    async (memberId: string) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('orphan_id', orphanId);
      if (deleteError) throw deleteError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  const updatePaymentRow = useCallback(
    async (
      paymentId: string,
      updates: {
        amount?: number;
        due_date?: string;
        paid_date?: string | null;
        status?: PaymentStatus | string;
      }
    ) => {
      if (!userProfile || !orphanId) {
        throw new Error('User not authenticated or orphan not loaded');
      }
      const patch: Record<string, unknown> = {};
      if (updates.amount !== undefined) patch.amount = updates.amount;
      if (updates.due_date !== undefined) patch.due_date = updates.due_date;
      if (updates.paid_date !== undefined) patch.paid_date = updates.paid_date;
      if (updates.status !== undefined) patch.status = updates.status;
      const { error: updateError } = await supabase.from('payments').update(patch).eq('id', paymentId);
      if (updateError) throw updateError;
      await invalidateDetail();
    },
    [userProfile, orphanId, invalidateDetail]
  );

  return {
    orphan,
    loading,
    error: error ? getFriendlyDataError(error) : null,
    refetch,
    updateOrphan,
    insertUpdateLog,
    updateUpdateLog,
    deleteUpdateLog,
    insertAchievement,
    updateAchievement,
    deleteAchievement,
    upsertProgramParticipation,
    insertFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    updatePaymentRow,
  };
};
