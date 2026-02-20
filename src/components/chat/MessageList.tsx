import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { theme } from '../../lib/theme';
import { MessageItem } from './MessageItem';
import type { Message } from '../../lib/types';
import type { StatusPill as StatusPillType, SearchResult } from '../../lib/hooks/useStreaming';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  streamingMessageId?: string | null;
  streamingContent?: string;
  statusPills?: StatusPillType[];
  searchResults?: SearchResult | null;
  onRetry?: (messageId: string) => void;
  isGuest?: boolean;
  // Allow custom rendering (e.g. from app/chat.tsx which has callbacks)
  renderMessage?: (props: { item: Message; index: number }) => React.ReactElement | null;
  // Scroll position callback
  onScrollPositionChange?: (isAtBottom: boolean) => void;
  contentContainerStyle?: any;
  // Pagination
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export interface MessageListRef {
  scrollToEnd: (animated?: boolean) => void;
}

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList({
  messages,
  isLoading,
  streamingMessageId,
  streamingContent,
  statusPills,
  searchResults,
  onRetry,
  isGuest = false,
  renderMessage,
  onScrollPositionChange,
  contentContainerStyle,
  onLoadMore,
  hasMore,
  isLoadingMore,
}, ref) {
  const listRef = useRef<FlatList>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  // Expose scrollToEnd to parent via ref
  useImperativeHandle(ref, () => ({
    scrollToEnd: (animated = true) => {
      listRef.current?.scrollToEnd({ animated });
      setIsUserScrolledUp(false);
    },
  }), []);

  // Auto-scroll to bottom when streaming or new messages (only if not scrolled up)
  useEffect(() => {
    if ((messages.length > 0 || streamingContent) && !isUserScrolledUp) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, streamingContent, isUserScrolledUp]);

  // Track scroll position
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Threshold for "at bottom"
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;

    setIsUserScrolledUp(!isAtBottom);
    onScrollPositionChange?.(isAtBottom);

    // Detect top for pagination (load more)
    // Using a threshold of 50px from top
    if (contentOffset.y <= 50 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [onScrollPositionChange, hasMore, isLoadingMore, onLoadMore]);

  const defaultRenderItem = ({ item, index }: { item: Message; index: number }) => {
    // Check if this is the message currently being streamed
    const isStreaming = item.id === streamingMessageId;
    const isLastMessage = index === messages.length - 1;
    const previousMessage = index > 0 ? messages[index - 1] : undefined;

    // Grouping logic (simplified)
    const showAvatar = item.role === 'assistant' && (
      !previousMessage || previousMessage.role !== 'assistant'
    );

    return (
      <MessageItem
        message={item}
        isStreaming={isStreaming}
        streamingContent={isStreaming && streamingContent ? streamingContent : ''}
        statusPills={isStreaming ? (statusPills || []) : []}
        searchResults={isStreaming ? searchResults : undefined}
        isLastMessage={isLastMessage}
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      style={{ flex: 1 }}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      renderItem={renderMessage || defaultRenderItem}
      ListHeaderComponent={() =>
        isLoadingMore ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.text.tertiary} />
          </View>
        ) : null
      }
      ListFooterComponent={() =>
        isLoading && !streamingMessageId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.text.tertiary} />
          </View>
        ) : <View style={{ height: 20 }} /> // Spacer
      }
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={(_, height) => {
        contentHeight.current = height;
        if (!isUserScrolledUp) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }}
      onLayout={(e) => {
        scrollViewHeight.current = e.nativeEvent.layout.height;
        if (!isUserScrolledUp) {
          listRef.current?.scrollToEnd({ animated: false });
        }
      }}
      extraData={{ streamingMessageId, streamingContent, statusPills, searchResults }}
    />
  );
});

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

