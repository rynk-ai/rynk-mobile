// Auth types for the mobile app

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  credits: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'past_due';
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: number;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  user: User | null;
}

export interface LoginResult {
  success: boolean;
  session?: Session;
  error?: string;
}

export interface AuthContextType extends AuthState {
  signIn: (method: 'google' | 'apple' | 'email', email?: string) => Promise<LoginResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
