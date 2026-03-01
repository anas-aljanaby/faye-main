import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, withUserContext } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

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
  const [mutationError, setMutationError] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['delegates', userProfile?.organization_id];

  const {
    data: delegates = EMPTY_DELEGATES,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchDelegatesData(userProfile!.organization_id),
    enabled: !!userProfile,
  });

  const fetchDelegates = useCallback(async (_useCache = true, _silent = false) => {
    setMutationError(null);
    await refetch();
  }, [refetch]);

  const addDelegate = async (delegate: DelegateInput): Promise<Delegate | null> => {
    if (!userProfile) return null;

    try {
      setMutationError(null);

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

      queryClient.setQueryData<Delegate[]>(queryKey, (prev = EMPTY_DELEGATES) =>
        [...prev, newDelegate].sort((a, b) => a.name.localeCompare(b.name))
      );
      await queryClient.invalidateQueries({ queryKey: ['delegates'] });
      
      return newDelegate;
    } catch (err) {
      console.error('Error adding delegate:', err);
      setMutationError(err instanceof Error ? err.message : 'Failed to add delegate');
      return null;
    }
  };

  const updateDelegate = async (id: string, updates: Partial<DelegateInput>): Promise<Delegate | null> => {
    if (!userProfile) return null;

    try {
      setMutationError(null);

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

      queryClient.setQueryData<Delegate[]>(queryKey, (prev = EMPTY_DELEGATES) =>
        prev.map(d => d.id === id ? updatedDelegate : d)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      await queryClient.invalidateQueries({ queryKey: ['delegates'] });
      
      return updatedDelegate;
    } catch (err) {
      console.error('Error updating delegate:', err);
      setMutationError(err instanceof Error ? err.message : 'Failed to update delegate');
      return null;
    }
  };

  const deleteDelegate = async (id: string): Promise<boolean> => {
    if (!userProfile) return false;

    try {
      setMutationError(null);

      const { error: deleteError } = await withUserContext(async () => {
        return await supabase
          .from('delegates')
          .delete()
          .eq('id', id);
      });

      if (deleteError) throw deleteError;

      queryClient.setQueryData<Delegate[]>(queryKey, (prev = EMPTY_DELEGATES) =>
        prev.filter(d => d.id !== id)
      );
      await queryClient.invalidateQueries({ queryKey: ['delegates'] });
      
      return true;
    } catch (err) {
      console.error('Error deleting delegate:', err);
      setMutationError(err instanceof Error ? err.message : 'Failed to delete delegate');
      return false;
    }
  };

  return {
    delegates,
    loading,
    error: mutationError || (queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch delegates') : null),
    refetch: fetchDelegates,
    addDelegate,
    updateDelegate,
    deleteDelegate,
  };
};

const EMPTY_DELEGATES: Delegate[] = [];

async function fetchDelegatesData(organizationId: string): Promise<Delegate[]> {
  const { data, error } = await withUserContext(async () => {
    return await supabase
      .from('delegates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });
  });

  if (error) throw error;

  return (data || []).map(d => ({
    ...d,
    emails: d.emails || [],
    phones: d.phones || [],
    created_at: new Date(d.created_at),
    updated_at: new Date(d.updated_at),
  })) as Delegate[];
}
