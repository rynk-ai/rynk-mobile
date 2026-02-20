/**
 * Guest Chat Screen
 * Chat experience for unauthenticated users with quote reply support
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Menu, Plus, AlertCircle, RotateCcw, Search } from 'lucide-react-native';

import { GuestChatProvider, useGuestChatContext } from '../src/lib/contexts/GuestChatContext';
import { MessageItem, ChatInput, EmptyStateChat, SubChatSheet, ContextPickerSheet, ScrollToBottomButton, ChatBackground, ChatSearchSheet, type StatusPill, type QuotedMessage, type ContextItem } from '../src/components/chat';
import { useGuestSubChats } from '../src/lib/hooks/useGuestSubChats';
import { GuestDrawer } from '../src/components/GuestDrawer';
import { SignInModal } from '../src/components/SignInModal';
import { theme } from '../src/lib/theme';
import { ONBOARDING_MESSAGES } from '../src/lib/services/onboarding-content';
import type { Message, Conversation, SurfaceMode } from '../src/lib/types';

function GuestChatContent() {
  const router = useRouter(); // Initialize router
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
    creditsRemaining,
    isCreditsExhausted,
    selectConversation,
    sendMessage,
    createNewChat,
    loadConversations,
    clearError,
    isLoadingConversations,
    // Pagination
    hasMoreMessages,
    isLoadingMore,
    loadMoreMessages,

    folders,
    togglePinConversation,
    createFolder,
  } = useGuestChatContext();

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('chat');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [inputText, setInputText] = useState(''); // Track current input
  const [quotedMessage, setQuotedMessage] = useState<QuotedMessage | null>(null);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Sub-chat hook
  const {
    subChats,
    activeSubChat,
    subChatSheetOpen,
    setSubChatSheetOpen,
    subChatLoading,
    subChatStreamingContent,
    messageIdsWithSubChats,
    handleOpenSubChat,
    handleOpenExistingSubChat,
    handleSubChatSendMessage,
  } = useGuestSubChats(currentConversationId);

  // Determine if we're in empty state (no messages and not sending)
  const isEmptyState = messages.length === 0 && !isSending;

  // Onboarding messages - shown when no conversation is selected
  const onboardingMessages = useMemo(() => {
    const now = Date.now();
    return ONBOARDING_MESSAGES.map((msg, index) => ({
      id: `onboarding-${index}`,
      conversationId: 'preview',
      role: msg.role,
      content: msg.content,
      createdAt: new Date(now + (index * 100)).toISOString(),
      versionNumber: 1,
      // Include onboarding images for mobile rendering
      onboardingImages: msg.images,
    })) as Message[];
  }, []);

  // Show onboarding instead of empty state when no conversation selected
  const showOnboarding = !currentConversationId && isEmptyState;

  // Show sign in modal when credits exhausted
  React.useEffect(() => {
    if (isCreditsExhausted) {
      setShowSignInModal(true);
    }
  }, [isCreditsExhausted]);

  // Clear quote when conversation changes
  React.useEffect(() => {
    setQuotedMessage(null);
    setPendingPrompt('');
  }, [currentConversationId]);

  // Handle send
  const handleSend = useCallback((content: string) => {
    console.log('[handleSend] Called with:', content.substring(0, 50), '...');
    if (isCreditsExhausted) {
      setShowSignInModal(true);
      return;
    }

    // Prepend quote as markdown if present
    let finalContent = content;
    if (quotedMessage) {
      const quoteLines = quotedMessage.quotedText.split('\n').map(line => `> ${line}`).join('\n');
      finalContent = `${quoteLines}\n\n${content}`;
    }

    // Build referencedConversations with id and title
    const referencedConversations = selectedContext.length > 0
      ? selectedContext.map(item => ({ id: item.id, title: item.title }))
      : undefined;

    console.log('[handleSend] Calling sendMessage with referencedConversations:', referencedConversations?.length || 0);
    sendMessage(finalContent, referencedConversations, surfaceMode);
    setPendingPrompt('');
    setInputText(''); // Clear input
    setQuotedMessage(null);
    setSelectedContext([]); // Clear context after sending
  }, [sendMessage, isCreditsExhausted, quotedMessage, selectedContext, surfaceMode]);

  // Handle quote from message
  const handleQuote = useCallback((messageId: string, text: string, role: 'user' | 'assistant') => {
    setQuotedMessage({ messageId, quotedText: text, authorRole: role });
  }, []);

  // Handle clear quote
  const handleClearQuote = useCallback(() => {
    setQuotedMessage(null);
  }, []);

  // Handle suggestion selection from empty state
  const handleSelectSuggestion = useCallback((prompt: string) => {
    console.log('[handleSelectSuggestion] Called with:', prompt.substring(0, 50));
    setPendingPrompt(prompt);
    if (!isCreditsExhausted) {
      console.log('[handleSelectSuggestion] Calling sendMessage...');
      sendMessage(prompt);
      setPendingPrompt('');
    }
  }, [sendMessage, isCreditsExhausted]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createNewChat();
    setDrawerOpen(false);
    setPendingPrompt('');
    setQuotedMessage(null);
  }, [createNewChat]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((id: string | null) => {
    selectConversation(id);
    setDrawerOpen(false);
    setPendingPrompt('');
    setQuotedMessage(null);
  }, [selectConversation]);

  // Render message item
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
        searchResults={isThisStreaming || isLastMessage ? searchResults : null}
        isLastMessage={isLastMessage}
        onQuote={handleQuote}
        onDeepDive={handleOpenSubChat}
        messageSubChats={messageSubChats}
        onOpenExistingSubChat={handleOpenExistingSubChat}
      />
    );
  }, [messages.length, streamingMessageId, streamingContent, statusPills, searchResults, handleQuote, subChats, handleOpenSubChat, handleOpenExistingSubChat]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ChatBackground />

      {/* Header - Floating pill design matching web */}
      <View style={styles.header}>
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

          {/* Search Button (placeholder) */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSearchOpen(true)}
            activeOpacity={0.7}
          >
            <Search size={18} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Credits indicator in header */}
        {creditsRemaining !== null && (
          <View style={styles.creditsIndicator}>
            <Text style={[
              styles.creditsText,
              isCreditsExhausted && styles.creditsExhausted
            ]}>
              {isCreditsExhausted ? 'No credits' : `${creditsRemaining} messages left`}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Empty State with branding - only when explicitly empty (not onboarding) */}
        {isEmptyState && !showOnboarding ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateContent}>
              <EmptyStateChat onSelectSuggestion={handleSelectSuggestion} />
            </View>
            <View style={styles.centeredInputWrapper}>
              <ChatInput
                onSend={handleSend}
                isLoading={isSending}
                disabled={isCreditsExhausted}
                placeholder="Ask anything..."
                initialValue={pendingPrompt}
                quotedMessage={quotedMessage}
                onClearQuote={handleClearQuote}
                onAddContext={conversations.length > 0 ? () => setContextPickerOpen(true) : undefined}
                contextItems={selectedContext}
                onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(item => item.id !== id))}
                isGuest={true}
                onShowSignIn={() => setShowSignInModal(true)}
                onValueChange={setInputText}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Messages list - shows onboarding or real messages */}
            <View style={styles.contentArea}>
              <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={showOnboarding ? onboardingMessages : messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onScroll={(event) => {
                  const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
                  const paddingToBottom = 100;
                  const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
                  setIsScrolledUp(!isAtBottom);
                }}
                scrollEventThrottle={16}
                onContentSizeChange={() => {
                  if ((isStreaming || isSending) && !isScrolledUp) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                // Pagination - load more when scrolling to top
                onStartReached={hasMoreMessages ? loadMoreMessages : undefined}
                onStartReachedThreshold={0.5}
                maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 100 }}
                ListHeaderComponent={
                  isLoadingMore ? (
                    <View style={styles.loadingMore}>
                      <Text style={styles.loadingMoreText}>Loading older messages...</Text>
                    </View>
                  ) : null
                }
              />

              {/* Scroll to Bottom Button */}
              <ScrollToBottomButton
                visible={isScrolledUp && messages.length > 0}
                onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={theme.colors.accent.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={clearError}>
                  <RotateCcw size={14} color={theme.colors.accent.error} />
                </TouchableOpacity>
              </View>
            )}

            {/* Input at bottom */}
            <ChatInput
              onSend={handleSend}
              isLoading={isSending}
              disabled={isCreditsExhausted}
              placeholder="Continue the conversation..."
              initialValue={pendingPrompt}
              onValueChange={setInputText}
              quotedMessage={quotedMessage}
              onClearQuote={handleClearQuote}
              onAddContext={conversations.length > 1 ? () => setContextPickerOpen(true) : undefined}
              contextItems={selectedContext}
              onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(item => item.id !== id))}
              isGuest={true}
              onShowSignIn={() => setShowSignInModal(true)}
            />
          </>
        )}
      </KeyboardAvoidingView>

      {/* Drawer */}
      <GuestDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        creditsRemaining={creditsRemaining}
        onRefresh={loadConversations}
        isLoading={isLoadingConversations}
        folders={folders}
        onTogglePin={togglePinConversation}
        onCreateFolder={() => createFolder("New Folder")} // TODO: Add dialog
        isAuthenticated={false}
        user={null}
        onSignOut={() => { }}
      />

      {/* Sign In Modal */}
      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        isBlocking={isCreditsExhausted}
        creditsRemaining={creditsRemaining}
        pendingPrompt={inputText} // Pass current input
        guestConversationData={{
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          messageCount: messages.length,
        }}
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

      {/* Context Picker Sheet */}
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

      <ChatSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        onSelectConversation={(c: Conversation) => {
          selectConversation(c.id);
          setSearchOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

export default function GuestChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string; q?: string }>();

  return (
    <GuestChatProvider initialConversationId={params.conversationId}>
      <GuestChatContent />
    </GuestChatProvider>
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
    justifyContent: 'space-between',
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
  creditsIndicator: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100, // Pill shape
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  creditsExhausted: {
    color: theme.colors.accent.error,
  },
  keyboardView: {
    flex: 1,
  },
  // Empty state centered layout
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
  // Messages layout
  contentArea: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
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
  loadingMore: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
