import { supabase } from '../lib/supabase';
import { Conversation } from '../types';

/**
 * Find or create a conversation between two users
 * Ensures user1_id < user2_id to prevent duplicate conversations
 */
export const findOrCreateConversation = async (
  currentUserId: string,
  otherUserId: string,
  organizationId: string
): Promise<{ conversation: Conversation | null; error: Error | null }> => {
  try {
    // Ensure consistent ordering (user1_id < user2_id)
    const [user1Id, user2Id] = currentUserId < otherUserId 
      ? [currentUserId, otherUserId]
      : [otherUserId, currentUserId];

    // Try to find existing conversation
    const { data: existingConv, error: findError } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:user_profiles!conversations_user1_id_fkey(id, name, avatar_url, role),
        user2:user_profiles!conversations_user2_id_fkey(id, name, avatar_url, role)
      `)
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .single();

    if (existingConv && !findError) {
      // Conversation exists, format and return
      const participant = existingConv.user1_id === currentUserId 
        ? existingConv.user2 
        : existingConv.user1;

      return {
        conversation: {
          id: existingConv.id,
          user1_id: existingConv.user1_id,
          user2_id: existingConv.user2_id,
          organization_id: existingConv.organization_id,
          last_message_at: existingConv.last_message_at ? new Date(existingConv.last_message_at) : null,
          created_at: new Date(existingConv.created_at),
          updated_at: new Date(existingConv.updated_at),
          participant: participant ? {
            id: participant.id,
            name: participant.name,
            avatar_url: participant.avatar_url || undefined,
            role: participant.role as 'team_member' | 'sponsor'
          } : undefined
        },
        error: null
      };
    }

    // Conversation doesn't exist, create it
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        organization_id: organizationId
      })
      .select(`
        *,
        user1:user_profiles!conversations_user1_id_fkey(id, name, avatar_url, role),
        user2:user_profiles!conversations_user2_id_fkey(id, name, avatar_url, role)
      `)
      .single();

    if (createError) {
      return { conversation: null, error: createError };
    }

    if (!newConv) {
      return { conversation: null, error: new Error('Failed to create conversation') };
    }

    const participant = newConv.user1_id === currentUserId 
      ? newConv.user2 
      : newConv.user1;

    return {
      conversation: {
        id: newConv.id,
        user1_id: newConv.user1_id,
        user2_id: newConv.user2_id,
        organization_id: newConv.organization_id,
        last_message_at: newConv.last_message_at ? new Date(newConv.last_message_at) : null,
        created_at: new Date(newConv.created_at),
        updated_at: new Date(newConv.updated_at),
        participant: participant ? {
          id: participant.id,
          name: participant.name,
          avatar_url: participant.avatar_url || undefined,
          role: participant.role as 'team_member' | 'sponsor'
        } : undefined
      },
      error: null
    };
  } catch (err) {
    return {
      conversation: null,
      error: err instanceof Error ? err : new Error('Failed to find or create conversation')
    };
  }
};

/**
 * Format timestamp in Arabic relative format
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة${diffMins > 1 ? '' : ''}`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة${diffHours > 1 ? '' : ''}`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} يوم${diffDays > 1 ? '' : ''}`;
  
  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};
