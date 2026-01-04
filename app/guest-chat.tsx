/**
 * Guest Chat Screen
 * Chat experience for unauthenticated users with quote reply support
 */

import React, { useCallback, useRef, useState } from 'react';
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
import { Menu, Plus, AlertCircle, RotateCcw } from 'lucide-react-native';

import { GuestChatProvider, useGuestChatContext } from '../src/lib/contexts/GuestChatContext';
import { MessageItem, ChatInput, EmptyStateChat, SubChatSheet, ContextPickerSheet, type StatusPill, type QuotedMessage, type ContextItem } from '../src/components/chat';
import { useGuestSubChats } from '../src/lib/hooks/useGuestSubChats';
import { GuestDrawer } from '../src/components/GuestDrawer';
import { SignInModal } from '../src/components/SignInModal';
import { theme } from '../src/lib/theme';
import type { Message, SurfaceMode } from '../src/lib/types';

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
  const [quotedMessage, setQuotedMessage] = useState<QuotedMessage | null>(null);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
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

  // Determine if we're in empty state
  const isEmptyState = messages.length === 0 && !isSending;

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
    
    // Handle Surface generation (all non-chat surfaces)
    if (surfaceMode && surfaceMode !== 'chat') {
      router.push({
        pathname: '/guest-surface',
        params: { type: surfaceMode, query: content }
      });
      setPendingPrompt('');
      setSelectedContext([]);
      return;
    }

    console.log('[handleSend] Calling sendMessage with referencedConversations:', referencedConversations?.length || 0);
    sendMessage(finalContent, referencedConversations, surfaceMode);
    setPendingPrompt('');
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
          activeOpacity={0.7}
        >
          <Menu size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentConversationId ? 'Chat' : 'rynk.'}
        </Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Credits indicator */}
      {creditsRemaining !== null && (
        <View style={styles.creditsBar}>
          <Text style={[
            styles.creditsText,
            isCreditsExhausted && styles.creditsExhausted
          ]}>
            {isCreditsExhausted ? 'Credits exhausted' : `${creditsRemaining} credits left`}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Empty State - Centered layout with brand and input */}
        {isEmptyState ? (
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
                showContextPicker={conversations.length > 0}
                onAddContext={() => setContextPickerOpen(true)}
                contextItems={selectedContext}
                onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(item => item.id !== id))}
                surfaceMode={surfaceMode}
                onSurfaceModeChange={setSurfaceMode}
                isGuest={true}
                onShowSignIn={() => setShowSignInModal(true)}
              />
            </View>
          </View>
        ) : (
          <>
            {/* Messages list */}
            <View style={styles.contentArea}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  if (isStreaming || isSending) {
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
              quotedMessage={quotedMessage}
              onClearQuote={handleClearQuote}
              showContextPicker={conversations.length > 1}
              onAddContext={() => setContextPickerOpen(true)}

              contextItems={selectedContext}
              onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(item => item.id !== id))}
              surfaceMode={surfaceMode}
              onSurfaceModeChange={setSurfaceMode}
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
        onSignOut={() => {}}
      />

      {/* Sign In Modal */}
      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        isBlocking={isCreditsExhausted}
        creditsRemaining={creditsRemaining}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
  },
  creditsBar: {
    paddingHorizontal: 16,
    paddingVertical: 6, // Compact
    backgroundColor: theme.colors.background.secondary,
  },
  creditsText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
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
