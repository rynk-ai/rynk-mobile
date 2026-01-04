import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../src/lib/auth';
import { theme } from '../src/lib/theme';

/**
 * Index route - redirects based on authentication state
 * - Authenticated users → /chat
 * - Guest users → /guest-chat
 */
export default function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href={{ pathname: '/chat' } as any} />;
  }

  return <Redirect href={{ pathname: '/guest-chat' } as any} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});
