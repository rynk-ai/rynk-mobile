/**
 * ChatInput - Enhanced message input component
 * Features:
 * - Auto-sizing textarea
 * - Loading animation
 * - Quote reply support
 * - Swiss Modern Design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Send, Loader2, X, Plus, Paperclip } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ContextItem } from './ContextPickerSheet';

export interface QuotedMessage {
  messageId: string;
  quotedText: string;
  authorRole: 'user' | 'assistant';
}

export interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  onValueChange?: (value: string) => void;
  autoFocus?: boolean;
  /** Quoted message to display above input */
  quotedMessage?: QuotedMessage | null;
  /** Callback to clear quote */
  onClearQuote?: () => void;
  /** Selected context items */
  contextItems?: ContextItem[];
  /** Callback when + button is pressed */
  onAddContext?: () => void;
  /** Callback to remove a context item */
  onRemoveContext?: (id: string) => void;
  /** Show the + button */
  showContextPicker?: boolean;
  /** Whether the user is a guest */
  isGuest?: boolean;
  /** Callback to show sign in modal */
  onShowSignIn?: () => void;
  /** Edit mode - when true, input is for editing a message */
  editMode?: boolean;
  /** Callback to cancel edit */
  onCancelEdit?: () => void;
}

const MIN_INPUT_HEIGHT = 44; // Slightly taller for better touch target
const MAX_INPUT_HEIGHT = 160;

export function ChatInput({
  onSend,
  isLoading,
  disabled = false,
  placeholder = 'Ask anything...',
  initialValue = '',
  onValueChange,
  autoFocus = false,
  quotedMessage,
  onClearQuote,
  contextItems = [],
  onAddContext,
  onRemoveContext,
  showContextPicker = false,
  isGuest = false,
  onShowSignIn,
  onAttach,
  editMode = false,
  onCancelEdit,
}: ChatInputProps & { onAttach?: () => void }) {
  const [text, setText] = useState(initialValue);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const inputRef = useRef<TextInput>(null);
  
  // Loading animation
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  
  // Handle loading animation
  useEffect(() => {
    if (isLoading) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      
      spin.start();
      pulse.start();
      
      return () => {
        spin.stop();
        pulse.stop();
        spinValue.setValue(0);
        pulseValue.setValue(1);
      };
    }
  }, [isLoading, spinValue, pulseValue]);
  
  const spinRotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Update internal state when initialValue changes
  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  // Handle text change
  const handleChangeText = (value: string) => {
    setText(value);
    onValueChange?.(value);
  };

  // Handle send
  const handleSend = () => {
    if (!text.trim() || isLoading || disabled) return;
    onSend(text.trim());
    setText('');
    setInputHeight(MIN_INPUT_HEIGHT);
    onClearQuote?.();
  };

  const canSend = text.trim().length > 0 && !isLoading && !disabled;

  return (
    <View style={styles.container}>
      {/* Quoted Message */}
      {quotedMessage && (
        <View style={styles.quoteContainer}>
          <View style={styles.quoteBar} />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteAuthor}>
              Replying to {quotedMessage.authorRole === 'assistant' ? 'Assistant' : 'You'}
            </Text>
            <Text style={styles.quoteText} numberOfLines={2}>
              {quotedMessage.quotedText}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeQuoteButton}
            onPress={onClearQuote}
          >
            <X size={14} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Context Pills */}
      {contextItems && contextItems.length > 0 && (
        <View style={styles.contextPillsContainer}>
          {contextItems.map((item) => (
            <View key={item.id} style={styles.contextPill}>
              <Text style={styles.contextPillText} numberOfLines={1}>
                {item.title}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveContext?.(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={12} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input Card Container */}
      <View style={styles.inputCard}>
        {/* Input Field (Top) */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, inputHeight)) }
          ]}
          value={text}
          onChangeText={handleChangeText}
          placeholder={quotedMessage ? 'Add your reply...' : placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          textAlignVertical="top"
          autoFocus={autoFocus}
          onContentSizeChange={(e) => {
            setInputHeight(e.nativeEvent.contentSize.height);
          }}
          editable={!disabled && !isLoading}
        />

        {/* Guest Sign In Overlay */}
        {disabled && isGuest && onShowSignIn && (
          <View style={[StyleSheet.absoluteFill, styles.signInOverlay]}>
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={onShowSignIn}
              activeOpacity={0.9}
            >
              <Text style={styles.signInButtonText}>Sign in to continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Bar (Bottom) */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            {/* Context Button */}
            {showContextPicker && onAddContext && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAddContext}
                disabled={disabled || isLoading}
              >
                <Plus size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}

            {/* Attach Button */}
            {onAttach && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onAttach}
                disabled={disabled || isLoading}
              >
                <Paperclip size={18} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend && styles.sendButtonActive,
              isLoading && styles.sendButtonLoading,
            ]}
            onPress={handleSend}
            disabled={!canSend || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <Animated.View style={{ transform: [{ rotate: spinRotation }, { scale: pulseValue }] }}>
                <Loader2 size={16} color={theme.colors.text.inverse} />
              </Animated.View>
            ) : (
              <Send 
                size={16} 
                color={canSend ? theme.colors.text.inverse : theme.colors.text.tertiary} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
    backgroundColor: theme.colors.background.primary,
  },
  // Input Card Styles - Flat Swiss
  inputCard: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.sm, // Sharp
    overflow: 'hidden',
    // No shadows
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    lineHeight: 22,
    backgroundColor: 'transparent',
  },
  // Action Bar Styles
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm, // Sharp
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm, // Sharp
    backgroundColor: theme.colors.background.tertiary, // Disabled state
  },
  sendButtonActive: {
    backgroundColor: theme.colors.text.primary, // Active state (White)
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.accent.primary,
  },
  
  // Quote styles
  quoteContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.sm, // Sharp
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accent.primary,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  quoteBar: {
    display: 'none', 
  },
  quoteContent: {
    flex: 1,
    flexDirection: 'column', 
    gap: 4,
  },
  quoteAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  quoteText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  closeQuoteButton: {
    padding: 4,
  },

  // Context pills styles
  contextPillsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    marginTop: 10,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.sm, // Sharp
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 6,
    maxWidth: 150,
  },
  contextPillText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  
  // Sign In Overlay
  signInOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)', // Dark overlay
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: theme.borderRadius.sm,
  },
  signInButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
  },
  signInButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
});
