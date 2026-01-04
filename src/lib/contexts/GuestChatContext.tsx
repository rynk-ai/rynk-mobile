/**
 * GuestChatContext - Context provider for guest chat
 * Combines message state, streaming, and guest API integration
 */

import React, { createContext, useContext, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { guestApi, GuestApiError } from '../api/guest';
import { useMessages } from '../hooks/useMessages';
import { useStreaming, type StatusPill, type SearchResult } from '../hooks/useStreaming';
import type { Message, Conversation, Folder, SurfaceMode } from '../types';

// Initial Folders (Mock data for guest)
const INITIAL_FOLDERS: Folder[] = [];

// Page size for message pagination
const MESSAGE_PAGE_SIZE = 30;

interface GuestChatContextValue {
  // Conversations
  conversations: Conversation[];
  folders: Folder[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;
  
  // Messages
  messages: Message[];
  
  // Pagination
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  loadMoreMessages: () => Promise<void>;
  
  // Streaming
  streamingMessageId: string | null;
  streamingContent: string;
  statusPills: StatusPill[];
  searchResults: SearchResult | null;
  isStreaming: boolean;
  
  // Loading states
  isSending: boolean;
  error: string | null;
  
  // Credits
  creditsRemaining: number | null;
  isCreditsExhausted: boolean;
  
  // Actions
  selectConversation: (id: string | null) => void;
  sendMessage: (content: string, referencedConversations?: { id: string; title: string }[], surfaceMode?: SurfaceMode) => Promise<void>;
  createNewChat: () => void;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  clearError: () => void;
}

const GuestChatContext = createContext<GuestChatContextValue | null>(null);

export function useGuestChatContext() {
  const context = useContext(GuestChatContext);
  if (!context) {
    throw new Error('useGuestChatContext must be used within a GuestChatProvider');
  }
  return context;
}

interface GuestChatProviderProps {
  children: React.ReactNode;
  initialConversationId?: string | null;
}

export function GuestChatProvider({ children, initialConversationId }: GuestChatProviderProps) {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId ?? null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  
  // Hooks
  const {
    messages,
    setMessages,
    addMessages,
    updateMessage,
    replaceMessage,
    clearMessages,
    // Pagination
    prependMessages,
    nextCursor,
    setNextCursor,
    hasMoreMessages,
    setHasMoreMessages,
    isLoadingMore,
    setIsLoadingMore,
  } = useMessages();
  
  const {
    streamingMessageId,
    streamingContent,
    statusPills,
    searchResults,
    isStreaming,
    startStreaming,
    updateStreamContent,
    addStatusPill,
    updateSearchResults,
    finishStreaming,
    clearStatus,
  } = useStreaming();
  
  // Refs for avoiding stale closures
  const isSendingRef = useRef(false);
  const loadConversationsRef = useRef<() => Promise<void>>(() => Promise.resolve());
  
  // Computed
  const currentConversation = useMemo(
    () => conversations.find(c => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );
  
  const isCreditsExhausted = creditsRemaining !== null && creditsRemaining <= 0;
  
  // Subscribe to credit updates
  useEffect(() => {
    const unsubscribe = guestApi.onCreditsChange(setCreditsRemaining);
    return unsubscribe;
  }, []);
  
  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await guestApi.get<{ conversations: Conversation[] }>('/guest/conversations');
      setConversations(response.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);
  
  // Keep ref updated for use in sendMessage
  useEffect(() => {
    loadConversationsRef.current = loadConversations;
  }, [loadConversations]);
  
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  // Load messages when conversation changes (with pagination)
  useEffect(() => {
    if (!currentConversationId) {
      clearMessages();
      clearStatus();
      return;
    }
    
    // Don't reload if we're sending (preserve optimistic messages)
    if (isSendingRef.current) return;
    
    const loadInitialMessages = async () => {
      try {
        const response = await guestApi.get<{ messages: Message[]; nextCursor: string | null }>(
          `/guest/conversations/${currentConversationId}/messages?limit=${MESSAGE_PAGE_SIZE}`
        );
        if (response.messages) {
          setMessages(response.messages);
          setNextCursor(response.nextCursor ?? null);
          setHasMoreMessages(!!response.nextCursor);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    
    loadInitialMessages();
  }, [currentConversationId, clearMessages, clearStatus, setMessages, setNextCursor, setHasMoreMessages]);
  
  // Load more messages (for pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversationId || !nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await guestApi.get<{ messages: Message[]; nextCursor: string | null }>(
        `/guest/conversations/${currentConversationId}/messages?limit=${MESSAGE_PAGE_SIZE}&cursor=${encodeURIComponent(nextCursor)}`
      );
      if (response.messages && response.messages.length > 0) {
        prependMessages(response.messages);
        setNextCursor(response.nextCursor ?? null);
        setHasMoreMessages(!!response.nextCursor);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentConversationId, nextCursor, isLoadingMore, prependMessages, setNextCursor, setHasMoreMessages, setIsLoadingMore]);
  
  // Select conversation
  const selectConversation = useCallback((id: string | null) => {
    setCurrentConversationId(id);
    setError(null);
    clearStatus();
  }, [clearStatus]);
  
  // Create new chat
  const createNewChat = useCallback(() => {
    setCurrentConversationId(null);
    clearMessages();
    clearStatus();
    setError(null);
  }, [clearMessages, clearStatus]);
  
  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await guestApi.delete(`/guest/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        createNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [currentConversationId, createNewChat]);
  
  // Send message with streaming
  const sendMessage = useCallback(async (content: string, referencedConversations?: { id: string; title: string }[], surfaceMode?: SurfaceMode) => {
    console.log('[sendMessage] Entry - isSendingRef:', isSendingRef.current, 'isSending:', isSending, 'content:', content.substring(0, 30), 'referencedConversations:', referencedConversations?.length || 0);
    
    // Immediate check and lock - must be synchronous
    if (!content.trim()) {
      console.log('[sendMessage] Empty content, returning');
      return;
    }
    if (isSendingRef.current) {
      console.log('[sendMessage] Already sending (ref=true), ignoring duplicate call');
      return;
    }
    
    // Set lock immediately before any async work
    console.log('[sendMessage] Setting lock and proceeding...');
    isSendingRef.current = true;
    setIsSending(true);
    
    // Check credits
    if (isCreditsExhausted) {
      setError('Credits exhausted. Please sign in to continue.');
      isSendingRef.current = false;
      setIsSending(false);
      return;
    }
    
    setError(null);
    
    try {
      // Create conversation ID if needed - don't call API, let chat service create it with title
      let convId = currentConversationId;
      const isNewConversation = !convId;
      if (!convId) {
        // Generate UUID client-side, chat service will create the conversation with message as title
        convId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        setCurrentConversationId(convId);
      }
      
      // Generate temp IDs for optimistic update
      const tempUserMsgId = `temp_user_${Date.now()}`;
      const tempAssistantMsgId = `temp_assistant_${Date.now()}`;
      
      // Add optimistic user message
      const userMessage: Message = {
        id: tempUserMsgId,
        conversationId: convId,
        role: 'user',
        content: content.trim(),
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
      
      // Add optimistic assistant placeholder
      const assistantMessage: Message = {
        id: tempAssistantMsgId,
        conversationId: convId,
        role: 'assistant',
        content: '',
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
      
      addMessages([userMessage, assistantMessage]);
      startStreaming(tempAssistantMsgId);
      
      // Add initial status
      addStatusPill({
        status: 'analyzing',
        message: 'Thinking...',
        timestamp: Date.now(),
      });
      
      // Stream the response
      const finalContent = await guestApi.sendChatStreaming(
        convId,
        content.trim(),
        {
          onContent: (chunk, fullContent) => {
            updateStreamContent(fullContent);
          },
          onStatus: (status) => {
            addStatusPill({
              status: status.status as StatusPill['status'],
              message: status.message,
              timestamp: Date.now(),
            });
          },
          onSearchResults: (results) => {
            updateSearchResults(results);
          },
        },

        referencedConversations,
        surfaceMode
      );
      
      // Update assistant message with final content
      updateMessage(tempAssistantMsgId, { content: finalContent });
      finishStreaming(finalContent);
      
      // Refresh conversations list using ref to avoid stale closure
      loadConversationsRef.current?.();
      
    } catch (err) {
      console.error('Send message error:', err);
      
      if (err instanceof GuestApiError && (err.status === 402 || err.status === 403)) {
        setCreditsRemaining(0);
        setError('Credits exhausted. Please sign in to continue.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
      
      // Remove optimistic messages on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp_')));
      finishStreaming();
      
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, [
    currentConversationId,
    isCreditsExhausted,
    addMessages,
    startStreaming,
    addStatusPill,
    updateStreamContent,
    updateSearchResults,
    updateMessage,
    finishStreaming,
    setMessages,
  ]);
  
  // Clear error
  const clearError = useCallback(() => setError(null), []);
  
  // Memoize context value
  const value = useMemo<GuestChatContextValue>(() => ({
    conversations,
    currentConversationId,
    currentConversation,
    isLoadingConversations,
    messages,
    streamingMessageId,
    streamingContent,
    statusPills,
    searchResults,
    isStreaming,
    isSending,
    error,
    creditsRemaining,
    isCreditsExhausted,
    selectConversation,
    sendMessage,
    createNewChat,
    loadConversations,
    deleteConversation,

    togglePinConversation: async (id: string) => {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    },
    folders,
    createFolder: async (name: string) => {
      const newFolder: Folder = {
        id: `folder_${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversationIds: [],
      };
      setFolders(prev => [newFolder, ...prev]);
    },
    deleteFolder: async (id: string) => { 
      setFolders(prev => prev.filter(f => f.id !== id));
    },
    // Pagination
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    clearError,
  }), [
    conversations,
    // Add new dependencies if state added
    currentConversationId,
    currentConversation,
    isLoadingConversations,
    messages,
    streamingMessageId,
    streamingContent,
    statusPills,
    searchResults,
    isStreaming,
    isSending,
    error,
    creditsRemaining,
    isCreditsExhausted,
    selectConversation,
    sendMessage,
    createNewChat,
    loadConversations,
    deleteConversation,
    folders,
    // Pagination deps
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,
    clearError,
  ]);
  
  return (
    <GuestChatContext.Provider value={value}>
      {children}
    </GuestChatContext.Provider>
  );
}
