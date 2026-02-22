/**
 * ChatContext - Context provider for authenticated chat
 * Uses the same hooks as guest chat but with authenticated API
 */

import React, { createContext, useContext, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { api, ApiError } from '../api/client';
import { useMessages } from '../hooks/useMessages';
import { useStreaming, type StatusPill, type SearchResult } from '../hooks/useStreaming';
import { useAuth } from '../auth';
import type { Message, Conversation, Folder, Project } from '../types';
import { filterActiveVersions } from '../utils/filterActiveVersions';

interface ChatContextValue {
  // Conversations
  conversations: Conversation[];
  folders: Folder[];
  projects: Project[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  isLoadingConversations: boolean;

  // Messages
  messages: Message[];

  // Streaming
  streamingMessageId: string | null;
  streamingContent: string;
  statusPills: StatusPill[];
  searchResults: SearchResult | null;
  isStreaming: boolean;

  // Loading states
  isSending: boolean;
  error: string | null;

  // User
  userCredits: number | null;

  // Actions
  selectConversation: (id: string | null) => void;
  sendMessage: (content: string, referencedConversations?: { id: string; title: string }[], attachments?: { url: string; name: string; type: string; size: number }[]) => Promise<void>;
  createNewChat: () => void;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  branchConversation: (messageId: string) => Promise<string>;
  deleteMessage: (messageId: string) => Promise<void>;
  getMessageVersions: (messageId: string) => Promise<Message[]>;
  switchToMessageVersion: (versionId: string) => Promise<void>;
  reloadMessages: () => Promise<Message[]>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;
  createShareLink: (conversationId: string) => Promise<string>;

  // Edit state
  isEditing: boolean;
  editingMessageId: string | null;
  editContent: string;
  startEdit: (message: Message) => void;
  cancelEdit: () => void;
  updateEditContent: (content: string) => void;
  saveEdit: () => Promise<void>;
  isSavingEdit: boolean;

  clearError: () => void;

  // Folders
  createFolder: (name: string, description?: string, conversationIds?: string[]) => Promise<void>;
  updateFolder: (id: string, updates: { name?: string; description?: string; conversationIds?: string[] }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export function useOptionalChatContext() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: React.ReactNode;
  initialConversationId?: string | null;
  projectId?: string | null; // Added projectId prop
}

export function ChatProvider({ children, initialConversationId, projectId }: ChatProviderProps) {
  const { user } = useAuth();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId ?? null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(user?.credits ?? null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sync initialConversationId from props (deep links)
  useEffect(() => {
    if (initialConversationId !== undefined && initialConversationId !== currentConversationId) {
      console.log('[ChatContext] initialConversationId changed, updating currentConversationId:', initialConversationId);
      setCurrentConversationId(initialConversationId);
    }
  }, [initialConversationId]);



  // Hooks
  const {
    messages,
    setMessages,
    addMessages,
    updateMessage,
    replaceMessage,
    clearMessages,
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
    // ... rest of streaming hook
    isStreaming,
    startStreaming,
    updateStreamingMessageId,
    updateStreamContent,
    addStatusPill,
    updateSearchResults,
    finishStreaming,
    clearStatus,
  } = useStreaming();

  // ... (Safety Net useEffect) ...

  const isSendingRef = useRef(false);

  // Computed
  const currentConversation = useMemo(
    () => conversations.find(c => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const endpoint = projectId
        ? `/mobile/conversations?projectId=${projectId}`
        : `/mobile/conversations`;

      const [convRes, foldRes, projRes] = await Promise.all([
        api.get<{ conversations: Conversation[] }>(endpoint),
        // Assuming these endpoints exist, wrap in try/catch if uncertain or handle gracefully
        api.get<{ folders: Folder[] }>('/mobile/folders').catch(() => ({ folders: [] })),
        api.get<{ projects: Project[] }>('/mobile/projects').catch(() => ({ projects: [] })),
      ]);

      let loadedConversations = convRes.conversations || [];
      if (projectId) {
        loadedConversations = loadedConversations.filter(c => c.projectId === projectId);
      } else {
        loadedConversations = loadedConversations.filter(c => !c.projectId);
      }
      setConversations(loadedConversations);

      setFolders(foldRes.folders || []);
      setProjects(projRes.projects || []);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversationId) {
      clearMessages();
      clearStatus();
      return;
    }

    // Skip loading if we're in the middle of sending or streaming
    if (isSendingRef.current || isStreaming) {
      console.log('[ChatContext] Skipping loadMessages - sending or streaming in progress');
      return;
    }

    const loadMessages = async () => {
      // Double-check we're still not sending (async race condition guard)
      if (isSendingRef.current || isStreaming) {
        console.log('[ChatContext] loadMessages aborted - sending started');
        return;
      }

      try {
        const response = await api.get<{ messages: Message[], nextCursor?: string | null }>(
          `/mobile/conversations/${currentConversationId}/messages?limit=20`
        );

        // Final check before setting - don't overwrite optimistic messages
        if (isSendingRef.current || isStreaming) {
          console.log('[ChatContext] loadMessages result discarded - sending in progress');
          return;
        }

        if (response.messages) {
          setMessages(response.messages);
          setNextCursor(response.nextCursor || null);
          setHasMoreMessages(!!response.nextCursor);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [currentConversationId, clearMessages, clearStatus, setMessages, isStreaming, setNextCursor, setHasMoreMessages]);


  // Load older messages (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversationId || isLoadingMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);
      const response = await api.get<{ messages: Message[], nextCursor?: string | null }>(
        `/mobile/conversations/${currentConversationId}/messages?cursor=${nextCursor}&limit=20`
      );

      if (response.messages && response.messages.length > 0) {
        prependMessages(response.messages);
        setNextCursor(response.nextCursor || null);
        setHasMoreMessages(!!response.nextCursor);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentConversationId, isLoadingMore, nextCursor, prependMessages, setNextCursor, setHasMoreMessages, setIsLoadingMore]);

  // Debug Messages State
  useEffect(() => {
    console.log('[ChatContext] Messages state:', messages.length, messages.map(m => m.id));
  }, [messages]);

  // Select conversation
  const selectConversation = useCallback((id: string | null) => {
    setCurrentConversationId(id);
    setError(null);
    clearStatus();
  }, [clearStatus]);

  // Create new chat
  const createNewChat = useCallback(() => {
    console.log('[ChatContext] createNewChat called - clearing messages');
    setCurrentConversationId(null);
    clearMessages();
    clearStatus();
    setError(null);
  }, [clearMessages, clearStatus]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(`/mobile/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) {
        createNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      throw err;
    }
  }, [currentConversationId, createNewChat]);

  // Rename conversation
  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await api.patch(`/mobile/conversations/${id}`, { title });
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      throw err;
    }
  }, []);

  // Toggle pin
  const togglePin = useCallback(async (id: string) => {
    try {
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === id) {
            return { ...c, isPinned: !c.isPinned };
          }
          return c;
        });
      });

      const conversation = conversations.find(c => c.id === id);
      const newIsPinned = !conversation?.isPinned;

      await api.put(`/mobile/conversations/${id}/pin`, { isPinned: newIsPinned });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      // Revert on error
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === id) {
            return { ...c, isPinned: !c.isPinned };
          }
          return c;
        });
      });
    }
  }, [conversations]);

  // Branch conversation
  const branchConversation = useCallback(async (messageId: string) => {
    try {
      if (!currentConversationId) throw new Error("No active conversation");

      const response = await api.post<{ conversationId: string }>('/mobile/conversations/branch', {
        conversationId: currentConversationId,
        messageId
      });

      return response.conversationId;
    } catch (err) {
      console.error('Failed to branch conversation:', err);
      throw err;
    }
  }, [currentConversationId]);

  // Create share link
  const createShareLink = useCallback(async (conversationId: string) => {
    try {
      const response = await api.post<{ share: { id: string } }>('/mobile/share', {
        conversationId
      });
      return response.share.id;
    } catch (err) {
      console.error('Failed to create share link:', err);
      throw err;
    }
  }, []);



  // Get message versions
  const getMessageVersions = useCallback(async (messageId: string): Promise<Message[]> => {
    try {
      const response = await api.get<{ versions: Message[] }>(`/mobile/messages/${messageId}/versions`);
      return response.versions || [];
    } catch (err) {
      console.error('Failed to get message versions:', err);
      return [];
    }
  }, []);

  // Switch to message version
  const switchToMessageVersion = useCallback(async (versionId: string) => {
    try {
      if (!currentConversationId) throw new Error("No active conversation");

      await api.post(`/mobile/messages/${versionId}/versions`, {
        conversationId: currentConversationId
      });

      // Reload messages to show the switched version
      const response = await api.get<{ messages: Message[] }>(
        `/mobile/conversations/${currentConversationId}/messages`
      );
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Failed to switch message version:', err);
      throw err;
    }
  }, [currentConversationId, setMessages]);

  // Reload messages
  const reloadMessages = useCallback(async (): Promise<Message[]> => {
    if (!currentConversationId) return [];
    try {
      const response = await api.get<{ messages: Message[] }>(
        `/mobile/conversations/${currentConversationId}/messages`
      );
      if (response.messages) {
        setMessages(response.messages);
        return response.messages;
      }
      return [];
    } catch (err) {
      console.error('Failed to reload messages:', err);
      return [];
    }
  }, [currentConversationId, setMessages]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      if (!currentConversationId) throw new Error("No active conversation");

      await api.delete(`/mobile/conversations/${currentConversationId}/messages/${messageId}`);

      // Reload messages to reflect server-side cascading deletion
      await reloadMessages();
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  }, [currentConversationId, reloadMessages]);

  // Edit actions
  const startEdit = useCallback((message: Message) => {
    setIsEditing(true);
    setEditingMessageId(message.id);
    setEditContent(message.content);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingMessageId(null);
    setEditContent('');
  }, []);

  const updateEditContent = useCallback((content: string) => {
    setEditContent(content);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingMessageId || !currentConversationId || !editContent.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    const messageIdToEdit = editingMessageId;
    const contentToSave = editContent.trim(); // Capture before cancelEdit

    try {
      // Cancel edit UI immediately
      cancelEdit();

      console.log('[saveEdit] Saving edit:', { messageIdToEdit, contentToSave: contentToSave.substring(0, 50) });

      // Create new version
      const result = await api.post<{ newMessage: Message }>('/mobile/messages/edit', {
        conversationId: currentConversationId,
        messageId: messageIdToEdit,
        newContent: contentToSave,
      });

      if (!result.newMessage) {
        throw new Error('Failed to create message version');
      }

      // Reload messages to get updated list (server returns in path order)
      const freshMessages = await reloadMessages();
      // Note: Server already returns messages in path order with correct version
      // No need for filterActiveVersions as server handles this via conversation.path

      // Check if edited message (new version) is the last user message -> generate AI response
      const lastUserMessage = [...freshMessages].reverse().find(m => m.role === 'user');
      const isEditedMessageLast = lastUserMessage?.id === result.newMessage.id;

      if (isEditedMessageLast) {
        // The edited message was the last user message, trigger AI response
        // The server will create the assistant message - we just need to stream the content

        startStreaming('pending'); // Generic streaming indicator

        addStatusPill({
          status: 'analyzing',
          message: 'Thinking...',
          timestamp: Date.now(),
        });

        let fullContent = '';
        let realAssistantMsgId: string | null = null;

        // Create a dedicated completion handler for this stream execution
        const handleStreamCompletion = async (finalContent: string) => {
          finishStreaming(finalContent);
          await reloadMessages();
        };

        try {
          await api.stream(
            '/mobile/chat',
            {
              conversationId: currentConversationId,
              messageId: result.newMessage.id, // Use new message ID
              useReasoning: 'auto',
            },
            (dataString: string) => {
              if (!dataString) return;
              try {
                const parsed = JSON.parse(dataString);

                if (parsed.type === 'status') {
                  if (parsed.status === 'complete') {
                    // Server says complete
                    return;
                  }
                  addStatusPill({
                    status: parsed.status,
                    message: parsed.message,
                    timestamp: Date.now(),
                  });
                  return;
                }

                if (parsed.type === 'content') {
                  fullContent += parsed.content;
                  updateStreamContent(fullContent);
                  return;
                }

                if (parsed.type === 'search_results') {
                  updateSearchResults(parsed);
                  return;
                }
              } catch (e) {
                // Fallback
                fullContent += dataString;
                updateStreamContent(fullContent);
              }
            },
            {
              onHeaders: (headers: Headers) => {
                realAssistantMsgId = headers.get('X-Assistant-Message-Id');
                console.log('[saveEdit] Got real assistant ID from headers:', realAssistantMsgId);
              }
            }
          );
        } catch (e) {
          console.error('[saveEdit] Stream error:', e);
        } finally {
          // ALWAYS ensure streaming is finished, even on error or hang
          console.log('[saveEdit] Stream finished/closed, cleaning up');
          await handleStreamCompletion(fullContent);
        }
      }
    } catch (err) {
      console.error('Failed to save edit:', err);
      setError(err instanceof Error ? err.message : 'Failed to save edit');
    } finally {
      setIsSavingEdit(false);
    }
  }, [
    editingMessageId,
    currentConversationId,
    editContent,
    isSavingEdit,
    cancelEdit,
    reloadMessages,
    messages,
    addMessages,
    startStreaming,
    addStatusPill,
    updateSearchResults,
    updateStreamContent,
    updateMessage,
    finishStreaming,
  ]);

  // Send message with streaming

  const sendMessage = useCallback(async (
    content: string,
    referencedConversations?: { id: string; title: string }[],
    attachments?: { url: string; name: string; type: string; size: number }[]
  ) => {
    if (!content.trim() || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setError(null);

    try {
      // Create conversation if needed
      let convId = currentConversationId;
      const isNewConversation = !convId;
      if (!convId) {
        const payload: Record<string, string> = {};
        if (projectId) {
          payload.projectId = projectId;
        }

        const response = await api.post<{ conversationId: string }>('/mobile/conversations', payload);
        if (!response?.conversationId) {
          throw new Error('Failed to create conversation: No ID returned');
        }
        convId = response.conversationId;
        setCurrentConversationId(convId);
      }

      // Generate temp IDs
      const tempUserMsgId = `temp_user_${Date.now()}`;
      const tempAssistantMsgId = `temp_assistant_${Date.now()}`;

      // Optimistic user message
      const userMessage: Message = {
        id: tempUserMsgId,
        conversationId: convId,
        role: 'user',
        content: content.trim(),
        attachments: attachments || null,
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

      // Optimistic assistant placeholder
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

      console.log('[sendMessage] Adding optimistic messages:', { tempUserMsgId, tempAssistantMsgId });

      console.log('[sendMessage] Adding optimistic messages:', { tempUserMsgId, tempAssistantMsgId });
      addMessages([userMessage, assistantMessage]);
      startStreaming(tempAssistantMsgId);

      addStatusPill({
        status: 'analyzing',
        message: 'Thinking...',
        timestamp: Date.now(),
      });

      // Track effective IDs
      let effectiveUserMsgId = tempUserMsgId;
      let effectiveAssistantMsgId = tempAssistantMsgId;

      // Stream response
      let fullContent = '';

      try {
        await api.stream(
          '/mobile/chat',
          {
            conversationId: convId,
            message: content.trim(),
            useReasoning: 'auto',
            referencedConversations: referencedConversations || [],
            referencedFolders: [],
            attachments: attachments || [],
          },
          (dataString: string) => {
            if (!dataString) return;
            try {
              const parsed = JSON.parse(dataString);

              if (parsed.type === 'meta') {
                // Update specific IDs from server
                if (parsed.userMessageId && parsed.userMessageId !== effectiveUserMsgId) {
                  effectiveUserMsgId = parsed.userMessageId;
                }
                if (parsed.assistantMessageId && parsed.assistantMessageId !== effectiveAssistantMsgId) {
                  effectiveAssistantMsgId = parsed.assistantMessageId;
                }
                return;
              }

              if (parsed.type === 'status') {
                if (parsed.status === 'complete') return;
                addStatusPill({
                  status: parsed.status,
                  message: parsed.message,
                  timestamp: Date.now(),
                });
                return;
              }

              if (parsed.type === 'content') {
                fullContent += parsed.content;
                updateStreamContent(fullContent);
                return;
              }

              if (parsed.type === 'search_results') {
                updateSearchResults(parsed);
                return;
              }
            } catch (e) {
              fullContent += dataString;
              updateStreamContent(fullContent);
            }
          },
          {
            onHeaders: (headers: Headers) => {
              const realUserMsgId = headers.get('X-User-Message-Id');
              const realAssistantMsgId = headers.get('X-Assistant-Message-Id');

              if (realUserMsgId && realUserMsgId !== tempUserMsgId) {
                replaceMessage(tempUserMsgId, { ...userMessage, id: realUserMsgId });
                effectiveUserMsgId = realUserMsgId;
              }
              if (realAssistantMsgId && realAssistantMsgId !== tempAssistantMsgId) {
                replaceMessage(tempAssistantMsgId, { ...assistantMessage, id: realAssistantMsgId });
                effectiveAssistantMsgId = realAssistantMsgId;
                // Update streaming message ID to match the real ID
                updateStreamingMessageId(realAssistantMsgId);
              }
            }
          }
        );
      } catch (err) {
        console.error('[sendMessage] inner stream error', err);
        throw err;
      } finally {
        console.log('[sendMessage] Stream finished/closed, cleaning up');
        // Update message with final content using correct ID
        updateMessage(effectiveAssistantMsgId, { content: fullContent });
        finishStreaming(fullContent);
      }

      // For new conversations, generate a title (Fire and forget)
      if (isNewConversation) {
        api.post<{ title: string }>('/mobile/chat/title', {
          conversationId: convId,
          messageContent: content.trim()
        })
          .then(() => {
            // Reload conversations to reflect the new title
            // We don't need to await this
            loadData();
          })
          .catch(err => {
            console.error('Failed to generate title:', err);
          });
      }

      // Reload actual messages from server to ensure we have real IDs
      await reloadMessages();
      finishStreaming();

    } finally {
      // Force state update on next tick to ensure UI unblocks
      setTimeout(() => {
        setIsSending(false);
        isSendingRef.current = false;
        // Refresh conversations list in background
        loadData();
      }, 10);
    }
  }, [
    currentConversationId,
    addMessages,
    startStreaming,
    updateStreamingMessageId,
    addStatusPill,
    updateStreamContent,
    updateSearchResults,
    updateMessage,
    replaceMessage,
    finishStreaming,
    loadData,
    reloadMessages,
  ]);

  const clearError = useCallback(() => setError(null), []);

  // Folder actions
  const createFolder = useCallback(async (name: string, description?: string, conversationIds?: string[]) => {
    console.log('[ChatContext] creating folder:', { name, description, conversationIdsCount: conversationIds?.length, conversationIds });
    try {
      const response = await api.post<{ folder: Folder }>('/mobile/folders', {
        name,
        description,
        conversationIds
      });
      console.log('[ChatContext] createFolder response:', response);
      if (response.folder) {
        console.log('[ChatContext] createFolder adding to state:', response.folder);
        setFolders(prev => [response.folder, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
      throw err;
    }
  }, []);

  const updateFolder = useCallback(async (id: string, updates: { name?: string; description?: string; conversationIds?: string[] }) => {
    try {
      const response = await api.patch<{ folder: Folder }>(`/mobile/folders/${id}`, updates);
      if (response.folder) {
        setFolders(prev => prev.map(f => f.id === id ? response.folder : f));
      }
    } catch (err) {
      console.error('Failed to update folder:', err);
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      await api.delete(`/mobile/folders/${id}`);
      setFolders(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed to delete folder:', err);
      throw err;
    }
  }, []);

  // Memoize value
  const value = useMemo<ChatContextValue>(() => ({
    conversations,
    folders,
    projects,
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
    userCredits,
    selectConversation,
    sendMessage,
    createNewChat,
    loadConversations: loadData,
    deleteConversation,
    renameConversation,
    togglePin,
    branchConversation,
    deleteMessage,
    getMessageVersions,
    switchToMessageVersion,
    reloadMessages,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    // Edit state
    isEditing,
    editingMessageId,
    editContent,
    startEdit,
    cancelEdit,
    updateEditContent,
    saveEdit,
    isSavingEdit,
    clearError,
    createFolder,
    updateFolder,
    deleteFolder,
    createShareLink,
  }), [
    conversations,
    folders,
    projects,
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
    userCredits,
    selectConversation,
    sendMessage,
    createNewChat,
    loadData,
    deleteConversation,
    togglePin,
    branchConversation,
    deleteMessage,
    getMessageVersions,
    switchToMessageVersion,
    reloadMessages,
    isEditing,
    editingMessageId,
    editContent,
    startEdit,
    cancelEdit,
    updateEditContent,
    saveEdit,
    isSavingEdit,
    clearError,
    createFolder,
    updateFolder,
    deleteFolder,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
