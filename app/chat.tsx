import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Menu, AlertCircle, RotateCcw, Sparkles, Search, BookOpen, Check } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useCreateConversation, useSendMessage, useGuestConversations } from '../src/lib/hooks/useChat';
import { useGuestCredits } from '../src/lib/hooks/useGuestCredits';
import { guestApi, GuestApiError } from '../src/lib/api/guest';
import { theme } from '../src/lib/theme';
import { GuestDrawer } from '../src/components/GuestDrawer';
import { SignInModal } from '../src/components/SignInModal';
import type { Message, Conversation } from '../src/lib/types';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string; q?: string }>();
  const [conversationId, setConversationId] = useState<string | null>(params.conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(params.q || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isSendingRef = useRef(false);  // Guard against duplicate sends

  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const { creditsRemaining, isExhausted } = useGuestCredits();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const response = await guestApi.get<{ conversations: Conversation[] }>('/guest/conversations');
      setConversations(response.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Note: Auto-submit removed - was causing duplicate sends
  // If you want auto-submit, handle it once in a controlled way

  // Load existing messages if conversationId is provided (from navigation, not from creating new)
  // Skip if we're in the middle of sending (to preserve optimistic updates)
  useEffect(() => {
    // Only load messages if we're opening an existing conversation, not during send
    if (conversationId && !isLoading && messages.length === 0) {
      loadMessages(conversationId);
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async (convId: string) => {
    try {
      const response = await guestApi.get<{ messages: Message[] }>(`/guest/conversations/${convId}/messages`);
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSelectConversation = (id: string | null) => {
    setConversationId(id);
    setInput('');
    setError(null);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    // Guard against duplicate sends
    if (isSendingRef.current) {
      console.log('[Chat] Ignoring duplicate send');
      return;
    }

    // Check if credits exhausted
    if (isExhausted) {
      setShowSignInModal(true);
      return;
    }

    isSendingRef.current = true;
    const userContent = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // Create conversation if we don't have one
      let currentConvId = conversationId;
      if (!currentConvId) {
        const newConv = await createConversation.mutateAsync();
        currentConvId = newConv.id;
        setConversationId(currentConvId);
      }

      // Add user message immediately (optimistic)
      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        conversationId: currentConvId,
        role: 'user',
        content: userContent,
        attachments: null,
        parentMessageId: null,
        versionOf: null,
        versionNumber: 1,
        branchId: null,
        reasoningContent: null,
        reasoningMetadata: null,
        webAnnotations: null,
        modelUsed: null,
        createdAt: new Date().toISOString(),
      };

      // Add placeholder assistant message for streaming
      const assistantMsgId = `msg_${Date.now()}_assistant`;
      const assistantMessage: Message = {
        id: assistantMsgId,
        conversationId: currentConvId,
        role: 'assistant',
        content: '',
        attachments: null,
        parentMessageId: null,
        versionOf: null,
        versionNumber: 1,
        branchId: null,
        reasoningContent: null,
        reasoningMetadata: null,
        webAnnotations: null,
        modelUsed: null,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);

      // Send message and get response (non-streaming for now)
      setStreamingStatus('Thinking...');
      
      try {
        const responseContent = await guestApi.sendChat(currentConvId, userContent);
        
        console.log('[Chat] Response received, length:', responseContent.length);
        
        // Update assistant message with response
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: responseContent }
            : m
        ));
        
        setStreamingStatus(null);
        loadConversations();
        
      } catch (chatError: any) {
        console.error('Chat error:', chatError);
        if (chatError instanceof GuestApiError && (chatError.status === 402 || chatError.status === 403)) {
          setShowSignInModal(true);
        } else {
          setError(chatError.message || 'Failed to send message');
        }
        // Remove placeholder assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
      }

    } catch (err: any) {
      console.error('Send message error:', err);
      
      // Check for credit exhaustion
      if (err instanceof GuestApiError && (err.status === 402 || err.status === 403)) {
        setShowSignInModal(true);
      } else {
        setError(err.message || 'Failed to send message');
      }
      
      // Remove the optimistic messages on error
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [input, isLoading, conversationId, createConversation, isExhausted]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isStreamingMsg = isLoading && index === messages.length - 1 && !isUser;
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          {/* Status indicator for streaming */}
          {isStreamingMsg && streamingStatus && (
            <View style={styles.statusIndicator}>
              <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              <Text style={styles.statusText}>{streamingStatus}</Text>
            </View>
          )}
          
          {isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {item.content}
            </Text>
          ) : (
            item.content ? (
              <Markdown style={markdownStyles}>
                {item.content}
              </Markdown>
            ) : isStreamingMsg ? (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              </View>
            ) : null
          )}
        </View>
      </View>
    );
  }, [isLoading, messages.length, streamingStatus]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandName}>rynk.</Text>
        <Text style={styles.brandTagline}>What would you like to explore today?</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
          activeOpacity={0.7}
        >
          <Menu size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {conversationId ? 'Chat' : 'rynk.'}
        </Text>
        <View style={styles.headerRight}>
          {creditsRemaining !== null && (
            <Text style={styles.creditsText}>{creditsRemaining} left</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={theme.colors.accent.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <RotateCcw size={14} color={theme.colors.accent.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={4000}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!input.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Send 
                size={18} 
                color={input.trim() && !isLoading ? theme.colors.text.inverse : theme.colors.text.tertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Drawer */}
      <GuestDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        creditsRemaining={creditsRemaining}
        onRefresh={loadConversations}
        isLoading={isLoadingConversations}
      />

      {/* Sign In Modal */}
      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        isBlocking={isExhausted}
        creditsRemaining={creditsRemaining}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  creditsText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  keyboardView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -2,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: width * 0.85,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.text.primary,
  },
  assistantText: {
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.accent.error,
  },
  retryButton: {
    padding: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: theme.colors.background.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    fontSize: 15,
    color: theme.colors.text.primary,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.text.primary,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.background.secondary,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
  },
  statusText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});

// Markdown styles for assistant messages
const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: theme.colors.text.primary,
    fontSize: 19,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  code_block: {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 8,
  },
  fence: {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: theme.colors.background.secondary,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  strong: {
    fontWeight: '600',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: theme.colors.accent.primary,
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: theme.colors.border.subtle,
    height: 1,
    marginVertical: 12,
  },
});
