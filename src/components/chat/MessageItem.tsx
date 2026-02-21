/**
 * MessageItem - Enhanced message component
 * Features:
 * - Markdown rendering for assistant messages
 * - Native text selection with Quote and Deep Dive actions
 * - Sub-chat text highlighting
 * - Action buttons at bottom (Copy)
 * - Status pills for AI processing
 * - Source Images & Citations Footer
 * - Swiss Modern Design (Sharp corners)
 */

import React, { memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { Copy, Check, Info, ChevronRight, Play, BookOpen, GitBranch, MessageSquare, Pencil, Trash2, Folder, Paperclip } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { Message } from '../../lib/types';
import type { StatusPill, SearchResult } from '../../lib/hooks/useStreaming';
import type { SubChat } from '../../lib/hooks/useGuestSubChats';
import { ReasoningDisplay } from './ReasoningDisplay';
import { SearchResultsCard } from './SearchResultsCard';
import { SelectableMessage } from './SelectableMessage';
import { MermaidDiagram } from './MermaidDiagram';
import { SourceImages, type SourceImage } from './SourceImages';
import { SourcesFooter, type Citation } from './SourcesFooter';
import { CodeBlock } from './markdown/CodeBlock';
import { ONBOARDING_IMAGES } from '../../lib/services/onboarding-content';
import { InlineCitation, parseCitationsInText } from './InlineCitation';
import { useOptionalChatContext } from '../../lib/contexts/ChatContext';
import { useRouter } from 'expo-router';
import { VersionIndicator } from './VersionIndicator';
import { Alert } from 'react-native';

interface MessageItemProps {
  message: Message;
  isStreaming: boolean;
  streamingContent: string;
  statusPills?: StatusPill[];
  searchResults?: SearchResult | null;
  isLastMessage: boolean;
  onQuote?: (messageId: string, text: string, role: 'user' | 'assistant') => void;
  onDeepDive?: (
    text: string,
    messageId: string,
    role: 'user' | 'assistant',
    fullContent: string
  ) => void;
  messageSubChats?: SubChat[];
  onOpenExistingSubChat?: (subChat: SubChat) => void;
  // Surface props
  conversationId?: string | null;
  userQuery?: string;
  // User message actions
  onStartEdit?: (message: Message) => void;
  versions?: Message[];
  isEditing?: boolean;
}

// Helper: Format citations from search results (mimicking web Logic)
function formatCitationsFromSearchResults(
  results: SearchResult | null | undefined
): Citation[] {
  if (!results || !results.sources) return [];
  // Assuming SearchResult structure matches what's needed or adapting
  // If SearchResult.sources is already { title, url, ... }
  return results.sources.map((s, index) => ({
    id: index + 1, // Assign 1-based ID
    title: s.title,
    url: s.url,
    snippet: s.snippet,
    images: s.images // Assuming source might have images if expanded, or we check top level
  }));
}

// Helper: Extract images from citations
function extractImagesFromCitations(citations: Citation[]): SourceImage[] {
  const images: SourceImage[] = [];
  for (const citation of citations) {
    // If citation has explicit image field (depends on backend)
    // For now, let's assume `citation` object might have `image` or `images` prop if passed from SearchResult
    // We cast to any to safely check
    const c = citation as any;
    if (c.image) {
      images.push({ url: c.image, sourceUrl: c.url, sourceTitle: c.title });
    }
    if (c.images && Array.isArray(c.images)) {
      for (const imgUrl of c.images) {
        images.push({ url: imgUrl, sourceUrl: c.url, sourceTitle: c.title });
      }
    }
  }
  return images;
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
  conversationId,
  userQuery,
  onStartEdit,
  versions = [],
  isEditing = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [showCopied, setShowCopied] = useState(false);

  // Streaming dots animation
  const chatContext = useOptionalChatContext();
  const { branchConversation, loadConversations, deleteMessage, switchToMessageVersion, getMessageVersions } = chatContext || {};
  const router = useRouter();
  const dotsAnim = useRef(new Animated.Value(0)).current;

  // Versions State
  const [localVersions, setLocalVersions] = useState<Message[]>([]);
  const effectiveVersions = versions.length > 0 ? versions : localVersions;

  useEffect(() => {
    // Only fetch versions for user messages to show indicator
    // Validate if we need to fetch (don't have them yet)
    if (isUser && effectiveVersions.length === 0 && typeof getMessageVersions === 'function') {
      let isMounted = true;
      getMessageVersions(message.id).then(fetched => {
        // Only update if we have multiple versions to show
        if (isMounted && fetched && fetched.length > 1) {
          setLocalVersions(fetched);
        }
      });
      return () => { isMounted = false; };
    }
  }, [message.id, isUser, getMessageVersions, effectiveVersions.length]);

  useEffect(() => {
    if (isStreaming && !streamingContent) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(dotsAnim, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dotsAnim, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isStreaming, streamingContent, dotsAnim]);

  // Parse reasoning metadata
  const parsedMetadata = useMemo(() => {
    const raw = message.reasoningMetadata;
    if (!raw) return undefined;
    // If it's stored as JSON object already in mobile types (Message interface)
    return raw;
  }, [message.reasoningMetadata]);

  // Determine effective data
  const effectiveStatusPills = isStreaming ? statusPills : (parsedMetadata as any)?.statusPills;
  const effectiveSearchResults = isStreaming ? searchResults : (parsedMetadata as any)?.searchResults;

  const displayContent = isAssistant && isStreaming ? streamingContent : message.content;
  // Show actions when not streaming and message exists (for both user and assistant)
  const showActions = !isStreaming && (displayContent || message.content);
  const hasSubChats = messageSubChats.length > 0;

  // Prepare Citations & Images
  const citations = useMemo(() => {
    if (!isAssistant) return [];
    return formatCitationsFromSearchResults(effectiveSearchResults);
  }, [effectiveSearchResults, isAssistant]);

  const sourceImages = useMemo(() => extractImagesFromCitations(citations), [citations]);


  // Copy handler
  const handleCopy = useCallback(async () => {
    const textToCopy = displayContent || message.content;
    if (!textToCopy) return;
    await Clipboard.setStringAsync(textToCopy);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [displayContent, message.content]);

  // Branch handler
  const handleBranch = useCallback(async () => {
    if (!conversationId || !message.id || !branchConversation) return;
    const newConversationId = await branchConversation(message.id);
    if (newConversationId) {
      if (loadConversations) await loadConversations(); // Refresh conversation list
      router.push({ pathname: '/chat', params: { id: newConversationId } });
    }
  }, [conversationId, message.id, branchConversation, loadConversations, router]);

  // Edit handler (pass to parent to populate ChatInput)
  const handleEdit = useCallback(() => {
    if (onStartEdit) {
      onStartEdit(message);
    }
  }, [message, onStartEdit]);

  // Delete handler with confirmation
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!deleteMessage) return;
            try {
              await deleteMessage(message.id);
            } catch (err) {
              console.error('Failed to delete message:', err);
            }
          },
        },
      ]
    );
  }, [message.id, deleteMessage]);

  // Version switch handler
  const handleSwitchVersion = useCallback(async (versionId: string) => {
    if (switchToMessageVersion) {
      await switchToMessageVersion(versionId);
    }
  }, [switchToMessageVersion]);

  // Selection handlers
  const handleQuoteSelection = useCallback(
    (selectedText: string, _start: number, _end: number) => {
      if (!onQuote) return;
      onQuote(message.id, selectedText, message.role === 'user' ? 'user' : 'assistant');
    },
    [message.id, message.role, onQuote]
  );

  const handleDeepDiveSelection = useCallback(
    (selectedText: string, _start: number, _end: number) => {
      if (!onDeepDive) return;
      const fullContent = displayContent || message.content || '';
      onDeepDive(selectedText, message.id, message.role === 'user' ? 'user' : 'assistant', fullContent);
    },
    [message.id, message.role, message.content, displayContent, onDeepDive]
  );

  const dotsOpacity = dotsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const canSelect = !isStreaming && displayContent;

  const markdownRules = useMemo(() => {
    const rules: any = {
      fence: (node: any, children: any, parent: any, styles: any) => {
        const info = node.sourceInfo || '';
        if (info.toLowerCase() === 'mermaid') {
          const content = node.content || '';
          return (
            <MermaidDiagram key={node.key} code={content} />
          );
        }
        return (
          <CodeBlock key={node.key} code={node.content} language={info} />
        );
      },
      image: (node: any, children: any, parent: any, styles: any) => {
        const { key, ...otherProps } = node.attributes || {};
        return (
          <Image
            key={node.key}
            source={{ uri: node.attributes?.src }}
            style={styles.image}
            resizeMode="contain"
            {...otherProps}
          />
        );
      },
    };

    // Enable citation parsing without breaking inheritance
    rules.text = (node: any, children: any, parent: any, styles: any) => {
      try {
        const parts = parseCitationsInText(node.content, citations || []);
        // NO explicit style passed here means it will cleanly inherit fontWeight/fontFamily
        // from parent parent nodes like `strong` or `em`.
        return (
          <Text key={node.key} style={{ color: theme.colors.text.primary }}>
            {parts}
          </Text>
        );
      } catch (e) {
        return (
          <Text key={node.key} style={{ color: theme.colors.text.primary }}>
            {node.content}
          </Text>
        );
      }
    };

    return rules;
  }, [citations]);

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>

        {/* Assistant-only Header Components */}
        {isAssistant && (
          <>
            {/* 1. Reasoning Display */}
            {(effectiveStatusPills && effectiveStatusPills.length > 0) || (isStreaming && isLastMessage) ? (
              <ReasoningDisplay
                statuses={isLastMessage && isStreaming ? (statusPills || []) : (effectiveStatusPills || [])}
                searchResults={isLastMessage && isStreaming ? searchResults : effectiveSearchResults}
                isStreaming={isStreaming && isLastMessage}
                hasContent={!!displayContent}
              />
            ) : null}

            {/* 2. Source Images (Hero) */}
            {sourceImages.length > 0 && (
              <SourceImages images={sourceImages} />
            )}
          </>
        )}

        {/* Message Content */}
        {isUser ? (
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

        {/* Onboarding Images (for welcome messages) */}
        {isAssistant && message.onboardingImages && message.onboardingImages.length > 0 && (
          <View style={styles.onboardingImagesContainer}>
            {message.onboardingImages.map((imageKey, idx) => {
              const imageSource = ONBOARDING_IMAGES[imageKey as keyof typeof ONBOARDING_IMAGES];
              if (!imageSource) return null;
              return (
                <Image
                  key={`${imageKey}-${idx}`}
                  source={imageSource}
                  style={styles.onboardingImage}
                  resizeMode="contain"
                />
              );
            })}
          </View>
        )}

        {/* Context Badges (User messages only) */}
        {isUser && ((message.referencedConversations?.length ?? 0) > 0 || (message.referencedFolders?.length ?? 0) > 0) && (
          <View style={styles.contextBadgesContainer}>
            {message.referencedFolders?.map((f) => (
              <View key={`f-${f.id}`} style={styles.contextBadge}>
                <Folder size={10} color={theme.colors.text.tertiary} />
                <Text style={styles.contextBadgeText} numberOfLines={1}>{f.name}</Text>
              </View>
            ))}
            {message.referencedConversations?.map((c) => (
              <View key={`c-${c.id}`} style={styles.contextBadge}>
                <MessageSquare size={10} color={theme.colors.text.tertiary} />
                <Text style={styles.contextBadgeText} numberOfLines={1}>{c.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Attachments (User messages only) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {message.attachments.map((file, i) => (
              <View key={file.url || i} style={styles.attachmentItem}>
                <Paperclip size={12} color={theme.colors.text.tertiary} />
                <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Assistant-only Footer Components */}
        <>
          {/* 4. Sources Footer */}
          {citations.length > 0 && (
            <SourcesFooter citations={citations} />
          )}
        </>

        {/* Sub-chat indicator - Now Clickable */}
        {hasSubChats && !isStreaming && (
          <TouchableOpacity
            style={styles.subChatIndicator}
            onPress={() => onOpenExistingSubChat && messageSubChats[0] ? onOpenExistingSubChat(messageSubChats[0]) : null}
            activeOpacity={0.7}
          >
            <View style={styles.subChatIconContainer}>
              <MessageSquare size={12} color={theme.colors.accent.primary} />
            </View>
            <Text style={styles.subChatCount}>
              {messageSubChats.length} deep dive{messageSubChats.length > 1 ? 's' : ''}
            </Text>
            <ChevronRight size={12} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}

      </View>

      {/* Action Buttons (Outside bubble for User, Inside for Assistant) */}
      {showActions && (
        <View style={[
          styles.actionsRow,
          isUser ? styles.userActionsRow : styles.assistantActionsRow
        ]}>
          {/* Branch Button (Assistant Only) */}
          {isAssistant && (
            <Pressable
              onPress={handleBranch}
              style={styles.actionButton}
              hitSlop={8}
            >
              <GitBranch size={14} color={theme.colors.text.tertiary} />
            </Pressable>
          )}

          {/* Version Indicator (User Only, when multiple versions) */}
          {isUser && effectiveVersions.length > 1 && (
            <VersionIndicator
              message={message}
              versions={effectiveVersions}
              onSwitchVersion={handleSwitchVersion}
            />
          )}

          {/* Edit Button (User Only) */}
          {isUser && onStartEdit && (
            <Pressable
              onPress={handleEdit}
              style={styles.actionButton}
              hitSlop={8}
            >
              <Pencil size={14} color={theme.colors.text.tertiary} />
            </Pressable>
          )}

          {/* Delete Button (User Only) */}
          {isUser && (
            <Pressable
              onPress={handleDelete}
              style={styles.actionButton}
              hitSlop={8}
            >
              <Trash2 size={14} color={theme.colors.text.tertiary} />
            </Pressable>
          )}

          {/* Copy Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopy}
            activeOpacity={0.6}
            hitSlop={8}
          >
            {showCopied ? (
              <Check size={14} color={theme.colors.accent.success} />
            ) : (
              <Copy size={14} color={theme.colors.text.tertiary} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Memoize
export const MessageItem = memo(MessageItemBase, (prev, next) => {
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.isStreaming && prev.streamingContent !== next.streamingContent) return false;

  // Deep check statusPills length
  if ((prev.statusPills?.length ?? 0) !== (next.statusPills?.length ?? 0)) return false;
  // Check last status message
  if (prev.statusPills?.length && next.statusPills?.length) {
    if (prev.statusPills[prev.statusPills.length - 1].message !== next.statusPills[next.statusPills.length - 1].message) return false;
  }

  if (prev.message.content !== next.message.content) return false;
  if (prev.message.id !== next.message.id) return false;

  // Check search results change
  if (prev.searchResults !== next.searchResults) return false;
  // Deep check search results count
  if (prev.searchResults?.sources?.length !== next.searchResults?.sources?.length) return false;

  if (prev.messageSubChats?.length !== next.messageSubChats?.length) return false;

  return true;
});


const styles = StyleSheet.create({
  container: {
    marginBottom: 12, // Increased spacing between messages
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
    paddingHorizontal: 0,
    paddingVertical: 2,
    // borderRadius: 0, // Swiss Sharp
  },
  userBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg, // Rounded (16)
  },
  assistantBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.tertiary,
  },
  subChatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  subChatIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Subtle blue bg
  },
  subChatCount: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // More breathable
    marginTop: 6,
  },

  assistantActionsRow: {
    paddingTop: 4,
    marginLeft: 4,
  },
  userActionsRow: {
    // Outside bubble, align to right
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  actionButton: {
    // No padding as requested
    padding: 4, // Slightly clearer touch target
    opacity: 0.6,
  },
  // Context Badges
  contextBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full, // Pill shape
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  contextBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    maxWidth: 120,
  },
  // Attachments
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  attachmentName: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    maxWidth: 120,
  },
  // Onboarding images
  onboardingImagesContainer: {
    marginTop: 12,
    gap: 12,
  },
  onboardingImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 18, // increased font size
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  heading1: {
    color: theme.colors.text.primary,
    fontSize: 28, // increased
    fontWeight: '700',
    marginTop: 24, // increased margin
    marginBottom: 12, // increased
    lineHeight: 38, // increased
    letterSpacing: -0.4,
  },
  heading2: {
    color: theme.colors.text.primary,
    fontSize: 24, // increased
    fontWeight: '600',
    marginTop: 20, // increased
    marginBottom: 10,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  heading3: {
    color: theme.colors.text.primary,
    fontSize: 22, // increased
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  paragraph: {
    color: theme.colors.text.primary,
    fontSize: 18, // increased font size
    lineHeight: 28,
    letterSpacing: -0.2,
    marginTop: 0,
    marginBottom: 16, // slightly more gap
  },
  code_inline: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    fontSize: 15, // Bumped slightly
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    overflow: 'hidden',
  },
  code_block: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.primary,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  fence: {
    backgroundColor: theme.colors.background.tertiary,
    color: theme.colors.text.primary,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  blockquote: {
    backgroundColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.text.tertiary,
    paddingLeft: 14,
    paddingVertical: 6,
    marginVertical: 12, // More gap for larger text
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 14, // More gap
  },
  ordered_list: {
    marginTop: 4,
    marginBottom: 14, // More gap
  },
  list_item: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  bullet_list_icon: {
    marginTop: Platform.OS === 'ios' ? 9 : 10,
    marginRight: 8, // More gap after bullet
    color: theme.colors.text.primary,
    fontSize: 15, // Slightly larger bullet
  },
  ordered_list_icon: {
    marginTop: Platform.OS === 'ios' ? 0 : 2,
    marginRight: 8, // More gap after number
    color: theme.colors.text.primary,
    fontSize: 17, // Match new body size
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  strong: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  em: {
    fontStyle: 'italic',
    color: theme.colors.text.primary,
  },
  link: {
    color: theme.colors.accent.primary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  hr: {
    backgroundColor: theme.colors.border.subtle,
    height: 1,
    marginVertical: 20,
  },
  // Table styles
  table: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginVertical: 12,
  },
  thead: {
    backgroundColor: theme.colors.background.secondary,
  },
  th: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 8,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: 13,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  td: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 8,
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  // Image
  image: {
    marginVertical: 12,
  },
});


