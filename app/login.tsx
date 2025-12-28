import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react-native';
import { theme } from '../src/lib/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    // TODO: Implement actual login with magic link
    setTimeout(() => {
      setIsLoading(false);
      router.push('/chat');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.logo}>rynk.</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in with your email to continue
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, !email.trim() && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.loginButtonText, !email.trim() && styles.buttonTextDisabled]}>
              {isLoading ? 'Sending link...' : 'Continue with Email'}
            </Text>
            {!isLoading && email.trim() && (
              <ArrowRight size={18} color={theme.colors.text.inverse} />
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Guest Mode */}
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={() => router.push('/chat')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -1.5,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.text.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.background.secondary,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  buttonTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.default,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  guestButton: {
    paddingVertical: 12,
  },
  guestButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
