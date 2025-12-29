/**
 * Authenticated Chat Screen
 * Full chat experience for logged-in users
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Menu, Plus, AlertCircle, RotateCcw } from 'lucide-react-native';

import { ChatProvider, useChatContext } from '../src/lib/contexts/ChatContext';
import { useAuth } from '../src/lib/auth';
import { theme } from '../src/lib/theme';
import { 
  AuthenticatedChatInput,
  MessageList,
  ContextPickerSheet,
  SubChatSheet,
  MessageItem,
  type ContextItem 
} from '../src/components/chat';
import { AppSidebar } from '../src/components/sidebar/AppSidebar';
import { useGuestSubChats } from '../src/lib/hooks/useGuestSubChats';
import type { Message, Conversation, SurfaceMode } from '../src/lib/types';

function ChatContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
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
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const [surfaceMode, setSurfaceMode] = useState<any>('chat'); // TODO: import SurfaceMode type

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/guest-chat');
    }
  }, [isAuthenticated, router]);

  // Handle send
  const handleSend = useCallback((content: string) => {
    // Handle Surface generation (Wiki/Quiz)
    if (surfaceMode && (surfaceMode === 'wiki' || surfaceMode === 'quiz')) {
      router.push({
        pathname: '/surface',
        params: { type: surfaceMode, query: content, conversationId: currentConversationId }
      });
      setQuotedMessage(null);
      setSelectedContext([]);
      return;
    }

    let finalContent = content;
    
    // Prepend quote if present
    if (quotedMessage) {
      const quoteLines = quotedMessage.quotedText.split('\n').map((line: string) => `> ${line}`).join('\n');
      finalContent = `${quoteLines}\n\n${content}`;
    }
    
    // Referenced conversations
    const referencedConversations = selectedContext.map(item => ({ id: item.id, title: item.title }));

    sendMessage(finalContent, referencedConversations);
    setQuotedMessage(null);
    setSelectedContext([]);
  }, [sendMessage, quotedMessage, selectedContext, surfaceMode, currentConversationId]);

  // Handle deep dive (for sub-chats)
  const handleDeepDive = useCallback((text: string, messageId: string, role: 'user' | 'assistant', fullContent: string) => {
    handleOpenSubChat(text, messageId, role, fullContent);
  }, [handleOpenSubChat]);

  // Handle quote from message
  const handleQuote = useCallback((messageId: string, text: string, role: 'user' | 'assistant') => {
    setQuotedMessage({ messageId, quotedText: text, authorRole: role });
  }, []);

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
      />
    );
  }, [messages.length, streamingMessageId, streamingContent, statusPills, searchResults, handleQuote, handleDeepDive, subChats, handleOpenExistingSubChat]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createNewChat();
  }, [createNewChat]);

  if (!isAuthenticated) return null;

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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isSending}
          streamingMessageId={streamingMessageId}
          streamingContent={streamingContent}
          statusPills={statusPills}
          searchResults={searchResults}
          renderMessage={renderMessage}
          // onRetry...
        />

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

        {/* Input */}
        <AuthenticatedChatInput
          onSend={handleSend}
          isLoading={isSending}
          quotedMessage={quotedMessage}
          onClearQuote={() => setQuotedMessage(null)}
          showContextPicker={conversations.length > 0}
          onAddContext={() => setContextPickerOpen(true)}
          contextItems={selectedContext}
          onRemoveContext={(id: string) => setSelectedContext(prev => prev.filter(p => p.id !== id))}
          surfaceMode={surfaceMode}
          onSurfaceModeChange={setSurfaceMode}
          // onAttach...
        />
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <AppSidebar
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
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
      
    </SafeAreaView>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();

  return (
    <ChatProvider initialConversationId={params.conversationId}>
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
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
});

