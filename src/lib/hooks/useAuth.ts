/**
 * Authentication hook for rynk Mobile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Session, User } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<Session | null> => {
      try {
        return await api.get<Session>('/auth/session');
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
      await api.clearAuthToken();
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      queryClient.clear();
    },
  });

  return {
    session: sessionQuery.data,
    user: sessionQuery.data?.user ?? null,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!sessionQuery.data?.user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    refetch: sessionQuery.refetch,
  };
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}
