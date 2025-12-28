/**
 * Chat API hooks for Rynk Mobile
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestApi, getOrCreateGuestId } from '../api/guest';
import type { Message, Conversation } from '../types';

export interface SendMessageParams {
  conversationId: string;
  message: string;
}

/**
 * Hook to create a new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Conversation> => {
      const response = await guestApi.post<{ conversation: Conversation }>('/guest/conversations');
      return response.conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-conversations'] });
    },
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
    }: SendMessageParams): Promise<{ userMessage: Message; assistantMessage: Message }> => {
      const userMessageId = `msg_${Date.now()}_user`;
      const assistantMessageId = `msg_${Date.now()}_assistant`;
      
      // Get the full response (React Native doesn't support streaming)
      const fullContent = await guestApi.sendChat(conversationId, message);

      const userMessage: Message = {
        id: userMessageId,
        conversationId,
        role: 'user',
        content: message,
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

      const assistantMessage: Message = {
        id: assistantMessageId,
        conversationId,
        role: 'assistant',
        content: fullContent,
        attachments: null,
        parentMessageId: userMessageId,
        versionOf: null,
        versionNumber: 1,
        branchId: null,
        reasoningContent: null,
        reasoningMetadata: null,
        webAnnotations: null,
        modelUsed: null,
        createdAt: new Date().toISOString(),
      };

      return { userMessage, assistantMessage };
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['guest-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['guest-conversations'] });
    },
  });
}

/**
 * Hook to get guest conversations
 */
export function useGuestConversations() {
  const queryClient = useQueryClient();
  
  // We use useMutation here because we need to ensure guest ID exists first
  return useMutation({
    mutationKey: ['guest-conversations'],
    mutationFn: async (): Promise<Conversation[]> => {
      // Ensure guest ID exists
      await getOrCreateGuestId();
      
      const response = await guestApi.get<{ conversations: Conversation[] }>('/guest/conversations');
      return response.conversations || [];
    },
  });
}

/**
 * Hook to get messages for a conversation
 */
export function useGuestMessages(conversationId: string | undefined) {
  return useMutation({
    mutationKey: ['guest-messages', conversationId],
    mutationFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      
      const response = await guestApi.get<{ messages: Message[] }>(`/guest/conversations/${conversationId}/messages`);
      return response.messages || [];
    },
  });
}
