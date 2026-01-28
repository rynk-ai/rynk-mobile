/**
 * useStreaming - Streaming state management hook
 * Port of web's useStreaming.ts for React Native
 * Handles throttled content updates for performance
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { StatusPill, SearchResult } from '../types';
export type { StatusPill, SearchResult };

export function useStreaming() {
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [statusPills, setStatusPills] = useState<StatusPill[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  // Buffer for throttling content updates (16ms = 60fps)
  const contentBufferRef = useRef('');
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Start streaming for a specific message
   */
  const startStreaming = useCallback((messageId: string) => {
    setStreamingMessageId(messageId);
    setStreamingContent('');
    setStatusPills([]);
    setSearchResults(null);
    contentBufferRef.current = '';
  }, []);

  /**
   * Update streaming message ID (when temp ID is replaced with real ID)
   */
  const updateStreamingMessageId = useCallback((newMessageId: string) => {
    setStreamingMessageId(newMessageId);
  }, []);

  /**
   * Update streaming content with throttling (16ms batching)
   */
  const updateStreamContent = useCallback((newContent: string) => {
    contentBufferRef.current = newContent;

    // Throttle: Only schedule a flush if one isn't already pending
    if (!flushTimeoutRef.current) {
      flushTimeoutRef.current = setTimeout(() => {
        setStreamingContent(contentBufferRef.current);
        flushTimeoutRef.current = null;
      }, 16); // 60fps
    }
  }, []);

  /**
   * Add a status pill
   */
  const addStatusPill = useCallback((pill: StatusPill) => {
    setStatusPills(prev => [...prev, pill]);
  }, []);

  /**
   * Update search results
   */
  const updateSearchResults = useCallback((results: SearchResult) => {
    setSearchResults(results);
  }, []);

  /**
   * Flush buffered content immediately
   */
  const flushStreamContent = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    setStreamingContent(contentBufferRef.current);
  }, []);

  /**
   * Finish streaming and clear state
   */
  const finishStreaming = useCallback((finalContent?: string) => {
    const contentToFlush = finalContent ?? contentBufferRef.current;
    setStreamingContent(contentToFlush);

    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    setStreamingMessageId(null);
    contentBufferRef.current = '';
  }, []);

  /**
   * Clear status pills (for new conversation)
   */
  const clearStatus = useCallback(() => {
    setStatusPills([]);
    setSearchResults(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    streamingMessageId,
    streamingContent,
    statusPills,
    searchResults,
    isStreaming: streamingMessageId !== null,

    // Actions
    startStreaming,
    updateStreamingMessageId,
    updateStreamContent,
    addStatusPill,
    updateSearchResults,
    flushStreamContent,
    finishStreaming,
    clearStatus,
  };
}
