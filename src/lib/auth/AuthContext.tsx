import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { saveSession, loadSession, clearSession, onSessionChange } from './storage';
import type { AuthContextType, AuthState, Session, LoginResult, User } from '../types/auth';

const BASE_URL = 'https://rynk.io';

// Flag to ensure we only configure Google Sign-In once
let isGoogleSignInConfigured = false;

/**
 * Configure Google Sign-In lazily (must be called after React Native is initialized)
 * This avoids crashes when the module is imported before the native bridge is ready
 */
function configureGoogleSignIn() {
  if (isGoogleSignInConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId: '400644197476-1mai5n25a5vln4fvelua41oo1mm8crik.apps.googleusercontent.com',
      offlineAccess: true,
    });
    isGoogleSignInConfigured = true;
    console.log('[Auth] Google Sign-In configured');
  } catch (error) {
    console.error('[Auth] Failed to configure Google Sign-In:', error);
  }
}

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

  // Configure Google Sign-In and load session on mount
  useEffect(() => {
    configureGoogleSignIn();
    loadStoredSession();
    
    // Subscribe to session changes (e.g. token refresh)
    const unsubscribe = onSessionChange((newSession) => {
      console.log('[Auth] Session updated via storage listener');
      if (newSession) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          session: newSession,
          user: newSession.user,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          session: null,
          user: null,
        });
      }
    });
    
    return unsubscribe;
  }, []);

  const loadStoredSession = async () => {
    try {
      const session = await loadSession();
      if (session) {
        console.log('[Auth] Loaded existing session for:', session.user.email);
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
   * Sign in with Google (Native)
   */
  const signInWithGoogle = async (): Promise<LoginResult> => {
    try {
      console.log('[Auth] Starting Google Sign-In...');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in
      const signInResult = await GoogleSignin.signIn();
      console.log('[Auth] Google Sign-In successful');
      
      // Get ID token for backend verification
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      
      if (!idToken) {
        throw new Error('Failed to get ID token from Google');
      }
      
      // Send to backend for verification and session creation
      const session = await verifyAndCreateSession('google', idToken, {
        email: signInResult.data?.user.email,
        name: signInResult.data?.user.name,
        image: signInResult.data?.user.photo,
      });
      
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
      
      return { success: false, error: 'Failed to create session' };
      
    } catch (error: any) {
      console.error('[Auth] Google Sign-In error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign in cancelled' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Google Play Services not available' };
      }
      
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  };

  /**
   * Sign in with Apple (Native - iOS only)
   */
  const signInWithApple = async (): Promise<LoginResult> => {
    try {
      console.log('[Auth] Starting Apple Sign-In...');
      
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'Apple Sign-In is only available on iOS' };
      }
      
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign-In not available on this device' };
      }
      
      // Request credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('[Auth] Apple Sign-In successful');
      
      // The identityToken is used for backend verification
      const identityToken = credential.identityToken;
      
      if (!identityToken) {
        throw new Error('Failed to get identity token from Apple');
      }
      
      // Construct name from Apple's given/family name format
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(' ')
        : undefined;
      
      // Send to backend for verification and session creation
      const session = await verifyAndCreateSession('apple', identityToken, {
        email: credential.email,
        name: fullName,
        appleUserId: credential.user,
      });
      
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
      
      return { success: false, error: 'Failed to create session' };
      
    } catch (error: any) {
      console.error('[Auth] Apple Sign-In error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Sign in cancelled' };
      }
      
      return { success: false, error: error.message || 'Apple sign in failed' };
    }
  };

  /**
   * Sign in dispatcher
   */
  const signIn = useCallback(async (method: 'google' | 'apple' | 'email', email?: string): Promise<LoginResult> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      let result: LoginResult;
      
      switch (method) {
        case 'google':
          result = await signInWithGoogle();
          break;
        case 'apple':
          result = await signInWithApple();
          break;
        case 'email':
          // For email, we still need the web flow for magic links
          result = { success: false, error: 'Email login not yet implemented' };
          break;
        default:
          result = { success: false, error: 'Invalid auth method' };
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
      
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
      // 1. Get current session info before clearing (for backend invalidation)
      const currentSession = await loadSession();
      
      // 2. Clear local storage and state IMMEDIATELY (Optimistic UI)
      await clearSession();
      setState({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        user: null,
      });
      console.log('[Auth] Local session cleared, signed out UI');

      // 3. Perform cleanup in background (non-blocking)
      (async () => {
        try {
          // Sign out from Google if needed
          const hasPreviousGoogleSignIn = await GoogleSignin.hasPreviousSignIn();
          if (hasPreviousGoogleSignIn) {
            await GoogleSignin.signOut();
          }
        } catch (e) {
          console.warn('[Auth] Google sign out error:', e);
        }

        // Invalidate session on backend
        if (currentSession?.accessToken) {
          try {
             // Use short timeout to not hang background tasks indefinitely
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 5000);
             
             await fetch(`${BASE_URL}/api/auth/mobile`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${currentSession.accessToken}`,
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log('[Auth] Server session invalidated');
          } catch (e) {
            console.warn('[Auth] Failed to invalidate server session (background):', e);
          }
        }
      })();
      
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Ensure we are signed out locally even if something failed
      await clearSession();
      setState({
         isLoading: false,
         isAuthenticated: false,
         session: null,
         user: null, 
      });
    }
  }, []);

  /**
   * Refresh session from backend
   */
  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await loadSession();
      if (!currentSession) return;

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
 * Verify token with backend and create session
 */
async function verifyAndCreateSession(
  provider: 'google' | 'apple',
  idToken: string,
  userInfo: { email?: string | null; name?: string | null; image?: string | null; appleUserId?: string }
): Promise<Session | null> {
  try {
    console.log('[Auth] Verifying token with backend...');
    
    const response = await fetch(`${BASE_URL}/api/auth/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        idToken,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.image,
        providerAccountId: userInfo.appleUserId,
      }),
    });

    if (!response.ok) {
      console.error('[Auth] Backend verification failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[Auth] Session created for:', data.user.email);

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
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresAt: new Date(data.accessTokenExpiresAt).getTime(),
      refreshTokenExpiresAt: new Date(data.refreshTokenExpiresAt).getTime(),
    };
  } catch (error) {
    console.error('[Auth] Verify and create session error:', error);
    return null;
  }
}
