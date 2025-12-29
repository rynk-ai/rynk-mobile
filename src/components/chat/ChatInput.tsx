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
import { SurfacePickerSheet } from './SurfacePickerSheet';
import { MessageCircle, BookOpen, CheckSquare, Layers, FileText, TrendingUp, Search } from 'lucide-react-native';
import { Send, Loader2, X, Quote, Plus, Paperclip } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ContextItem } from './ContextPickerSheet';
import { SurfaceModeSelector } from './SurfaceModeSelector'; 
import type { SurfaceMode } from '../../lib/types';

const SURFACE_ICONS: Record<string, any> = {
  chat: MessageCircle,
  learning: BookOpen,
  guide: Layers,
  quiz: CheckSquare,
  comparison: Layers,
  flashcard: Layers,
  timeline: Layers,
  wiki: FileText,
  finance: TrendingUp,
  research: Search,
};

const SURFACE_COLORS: Record<string, string> = {
  chat: theme.colors.text.primary,
  learning: '#3b82f6',
  guide: '#22c55e',
  quiz: '#ec4899',
  comparison: '#6366f1',
  flashcard: '#14b8a6',
  timeline: '#f59e0b',
  wiki: '#f97316',
  finance: '#10b981',
  research: '#a855f7',
};

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
  /** Current Surface Mode */
  surfaceMode?: SurfaceMode;
  /** Callback to change surface mode */
  onSurfaceModeChange?: (mode: SurfaceMode) => void;
  /** Whether the user is a guest */
  isGuest?: boolean;
  /** Callback to show sign in modal */
  onShowSignIn?: () => void;
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
  surfaceMode = 'chat',
  onSurfaceModeChange,
  isGuest = false,
  onShowSignIn,
  onAttach,
}: ChatInputProps & { onAttach?: () => void }) {
  const [text, setText] = useState(initialValue);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [surfacePickerOpen, setSurfacePickerOpen] = useState(false);
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

  const SurfaceIcon = SURFACE_ICONS[surfaceMode] || MessageCircle;
  const surfaceColor = SURFACE_COLORS[surfaceMode] || theme.colors.text.primary;

  const canSend = text.trim().length > 0 && !isLoading && !disabled;

  return (
    <View style={styles.container}>
      {/* Surface Picker Sheet */}
      {onSurfaceModeChange && (
        <SurfacePickerSheet
          open={surfacePickerOpen}
          onOpenChange={setSurfacePickerOpen}
          selectedMode={surfaceMode}
          onSelectMode={onSurfaceModeChange}
          isGuest={isGuest}
          onShowSignIn={onShowSignIn}
        />
      )}

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

      <View style={styles.inputRow}>
        {/* Surface Mode Button */}
        {onSurfaceModeChange && (
          <TouchableOpacity
            style={[styles.surfaceButton, surfaceMode !== 'chat' && { backgroundColor: surfaceColor + '15' }]}
            onPress={() => setSurfacePickerOpen(true)}
            disabled={disabled || isLoading}
          >
            <SurfaceIcon 
              size={20} 
              color={surfaceMode !== 'chat' ? surfaceColor : theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        )}

        {/* Context Button */}
        {showContextPicker && onAddContext && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onAddContext}
            disabled={disabled || isLoading}
          >
            <Plus size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Attach Button */}
        {onAttach && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onAttach}
            disabled={disabled || isLoading}
          >
            <Paperclip size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Input Field */}
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
          textAlignVertical="center"
          autoFocus={autoFocus}
          onContentSizeChange={(e) => {
            setInputHeight(e.nativeEvent.contentSize.height);
          }}
          editable={!disabled && !isLoading}
        />

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
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    paddingTop: 8,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  surfaceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    backgroundColor: theme.colors.background.secondary,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0, 
    backgroundColor: theme.colors.background.secondary,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: 36,
    maxHeight: MAX_INPUT_HEIGHT,
    lineHeight: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    color: theme.colors.accent.primary,
    textTransform: 'uppercase', 
    marginBottom: 0,
  },
  quoteText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  closeQuoteButton: {
    padding: 4,
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
  surfaceSelectorContainer: {
    marginBottom: 8,
  },
});

