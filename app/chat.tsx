/**
 * Authenticated Chat Screen
 * Full chat experience for logged-in users
 */

import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Menu, Plus, AlertCircle, RotateCcw, User, LogOut } from 'lucide-react-native';

import { ChatProvider, useChatContext } from '../src/lib/contexts/ChatContext';
import { 
  MessageItem, 
  ChatInput, 
  EmptyStateChat, 
  ContextPickerSheet, 
  type StatusPill, 
  type QuotedMessage,
  type ContextItem 
} from '../src/components/chat';
import { useAuth } from '../src/lib/auth';
import { theme } from '../src/lib/theme';
import type { Message, Conversation } from '../src/lib/types';

const { width } = Dimensions.get('window');

// Drawer component for authenticated users
function AuthDrawer({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  isLoading,
  user,
  onSignOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewChat: () => void;
  isLoading: boolean;
  user: any;
  onSignOut: () => void;
}) {
  if (!isOpen) return null;

  return (
    <View style={drawerStyles.overlay}>
      <TouchableOpacity 
        style={drawerStyles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={drawerStyles.drawer}>
        {/* Header */}
        <View style={drawerStyles.header}>
          <Text style={drawerStyles.headerTitle}>Chats</Text>
          <TouchableOpacity onPress={onNewChat} style={drawerStyles.newButton}>
            <Plus size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Conversation List */}
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                drawerStyles.conversationItem,
                item.id === currentConversationId && drawerStyles.conversationItemActive
              ]}
              onPress={() => {
                onSelectConversation(item.id);
                onClose();
              }}
            >
              <Text 
                style={drawerStyles.conversationTitle} 
                numberOfLines={1}
              >
                {item.title || 'New Chat'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={drawerStyles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* User Footer */}
        <View style={drawerStyles.footer}>
          <View style={drawerStyles.userInfo}>
            <User size={16} color={theme.colors.accent.primary} />
            <Text style={drawerStyles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <TouchableOpacity onPress={onSignOut} style={drawerStyles.signOutButton}>
            <LogOut size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ChatContent() {
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuth();
  
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
    userCredits,
    selectConversation,
    sendMessage,
    createNewChat,
    loadConversations,
    clearError,
    isLoadingConversations,
  } = useChatContext();

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<QuotedMessage | null>(null);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ContextItem[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Redirect to guest-chat if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/guest-chat' as any);
    }
  }, [isAuthenticated, router]);

  // Handle send with quote and context support
  const handleSend = useCallback((content: string) => {
    let finalContent = content;
    
    // Prepend quote if present
    if (quotedMessage) {
      const quoteLines = quotedMessage.quotedText.split('\n').map(line => `> ${line}`).join('\n');
      finalContent = `${quoteLines}\n\n${content}`;
    }
    
    // Build referencedConversations with id and title
    const referencedConversations = selectedContext.length > 0 
      ? selectedContext.map(item => ({ id: item.id, title: item.title })) 
      : undefined;
    
    sendMessage(finalContent, referencedConversations);
    setQuotedMessage(null);
    setSelectedContext([]);
  }, [sendMessage, quotedMessage, selectedContext]);

  // Handle quote from message
  const handleQuote = useCallback((messageId: string, text: string, role: 'user' | 'assistant') => {
    setQuotedMessage({ messageId, quotedText: text, authorRole: role });
  }, []);

  // Handle clear quote
  const handleClearQuote = useCallback(() => {
    setQuotedMessage(null);
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createNewChat();
    setDrawerOpen(false);
  }, [createNewChat]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/guest-chat' as any);
  }, [signOut, router]);

  // Render message
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isLastMessage = index === messages.length - 1;
    const isThisStreaming = item.id === streamingMessageId;

    return (
      <MessageItem
        message={item}
        isStreaming={isThisStreaming}
        streamingContent={streamingContent}
        statusPills={isThisStreaming ? statusPills : []}
        searchResults={isThisStreaming ? searchResults : null}
        isLastMessage={isLastMessage}
        onQuote={handleQuote}
      />
    );
  }, [messages.length, streamingMessageId, streamingContent, statusPills, searchResults, handleQuote]);

  // Empty state
  const EmptyState = useMemo(() => () => (
    <View style={styles.emptyState}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandName}>rynk.</Text>
        <Text style={styles.brandTagline}>What would you like to explore today?</Text>
      </View>
    </View>
  ), []);

  if (!isAuthenticated) {
    return null;
  }

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        {messages.length === 0 && !isSending ? (
          <EmptyState />
        ) : (
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
          />
        )}

        {/* Error */}
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
        <ChatInput 
          onSend={handleSend} 
          isLoading={isSending}
          quotedMessage={quotedMessage}
          onClearQuote={handleClearQuote}
          showContextPicker={conversations.length > 1}
          onAddContext={() => setContextPickerOpen(true)}
          contextItems={selectedContext}
          onRemoveContext={(id) => setSelectedContext(prev => prev.filter(item => item.id !== id))}
        />
      </KeyboardAvoidingView>

      {/* Drawer */}
      <AuthDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        isLoading={isLoadingConversations}
        user={user}
        onSignOut={handleSignOut}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 56,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -2,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.accent.error,
  },
  retryButton: {
    padding: 4,
  },
});

const drawerStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: theme.colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  newButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  list: {
    padding: 8,
  },
  conversationItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 4,
  },
  conversationItemActive: {
    backgroundColor: theme.colors.background.secondary,
  },
  conversationTitle: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  signOutButton: {
    padding: 8,
  },
});
