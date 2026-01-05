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
  /** Edit mode - when true, input is for editing a message */
  editMode?: boolean;
  /** Callback to cancel edit */
  onCancelEdit?: () => void;
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
  editMode = false,
  onCancelEdit,
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

        {/* Action Bar (Bottom) */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            {/* Surface Mode Button */}
            {onSurfaceModeChange && (
              <TouchableOpacity
                style={[styles.actionButton, surfaceMode !== 'chat' && { backgroundColor: surfaceColor + '15' }]}
                onPress={() => setSurfacePickerOpen(true)}
                disabled={disabled || isLoading}
              >
                <SurfaceIcon 
                  size={18} 
                  color={surfaceMode !== 'chat' ? surfaceColor : theme.colors.text.secondary} 
                />
              </TouchableOpacity>
            )}

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
  // Input Card Styles
  inputCard: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    // Swiss Modern Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  input: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    lineHeight: 22,
    backgroundColor: 'transparent', // Transparent to blend with card
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
    width: 32,
    height: 32,
    borderRadius: 6, // Specific small radius for internal buttons or theme.borderRadius.sm
    alignItems: 'center',
    justifyContent: 'center',
    // Ghost style by default (transparent)
  },
  sendButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6, // Matches action buttons
    backgroundColor: theme.colors.background.primary, // Contrast with card (secondary)
  },
  sendButtonActive: {
    backgroundColor: theme.colors.text.primary,
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.accent.primary || theme.colors.text.primary,
  },
  
  // Quote styles (unchanged mostly, but ensured alignment)
  quoteContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
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
    backgroundColor: theme.colors.accent.primary + '15',
    borderRadius: theme.borderRadius.lg,
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
});

