import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../src/lib/theme';

/**
 * Index route - redirects to chat (guest mode default)
 * This is the entry point of the app
 */
export default function IndexRedirect() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Redirect to chat immediately
    router.replace('/chat');
  }, []);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});
