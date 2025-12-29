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
import type { Conversation, Folder } from '../lib/types';
import { ChevronDown, ChevronRight, Folder as FolderIcon, Pin, MoreVertical, Pencil, Trash2, FolderInput } from 'lucide-react-native';
import { InputDialog } from './InputDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface GuestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  folders?: Folder[];
  onTogglePin?: (id: string) => void;

  onCreateFolder?: (name: string) => void;
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
  folders = [],
  currentConversationId,
  onSelectConversation,
  creditsRemaining,
  onRefresh,
  isLoading = false,
  isAuthenticated = false,
  user = null,
  onSignOut,
  onTogglePin,
  onCreateFolder,
}: GuestDrawerProps) {
  const router = useRouter();
  const [foldersExpanded, setFoldersExpanded] = React.useState(true);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = React.useState(false);

  // Handlers
  const handleCreateFolder = (name: string) => {
    onCreateFolder?.(name);
    setIsFolderDialogOpen(false);
  };

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


        {/* Pinned Conversations */}
        {conversations.some(c => c.isPinned) && (
          <View style={styles.pinnedSection}>
             <Text style={styles.sectionHeader}>Pinned</Text>
             {conversations.filter(c => c.isPinned).map(conv => (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.conversationItem,
                    currentConversationId === conv.id && styles.conversationItemActive,
                  ]}
                  onPress={() => handleSelectConversation(conv.id)}
                >
                  <View style={[
                    styles.conversationIcon,
                    currentConversationId === conv.id && styles.conversationIconActive,
                  ]}>
                    <Pin size={12} color={theme.colors.accent.primary} fill={theme.colors.accent.primary} />
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

        {/* Folders Section */}
        <View style={styles.foldersSection}>
          <TouchableOpacity 
            style={styles.foldersHeader} 
            onPress={() => setFoldersExpanded(!foldersExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.foldersTitleRow}>
              {foldersExpanded ? (
                <ChevronDown size={14} color={theme.colors.text.tertiary} />
              ) : (
                <ChevronRight size={14} color={theme.colors.text.tertiary} />
              )}
              <Text style={styles.sectionHeader}>Folders</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsFolderDialogOpen(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Plus size={14} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
          
          {foldersExpanded && (
            <View style={styles.foldersList}>
              {folders.length === 0 ? (
                 <Text style={styles.emptyFoldersText}>No folders yet</Text>
              ) : (
                folders.map(folder => (
                  <TouchableOpacity
                    key={folder.id}
                    style={styles.folderItem}
                    // onPress={() => handleSelectFolder(folder.id)} // TODO: Implement folder selection/view
                  >
                    <FolderIcon size={14} color={theme.colors.text.tertiary} />
                    <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
                    <Text style={styles.folderCount}>{folder.conversationIds.length}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
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
              {group.data.filter(c => !c.isPinned).map((conv) => (
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

      {/* Dialogs */}
      <InputDialog
        visible={isFolderDialogOpen}
        onClose={() => setIsFolderDialogOpen(false)}
        onSubmit={handleCreateFolder}
        title="New Folder"
        placeholder="Folder name"
        submitLabel="Create"
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly lighter backdrop
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: theme.colors.background.primary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.subtle,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1, // Softer shadow
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    padding: 16, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  // Brand header for guests
  brandHeader: {
    marginBottom: 8,
  },
  brandText: {
    fontSize: 24, // Smaller brand text
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -1,
  },
  // Guest header styles
  creditsSection: {
    marginBottom: 12,
  },
  creditsLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  creditsValue: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontSize: 13,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 10, // Compact button
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  // Authenticated header styles
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40, // Smaller avatar
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  userEmail: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  tierBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.accent.primary + '15',
    borderRadius: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  // Rest of styles
  newChatSection: {
    padding: 12, // Compact padding
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  newChatText: {
    fontSize: 14, // Smaller
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  group: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 10, // Smaller section header
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    opacity: 0.8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Very compact
    paddingHorizontal: 16,
    marginHorizontal: 8, // Inset look
    borderRadius: 6,
  },
  conversationItemActive: {
    backgroundColor: theme.colors.background.secondary,
  },
  conversationIcon: {
    width: 24, // Smaller icon box
    height: 24,
    borderRadius: 6,
    backgroundColor: 'transparent', // Transparent by default
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  conversationIconActive: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  conversationTitle: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary, // Default to secondary
  },
  conversationTitleActive: {
    fontWeight: '500',
    color: theme.colors.text.primary, // Primary when active
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
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
    lineHeight: 16,
  },
  // New Styles
  pinnedSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  foldersSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  foldersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  foldersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foldersList: {
    paddingTop: 4,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 28, // Indented
    gap: 8,
  },
  folderName: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  folderCount: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  emptyFoldersText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    paddingLeft: 28,
    paddingVertical: 4,
  },
});

export default GuestDrawer;
