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
  sendMessage: (content: string, referencedConversations?: { id: string; title: string }[]) => Promise<void>;
  createNewChat: () => void;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  branchConversation: (messageId: string) => Promise<string>;
  deleteMessage: (messageId: string) => Promise<void>;
  getMessageVersions: (messageId: string) => Promise<Message[]>;
  switchToMessageVersion: (versionId: string) => Promise<void>;
  reloadMessages: () => Promise<void>;
  
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
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
  initialConversationId?: string | null;
}

export function ChatProvider({ children, initialConversationId }: ChatProviderProps) {
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
  
  // Hooks
  const {
    messages,
    setMessages,
    addMessages,
    updateMessage,
    replaceMessage,
    clearMessages,
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
  
  // Refs
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
      const [convRes, foldRes, projRes] = await Promise.all([
        api.get<{ conversations: Conversation[] }>('/mobile/conversations'),
        // Assuming these endpoints exist, wrap in try/catch if uncertain or handle gracefully
        api.get<{ folders: Folder[] }>('/mobile/folders').catch(() => ({ folders: [] })),
        api.get<{ projects: Project[] }>('/mobile/projects').catch(() => ({ projects: [] })),
      ]);
      
      setConversations(convRes.conversations || []);
      setFolders(foldRes.folders || []);
      setProjects(projRes.projects || []);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);
  
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
    
    if (isSendingRef.current) return;
    
    const loadMessages = async () => {
      try {
        const response = await api.get<{ messages: Message[] }>(
          `/mobile/conversations/${currentConversationId}/messages`
        );
        if (response.messages) {
          setMessages(response.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    
    loadMessages();
  }, [currentConversationId, clearMessages, clearStatus, setMessages]);
  
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

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      if (!currentConversationId) throw new Error("No active conversation");

      await api.delete(`/mobile/conversations/${currentConversationId}/messages/${messageId}`);
      
      // Remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  }, [currentConversationId, setMessages]);

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
  const reloadMessages = useCallback(async () => {
    if (!currentConversationId) return;
    try {
      const response = await api.get<{ messages: Message[] }>(
        `/mobile/conversations/${currentConversationId}/messages`
      );
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Failed to reload messages:', err);
    }
  }, [currentConversationId, setMessages]);

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

    try {
      // Cancel edit UI immediately
      cancelEdit();

      // Create new version
      const result = await api.post<{ newMessage: Message }>('/mobile/messages/edit', {
        conversationId: currentConversationId,
        messageId: messageIdToEdit,
        newContent: editContent.trim(),
      });

      if (!result.newMessage) {
        throw new Error('Failed to create message version');
      }

      // Reload messages to get updated list
      await reloadMessages();

      // Check if edited message was last user message -> generate AI response
      const lastUserMsgIndex = messages.findLastIndex(m => m.role === 'user');
      const editedMsgIndex = messages.findIndex(m => m.id === messageIdToEdit);
      
      if (lastUserMsgIndex === editedMsgIndex) {
        // The edited message was the last user message, trigger AI response
        // This will be handled by the streaming flow
        const tempAssistantMsgId = `temp_assistant_${Date.now()}`;
        const assistantMessage: Message = {
          id: tempAssistantMsgId,
          conversationId: currentConversationId,
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
        
        addMessages([assistantMessage]);
        startStreaming(tempAssistantMsgId);
        
        addStatusPill({
          status: 'analyzing',
          message: 'Thinking...',
          timestamp: Date.now(),
        });
        
        let fullContent = '';
        
        await api.stream(
          '/mobile/chat',
          {
            conversationId: currentConversationId,
            messageId: result.newMessage.id, // Use new message ID
            useReasoning: 'auto',
          },
          (rawText: string) => {
            const lines = rawText.split('\n');
            let contentBuffer = '';
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              if (line.startsWith('{')) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.type === 'status') {
                    addStatusPill({
                      status: parsed.status,
                      message: parsed.message,
                      timestamp: Date.now(),
                    });
                    continue;
                  }
                  if (parsed.type === 'search_results') {
                    updateSearchResults(parsed);
                    continue;
                  }
                  if (parsed.type === 'context_cards') continue;
                  contentBuffer += line;
                  if (i < lines.length - 1) contentBuffer += '\n';
                } catch {
                  contentBuffer += line;
                  if (i < lines.length - 1) contentBuffer += '\n';
                }
              } else {
                contentBuffer += line;
                if (i < lines.length - 1) contentBuffer += '\n';
              }
            }
            
            fullContent = contentBuffer;
            updateStreamContent(fullContent);
          }
        );
        
        updateMessage(tempAssistantMsgId, { content: fullContent });
        finishStreaming(fullContent);
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

  const sendMessage = useCallback(async (content: string, referencedConversations?: { id: string; title: string }[]) => {
    if (!content.trim() || isSendingRef.current) return;
    
    isSendingRef.current = true;
    setIsSending(true);
    setError(null);
    
    try {
      // Create conversation if needed
      let convId = currentConversationId;
      const isNewConversation = !convId;
      if (!convId) {
        const response = await api.post<{ conversationId: string }>('/mobile/conversations', {});
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
      
      addMessages([userMessage, assistantMessage]);
      startStreaming(tempAssistantMsgId);
      
      addStatusPill({
        status: 'analyzing',
        message: 'Thinking...',
        timestamp: Date.now(),
      });
      
      // Stream response
      let fullContent = '';
      
      await api.stream(
        '/mobile/chat',
        {
          conversationId: convId,
          message: content.trim(),
          useReasoning: 'auto',
          referencedConversations: referencedConversations || [],
          referencedFolders: [],
        },
        (rawText: string) => {
          // The streaming format is:
          // - Status events: {"type":"status",...}\n
          // - Search results: {"type":"search_results",...}\n
          // - Content: raw text (may contain newlines)
          
          // Strategy: Find and extract JSON events at start of lines,
          // everything else is content
          
          const lines = rawText.split('\n');
          let contentBuffer = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Try to parse as JSON event
            if (line.startsWith('{')) {
              try {
                const parsed = JSON.parse(line);
                
                // Handle status events
                if (parsed.type === 'status') {
                  addStatusPill({
                    status: parsed.status,
                    message: parsed.message,
                    timestamp: Date.now(),
                  });
                  continue; // Don't add to content
                }
                
                // Handle search results
                if (parsed.type === 'search_results') {
                  updateSearchResults(parsed);
                  continue; // Don't add to content
                }
                
                // Handle context cards (skip)
                if (parsed.type === 'context_cards') {
                  continue;
                }
                
                // Unknown JSON - add as content
                contentBuffer += line;
                if (i < lines.length - 1) contentBuffer += '\n';
              } catch {
                // Not valid JSON - add as content
                contentBuffer += line;
                if (i < lines.length - 1) contentBuffer += '\n';
              }
            } else {
              // Plain text line - add to content
              contentBuffer += line;
              if (i < lines.length - 1) contentBuffer += '\n';
            }
          }
          
          // Set the full content (not append - rawText contains full response)
          fullContent = contentBuffer;
          updateStreamContent(fullContent);
        }
      );
      
      // Update message with final content
      updateMessage(tempAssistantMsgId, { content: fullContent });
      finishStreaming(fullContent);
      
      // Refresh conversations list immediately to show the new chat
      loadData();

      // For new conversations, generate a title
      if (isNewConversation) {
        api.post<{ title: string }>('/mobile/chat/title', { 
          conversationId: convId, 
          messageContent: content.trim() 
        })
        .then(() => {
          // Reload conversations to reflect the new title
          loadData();
        })
        .catch(err => {
          console.error('Failed to generate title:', err);
        });
      }
      
    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp_')));
      finishStreaming();
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, [
    currentConversationId,
    addMessages,
    startStreaming,
    addStatusPill,
    updateStreamContent,
    updateSearchResults,
    updateMessage,
    updateMessage,
    finishStreaming,
    loadData,
    setMessages,
  ]);
  
  const clearError = useCallback(() => setError(null), []);
  
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
    togglePin,
    branchConversation,
    deleteMessage,
    getMessageVersions,
    switchToMessageVersion,
    reloadMessages,
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
  ]);
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
