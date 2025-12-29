/**
 * SubChatSheet - Bottom sheet for sub-chat conversations
 * Shows quoted context and allows follow-up questions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { X, Send, Quote, MessageSquare } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { theme } from '../../lib/theme';
import type { SubChat, SubChatMessage } from '../../lib/hooks/useGuestSubChats';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface SubChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subChat: SubChat | null;
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  streamingContent?: string;
}

export function SubChatSheet({
  open,
  onOpenChange,
  subChat,
  onSendMessage,
  isLoading = false,
  streamingContent = '',
}: SubChatSheetProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Animate sheet in/out
  useEffect(() => {
    if (open) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 120,
      }).start();
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [open, slideAnim]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (subChat?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [subChat?.messages.length, streamingContent]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const content = input.trim();
    setInput('');
    await onSendMessage(content);
  }, [input, isLoading, onSendMessage]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const renderMessage = useCallback(
    ({ item }: { item: SubChatMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {isUser ? (
            <Text style={styles.userText}>{item.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{item.content}</Markdown>
          )}
        </View>
      );
    },
    []
  );

  if (!subChat) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MessageSquare size={18} color={theme.colors.text.secondary} />
              <Text style={styles.headerTitle}>Deep Dive</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Quoted Context */}
          <View style={styles.quoteSection}>
            <View style={styles.quoteHeader}>
              <Quote size={14} color={theme.colors.accent.primary} />
              <Text style={styles.quoteLabel}>Context</Text>
            </View>
            <Text style={styles.quoteText} numberOfLines={4}>
              "{subChat.quotedText}"
            </Text>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={subChat.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isLoading && streamingContent ? (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Markdown style={markdownStyles}>{streamingContent}</Markdown>
                </View>
              ) : isLoading ? (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <Text style={styles.loadingDots}>•••</Text>
                </View>
              ) : null
            }
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              maxLength={2000}
              editable={!isLoading}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (input.trim() && !isLoading) && styles.sendButtonActive,
              ]}
              onPress={handleSubmit}
              disabled={!input.trim() || isLoading}
            >
              <Send
                size={18}
                color={
                  input.trim() && !isLoading
                    ? theme.colors.background.primary
                    : theme.colors.text.tertiary
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 16, // Matches sheet radius
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  keyboardView: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  quoteSection: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 10,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageBubble: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  userText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  loadingDots: {
    fontSize: 18,
    color: theme.colors.text.tertiary,
    letterSpacing: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.primary,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  sendButtonActive: {
    backgroundColor: theme.colors.text.primary,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  paragraph: {
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.accent.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
});
