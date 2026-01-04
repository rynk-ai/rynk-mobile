import * as SecureStore from 'expo-secure-store';
import type { Session } from '../types/auth';

const SESSION_KEY = 'rynk_session';

// Session change listeners
type SessionChangeCallback = (session: Session | null) => void;
const listeners: SessionChangeCallback[] = [];

export function onSessionChange(callback: SessionChangeCallback): () => void {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function notifyListeners(session: Session | null) {
  listeners.forEach(listener => listener(session));
}

/**
 * Save session to secure storage
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    notifyListeners(session);
    console.log('[Auth Storage] Session saved');
  } catch (error) {
    console.error('[Auth Storage] Failed to save session:', error);
    throw error;
  }
}

/**
 * Load session from secure storage
 */
export async function loadSession(): Promise<Session | null> {
  try {
    const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sessionStr) {
      console.log('[Auth Storage] No stored session found');
      return null;
    }
    
    const session = JSON.parse(sessionStr) as Session;
    
    // Debug logging to trace expiry issues
    const now = Date.now();
    const accessExpiresAt = session.accessTokenExpiresAt;
    const refreshExpiresAt = session.refreshTokenExpiresAt;
    
    console.log('[Auth Storage] Session loaded:', {
      userId: session.user?.id?.substring(0, 8) + '...',
      email: session.user?.email,
      now: new Date(now).toISOString(),
      accessToken: {
        expiresAt: accessExpiresAt ? new Date(accessExpiresAt).toISOString() : 'none',
        expiresInMins: accessExpiresAt ? ((accessExpiresAt - now) / (60 * 1000)).toFixed(1) : 'N/A',
        isExpired: accessExpiresAt ? now > accessExpiresAt : false,
      },
      refreshToken: {
        expiresAt: refreshExpiresAt ? new Date(refreshExpiresAt).toISOString() : 'none',
        expiresInDays: refreshExpiresAt ? ((refreshExpiresAt - now) / (24 * 60 * 60 * 1000)).toFixed(1) : 'N/A',
        isExpired: refreshExpiresAt ? now > refreshExpiresAt : false,
      },
    });
    
    // Check if refresh token is expired (session is dead)
    if (session.refreshTokenExpiresAt && Date.now() > session.refreshTokenExpiresAt) {
      console.log('[Auth Storage] Refresh token expired, clearing session...');
      await clearSession();
      return null;
    }
    
    console.log('[Auth Storage] Session valid, returning');
    return session;
  } catch (error) {
    console.error('[Auth Storage] Failed to load session:', error);
    return null;
  }
}

/**
 * Clear session from secure storage
 */
export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    notifyListeners(null);
    console.log('[Auth Storage] Session cleared');
  } catch (error) {
    console.error('[Auth Storage] Failed to clear session:', error);
  }
}

/**
 * Check if user has a valid session
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await loadSession();
  return session !== null;
}
