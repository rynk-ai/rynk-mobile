/**
 * Guest Chat hooks for rynk Mobile
 * Handles conversation creation and message sending for guest users
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guestApi, GuestApiError } from '../api/guest';
import type { Conversation, Message } from '../types';

interface CreateConversationResponse {
  id: string;
  conversation: Conversation;
}

interface SendMessageRequest {
  conversationId: string;
  message: string;
}

interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

/**
 * Hook to create a new guest conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const response = await guestApi.post<CreateConversationResponse>('/guest/conversations', {
        title: 'New Chat',
      });
      return { id: response.id || response.conversation?.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-conversations'] });
    },
  });
}

/**
 * Hook to send a message in a guest conversation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, message }: SendMessageRequest): Promise<{ assistantMessage: Message }> => {
      // Send chat and get response content
      const content = await guestApi.sendChat(conversationId, message);

      // Create assistant message from response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        conversationId,
        role: 'assistant',
        content,
        attachments: null,
        parentMessageId: null,
        versionOf: null,
        versionNumber: 1,
        branchId: null,
        reasoningContent: null,
        reasoningMetadata: null,
        webAnnotations: null,
        modelUsed: null,
        createdAt: new Date().toISOString(),
      };

      return { assistantMessage };
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['guest-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['guest-conversations'] });
    },
  });
}

/**
 * Hook to fetch guest conversations
 */
export function useGuestConversations() {
  return useQuery({
    queryKey: ['guest-conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      const response = await guestApi.get<{ conversations: Conversation[] }>('/guest/conversations');
      return response.conversations || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch messages for a guest conversation
 */
export function useGuestMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['guest-messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const response = await guestApi.get<{ messages: Message[] }>(
        `/guest/conversations/${conversationId}/messages`
      );
      return response.messages || [];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Hook to delete a guest conversation
 */
export function useDeleteGuestConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await guestApi.delete(`/guest/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-conversations'] });
    },
  });
}

export { GuestApiError };
