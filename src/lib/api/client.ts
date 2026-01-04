/**
 * API Client for rynk Mobile
 * Connects to the rynk.io backend
 */

import { loadSession, saveSession, clearSession } from '../auth/storage';
import type { Session } from '../types/auth';

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
      const session = await loadSession();
      if (!session) return null;

      // Check if access token is expired or expiring soon (within 60s)
      if (Date.now() > session.accessTokenExpiresAt - 60000) {
        console.log('[ApiClient] Access token expired/expiring, refreshing...');
        return await this.refreshAccessToken(session.refreshToken);
      }

      return session.accessToken;
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/mobile/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('[ApiClient] Refresh failed:', response.status);
        await clearSession();
        return null;
      }

      const data = await response.json();
      
      const newSession: Session = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: new Date(data.accessTokenExpiresAt).getTime(),
        refreshTokenExpiresAt: new Date(data.refreshTokenExpiresAt).getTime(),
      };

      await saveSession(newSession);
      return newSession.accessToken;
    } catch (error) {
      console.error('[ApiClient] Refresh error:', error);
      return null;
    }
  }

  async clearAuthToken(): Promise<void> {
    await clearSession();
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

  private async pollForJobCompletion(
    jobId: string,
    maxAttempts = 90,
    intervalMs = 1500
  ): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs));
        try {
            const data = await this.get<{
                status: 'queued' | 'processing' | 'complete' | 'error';
                result?: { surfaceState: any };
                error?: string;
            }>(`/jobs/${jobId}`);

            console.log(`[ApiClient] Poll job ${jobId}: ${data.status}`);

            if (data.status === 'complete' && data.result?.surfaceState) {
                return { surfaceState: data.result.surfaceState };
            }

            if (data.status === 'error') {
                throw new Error(data.error || 'Job failed');
            }
        } catch (error) {
            console.log(`[ApiClient] Polling error (attempt ${i + 1}):`, error);
             if (error instanceof ApiError && error.status === 401) {
                 throw error;
             }
             // Continue polling on other errors (e.g. network glitch)
        }
    }
    throw new Error('Job timed out');
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

    if (response.async && response.jobId) {
        console.log(`[ApiClient] Surface generation is async, polling job: ${response.jobId}`);
        return this.pollForJobCompletion(response.jobId);
    }

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
