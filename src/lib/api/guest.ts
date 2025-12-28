/**
 * Guest Mode Service for Rynk Mobile
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

  constructor(baseUrl: string = 'https://rynk.io/api') {
    this.baseUrl = baseUrl;
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
   * Send a chat message and get response (non-streaming fallback)
   * Used when streaming is not needed or fails
   */
  async sendChat(
    conversationId: string,
    message: string,
  ): Promise<string> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`${this.baseUrl}/guest/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversationId,
        message,
        useReasoning: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Chat request failed');
      
      // Check for credit exhaustion
      if (response.status === 402 || errorText.toLowerCase().includes('credit')) {
        this.updateCredits(0);
        throw new GuestApiError(402, 'Credits exhausted. Please sign in to continue.');
      }
      
      throw new GuestApiError(response.status, errorText);
    }

    // Parse credits from headers
    this.parseCreditsFromHeaders(response.headers);

    // Get the full response text
    const text = await response.text();
    
    // Parse SSE events and extract content
    let fullContent = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content' && data.content) {
            fullContent += data.content;
          } else if (data.content && !data.type) {
            fullContent += data.content;
          } else if (data.type === 'error') {
            throw new GuestApiError(500, data.error || 'Chat error');
          }
        } catch (e) {
          const content = line.slice(6).trim();
          if (content && content !== '[DONE]') {
            fullContent += content;
          }
        }
      }
    }
    
    if (!fullContent && text) {
      fullContent = text;
    }

    return fullContent;
  }

  /**
   * Send a chat message with SSE streaming
   * Provides real-time updates via callbacks
   */
  async sendChatStreaming(
    conversationId: string,
    message: string,
    callbacks: {
      onContent?: (content: string, fullContent: string) => void;
      onStatus?: (status: { status: string; message: string }) => void;
      onSearchResults?: (results: any) => void;
      onComplete?: (fullContent: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    const guestId = await getOrCreateGuestId();
    
    // Check credits before sending
    if (this._creditsRemaining !== null && this._creditsRemaining <= 0) {
      callbacks.onError?.(new GuestApiError(402, 'Credits exhausted'));
      return;
    }

    let fullContent = '';
    
    try {
      // Use react-native-sse for streaming
      const EventSource = require('react-native-sse').default;
      
      const es = new EventSource(`${this.baseUrl}/guest/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestId}`,
        },
        body: JSON.stringify({
          conversationId,
          message,
          useReasoning: 'auto',
        }),
      });

      es.addEventListener('open', () => {
        console.log('[SSE] Connection opened');
        callbacks.onStatus?.({ status: 'analyzing', message: 'Analyzing request...' });
      });

      es.addEventListener('message', (event: any) => {
        const data = event.data;
        
        if (!data || data === '[DONE]') {
          return;
        }

        try {
          // Try parsing as JSON (status updates, search results)
          const parsed = JSON.parse(data);
          
          if (parsed.type === 'status') {
            callbacks.onStatus?.({
              status: parsed.status,
              message: parsed.message,
            });
          } else if (parsed.type === 'search_results') {
            callbacks.onSearchResults?.(parsed);
          } else if (parsed.type === 'error') {
            callbacks.onError?.(new GuestApiError(500, parsed.error || 'Chat error'));
            es.close();
          }
        } catch {
          // Not JSON - it's content
          fullContent += data;
          callbacks.onContent?.(data, fullContent);
        }
      });

      es.addEventListener('error', (event: any) => {
        console.error('[SSE] Error:', event);
        
        if (event.status === 402 || event.message?.includes('credit')) {
          this.updateCredits(0);
          callbacks.onError?.(new GuestApiError(402, 'Credits exhausted'));
        } else {
          callbacks.onError?.(new GuestApiError(event.status || 500, event.message || 'Stream error'));
        }
        
        es.close();
      });

      es.addEventListener('close', () => {
        console.log('[SSE] Connection closed');
        callbacks.onStatus?.({ status: 'complete', message: 'Complete' });
        callbacks.onComplete?.(fullContent);
        
        // Decrement credits locally
        if (this._creditsRemaining !== null && this._creditsRemaining > 0) {
          this.updateCredits(this._creditsRemaining - 1);
        }
      });

    } catch (error: any) {
      console.error('[SSE] Setup error:', error);
      callbacks.onError?.(error);
    }
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
