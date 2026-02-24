import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { cache, getCacheKey } from '../utils/cache';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile, user } = useAuth();

  useEffect(() => {
    if (!userProfile || !user) {
      setLoading(false);
      return;
    }

    fetchConversations();
  }, [userProfile, user]);

  const fetchConversations = async (useCache = true, silent = false) => {
    if (!userProfile || !user) return;

    const cacheKey = getCacheKey.conversations(userProfile.organization_id, user.id);
    
    // Check cache first
    if (useCache) {
      const cachedData = cache.get<Conversation[]>(cacheKey);
      if (cachedData) {
        setConversations(cachedData);
        setLoading(false);
        // Revalidate in the background without toggling the loading spinner
        fetchConversations(false, true).catch(() => {});
        return;
      }
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      // Fetch conversations where user is either user1 or user2
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user_profiles!conversations_user1_id_fkey(id, name, avatar_url, role),
          user2:user_profiles!conversations_user2_id_fkey(id, name, avatar_url, role)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData) {
        setConversations([]);
        setLoading(false);
        cache.set(cacheKey, [], 2 * 60 * 1000);
        return;
      }

      // Fetch unread counts and last messages for each conversation
      const conversationIds = conversationsData.map(c => c.id);
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_id, read_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Group messages by conversation
      const messagesByConversation = new Map<string, any[]>();
      (messagesData || []).forEach(msg => {
        if (!messagesByConversation.has(msg.conversation_id)) {
          messagesByConversation.set(msg.conversation_id, []);
        }
        messagesByConversation.get(msg.conversation_id)!.push(msg);
      });

      // Build conversations with participant info, unread count, and last message
      const conversationsWithData: Conversation[] = conversationsData.map((conv) => {
        const participant = conv.user1_id === user.id 
          ? conv.user2 
          : conv.user1;
        
        const messages = messagesByConversation.get(conv.id) || [];
        const unreadCount = messages.filter(
          msg => msg.sender_id !== user.id && !msg.read_at
        ).length;
        
        const lastMessage = messages.length > 0 ? {
          content: messages[0].content,
          created_at: new Date(messages[0].created_at)
        } : undefined;

        return {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          organization_id: conv.organization_id,
          last_message_at: conv.last_message_at ? new Date(conv.last_message_at) : null,
          created_at: new Date(conv.created_at),
          updated_at: new Date(conv.updated_at),
          participant: participant ? {
            id: participant.id,
            name: participant.name,
            avatar_url: participant.avatar_url || undefined,
            role: participant.role as 'team_member' | 'sponsor'
          } : undefined,
          unread_count: unreadCount,
          last_message: lastMessage
        };
      });

      setConversations(conversationsWithData);
      // Cache the result for 2 minutes
      cache.set(cacheKey, conversationsWithData, 2 * 60 * 1000);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  return { conversations, loading, error, refetch: fetchConversations };
};
