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
import { Send, Loader2, X, Plus, Paperclip, Globe, Quote, ArrowUp } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ContextItem } from './ContextPickerSheet';
import { ChatInputActionMenu } from './ChatInputActionMenu';

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
  quotedMessage?: QuotedMessage | null;
  onClearQuote?: () => void;
  contextItems?: ContextItem[];
  // Replaced generic onPressPlus with specific actions for the new menu
  onAttachFiles?: () => void;
  onAddContext?: () => void;
  onRemoveContext?: (id: string) => void;
  isGuest?: boolean;
  onShowSignIn?: () => void;
  editMode?: boolean;
  onCancelEdit?: () => void;
  attachments?: { url: string; name: string; type: string }[];
  onRemoveAttachment?: (url: string) => void;
  isDeepResearch?: boolean;
  onDeepResearchChange?: (enabled: boolean) => void;
  // Specific attachment actions
  onTakePhoto?: () => void;
  onPickImage?: () => void;
  onPickDocument?: () => void;
}

const MIN_INPUT_HEIGHT = 44;
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
  onAttachFiles,
  onAddContext,
  onRemoveContext,
  isGuest = false,
  onShowSignIn,
  editMode = false,
  onCancelEdit,
  attachments = [],
  onRemoveAttachment,
  isDeepResearch = false,
  onDeepResearchChange,
  onTakePhoto,
  onPickImage,
  onPickDocument,
}: ChatInputProps) {
  const [text, setText] = useState(initialValue);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      {/* Menu Overlay */}
      {isMenuOpen && (
        <ChatInputActionMenu
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onAttachFiles={onAttachFiles}
          onAddContext={onAddContext}
          onTakePhoto={onTakePhoto}
          onPickImage={onPickImage}
          onPickDocument={onPickDocument}
        />
      )}

      {/* Input Card Container */}
      <View style={styles.inputCard}>

        {/* Edit Mode Banner */}
        {editMode && onCancelEdit && (
          <View style={styles.editModeBanner}>
            <View style={styles.editModeContent}>
              <View style={styles.editModeDot} />
              <Text style={styles.editModeText}>Editing message</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={onCancelEdit}
            >
              <X size={12} color={theme.colors.text.primary} />
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quoted Message */}
        {quotedMessage && (
          <View style={styles.quoteContainer}>
            <View style={styles.quoteBar} />
            <View style={styles.quoteContent}>
              <View style={styles.quoteAuthor}>
                <Quote size={10} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, color: theme.colors.text.secondary, fontWeight: '700' }}>
                  Replying to {quotedMessage.authorRole === 'assistant' ? 'Assistant' : 'You'}
                </Text>
              </View>
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

        {/* Attachment Pills */}
        {attachments && attachments.length > 0 && (
          <View style={styles.attachmentPillsContainer}>
            {attachments.map((file) => (
              <View key={file.url} style={styles.attachmentPill}>
                <Paperclip size={12} color={theme.colors.text.secondary} />
                <Text style={styles.attachmentPillText} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity
                  onPress={() => onRemoveAttachment?.(file.url)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={12} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))}
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

        {/* Input Field (Top) */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { height: Math.max(MIN_INPUT_HEIGHT, Math.min(MAX_INPUT_HEIGHT, inputHeight)) }
          ]}
          value={text}
          onChangeText={handleChangeText}
          placeholder={editMode ? "Edit your message..." : (quotedMessage ? 'Add your reply...' : placeholder)}
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
            {/* Unified Plus Action (Context + Attachments) */}
            {!editMode && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isMenuOpen && { backgroundColor: theme.colors.background.tertiary }
                ]}
                onPress={() => setIsMenuOpen(!isMenuOpen)}
                disabled={disabled || isLoading}
              >
                <Plus size={20} color={isMenuOpen ? theme.colors.text.primary : theme.colors.text.secondary} />
              </TouchableOpacity>
            )}

            {/* Deep Research Toggle (Not for guests) */}
            {!isGuest && !editMode && onDeepResearchChange && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isDeepResearch && { backgroundColor: 'rgba(59, 130, 246, 0.1)' } // Blue tint
                ]}
                onPress={() => onDeepResearchChange(!isDeepResearch)}
                disabled={disabled || isLoading}
              >
                <Globe
                  size={18}
                  color={isDeepResearch ? '#3B82F6' : theme.colors.text.secondary}
                />
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
              <ArrowUp
                size={18}
                color={canSend ? theme.colors.text.inverse : theme.colors.text.tertiary}
                strokeWidth={2.5}
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
    marginHorizontal: 10
  },
  // Input Card Styles - Swiss Modern (Rounded + Glass effect)
  inputCard: {
    backgroundColor: theme.colors.background.secondary, // Fallback for glass
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', // Subtle glass border
    borderRadius: theme.borderRadius.lg, // Rounded (16)
    overflow: 'hidden',
    // Internal shadow simulation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 16, // Slightly larger for better readability
    color: theme.colors.text.primary,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    lineHeight: 24,
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
    borderRadius: theme.borderRadius.md, // Rounded (8)
    alignItems: 'center',
    justifyContent: 'center',
    // Hover effect simulation
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  deepResearchButton: {
    // Specific styles for active state if needed
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md, // Rounded (8)
    backgroundColor: theme.colors.background.tertiary, // Disabled state
  },
  sendButtonActive: {
    backgroundColor: theme.colors.text.primary, // Active state (White)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.accent.primary,
  },

  // Edit Mode Banner
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 242, 242, 0.05)', // Primary/5
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 242, 242, 0.1)',
  },
  editModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editModeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.primary,
  },
  editModeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.accent.primary,
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(242, 242, 242, 0.05)',
  },
  cancelEditText: {
    fontSize: 11,
    color: theme.colors.text.primary,
  },

  // Quote styles
  quoteContainer: {
    marginHorizontal: 4, // Inside input card feel or close to it
    marginTop: 0,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.borderRadius.sm, // Sharp
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accent.primary,
    padding: 10,
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
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  closeQuoteButton: {
    padding: 4,
    marginLeft: 4,
  },

  // Context pills styles
  contextPillsContainer: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 6,
    gap: 4,
    maxWidth: 150,
  },
  contextPillText: {
    fontSize: 11,
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
    borderRadius: theme.borderRadius.lg,
  },
  signInButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
  },
  signInButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },

  // Attachment Pills
  attachmentPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 6,
    gap: 4,
    maxWidth: 180,
  },
  attachmentPillText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flexShrink: 1,
  },
});
