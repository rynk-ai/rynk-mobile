/**
 * useMessages - Message state management hook
 * Port of web's useMessageState.ts for React Native
 */

import { useState, useCallback } from 'react';
import type { Message } from '../types';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageVersions, setMessageVersions] = useState<Map<string, Message[]>>(new Map());

  /**
   * Update a specific message by ID with partial updates
   */
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
  }, []);

  /**
   * Add new messages to the list, avoiding duplicates
   * Messages are sorted by createdAt after adding
   */
  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const toAdd = newMessages.filter(m => !existingIds.has(m.id));
      if (toAdd.length === 0) return prev;

      const combined = [...prev, ...toAdd];
      return combined.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  /**
   * Remove a message by ID
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageVersions(new Map());
  }, []);

  /**
   * Replace a message with a new one (swap temp ID with real ID)
   */
  const replaceMessage = useCallback((oldId: string, newMessage: Message) => {
    setMessages(prev => {
      // Check if the new ID already exists
      const exists = prev.some(m => m.id === newMessage.id && m.id !== oldId);

      if (exists) {
        // If exists, just remove the temporary message
        return prev.filter(m => m.id !== oldId);
      }

      // Otherwise replace the temp message with the new one
      return prev.map(m => m.id === oldId ? newMessage : m);
    });
  }, []);

  return {
    messages,
    setMessages,
    messageVersions,
    setMessageVersions,
    updateMessage,
    addMessages,
    removeMessage,
    clearMessages,
    replaceMessage,
  };
}
