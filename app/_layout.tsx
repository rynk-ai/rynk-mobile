import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/lib/auth';
import { theme } from '../src/lib/theme';
import { ChatBackgroundProvider } from '../src/lib/contexts/ChatBackgroundContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Text, TextInput, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Configure global font family for Text and TextInput
// This is a common React Native hack to apply global fonts without custom components
interface TextWithDefaultProps extends React.FC {
  defaultProps?: { style?: any };
}
if ((Text as unknown as TextWithDefaultProps).defaultProps == null) {
  (Text as unknown as TextWithDefaultProps).defaultProps = {};
  (Text as unknown as TextWithDefaultProps).defaultProps!.style = {};
}
const defaultTextProps = (Text as unknown as TextWithDefaultProps).defaultProps;
if (Array.isArray(defaultTextProps!.style)) {
  defaultTextProps!.style.push({ fontFamily: 'Manrope_400Regular' });
} else {
  defaultTextProps!.style = [defaultTextProps!.style, { fontFamily: 'Manrope_400Regular' }];
}

interface TextInputWithDefaultProps extends React.FC {
  defaultProps?: { style?: any };
}
if ((TextInput as unknown as TextInputWithDefaultProps).defaultProps == null) {
  (TextInput as unknown as TextInputWithDefaultProps).defaultProps = {};
  (TextInput as unknown as TextInputWithDefaultProps).defaultProps!.style = {};
}
const defaultTextInputProps = (TextInput as unknown as TextInputWithDefaultProps).defaultProps;
if (Array.isArray(defaultTextInputProps!.style)) {
  defaultTextInputProps!.style.push({ fontFamily: 'Manrope_400Regular' });
} else {
  defaultTextInputProps!.style = [defaultTextInputProps!.style, { fontFamily: 'Manrope_400Regular' }];
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

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
                  <Stack.Screen name="share/[id]" />
                </Stack>
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </ChatBackgroundProvider>
        </AuthProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}

