/**
 * API Client for rynk Mobile
 * Connects to the rynk.io backend
 */

import EventSource, { type EventSourceListener } from "react-native-sse";
import { loadSession, saveSession, clearSession } from '../auth/storage';
import type { Session } from '../types/auth';

const API_BASE_URL = 'https://rynk.io/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  onHeaders?: (headers: Headers) => void;
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
      const errorText = await response.text();
      let errorMessage = 'Request failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // Use raw text if not JSON
        if (errorText.length > 0) errorMessage = errorText.substring(0, 100);
      }
      
      console.log(`[ApiClient] Request failed: ${fetchOptions.method || 'GET'} ${url} -> ${response.status} ${errorMessage}`);
      throw new ApiError(response.status, errorMessage);
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

  // Streaming request for chat responses using SSE
  // Returns a Promise that resolves when stream is closed or rejects on error.
  async stream(
    endpoint: string,
    data: unknown,
    onMessage: (data: string) => void,
    options?: RequestOptions
  ): Promise<void> {
    const { skipAuth = false, headers: customHeaders } = options || {};

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const requestId = Math.random().toString(36).substring(7);
    console.log(`[ApiClient] stream() called. RequestId: ${requestId} URL: ${endpoint}`);

    console.log(`[ApiClient] stream() called. RequestId: ${requestId} URL: ${endpoint}`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      
      // Set headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      let seenBytes = 0;
      let buffer = '';
      let headersEmitted = false;

      const processBuffer = () => {
        // We assume structured messages (JSON or SSE) always end with a newline
        // Raw content might not.
        
        while (buffer.length > 0) {
          // Heuristic: Is this likely a structured message?
          // We check trimmed version to handle leading newlines from previous SSE double-newlines
          const trimmed = buffer.trimStart();
          const isStructured = trimmed.startsWith('{') || trimmed.startsWith('data: ');
          
          if (isStructured) {
            // If we detected structured message, consume the leading whitespace first
            if (buffer.length !== trimmed.length) {
              buffer = trimmed;
            }

            // Find delimiter
            // SSE uses \n\n, JSON-lines uses \n. safe to look for \n
            const newlineIdx = buffer.indexOf('\n');
            
            if (newlineIdx === -1) {
              // Incomplete structured message, wait for more data
              return;
            }
            
            const line = buffer.substring(0, newlineIdx).trim();
            buffer = buffer.substring(newlineIdx + 1); // Advance buffer
            
            if (!line) continue;
            
            // Try to parse as SSE or JSON
            let jsonStr = line;
            if (line.startsWith('data: ')) {
               jsonStr = line.substring(6).trim();
            }
            
            if (!jsonStr) continue;

            try {
               const parsed = JSON.parse(jsonStr);
               if (parsed.type === 'status' && parsed.status === 'complete') {
                  console.log(`[ApiClient] Stream complete (${requestId})`);
                  onMessage(jsonStr);
                  xhr.abort();
                  resolve();
                  return true; // Stop processing
               }
               onMessage(jsonStr);
            } catch (e) {
               // If it looked like JSON but failed, it might be raw text starting with {?
               // Highly unlikely for our schema, but let's log and treat as content fallback?
               // No, safer to ignore likely-malformed system messages to avoid showing code to user
               console.warn(`[ApiClient] Parse error (${requestId}):`, e);
            }
            
          } else {
             // It's raw content (Text Stream)
             
             // Check for functionality: content immediately followed by JSON control message
             // (e.g. "Some text{"type":"status"...)
             const jsonPatterns = [
               '{"type":"status"',
               '{"type":"search_results"',
               '{"type":"context_cards"'
             ];
             
             let jsonIdx = -1;
             for (const pattern of jsonPatterns) {
               const idx = buffer.indexOf(pattern);
               if (idx !== -1 && (jsonIdx === -1 || idx < jsonIdx)) {
                 jsonIdx = idx;
               }
             }
             
             if (jsonIdx !== -1) {
               // Found embedded JSON!
               // 1. Emit content up to the JSON
               if (jsonIdx > 0) {
                 const contentChunk = buffer.substring(0, jsonIdx);
                 onMessage(JSON.stringify({ type: 'content', content: contentChunk }));
               }
               
               // 2. Keep the JSON part in the buffer for the next loop iteration
               // (where isStructured will be true)
               buffer = buffer.substring(jsonIdx);
               continue;
             }
             
             // Normal content handling
             const newlineIdx = buffer.indexOf('\n');
             if (newlineIdx === -1) {
                // No newline. Flush ALL as content
                // Wrap in JSON content event for UI
                onMessage(JSON.stringify({ type: 'content', content: buffer }));
                buffer = '';
             } else {
                // Flush line
                const contentChunk = buffer.substring(0, newlineIdx + 1); // keep newline
                onMessage(JSON.stringify({ type: 'content', content: contentChunk }));
                buffer = buffer.substring(newlineIdx + 1);
             }
          }
        }
        return false;
      };

      xhr.onreadystatechange = () => {
        // Invoke onHeaders when headers are received (readyState >= 2)
        if (xhr.readyState >= 2 && !headersEmitted && options?.onHeaders) {
          headersEmitted = true;
          const headersObj = new Headers();
          const headerStr = xhr.getAllResponseHeaders();
          headerStr.split('\r\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length === 2) {
              headersObj.append(parts[0], parts[1]);
            }
          });
          options.onHeaders(headersObj);
        }

        if (xhr.readyState === 3 || xhr.readyState === 4) {
          console.log(`[ApiClient] XHR readyState: ${xhr.readyState} (${requestId})`);
          const newData = xhr.responseText.substring(seenBytes);
          if (newData.length === 0) return;
          
          seenBytes = xhr.responseText.length;
          
          console.log(`[ApiClient] XHR Chunk (${requestId}):`, newData.substring(0, 50));
          
          buffer += newData;
          
          const done = processBuffer();
          if (done) return;
        }
        
        if (xhr.readyState === 4) {
           console.log(`[ApiClient] XHR Done (${requestId}) status: ${xhr.status}`);
           // Flush remaining buffer as content if any
           if (buffer.length > 0) {
              onMessage(JSON.stringify({ type: 'content', content: buffer }));
           }
           
           if (xhr.status >= 200 && xhr.status < 300) {
             resolve();
           } else {
             reject(new Error(`Stream failed with status ${xhr.status}`));
           }
        }
      };
      
      xhr.onerror = () => {
         console.error(`[ApiClient] XHR Error (${requestId})`);
         reject(new Error('Network request failed'));
      };
      
      xhr.send(JSON.stringify(data));
    });
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
