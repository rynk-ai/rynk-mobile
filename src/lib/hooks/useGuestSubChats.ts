/**
 * useGuestSubChats - Hook for managing sub-chat threads
 * Port of web's use-guest-sub-chats.ts for React Native
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { guestApi } from '../api/guest';

export interface SubChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface SubChat {
  id: string;
  conversationId: string;
  sourceMessageId: string;
  quotedText: string;
  messages: SubChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface UseGuestSubChatsReturn {
  // State
  subChats: SubChat[];
  activeSubChat: SubChat | null;
  subChatSheetOpen: boolean;
  setSubChatSheetOpen: (open: boolean) => void;
  subChatLoading: boolean;
  subChatStreamingContent: string;
  messageIdsWithSubChats: Set<string>;

  // Handlers
  handleOpenSubChat: (
    text: string,
    messageId: string,
    role: 'user' | 'assistant',
    fullMessageContent: string
  ) => Promise<void>;
  handleViewSubChats: (messageId: string) => void;
  handleOpenExistingSubChat: (subChat: SubChat) => void;
  handleDeleteSubChat: (subChatId: string) => Promise<void>;
  handleSubChatSendMessage: (content: string) => Promise<void>;
}

export function useGuestSubChats(
  currentConversationId: string | null
): UseGuestSubChatsReturn {
  const [subChats, setSubChats] = useState<SubChat[]>([]);
  const [activeSubChat, setActiveSubChat] = useState<SubChat | null>(null);
  const [subChatSheetOpen, setSubChatSheetOpen] = useState(false);
  const [subChatLoading, setSubChatLoading] = useState(false);
  const [subChatStreamingContent, setSubChatStreamingContent] = useState('');

  // Set of message IDs that have sub-chats (for quick lookup)
  const messageIdsWithSubChats = useMemo(() => {
    return new Set(subChats.map((sc) => sc.sourceMessageId));
  }, [subChats]);

  // Load sub-chats for a conversation
  const loadSubChats = useCallback(async (conversationId: string) => {
    try {
      const response = await guestApi.get<{ subChats?: SubChat[] }>(
        `/guest/sub-chats?conversationId=${conversationId}`
      );
      setSubChats(response.subChats || []);
    } catch (err) {
      console.error('Failed to load sub-chats:', err);
    }
  }, []);

  // Load sub-chats when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadSubChats(currentConversationId);
    } else {
      setSubChats([]);
      setActiveSubChat(null);
      setSubChatSheetOpen(false);
    }
  }, [currentConversationId, loadSubChats]);

  // Open or create a sub-chat for selected text
  const handleOpenSubChat = useCallback(
    async (
      text: string,
      messageId: string,
      _role: 'user' | 'assistant',
      fullMessageContent: string
    ) => {
      if (!currentConversationId) return;

      try {
        // Check if there's an existing sub-chat for this exact text and message
        const existing = subChats.find(
          (sc) => sc.sourceMessageId === messageId && sc.quotedText === text
        );

        if (existing) {
          setActiveSubChat(existing);
          setSubChatSheetOpen(true);
          return;
        }

        // Create new sub-chat
        const response = await guestApi.post<{ subChat?: SubChat }>(
          '/guest/sub-chats',
          {
            conversationId: currentConversationId,
            sourceMessageId: messageId,
            quotedText: text,
            fullMessageContent: fullMessageContent,
          }
        );

        const newSubChat = response.subChat;
        if (newSubChat) {
          setSubChats((prev) => [newSubChat, ...prev]);
          setActiveSubChat(newSubChat);
          setSubChatSheetOpen(true);
        }
      } catch (err) {
        console.error('Failed to create sub-chat:', err);
      }
    },
    [currentConversationId, subChats]
  );

  // View existing sub-chats for a message
  const handleViewSubChats = useCallback(
    (messageId: string) => {
      const messageSubChats = subChats.filter(
        (sc) => sc.sourceMessageId === messageId
      );
      if (messageSubChats.length > 0) {
        setActiveSubChat(messageSubChats[0]);
        setSubChatSheetOpen(true);
      }
    },
    [subChats]
  );

  // Open an existing sub-chat directly
  const handleOpenExistingSubChat = useCallback((subChat: SubChat) => {
    setActiveSubChat(subChat);
    setSubChatSheetOpen(true);
  }, []);

  // Delete a sub-chat
  const handleDeleteSubChat = useCallback(
    async (subChatId: string) => {
      try {
        await guestApi.delete(`/guest/sub-chats/${subChatId}`);
        setSubChats((prev) => prev.filter((sc) => sc.id !== subChatId));

        if (activeSubChat?.id === subChatId) {
          setSubChatSheetOpen(false);
          setActiveSubChat(null);
        }
      } catch (err) {
        console.error('Failed to delete sub-chat:', err);
      }
    },
    [activeSubChat]
  );

  // Send a message in the active sub-chat
  const handleSubChatSendMessage = useCallback(
    async (content: string) => {
      if (!activeSubChat) return;

      setSubChatLoading(true);
      setSubChatStreamingContent('');

      try {
        // Add user message optimistically
        const userMessage: SubChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          createdAt: Date.now(),
        };

        setActiveSubChat((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, userMessage],
              }
            : null
        );

        // Send to API
        const response = await guestApi.post<{ subChat?: SubChat }>(
          `/guest/sub-chats/${activeSubChat.id}/message`,
          { content }
        );

        if (response.subChat) {
          setActiveSubChat(response.subChat);
          setSubChats((prev) =>
            prev.map((sc) =>
              sc.id === response.subChat!.id ? response.subChat! : sc
            )
          );
        }
      } catch (err) {
        console.error('Failed to send sub-chat message:', err);
      } finally {
        setSubChatLoading(false);
        setSubChatStreamingContent('');
      }
    },
    [activeSubChat]
  );

  return {
    // State
    subChats,
    activeSubChat,
    subChatSheetOpen,
    setSubChatSheetOpen,
    subChatLoading,
    subChatStreamingContent,
    messageIdsWithSubChats,

    // Handlers
    handleOpenSubChat,
    handleViewSubChats,
    handleOpenExistingSubChat,
    handleDeleteSubChat,
    handleSubChatSendMessage,
  };
}
