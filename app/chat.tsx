/**
 * Authenticated Chat Screen
 * Full chat experience for logged-in users
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Menu, Plus, AlertCircle, RotateCcw, Search } from 'lucide-react-native';

import { ChatProvider, useChatContext } from '../src/lib/contexts/ChatContext';
import { useAuth } from '../src/lib/auth';
import { theme } from '../src/lib/theme';
import {
  AuthenticatedChatInput,
  MessageList,
  ContextPickerSheet,
  SubChatSheet,
  MessageItem,
  EmptyStateChat,
  ScrollToBottomButton,
  type ContextItem,
  type MessageListRef,
  ChatBackground,
  ChatSearchSheet,
} from '../src/components/chat';
import { AppSidebar } from '../src/components/sidebar/AppSidebar';
import { useGuestSubChats } from '../src/lib/hooks/useGuestSubChats';
import type { Message, Conversation, SurfaceMode } from '../src/lib/types';

function ChatContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const {
    conversations,
    currentConversationId,
    messages,
    streamingMessageId,
    streamingContent,
    statusPills,
    searchResults,
    isStreaming,
    isSending,
    error,
    sendMessage,
    createNewChat,
    clearError,
    // Edit state
    isEditing,
    editingMessageId,
    editContent,
    updateEditContent,
    startEdit,
    cancelEdit,
    saveEdit,
    isSavingEdit,
    // Pagination
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  } = useChatContext();

  // Sub-chats (reuse guest hook for now as logic is similar)
  const {
    activeSubChat,
    subChats,
    handleOpenSubChat,
    setSubChatSheetOpen,
    handleOpenExistingSubChat,
    subChatSheetOpen,
    subChatLoading,
    subChatStreamingContent,
    handleSubChatSendMessage,
    handleDeleteSubChat,
  } = useGuestSubChats(currentConversationId);

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<any | null>(null);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [surfaceMode, setSurfaceMode] = useState<any>('chat');
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const messageListRef = useRef<MessageListRef>(null);

  // Initialize with prompt from params if available
  const params = useLocalSearchParams<{ conversationId?: string; prompt?: string }>();
  const [pendingPrompt, setPendingPrompt] = useState(params.prompt || '');

  // Determine if we're in empty state
  const isEmptyState = messages.length === 0 && !isSending;

  // Get active conversation for tags
  const activeConversation = conversations.find(c => c.id === currentConversationId);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/guest-chat');
    }
  }, [isAuthenticated, router]);

  // Handle suggestion selection from empty state
  const handleSelectSuggestion = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    sendMessage(prompt);
    setPendingPrompt('');
  }, [sendMessage]);

  // Handle send
  const handleSend = useCallback((content: string, attachments?: { url: string; name: string; type: string; size: number }[]) => {

    let finalContent = content;

    // Prepend quote if present
    if (quotedMessage) {
      const quoteLines = quotedMessage.quotedText.split('\n').map((line: string) => `> ${line}`).join('\n');
      finalContent = `${quoteLines}\n\n${content}`;
    }

    // Referenced conversations
    const referencedConversations = selectedContext.map(item => ({ id: item.id, title: item.title }));

    sendMessage(finalContent, referencedConversations, attachments);
    setQuotedMessage(null);
    setSelectedContext([]);
    setPendingPrompt('');
  }, [sendMessage, quotedMessage, selectedContext, surfaceMode, currentConversationId]);

  // Handle deep dive (for sub-chats)
  const handleDeepDive = useCallback((text: string, messageId: string, role: 'user' | 'assistant', fullContent: string) => {
    handleOpenSubChat(text, messageId, role, fullContent);
  }, [handleOpenSubChat]);

  // Handle quote from message
  const handleQuote = useCallback((messageId: string, text: string, role: 'user' | 'assistant') => {
    setQuotedMessage({ messageId, quotedText: text, authorRole: role });
  }, []);

  // Handle edit start - use context's startEdit
  const handleStartEdit = useCallback((message: Message) => {
    startEdit(message);
  }, [startEdit]);

  // Render message
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isLastMessage = index === messages.length - 1;
    const isThisStreaming = item.id === streamingMessageId;
    const messageSubChats = subChats.filter(sc => sc.sourceMessageId === item.id);

    return (
      <MessageItem
        message={item}
        isStreaming={isThisStreaming}
        streamingContent={streamingContent}
        statusPills={isThisStreaming ? statusPills : []}
        searchResults={isThisStreaming ? searchResults : null}
        isLastMessage={isLastMessage}
        onQuote={handleQuote}
        onDeepDive={handleDeepDive}
        messageSubChats={messageSubChats}
        onOpenExistingSubChat={(sc) => {
          handleOpenExistingSubChat(sc);
        }}
        conversationId={currentConversationId}
        onStartEdit={handleStartEdit}
        isEditing={editingMessageId === item.id}
      />
    );
  }, [messages.length, streamingMessageId, streamingContent, statusPills, searchResults, handleQuote, handleDeepDive, subChats, handleOpenExistingSubChat, currentConversationId, handleStartEdit, editingMessageId]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createNewChat();
  }, [createNewChat]);

  if (!isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ChatBackground />

      <View style={[styles.floatingHeaderWrapper, { top: insets.top }]} pointerEvents="box-none">
        {/* Header - Floating pill design matching web */}
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.headerButtonGroup}>
            {/* Menu Button */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Menu size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.headerSeparator} />

            {/* New Chat Button */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewChat}
              activeOpacity={0.7}
            >
              <Plus size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.headerSeparator} />

            {/* Search Button (placeholder for future command bar) */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setSearchOpen(true)}
              activeOpacity={0.7}
            >
              <Search size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags Section */}
        {activeConversation?.tags && activeConversation.tags.length > 0 && (
          <View style={styles.tagContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagContent}
              pointerEvents="auto"
            >
              {activeConversation.tags.map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >

        {isEmptyState ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <EmptyStateChat onSelectSuggestion={handleSelectSuggestion} />
            </View>
            <View style={styles.centeredInputWrapper}>
              <AuthenticatedChatInput
                onSend={handleSend}
                isLoading={isSending}
                quotedMessage={quotedMessage}
                onClearQuote={() => setQuotedMessage(null)}
                onAddContext={() => setContextPickerOpen(true)}
                contextItems={selectedContext}
                onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(p => p.id !== id))}
                initialValue={pendingPrompt}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.messageListContainer}>
              <MessageList
                ref={messageListRef}
                messages={messages}
                isLoading={isSending}
                streamingMessageId={streamingMessageId}
                streamingContent={streamingContent}
                statusPills={statusPills}
                searchResults={searchResults}
                renderMessage={renderMessage}
                onScrollPositionChange={(isAtBottom) => setIsScrolledUp(!isAtBottom)}
                contentContainerStyle={{
                  paddingTop: activeConversation?.tags && activeConversation.tags.length > 0 ? 100 : 60
                }}
                onLoadMore={loadMoreMessages}
                hasMore={hasMoreMessages}
                isLoadingMore={isLoadingMore}
              />

              {/* Scroll to Bottom Button */}
              <ScrollToBottomButton
                visible={isScrolledUp && messages.length > 0}
                onPress={() => messageListRef.current?.scrollToEnd(true)}
              />
            </View>

            {/* Error State */}
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={theme.colors.accent.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={clearError}>
                  <RotateCcw size={14} color={theme.colors.accent.error} />
                </TouchableOpacity>
              </View>
            )}

            <AuthenticatedChatInput
              onSend={isEditing ? saveEdit : handleSend}
              isLoading={isSending || isSavingEdit}
              quotedMessage={quotedMessage}
              onClearQuote={() => setQuotedMessage(null)}
              onAddContext={() => setContextPickerOpen(true)}
              contextItems={selectedContext}
              onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(p => p.id !== id))}
              initialValue={isEditing ? editContent : pendingPrompt}
              onValueChange={isEditing ? updateEditContent : undefined}
              editMode={isEditing}
              onCancelEdit={cancelEdit}
            />
          </>
        )}
      </KeyboardAvoidingView>

      {/* Sidebar, Context Picker, Sub-chat Sheet ... */}
      <AppSidebar
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearch={() => setSearchOpen(true)}
      />

      {/* Context Picker */}
      <ContextPickerSheet
        open={contextPickerOpen}
        onOpenChange={setContextPickerOpen}
        conversations={conversations.map(c => ({
          id: c.id,
          title: c.title || 'Untitled',
          createdAt: c.createdAt,
        }))}
        selectedItems={selectedContext}
        onSelectionChange={setSelectedContext}
        currentConversationId={currentConversationId}
      />

      {/* Sub-Chat Sheet */}
      <SubChatSheet
        open={subChatSheetOpen}
        onOpenChange={setSubChatSheetOpen}
        subChat={activeSubChat}
        onSendMessage={handleSubChatSendMessage}
        isLoading={subChatLoading}
        streamingContent={subChatStreamingContent}
      />

      {/* Search Sheet */}
      <ChatSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        onSelectConversation={(conv: Conversation) => {
          // Handle select (navigate if different)
          if (conv.id !== currentConversationId) {
            // We can just use selectConversation exposed via Context -> but router push is cleaner if URL updates
            // Actually, we use Context selectConversation usually.
            // But wait, router logic:
            router.push({ pathname: '/chat', params: { conversationId: conv.id } });
          }
          setSearchOpen(false);
        }}
      />

    </SafeAreaView>
  );
}


export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string; id?: string }>();

  return (
    <ChatProvider initialConversationId={params.id || params.conversationId}>
      <ChatContent />
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.background.secondary}CC`, // 80% opacity
    borderRadius: theme.borderRadius.md,
    padding: 4,
    gap: 2,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  headerSeparator: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: 2,
  },
  keyboardView: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.accent.error,
  },
  retryButton: {
    padding: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  centeredInputWrapper: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  messageListContainer: {
    flex: 1,
    position: 'relative',
  },
  tagContainer: {
    height: 32,
    marginBottom: 8,
  },
  tagContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  floatingHeaderWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

