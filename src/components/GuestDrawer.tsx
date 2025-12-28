import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, LogIn, MessageSquare, Clock, X } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { guestApi } from '../lib/api/guest';
import type { Conversation } from '../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface GuestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  creditsRemaining: number | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function GuestDrawer({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  creditsRemaining,
  onRefresh,
  isLoading = false,
}: GuestDrawerProps) {
  const router = useRouter();

  const handleNewChat = () => {
    onSelectConversation(null);
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const handleSignIn = () => {
    onClose();
    router.push('/login');
  };

  const formatDate = (dateString: string | number) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Group conversations by time
  const groupedConversations = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const lastWeek = new Date(today.getTime() - 604800000);

    const groups: { title: string; data: Conversation[] }[] = [
      { title: 'Today', data: [] },
      { title: 'Yesterday', data: [] },
      { title: 'Last 7 Days', data: [] },
      { title: 'Older', data: [] },
    ];

    conversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt || conv.createdAt);
      if (convDate >= today) {
        groups[0].data.push(conv);
      } else if (convDate >= yesterday) {
        groups[1].data.push(conv);
      } else if (convDate >= lastWeek) {
        groups[2].data.push(conv);
      } else {
        groups[3].data.push(conv);
      }
    });

    return groups.filter((g) => g.data.length > 0);
  }, [conversations]);

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      {/* Drawer */}
      <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
        {/* Header with credits */}
        <View style={styles.header}>
          <View style={styles.creditsSection}>
            <Text style={styles.creditsLabel}>
              {creditsRemaining !== null ? (
                <>
                  <Text style={styles.creditsValue}>{creditsRemaining}</Text> free messages remaining
                </>
              ) : (
                'Try our AI chat for free!'
              )}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <LogIn size={16} color={theme.colors.text.inverse} />
            <Text style={styles.signInText}>Sign in to continue</Text>
          </TouchableOpacity>
        </View>

        {/* New Chat Button */}
        <View style={styles.newChatSection}>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus size={18} color={theme.colors.text.secondary} />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Conversation List */}
        <FlatList
          data={groupedConversations}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={isLoading}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.data.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.conversationItem,
                    currentConversationId === conv.id && styles.conversationItemActive,
                  ]}
                  onPress={() => handleSelectConversation(conv.id)}
                  activeOpacity={0.6}
                >
                  <Text 
                    style={[
                      styles.conversationTitle,
                      currentConversationId === conv.id && styles.conversationTitleActive,
                    ]} 
                    numberOfLines={1}
                  >
                    {conv.title || 'Untitled Chat'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MessageSquare size={32} color={theme.colors.text.tertiary} />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
            </View>
          }
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sign in to save your chats permanently
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: theme.colors.background.card,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.subtle,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  creditsSection: {
    marginBottom: 12,
  },
  creditsLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  creditsValue: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  newChatSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingVertical: 8,
  },
  group: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  conversationItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  conversationItemActive: {
    backgroundColor: theme.colors.background.secondary,
  },
  conversationTitle: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  conversationTitleActive: {
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default GuestDrawer;
