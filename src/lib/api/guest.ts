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

  constructor(baseUrl: string = 'https://rynk.io/api') {
    this.baseUrl = baseUrl;
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new GuestApiError(response.status, error.error || 'Request failed');
    }

    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text) as T;
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
   * Send a chat message and get response
   * Note: React Native doesn't support ReadableStream, so we get the full response
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
      throw new GuestApiError(response.status, errorText);
    }

    // Get the full response text
    // The server streams SSE events, but we'll collect them all
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
            // Direct content without type
            fullContent += data.content;
          } else if (data.type === 'error') {
            throw new GuestApiError(500, data.error || 'Chat error');
          }
        } catch (e) {
          // Not JSON, check if it's raw content
          const content = line.slice(6).trim();
          if (content && content !== '[DONE]') {
            fullContent += content;
          }
        }
      }
    }
    
    // If no SSE parsing worked, return raw text (fallback)
    if (!fullContent && text) {
      fullContent = text;
    }

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
