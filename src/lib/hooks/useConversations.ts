/**
 * Conversations hook for Rynk Mobile
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Conversation, ConversationsResponse, Message, MessagesResponse } from '../types';

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: async ({ pageParam = 0 }): Promise<ConversationsResponse> => {
      return api.get<ConversationsResponse>(`/chat?offset=${pageParam}&limit=20`);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<Conversation | null> => {
      if (!conversationId) return null;
      return api.get<Conversation>(`/chat/${conversationId}`);
    },
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const response = await api.get<MessagesResponse>(`/chat/${conversationId}/messages`);
      return response.messages;
    },
    enabled: !!conversationId,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/chat/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      await api.put(`/chat/${conversationId}`, { title });
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
