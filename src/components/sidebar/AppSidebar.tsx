import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Plus, 
  LogOut, 
  User,
  Settings,
  X 
} from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useChatContext } from '../../lib/contexts/ChatContext';
import { ConversationListItem } from './ConversationListItem';
import { FolderListItem } from './FolderListItem';
import { ProjectListItem } from './ProjectListItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    folders,
    projects,
    currentConversationId, 
    selectConversation, 
    createNewChat,
    // isLoadingConversations,
  } = useChatContext();

  const [foldersExpanded, setFoldersExpanded] = useState(true);

  // Filter conversations
  const pinnedConversations = useMemo(() => 
    conversations.filter(c => c.isPinned), 
  [conversations]);

  const recentConversations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return conversations.filter(c => !c.isPinned && new Date(c.updatedAt) >= today);
  }, [conversations]);

  const olderConversations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return conversations.filter(c => !c.isPinned && new Date(c.updatedAt) < today);
  }, [conversations]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.replace('/login');
  };

  const handleNewChat = () => {
    createNewChat();
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    // If selecting current conversation, just close drawer
    if (id === currentConversationId) {
      onClose();
      return;
    }
    selectConversation(id);
    onClose();
  };

  if (!isOpen) return null;

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const tierLabel = user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
        {/* User Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.userSection} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
              {user?.image ? (
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
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{tierLabel}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
               <X size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* New Chat Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus size={16} color={theme.colors.text.primary} />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={[]} // Main list is mixed, so we use ListHeaderComponent/ListFooterComponent or manual render
          renderItem={() => null} 
          ListHeaderComponent={
            <>
              {/* Projects */}
              {projects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Projects</Text>
                  {projects.map(p => (
                    <ProjectListItem 
                      key={p.id} 
                      project={p} 
                      // isActive={...} 
                      // onSelect={() => ...}
                    />
                  ))}
                </View>
              )}

              {/* Pinned */}
              {pinnedConversations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pinned</Text>
                  {pinnedConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                    />
                  ))}
                </View>
              )}

              {/* Folders */}
              {folders.length > 0 && (
                <View style={styles.section}>
                   <Text style={styles.sectionTitle}>Folders</Text>
                   {folders.map(f => (
                     <FolderListItem
                       key={f.id}
                       folder={f}
                       itemCount={f.conversationIds.length}
                       isExpanded={foldersExpanded} // Simplified global expand for now or individual state
                       // onToggleExpand={() => ...}
                     />
                   ))}
                </View>
              )}
              
              {/* Recent */}
              {recentConversations.length > 0 && (
                 <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Today</Text>
                  {recentConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                    />
                  ))}
                 </View>
              )}

              {/* Older */}
              {olderConversations.length > 0 && (
                 <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Previous 7 Days</Text>
                  {olderConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                    />
                  ))}
                 </View>
              )}
            </>
          }
        />

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerItem} 
            onPress={handleSignOut}
          >
            <LogOut size={18} color={theme.colors.text.secondary} />
            <Text style={styles.footerText}>Sign Out</Text>
          </TouchableOpacity>
           <TouchableOpacity 
            style={styles.footerItem} 
            // onPress={() => router.push('/settings')}
          >
            <Settings size={18} color={theme.colors.text.secondary} />
            <Text style={styles.footerText}>Settings</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
      ios: { shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  tierBadge: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: theme.colors.accent.primary + '15',
    borderRadius: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  closeButton: {
    padding: 4,
  },
  actionSection: {
    padding: 12,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newChatText: {
    color: theme.colors.background.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
