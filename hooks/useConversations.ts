import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useConversations = () => {
  const { userProfile, user } = useAuth();
  const {
    data: conversations = EMPTY_CONVERSATIONS,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations', userProfile?.organization_id, user?.id],
    queryFn: () => fetchConversationsData(userProfile!.organization_id, user!.id),
    enabled: !!userProfile && !!user,
  });

  const fetchConversations = useCallback(async (_useCache = true, _silent = false) => {
    await refetch();
  }, [refetch]);

  return {
    conversations,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch conversations') : null,
    refetch: fetchConversations,
  };
};

const EMPTY_CONVERSATIONS: Conversation[] = [];

async function fetchConversationsData(
  organizationId: string,
  currentUserId: string
): Promise<Conversation[]> {
  const { data: conversationsData, error: conversationsError } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:user_profiles!conversations_user1_id_fkey(id, name, avatar_url, role),
      user2:user_profiles!conversations_user2_id_fkey(id, name, avatar_url, role)
    `)
    .eq('organization_id', organizationId)
    .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (conversationsError) throw conversationsError;
  if (!conversationsData || conversationsData.length === 0) return [];

  const conversationIds = conversationsData.map(c => c.id);
  const { data: messagesData } = await supabase
    .from('messages')
    .select('conversation_id, content, created_at, sender_id, read_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false });

  const messagesByConversation = new Map<string, any[]>();
  (messagesData || []).forEach(msg => {
    if (!messagesByConversation.has(msg.conversation_id)) {
      messagesByConversation.set(msg.conversation_id, []);
    }
    messagesByConversation.get(msg.conversation_id)!.push(msg);
  });

  return conversationsData.map((conv) => {
    const participant = conv.user1_id === currentUserId
      ? conv.user2
      : conv.user1;

    const messages = messagesByConversation.get(conv.id) || [];
    const unreadCount = messages.filter(
      msg => msg.sender_id !== currentUserId && !msg.read_at
    ).length;

    const lastMessage = messages.length > 0 ? {
      content: messages[0].content,
      created_at: new Date(messages[0].created_at),
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
        role: participant.role as 'team_member' | 'sponsor',
      } : undefined,
      unread_count: unreadCount,
      last_message: lastMessage,
    };
  });
}
