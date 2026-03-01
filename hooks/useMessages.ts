import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markMessagesAsRead = useCallback(async (convId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      queryClient.setQueryData<Message[]>(['messages', convId], (prev = []) =>
        prev.map(msg =>
          msg.conversation_id === convId &&
          msg.sender_id !== user.id &&
          !msg.read_at
            ? { ...msg, read_at: new Date() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [queryClient, user]);

  const {
    data: messages = EMPTY_MESSAGES,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessagesData(conversationId!),
    enabled: !!conversationId && !!user,
    onSuccess: () => {
      if (conversationId) {
        markMessagesAsRead(conversationId);
      }
    },
  });

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let channel: RealtimeChannel | null = null;

    const refetchMessages = async (_useCache = true, _silent = false) => {
      await refetch();
    };

    // Set up real-time subscription with error handling
    const setupRealtime = (): (() => void) | undefined => {
      if (!conversationId) return;

      let pollInterval: NodeJS.Timeout | null = null;

      try {
        channel = supabase
          .channel(`messages:${conversationId}`, {
            config: {
              broadcast: { self: false }
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
              // Fetch sender info for new message
              supabase
                .from('user_profiles')
                .select('id, name, avatar_url')
                .eq('id', payload.new.sender_id)
                .single()
                .then(({ data: sender }) => {
                  const newMessage: Message = {
                    id: payload.new.id,
                    conversation_id: payload.new.conversation_id,
                    sender_id: payload.new.sender_id,
                    content: payload.new.content,
                    read_at: payload.new.read_at ? new Date(payload.new.read_at) : null,
                    created_at: new Date(payload.new.created_at),
                    sender: sender ? {
                      id: sender.id,
                      name: sender.name,
                      avatar_url: sender.avatar_url || undefined
                    } : undefined
                  };

                  queryClient.setQueryData<Message[]>(['messages', conversationId], (prev = []) => {
                    if (prev.some(msg => msg.id === newMessage.id)) {
                      return prev;
                    }
                    return [...prev, newMessage];
                  });

                  // Mark as read if it's not from current user
                  if (payload.new.sender_id !== user?.id) {
                    markMessagesAsRead(conversationId);
                  }
                })
                .catch(err => {
                  console.error('Error fetching sender info:', err);
                });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
              queryClient.setQueryData<Message[]>(['messages', conversationId], (prev = []) =>
                prev.map(msg =>
                  msg.id === payload.new.id
                    ? {
                        ...msg,
                        read_at: payload.new.read_at ? new Date(payload.new.read_at) : null
                      }
                    : msg
                )
              );
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Real-time subscription active for conversation:', conversationId);
              // Clear any polling interval if subscription succeeds
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Real-time subscription error. Falling back to polling.');
              // Fallback to polling if real-time fails
              if (!pollInterval) {
                pollInterval = setInterval(() => {
                  refetchMessages(false).catch(() => {});
                }, 5000); // Poll every 5 seconds
              }
            }
          });
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
        // Fallback to polling if subscription setup fails
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            refetchMessages(false).catch(() => {});
          }, 5000);
        }
      }

      // Return cleanup function
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    };

    const cleanupRealtime = setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
      if (cleanupRealtime) {
        cleanupRealtime();
      }
    };
  }, [conversationId, markMessagesAsRead, queryClient, refetch, user?.id]);

  const sendMessage = useCallback(async (content: string): Promise<{ error: Error | null }> => {
    if (!conversationId || !user || !content.trim()) {
      return { error: new Error('Missing required fields') };
    }

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        });

      if (insertError) {
        return { error: insertError };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to send message') };
    }
  }, [conversationId, user]);

  return {
    messages,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch messages') : null,
    sendMessage,
    markMessagesAsRead,
  };
};

const EMPTY_MESSAGES: Message[] = [];

async function fetchMessagesData(conversationId: string): Promise<Message[]> {
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!messages_sender_id_fkey(id, name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;
  if (!messagesData) return [];

  return messagesData.map(msg => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    content: msg.content,
    read_at: msg.read_at ? new Date(msg.read_at) : null,
    created_at: new Date(msg.created_at),
    sender: msg.sender ? {
      id: msg.sender.id,
      name: msg.sender.name,
      avatar_url: msg.sender.avatar_url || undefined,
    } : undefined,
  }));
}
