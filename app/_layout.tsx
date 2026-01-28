import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/lib/auth';
import { theme } from '../src/lib/theme';
import { ChatBackgroundProvider } from '../src/lib/contexts/ChatBackgroundContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

import { KeyboardProvider } from 'react-native-keyboard-controller';

// ...

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChatBackgroundProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background.primary },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="guest-chat" />
                  <Stack.Screen name="chat" />
                  <Stack.Screen name="conversations" />
                </Stack>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </ChatBackgroundProvider>
        </AuthProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}

