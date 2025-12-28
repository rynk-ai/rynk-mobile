import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, LogIn, Mail, Sparkles } from 'lucide-react-native';
import { theme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SignInModalProps {
  visible: boolean;
  onClose?: () => void;
  isBlocking?: boolean; // If true, cannot dismiss (credits exhausted)
  creditsRemaining?: number | null;
}

export function SignInModal({
  visible,
  onClose,
  isBlocking = false,
  creditsRemaining,
}: SignInModalProps) {
  const router = useRouter();

  const handleSignIn = () => {
    onClose?.();
    router.push('/login');
  };

  const handleClose = () => {
    if (!isBlocking && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Close button (only if not blocking) */}
          {!isBlocking && onClose && (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Sparkles size={32} color={theme.colors.accent.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isBlocking ? 'Credits Exhausted' : 'Sign in to Rynk'}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {isBlocking ? (
              `You've used all your free messages. Sign in to continue chatting with unlimited access.`
            ) : creditsRemaining !== null ? (
              `You have ${creditsRemaining} free messages remaining. Sign in to unlock unlimited chats and save your conversations.`
            ) : (
              'Sign in to save your conversations and access them from any device.'
            )}
          </Text>

          {/* Sign in options */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <LogIn size={18} color={theme.colors.text.inverse} />
              <Text style={styles.primaryButtonText}>Sign in with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By signing in, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(77, 125, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  terms: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SignInModal;
