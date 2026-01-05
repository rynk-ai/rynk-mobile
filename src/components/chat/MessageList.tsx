import React, { useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
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
}

export function MessageList({
  messages,
  isLoading,
  streamingMessageId,
  streamingContent,
  statusPills,
  searchResults,
  onRetry,
  isGuest = false,
  renderMessage,
}: MessageListProps) {
  const listRef = useRef<FlatList>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, streamingContent]);

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
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={renderMessage || defaultRenderItem}
      ListFooterComponent={() => 
        isLoading && !streamingMessageId ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.text.tertiary} />
          </View>
        ) : <View style={{ height: 20 }} /> // Spacer
      }
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
      extraData={{ streamingMessageId, streamingContent, statusPills, searchResults }}
    />
  );
}

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
