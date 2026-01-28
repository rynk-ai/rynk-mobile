import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, LogIn, Sparkles, Check, Zap } from 'lucide-react-native';
import { theme } from '../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuestMessage {
  role: string;
  content: string;
}

interface SignInModalProps {
  visible: boolean;
  onClose?: () => void;
  isBlocking?: boolean; // If true, cannot dismiss (credits exhausted)
  creditsRemaining?: number | null;
  pendingPrompt?: string;
  guestConversationData?: {
    messages: GuestMessage[];
    messageCount: number;
  };
}

export function SignInModal({
  visible,
  onClose,
  isBlocking = false,
  creditsRemaining,
  pendingPrompt,
  guestConversationData,
}: SignInModalProps) {
  const router = useRouter();

  const handleSignIn = () => {
    if (onClose) onClose();
    
    // Pass pending prompt to login screen
    const params: any = { redirect: '/chat' };
    if (pendingPrompt) {
      params.prompt = pendingPrompt;
    }
    
    router.replace({
      pathname: '/login',
      params
    });
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
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Close button (only if not blocking) */}
          {!isBlocking && onClose && (
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Sparkles size={24} color={theme.colors.accent.primary} />
              </View>
              <Text style={styles.title}>
                {isBlocking ? 'Guest credits exhausted' : 'Sign in to rynk'}
              </Text>
              <Text style={styles.description}>
                {isBlocking 
                  ? "You've used all 5 free messages in guest mode. Sign up now to:" 
                  : "Sign in to unlock the full potential of rynk:"}
              </Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Check size={20} color={theme.colors.accent.success} style={{ marginTop: 2 }} />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Continue this conversation</Text>
                  <Text style={styles.benefitDescription}>Keep your chat history and never lose context</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Check size={20} color={theme.colors.accent.success} style={{ marginTop: 2 }} />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>15 more free messages</Text>
                  <Text style={styles.benefitDescription}>Start with 20 total free credits</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Check size={20} color={theme.colors.accent.success} style={{ marginTop: 2 }} />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Unlimited features</Text>
                  <Text style={styles.benefitDescription}>File uploads, context picker, sub-chats, and more</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Zap size={20} color={theme.colors.accent.primary} style={{ marginTop: 2 }} />
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Fast AI responses</Text>
                  <Text style={styles.benefitDescription}>Powered by Groq's lightning-fast inference</Text>
                </View>
              </View>
            </View>

            {/* Conversation Preview */}
            {guestConversationData && guestConversationData.messageCount > 0 && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Your guest conversation:</Text>
                <View style={styles.previewContent}>
                  {guestConversationData.messages.slice(0, 3).map((msg, idx) => (
                    <View key={idx} style={styles.previewMessage}>
                      <Text style={styles.previewRole}>
                        {msg.role === "assistant" ? "AI" : "You"}:
                      </Text>
                      <Text style={styles.previewText} numberOfLines={2}>
                        {msg.content}
                      </Text>
                    </View>
                  ))}
                  {guestConversationData.messageCount > 3 && (
                    <Text style={styles.previewMore}>
                      ...and {guestConversationData.messageCount - 3} more messages
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <LogIn size={18} color={theme.colors.text.inverse} />
              <Text style={styles.primaryButtonText}>Sign up to continue chatting</Text>
            </TouchableOpacity>

            {!isBlocking && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Maybe later</Text>
              </TouchableOpacity>
            )}
          </View>
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
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Extra padding for fixed/absolute buttons if needed, actually standard padding is enough as actions are in separate footer view
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
  },
  // Header
  header: {
    alignItems: 'center', // Centered header looks better
    marginBottom: 24,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(77, 125, 255, 0.1)',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Benefits
  benefitsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
  },
  // Preview
  previewContainer: {
    marginTop: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewMessage: {
    flexDirection: 'row',
    gap: 4,
  },
  previewRole: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    width: 30, // Fixed width for alignment
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  previewMore: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Footer
  footer: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
});

export default SignInModal;
