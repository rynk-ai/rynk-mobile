/**
 * API Client for rynk Mobile
 * Connects to the rynk.io backend
 */

import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://rynk.io/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Read from session storage (same as AuthContext uses)
      const sessionStr = await SecureStore.getItemAsync('rynk_session');
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      
      // Check if expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        return null;
      }
      
      return session.accessToken || null;
    } catch {
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
  }

  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text) as T;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Streaming request for chat responses
  // Returns the full response text for parsing by caller
  async streamRaw(
    endpoint: string,
    data: unknown,
    options?: RequestOptions
  ): Promise<string> {
    const { skipAuth = false, headers: customHeaders } = options || {};

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...customHeaders,
    };

    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Stream request failed');
      throw new ApiError(response.status, errorText);
    }

    // Return raw text for parsing by caller
    return await response.text();
  }

  // Legacy stream method for backwards compatibility
  async stream(
    endpoint: string,
    data: unknown,
    onChunk: (chunk: string) => void,
    options?: RequestOptions
  ): Promise<void> {
    const text = await this.streamRaw(endpoint, data, options);
    // Just pass the full text as a single chunk
    onChunk(text);
  }

  async generateSurface(
    messageId: string,
    query: string,
    surfaceType: 'wiki' | 'quiz' | 'course' | 'guide',
    conversationId?: string
  ): Promise<any> {
    const response = await this.post<any>('/mobile/surface/generate', {
      messageId,
      query,
      surfaceType: surfaceType.toLowerCase(),
      conversationId
    });

    return response;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
