/**
 * MessageItem - Enhanced message component
 * Features:
 * - Markdown rendering for assistant messages
 * - Native text selection with Quote and Deep Dive actions
 * - Sub-chat text highlighting
 * - Action buttons at bottom (Copy)
 * - Status pills for AI processing
 */

import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { Copy, Check, MessageSquare } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { Message } from '../../lib/types';
import type { StatusPill, SearchResult } from '../../lib/hooks/useStreaming';
import type { SubChat } from '../../lib/hooks/useGuestSubChats';
import { StatusPills } from './StatusPills';
import { SearchResultsCard } from './SearchResultsCard';
import { SelectableMessage } from './SelectableMessage';
import { MermaidDiagram } from './MermaidDiagram';

interface MessageItemProps {
  message: Message;
  isStreaming: boolean;
  streamingContent: string;
  statusPills: StatusPill[];
  searchResults?: SearchResult | null;
  isLastMessage: boolean;
  /** Callback when user selects "Quote" from context menu */
  onQuote?: (messageId: string, text: string, role: 'user' | 'assistant') => void;
  /** Callback when user selects "Deep Dive" from context menu */
  onDeepDive?: (
    text: string,
    messageId: string,
    role: 'user' | 'assistant',
    fullContent: string
  ) => void;
  /** Sub-chats for this message (for highlighting) */
  messageSubChats?: SubChat[];
  /** Callback when user taps a highlighted sub-chat */
  onOpenExistingSubChat?: (subChat: SubChat) => void;
}

function MessageItemBase({
  message,
  isStreaming,
  streamingContent,
  statusPills,
  searchResults,
  isLastMessage,
  onQuote,
  onDeepDive,
  messageSubChats = [],
  onOpenExistingSubChat,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [showCopied, setShowCopied] = useState(false);
  
  // Streaming dots animation
  const dotsAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isStreaming && !streamingContent) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotsAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isStreaming, streamingContent, dotsAnim]);

  const displayContent = isAssistant && isStreaming ? streamingContent : message.content;
  const showStatusPills = isAssistant && isStreaming && isLastMessage && statusPills.length > 0;
  const showActions = displayContent && !isStreaming;
  const hasSubChats = messageSubChats.length > 0;

  // Copy handler
  const handleCopy = useCallback(async () => {
    const textToCopy = displayContent || message.content;
    if (!textToCopy) return;
    
    await Clipboard.setStringAsync(textToCopy);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [displayContent, message.content]);

  // Quote handler for SelectableMessage
  const handleQuoteSelection = useCallback(
    (selectedText: string, _start: number, _end: number) => {
      if (!onQuote) return;
      const role = message.role === 'user' ? 'user' : 'assistant';
      onQuote(message.id, selectedText, role);
    },
    [message.id, message.role, onQuote]
  );

  // Deep Dive handler for SelectableMessage
  const handleDeepDiveSelection = useCallback(
    (selectedText: string, _start: number, _end: number) => {
      if (!onDeepDive) return;
      const role = message.role === 'user' ? 'user' : 'assistant';
      const fullContent = displayContent || message.content || '';
      onDeepDive(selectedText, message.id, role, fullContent);
    },
    [message.id, message.role, message.content, displayContent, onDeepDive]
  );



  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Use SelectableMessage for completed messages with text selection
  const canSelect = !isStreaming && displayContent;

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        {/* Search Results - show above assistant messages */}
        {isAssistant && searchResults && searchResults.sources?.length > 0 && (
          <SearchResultsCard searchResults={searchResults} />
        )}

        {/* Status Pills for streaming */}
        {showStatusPills && (
          <StatusPills pills={statusPills} />
        )}

        {/* Message Content */}
        {isUser ? (
          // User messages - use SelectableMessage for quote/deep dive selection
          canSelect ? (
            <SelectableMessage
              content={message.content}
              onQuote={onQuote ? handleQuoteSelection : undefined}
              onDeepDive={onDeepDive ? handleDeepDiveSelection : undefined}
              isUser={true}
            />
          ) : (
            <Text style={styles.userText}>{message.content}</Text>
          )
        ) : displayContent ? (
          // Assistant messages - always use Markdown for proper rendering
          <Markdown style={markdownStyles} rules={markdownRules}>{displayContent}</Markdown>
        ) : isStreaming ? (
          <Animated.View style={[styles.loadingDots, { opacity: dotsOpacity }]}>
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </Animated.View>
        ) : null}

        {/* Sub-chat indicator */}
        {hasSubChats && !isStreaming && (
          <View style={styles.subChatIndicator}>
            <MessageSquare size={12} color={theme.colors.accent.primary} />
            <Text style={styles.subChatCount}>
              {messageSubChats.length} deep dive{messageSubChats.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Action Buttons - shown at bottom for completed messages */}
        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopy}
              activeOpacity={0.6}
            >
              {showCopied ? (
                <Check size={14} color={theme.colors.accent.success} />
              ) : (
                <Copy size={14} color={theme.colors.text.tertiary} />
              )}
              <Text style={[
                styles.actionLabel,
                showCopied && styles.actionLabelSuccess
              ]}>
                {showCopied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// Memoize with custom comparison for performance
export const MessageItem = memo(MessageItemBase, (prev, next) => {
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.isStreaming && prev.streamingContent !== next.streamingContent) return false;
  if (prev.statusPills.length !== next.statusPills.length) return false;
  if (prev.message.content !== next.message.content) return false;
  if (prev.message.id !== next.message.id) return false;
  if (prev.searchResults !== next.searchResults) return false;
  if (prev.messageSubChats?.length !== next.messageSubChats?.length) return false;
  return true;
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    maxWidth: '100%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  loadingDots: {
    paddingVertical: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text.tertiary,
  },
  subChatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  subChatCount: {
    fontSize: 11,
    color: theme.colors.accent.primary,
    fontWeight: '500',
  },
  // Action buttons at bottom
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  actionLabelSuccess: {
    color: theme.colors.accent.success,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 28,
  },
  heading2: {
    color: theme.colors.text.primary,
    fontSize: 19,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
    lineHeight: 26,
  },
  heading3: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    lineHeight: 24,
  },
  paragraph: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
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
    padding: 14,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 12,
    overflow: 'hidden',
  },
  fence: {
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    padding: 14,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 12,
    overflow: 'hidden',
  },
  blockquote: {
    backgroundColor: theme.colors.background.secondary,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
    paddingLeft: 14,
    paddingVertical: 10,
    marginVertical: 12,
    borderRadius: 6,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  list_item: {
    flexDirection: 'row',
    marginVertical: 4,
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
    marginVertical: 16,
  },
});

// Custom render rules for markdown
const markdownRules = {
  fence: (node: any, children: any, parent: any, styles: any) => {
    // Check if this is a mermaid code block
    const info = node.sourceInfo || '';
    if (info.toLowerCase() === 'mermaid') {
      const content = node.content || '';
      return (
        <MermaidDiagram key={node.key} code={content} />
      );
    }
    
    // Default code block rendering
    return (
      <View key={node.key} style={styles.fence}>
        <Text style={styles.fence}>{node.content}</Text>
      </View>
    );
  },
};
