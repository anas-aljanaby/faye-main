import { useState, useEffect } from 'react';
import { supabase, withUserContext } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { cache } from '../utils/cache';

export interface Delegate {
  id: string;
  organization_id: string;
  name: string;
  task: string | null;
  address: string | null;
  emails: string[];
  phones: string[];
  created_at: Date;
  updated_at: Date;
}

export type DelegateInput = Omit<Delegate, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;

export const useDelegates = () => {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    fetchDelegates();
  }, [userProfile]);

  const fetchDelegates = async (useCache = true) => {
    if (!userProfile) return;

    const cacheKey = `delegates_${userProfile.organization_id}`;
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<Delegate[]>(cacheKey);
      if (cachedData) {
        setDelegates(cachedData);
        setLoading(false);
        // Still fetch in background to update cache (stale-while-revalidate)
        fetchDelegates(false).catch(() => {});
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await withUserContext(async () => {
        return await supabase
          .from('delegates')
          .select('*')
          .eq('organization_id', userProfile.organization_id)
          .order('name', { ascending: true });
      });

      if (fetchError) throw fetchError;

      const delegatesData = (data || []).map(d => ({
        ...d,
        emails: d.emails || [],
        phones: d.phones || [],
        created_at: new Date(d.created_at),
        updated_at: new Date(d.updated_at),
      })) as Delegate[];

      setDelegates(delegatesData);
      cache.set(cacheKey, delegatesData, 5 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching delegates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch delegates');
    } finally {
      setLoading(false);
    }
  };

  const addDelegate = async (delegate: DelegateInput): Promise<Delegate | null> => {
    if (!userProfile) return null;

    try {
      setError(null);

      const { data, error: insertError } = await withUserContext(async () => {
        return await supabase
          .from('delegates')
          .insert({
            organization_id: userProfile.organization_id,
            name: delegate.name,
            task: delegate.task,
            address: delegate.address,
            emails: delegate.emails,
            phones: delegate.phones,
          })
          .select()
          .single();
      });

      if (insertError) throw insertError;

      const newDelegate = {
        ...data,
        emails: data.emails || [],
        phones: data.phones || [],
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as Delegate;

      setDelegates(prev => [...prev, newDelegate].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Invalidate cache
      cache.delete(`delegates_${userProfile.organization_id}`);
      
      return newDelegate;
    } catch (err) {
      console.error('Error adding delegate:', err);
      setError(err instanceof Error ? err.message : 'Failed to add delegate');
      return null;
    }
  };

  const updateDelegate = async (id: string, updates: Partial<DelegateInput>): Promise<Delegate | null> => {
    if (!userProfile) return null;

    try {
      setError(null);

      const { data, error: updateError } = await withUserContext(async () => {
        return await supabase
          .from('delegates')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
      });

      if (updateError) throw updateError;

      const updatedDelegate = {
        ...data,
        emails: data.emails || [],
        phones: data.phones || [],
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      } as Delegate;

      setDelegates(prev => 
        prev.map(d => d.id === id ? updatedDelegate : d)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      
      // Invalidate cache
      cache.delete(`delegates_${userProfile.organization_id}`);
      
      return updatedDelegate;
    } catch (err) {
      console.error('Error updating delegate:', err);
      setError(err instanceof Error ? err.message : 'Failed to update delegate');
      return null;
    }
  };

  const deleteDelegate = async (id: string): Promise<boolean> => {
    if (!userProfile) return false;

    try {
      setError(null);

      const { error: deleteError } = await withUserContext(async () => {
        return await supabase
          .from('delegates')
          .delete()
          .eq('id', id);
      });

      if (deleteError) throw deleteError;

      setDelegates(prev => prev.filter(d => d.id !== id));
      
      // Invalidate cache
      cache.delete(`delegates_${userProfile.organization_id}`);
      
      return true;
    } catch (err) {
      console.error('Error deleting delegate:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete delegate');
      return false;
    }
  };

  return {
    delegates,
    loading,
    error,
    refetch: fetchDelegates,
    addDelegate,
    updateDelegate,
    deleteDelegate,
  };
};
