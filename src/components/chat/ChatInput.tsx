/**
 * ChatInput - Enhanced message input component
 * Features:
 * - Auto-sizing textarea
 * - Loading animation
 * - Quote reply support
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Send, Loader2, X, Quote, Plus } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ContextItem } from './ContextPickerSheet';

export interface QuotedMessage {
  messageId: string;
  quotedText: string;
  authorRole: 'user' | 'assistant';
}

interface ChatInputProps {
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
}

const MIN_INPUT_HEIGHT = 36;
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
}: ChatInputProps) {
  const [input, setInput] = useState(initialValue);
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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading || disabled) return;
    
    onSend(text);
    setInput('');
    onClearQuote?.();
  }, [input, isLoading, disabled, onSend, onClearQuote]);

  const handleChangeText = useCallback((text: string) => {
    setInput(text);
    onValueChange?.(text);
  }, [onValueChange]);

  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  return (
    <View style={styles.container}>
      {/* Quote Preview */}
      {quotedMessage && (
        <View style={styles.quoteContainer}>
          <View style={styles.quoteContent}>
            <Quote size={14} color={theme.colors.accent.primary} />
            <View style={styles.quoteTextWrapper}>
              <Text style={styles.quoteLabel}>
                Replying to {quotedMessage.authorRole === 'assistant' ? 'AI' : 'you'}
              </Text>
              <Text style={styles.quoteText} numberOfLines={2}>
                {quotedMessage.quotedText}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.quoteClearButton}
            onPress={onClearQuote}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Context Pills */}
      {contextItems.length > 0 && (
        <View style={styles.contextPillsContainer}>
          {contextItems.map(item => (
            <View key={item.id} style={styles.contextPill}>
              <Text style={styles.contextPillText} numberOfLines={1}>
                {item.title}
              </Text>
              {onRemoveContext && (
                <TouchableOpacity
                  onPress={() => onRemoveContext(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
      {/* Input Area */}
      <View style={styles.inputWrapper}>
        {/* + Button */}
        {showContextPicker && onAddContext && (
          <TouchableOpacity
            style={styles.addContextButton}
            onPress={onAddContext}
            activeOpacity={0.7}
          >
            <Plus size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={quotedMessage ? 'Add your reply...' : placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          value={input}
          onChangeText={handleChangeText}
          multiline
          maxLength={4000}
          editable={!disabled}
          autoFocus={autoFocus}
          blurOnSubmit={false}
          textAlignVertical="center"
        />
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
              <Loader2 size={18} color={theme.colors.text.inverse} />
            </Animated.View>
          ) : (
            <Send
              size={18}
              color={canSend ? theme.colors.text.inverse : theme.colors.text.tertiary}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.primary,
  },
  // Quote styles
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
    padding: 10,
    marginBottom: 10,
  },
  quoteContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  quoteTextWrapper: {
    flex: 1,
  },
  quoteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  quoteText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  quoteClearButton: {
    padding: 4,
  },
  // Input styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8, // Tighter gap
    backgroundColor: theme.colors.background.card,
    borderRadius: 24, // Matches 48px height fully rounded
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingLeft: 16,
    paddingRight: 6, // Reduced right padding
    paddingVertical: 6, // Reduced vertical padding
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, // Softer shadow
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    minHeight: 36, // Smaller min height
    maxHeight: 120, // Smaller max height
    fontSize: 15, // Smaller font
    lineHeight: 20,
    color: theme.colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 32, // Smaller button
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
    marginBottom: Platform.OS === 'ios' ? 2 : 2, // Align with input
  },
  sendButtonActive: {
    backgroundColor: theme.colors.text.primary,
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.accent.primary || theme.colors.text.primary,
  },
  // Context picker styles
  contextPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary + '15',
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 6,
    maxWidth: 150,
  },
  contextPillText: {
    fontSize: 12,
    color: theme.colors.accent.primary,
    fontWeight: '500',
    flexShrink: 1,
  },
  addContextButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputWithContext: {
    // No additional styles needed, just for differentiation
  },
});

