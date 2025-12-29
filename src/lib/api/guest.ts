/**
 * Guest Mode Service for rynk Mobile
 * Manages guest sessions without requiring authentication
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { api } from './client';

const GUEST_ID_KEY = 'rynk_guest_id';

/**
 * Generate a guest ID matching the server format
 */
async function generateGuestId(): Promise<string> {
  const uuid = Crypto.randomUUID();
  return `guest_${uuid}`;
}

/**
 * Get or create a guest ID
 */
export async function getOrCreateGuestId(): Promise<string> {
  try {
    // Check if we already have a guest ID
    const existingId = await SecureStore.getItemAsync(GUEST_ID_KEY);
    if (existingId && existingId.startsWith('guest_')) {
      return existingId;
    }

    // Generate a new guest ID
    const newId = await generateGuestId();
    await SecureStore.setItemAsync(GUEST_ID_KEY, newId);
    return newId;
  } catch (error) {
    // Fallback for environments where SecureStore doesn't work
    console.warn('SecureStore error, using memory storage:', error);
    const newId = await generateGuestId();
    return newId;
  }
}

/**
 * Clear guest session (for logout or reset)
 */
export async function clearGuestSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear guest session:', error);
  }
}

/**
 * Guest API client with automatic guest ID header injection
 */
class GuestApiClient {
  private baseUrl: string;
  private _creditsRemaining: number | null = null;
  private _creditsListeners: ((credits: number | null) => void)[] = [];
  private _activeEventSource: any = null; // Track active SSE connection

  constructor(baseUrl: string = 'https://rynk.io/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Close any active SSE connection
   */
  closeActiveConnection(): void {
    if (this._activeEventSource) {
      console.log('[SSE] Closing previous connection');
      try {
        this._activeEventSource.close();
      } catch (e) {
        console.warn('[SSE] Error closing connection:', e);
      }
      this._activeEventSource = null;
    }
  }

  get creditsRemaining(): number | null {
    return this._creditsRemaining;
  }

  onCreditsChange(listener: (credits: number | null) => void): () => void {
    this._creditsListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this._creditsListeners = this._creditsListeners.filter(l => l !== listener);
    };
  }

  private updateCredits(credits: number | null) {
    this._creditsRemaining = credits;
    this._creditsListeners.forEach(l => l(credits));
  }

  private parseCreditsFromHeaders(headers: Headers): void {
    const creditsHeader = headers.get('x-guest-credits-remaining');
    if (creditsHeader) {
      const credits = parseInt(creditsHeader, 10);
      if (!isNaN(credits)) {
        this.updateCredits(credits);
      }
    }
  }

  private async getHeaders(): Promise<Headers> {
    const guestId = await getOrCreateGuestId();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestId}`,
    });
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getHeaders();
    
    // Merge custom headers
    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse credits from response headers
    this.parseCreditsFromHeaders(response.headers);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      
      // Check for credit exhaustion
      if (response.status === 403 && error.error?.toLowerCase().includes('credit')) {
        this.updateCredits(0);
        throw new GuestApiError(403, 'Credits exhausted. Please sign in to continue.');
      }
      
      throw new GuestApiError(response.status, error.error || 'Request failed');
    }

    const text = await response.text();
    if (!text) return {} as T;
    
    // Try to parse credits from response body if not in headers
    try {
      const json = JSON.parse(text);
      if (typeof json.creditsRemaining === 'number') {
        this.updateCredits(json.creditsRemaining);
      }
      return json as T;
    } catch {
      return {} as T;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Send a chat message and get response (non-streaming - waits for full response)
   * Server sends: JSON status lines + raw text content
   */
  async sendChat(
    conversationId: string,
    message: string,
  ): Promise<string> {
    const headers = await this.getHeaders();
    
    console.log('[sendChat] Starting request to:', `${this.baseUrl}/guest/chat`);
    
    const response = await fetch(`${this.baseUrl}/guest/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversationId,
        message,
        useReasoning: 'auto',
      }),
    });

    console.log('[sendChat] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Chat request failed');
      console.error('[sendChat] Error response:', errorText);
      
      // Check for credit exhaustion
      if (response.status === 403 || response.status === 402 || errorText.toLowerCase().includes('credit')) {
        this.updateCredits(0);
        throw new GuestApiError(402, 'Credits exhausted. Please sign in to continue.');
      }
      
      throw new GuestApiError(response.status, errorText);
    }

    // Parse credits from headers
    this.parseCreditsFromHeaders(response.headers);

    // Get the full response text
    const text = await response.text();
    console.log('[sendChat] Raw response length:', text.length);
    
    // Server sends: JSON lines (for status) + raw text (for content)
    // Content is streamed character-by-character, may include newlines
    const lines = text.split('\n');
    const contentParts: string[] = [];
    
    for (const line of lines) {
      // Try to parse as JSON (status updates, search results, errors)
      if (line.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(line.trim());
          
          // Skip status updates, they're just metadata
          if (parsed.type === 'status') {
            console.log('[sendChat] Status:', parsed.message);
            continue;
          }
          
          // Handle errors
          if (parsed.type === 'error') {
            throw new GuestApiError(500, parsed.message || 'Chat error');
          }
          
          // Handle search results (skip, just metadata)
          if (parsed.type === 'search_results') {
            console.log('[sendChat] Search results received');
            continue;
          }
          
          // Handle context cards (skip, just metadata)
          if (parsed.type === 'context_cards') {
            continue;
          }
          
          // Unknown JSON type - might be content structured differently
          console.log('[sendChat] Unknown JSON type:', parsed.type);
        } catch (e) {
          // Not valid JSON starting with {, treat as content
          contentParts.push(line);
        }
      } else {
        // Raw text content - preserve all lines including empty ones for formatting
        contentParts.push(line);
      }
    }
    
    // Join content with newlines to preserve formatting
    const fullContent = contentParts.join('\n');
    console.log('[sendChat] Parsed content length:', fullContent.length);

    return fullContent;
  }

  /**
   * Send a chat message with streaming callbacks
   * React Native doesn't support ReadableStream, so we fetch full response
   * then parse and call callbacks to simulate streaming experience
   */
  async sendChatStreaming(
    conversationId: string,
    message: string,
    callbacks: {
      onContent?: (content: string, fullContent: string) => void;
      onStatus?: (status: { status: string; message: string }) => void;
      onSearchResults?: (results: any) => void;
    },
    referencedConversations?: { id: string; title: string }[]
  ): Promise<string> {
    const headers = await this.getHeaders();
    
    // Check credits before sending
    if (this._creditsRemaining !== null && this._creditsRemaining <= 0) {
      throw new GuestApiError(402, 'Credits exhausted');
    }

    console.log('[sendChatStreaming] Starting request with referencedConversations:', referencedConversations?.length || 0);
    callbacks.onStatus?.({ status: 'analyzing', message: 'Thinking...' });
    
    const response = await fetch(`${this.baseUrl}/guest/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversationId,
        message,
        useReasoning: 'auto',
        referencedConversations: referencedConversations || [],
        referencedFolders: [],
      }),
    });

    console.log('[sendChatStreaming] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Chat request failed');
      console.error('[sendChatStreaming] Error response:', errorText);
      
      if (response.status === 403 || response.status === 402 || errorText.toLowerCase().includes('credit')) {
        this.updateCredits(0);
        throw new GuestApiError(402, 'Credits exhausted. Please sign in to continue.');
      }
      
      throw new GuestApiError(response.status, errorText);
    }

    // Parse credits from headers
    this.parseCreditsFromHeaders(response.headers);

    // Get the full response text
    const text = await response.text();
    console.log('[sendChatStreaming] Raw response length:', text.length);
    
    // Parse the response and call callbacks
    // The server sends SSE format: "data: content\n" lines mixed with JSON metadata
    const lines = text.split('\n');
    const contentLines: string[] = [];
    
    for (const line of lines) {
      // Handle SSE data: prefix
      let data = line;
      if (line.startsWith('data: ')) {
        data = line.slice(6);
      }
      
      // Skip completely empty SSE lines (not content empty lines)
      if (line.startsWith('data: ') && !data) continue;
      
      // Handle completion signal
      if (data.trim() === '[DONE]') {
        callbacks.onStatus?.({ status: 'complete', message: 'Complete' });
        
        // Decrement credits locally
        if (this._creditsRemaining !== null && this._creditsRemaining > 0) {
          this.updateCredits(this._creditsRemaining - 1);
        }
        continue;
      }
      
      // Try to parse as JSON (status updates, search results, errors)
      if (data.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(data.trim());
          
          if (parsed.type === 'status') {
            callbacks.onStatus?.({
              status: parsed.status,
              message: parsed.message,
            });
            continue;
          }
          
          if (parsed.type === 'search_results') {
            callbacks.onSearchResults?.(parsed);
            continue;
          }
          
          if (parsed.type === 'error') {
            throw new GuestApiError(500, parsed.error || 'Chat error');
          }
          
          if (parsed.type === 'context_cards') {
            continue;
          }
          
          // Unknown JSON type
          console.log('[sendChatStreaming] Unknown JSON type:', parsed.type);
          continue;
        } catch (e) {
          // Not valid JSON starting with {, treat as content
        }
      }
      
      // It's content - preserve the line (including empty lines for paragraphs)
      contentLines.push(data);
    }
    
    // Join content lines preserving original newlines
    const fullContent = contentLines.join('\n').trim();
    callbacks.onContent?.(fullContent, fullContent);
    
    console.log('[sendChatStreaming] Complete, content length:', fullContent.length);
    return fullContent;
  }
}

export class GuestApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'GuestApiError';
  }
}

// Export singleton instance
export const guestApi = new GuestApiClient();
