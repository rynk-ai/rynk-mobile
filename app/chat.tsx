import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Send, Plus, Sparkles, AlertCircle } from 'lucide-react-native';
import { useCreateConversation, useSendMessage } from '../src/lib/hooks/useChat';
import { guestApi } from '../src/lib/api/guest';
import type { Message } from '../src/lib/types';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const [conversationId, setConversationId] = useState<string | null>(params.conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  // Load existing messages if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
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

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

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
      setMessages(prev => [...prev, userMessage]);

      // Send message and get response
      const { assistantMessage } = await sendMessage.mutateAsync({
        conversationId: currentConvId,
        message: userContent,
      });

      // Add the assistant message
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to send message');
      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversationId, createConversation, sendMessage]);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      {item.role === 'assistant' && (
        <View style={styles.assistantIcon}>
          <Sparkles size={16} color="#a855f7" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.content}
        </Text>
      </View>
    </View>
  ), []);

  // Combine messages with streaming content for display
  const displayMessages = [...messages];
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        {displayMessages.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles size={48} color="#a855f7" />
            </View>
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyDescription}>
              Ask anything. Get intelligent, context-aware responses powered by AI.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
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
            <ActivityIndicator size="small" color="#a855f7" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Plus size={20} color="#71717a" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Message Rynk..."
            placeholderTextColor="#52525b"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
            onSubmitEditing={handleSend}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.7}
          >
            <Send size={20} color={input.trim() && !isLoading ? '#fff' : '#52525b'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
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
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesList: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  assistantIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#a855f7',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#e4e4e7',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#71717a',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  attachButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#a855f7',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
