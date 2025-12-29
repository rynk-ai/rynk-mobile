import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  LogIn, 
  LogOut, 
  MessageSquare, 
  User,
} from 'lucide-react-native';
import { theme } from '../lib/theme';
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
  // Auth props
  isAuthenticated?: boolean;
  user?: {
    email?: string;
    name?: string | null;
    image?: string | null;
    credits?: number;
    subscriptionTier?: string;
  } | null;
  onSignOut?: () => void;
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
  isAuthenticated = false,
  user = null,
  onSignOut,
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

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
    onClose();
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

  // Get user display info
  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const tierLabel = user?.subscriptionTier === 'pro' ? 'Pro' : user?.subscriptionTier === 'enterprise' ? 'Enterprise' : 'Free';

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
        {/* Header - Auth Aware */}
        <View style={styles.header}>
          {isAuthenticated && user ? (
            // Authenticated User Header
            <>
              <View style={styles.userSection}>
                <View style={styles.avatarContainer}>
                  {user.image ? (
                    <Image source={{ uri: user.image }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={20} color={theme.colors.text.secondary} />
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {userDisplayName}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierText}>{tierLabel}</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
                activeOpacity={0.8}
              >
                <LogOut size={16} color={theme.colors.text.secondary} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Guest Header
            <>
              <View style={styles.brandHeader}>
                <Text style={styles.brandText}>rynk.</Text>
              </View>
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
            </>
          )}
        </View>

        {/* New Chat Button */}
        <View style={styles.newChatSection}>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus size={18} color={theme.colors.text.primary} />
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
                  <View style={[
                    styles.conversationIcon,
                    currentConversationId === conv.id && styles.conversationIconActive,
                  ]}>
                    <MessageSquare 
                      size={14} 
                      color={currentConversationId === conv.id 
                        ? theme.colors.text.primary 
                        : theme.colors.text.tertiary
                      } 
                    />
                  </View>
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
              <View style={styles.emptyIconContainer}>
                <MessageSquare size={24} color={theme.colors.text.tertiary} />
              </View>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
            </View>
          }
        />

        {/* Footer - Only show for guests */}
        {!isAuthenticated && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Sign in to save your chats permanently
            </Text>
          </View>
        )}
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
    backgroundColor: theme.colors.background.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  // Brand header for guests
  brandHeader: {
    marginBottom: 12,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -1,
  },
  // Guest header styles
  creditsSection: {
    marginBottom: 16,
  },
  creditsLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  creditsValue: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  signInText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  // Authenticated header styles
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  tierBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: theme.colors.accent.primary + '20',
    borderRadius: 6,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  // Rest of styles
  newChatSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  conversationItemActive: {
    backgroundColor: theme.colors.background.secondary,
  },
  conversationIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationIconActive: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  conversationTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  conversationTitleActive: {
    fontWeight: '500',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default GuestDrawer;
