import * as SecureStore from 'expo-secure-store';
import type { Session } from '../types/auth';

const SESSION_KEY = 'rynk_session';

/**
 * Save session to secure storage
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
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
      return null;
    }
    
    const session = JSON.parse(sessionStr) as Session;
    
    // Check if session is expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('[Auth Storage] Session expired');
      await clearSession();
      return null;
    }
    
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
