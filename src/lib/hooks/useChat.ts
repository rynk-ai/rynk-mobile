/**
 * Chat API hooks for Rynk Mobile
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestApi, getOrCreateGuestId } from '../api/guest';
import type { Message, Conversation } from '../types';

export interface SendMessageParams {
  conversationId: string;
  message: string;
  onChunk?: (chunk: string) => void;
}

export interface StreamingMessage {
  id: string;
  content: string;
  role: 'assistant';
  isStreaming: boolean;
}

/**
 * Parse SSE stream chunks into content
 */
function parseSSEChunk(chunk: string): { type: string; content?: string; error?: string }[] {
  const events: { type: string; content?: string; error?: string }[] = [];
  
  // SSE format: data: {...}\n\n
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        events.push(data);
      } catch {
        // Not JSON, might be raw content
        events.push({ type: 'content', content: line.slice(6) });
      }
    } else if (line.trim() && !line.startsWith(':')) {
      // Raw content without SSE wrapper
      events.push({ type: 'content', content: line });
    }
  }
  
  return events;
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
 * Hook to send a message with streaming
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
      onChunk,
    }: SendMessageParams): Promise<{ userMessage: Message; assistantMessage: Message }> => {
      const userMessageId = `msg_${Date.now()}_user`;
      const assistantMessageId = `msg_${Date.now()}_assistant`;
      
      let fullContent = '';
      
      // Stream the response
      await guestApi.streamChat(
        conversationId,
        message,
        (chunk) => {
          const events = parseSSEChunk(chunk);
          for (const event of events) {
            if (event.type === 'content' && event.content) {
              fullContent += event.content;
              onChunk?.(event.content);
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Chat error');
            }
          }
        }
      );

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
