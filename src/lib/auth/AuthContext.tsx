import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { saveSession, loadSession, clearSession } from './storage';
import type { AuthContextType, AuthState, Session, LoginResult, User } from '../types/auth';

// Warm up browser for Android
WebBrowser.maybeCompleteAuthSession();

const BASE_URL = 'https://rynk.io';

// Initial auth state
const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  session: null,
  user: null,
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component - wrap your app with this
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Load session on mount
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const session = await loadSession();
      if (session) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          session,
          user: session.user,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          session: null,
          user: null,
        });
      }
    } catch (error) {
      console.error('[Auth] Failed to load session:', error);
      setState({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        user: null,
      });
    }
  };

  /**
   * Sign in with Google or Email
   */
  const signIn = useCallback(async (method: 'google' | 'email', email?: string): Promise<LoginResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Get the redirect URI for the OAuth flow
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'rynk',
        path: 'auth/callback',
      });

      console.log('[Auth] Redirect URI:', redirectUri);

      if (method === 'google') {
        // Open web browser for Google OAuth
        // Use mobile-callback page that will create mobile session and redirect back
        const mobileCallbackUrl = `${BASE_URL}/auth/mobile-callback?redirect_uri=${encodeURIComponent(redirectUri)}`;
        const authUrl = `${BASE_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(mobileCallbackUrl)}`;
        
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        
        if (result.type === 'success' && result.url) {
          // Parse the callback URL for session token
          const url = new URL(result.url);
          const token = url.searchParams.get('token');
          
          if (token) {
            // Fetch user session from API
            const session = await fetchSession(token);
            if (session) {
              await saveSession(session);
              setState({
                isLoading: false,
                isAuthenticated: true,
                session,
                user: session.user,
              });
              return { success: true, session };
            }
          }
        }
        
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Authentication cancelled or failed' };
        
      } else if (method === 'email' && email) {
        // Request magic link
        const response = await fetch(`${BASE_URL}/api/auth/signin/resend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, callbackUrl: redirectUri }),
        });

        if (response.ok) {
          setState(prev => ({ ...prev, isLoading: false }));
          return { success: true }; // Magic link sent
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          return { success: false, error: 'Failed to send magic link' };
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Invalid auth method' };
      
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await clearSession();
      setState({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        user: null,
      });
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  }, []);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await loadSession();
      if (!currentSession) return;

      // Use mobile auth endpoint for session refresh
      const response = await fetch(`${BASE_URL}/api/auth/mobile`, {
        headers: {
          'Authorization': `Bearer ${currentSession.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const newSession: Session = {
            ...currentSession,
            user: data.user,
          };
          await saveSession(newSession);
          setState({
            isLoading: false,
            isAuthenticated: true,
            session: newSession,
            user: newSession.user,
          });
        }
      } else if (response.status === 401) {
        // Session expired
        await signOut();
      }
    } catch (error) {
      console.error('[Auth] Refresh session error:', error);
    }
  }, [signOut]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Fetch user session from API using token
 */
async function fetchSession(token: string): Promise<Session | null> {
  try {
    // Use mobile auth endpoint for session validation
    const response = await fetch(`${BASE_URL}/api/auth/mobile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.user) {
      return null;
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
        credits: data.user.credits || 100,
        subscriptionTier: data.user.subscriptionTier || 'free',
        subscriptionStatus: data.user.subscriptionStatus || 'none',
      },
      accessToken: token,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };
  } catch (error) {
    console.error('[Auth] Fetch session error:', error);
    return null;
  }
}
