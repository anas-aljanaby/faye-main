import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const fetchMessages = async (useCache = true) => {
      const cacheKey = getCacheKey.messages(conversationId);
      
      // Check cache first
      if (useCache) {
        const cachedData = cache.get<Message[]>(cacheKey);
        if (cachedData) {
          setMessages(cachedData);
          setLoading(false);
          // Still fetch in background to update cache (stale-while-revalidate)
          fetchMessages(false).catch(() => {});
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch messages with sender info
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, name, avatar_url)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (!messagesData) {
          setMessages([]);
          setLoading(false);
          cache.set(cacheKey, [], 2 * 60 * 1000);
          return;
        }

        const formattedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          read_at: msg.read_at ? new Date(msg.read_at) : null,
          created_at: new Date(msg.created_at),
          sender: msg.sender ? {
            id: msg.sender.id,
            name: msg.sender.name,
            avatar_url: msg.sender.avatar_url || undefined
          } : undefined
        }));

        setMessages(formattedMessages);
        // Cache the result for 2 minutes
        cache.set(cacheKey, formattedMessages, 2 * 60 * 1000);

        // Mark messages as read when viewing conversation
        markMessagesAsRead(conversationId);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
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

                  setMessages(prev => [...prev, newMessage]);
                  
                  // Update cache
                  const cacheKey = getCacheKey.messages(conversationId);
                  const cachedMessages = cache.get<Message[]>(cacheKey) || [];
                  cache.set(cacheKey, [...cachedMessages, newMessage], 2 * 60 * 1000);

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
              setMessages(prev =>
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
                  fetchMessages(false).catch(() => {});
                }, 5000); // Poll every 5 seconds
              }
            }
          });
      } catch (err) {
        console.error('Error setting up real-time subscription:', err);
        // Fallback to polling if subscription setup fails
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            fetchMessages(false).catch(() => {});
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

    fetchMessages();
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
  }, [conversationId, user]);

  const markMessagesAsRead = useCallback(async (convId: string) => {
    if (!user) return;

    try {
      // Update all unread messages in this conversation that were sent by others
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
      } else {
        // Update local state
        setMessages(prev =>
          prev.map(msg =>
            msg.conversation_id === convId &&
            msg.sender_id !== user.id &&
            !msg.read_at
              ? { ...msg, read_at: new Date() }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user]);

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

      // Clear cache to force refresh
      cache.delete(getCacheKey.messages(conversationId));
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to send message') };
    }
  }, [conversationId, user]);

  return { messages, loading, error, sendMessage, markMessagesAsRead };
};
