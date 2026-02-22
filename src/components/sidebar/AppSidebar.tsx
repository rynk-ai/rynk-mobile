import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  SectionList,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
  Animated,
} from 'react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  LogOut,
  User,
  Settings,
  X,
  Search,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Folder
} from 'lucide-react-native';
import { TextInput, Keyboard } from 'react-native';
import { theme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useChatContext } from '../../lib/contexts/ChatContext';
import type { Conversation } from '../../lib/types';
import { ConversationListItem } from './ConversationListItem';
import { FolderListItem } from './FolderListItem';
import { ProjectListItem } from './ProjectListItem';
import { UserMenu } from './UserMenu';
import { ConversationMenu } from './ConversationMenu';
import { FolderCreationModal } from './FolderCreationModal';
import { RenameConversationModal } from './RenameConversationModal';
import { AddToFolderModal } from './AddToFolderModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: () => void;
}

export function AppSidebar({ isOpen, onClose, onSearch }: AppSidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    conversations,
    folders,
    projects,
    currentConversationId,
    selectConversation,
    createNewChat,
    togglePin,
    deleteConversation,
    // isLoadingConversations,
  } = useChatContext();

  // Section Header Component with Animation
  function CollapsibleSection({
    title,
    expanded,
    onToggle,
    children
  }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children?: React.ReactNode
  }) {
    const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(rotateAnim, {
        toValue: expanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [expanded]);

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'], // Right (0) to Down (90)
    });

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronRight size={14} color={theme.colors.text.tertiary} />
          </Animated.View>
        </TouchableOpacity>
        {expanded && children}
      </View>
    );
  }

  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(true);

  // Track which folders are individually expanded
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };

  const toggleFolderExpand = useCallback((folderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [menuConversation, setMenuConversation] = useState<Conversation | null>(null);

  const handleShowMenu = useCallback((c: Conversation) => {
    setMenuConversation(c);
  }, []);

  // Handlers for menu actions
  const handleTogglePin = useCallback((id: string) => {
    // Already implemented as togglePin
    togglePin(id);
  }, [togglePin]);

  const handleDeleteConversation = useCallback((id: string) => {
    // Show confirmation
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(id);
              // Close menu if open
              setMenuConversation(null);
            } catch (error) {
              console.error('Failed to delete', error);
            }
          }
        }
      ]
    );
  }, [deleteConversation]);

  const handleRename = useCallback((id: string) => {
    setActionConversationId(id);
    setIsRenameModalVisible(true);
  }, []);

  const handleAddToFolder = useCallback((id: string) => {
    setActionConversationId(id);
    setIsAddToFolderModalVisible(true);
  }, []);

  const handleEditTags = useCallback((id: string) => {
    // Placeholder
    console.log('Edit tags for', id);
  }, []);

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
    if (id === currentConversationId) {
      onClose();
      return;
    }
    selectConversation(id);
    onClose();
  };

  const handleSelectProject = (projectId: string) => {
    onClose();
    // Use timeout to allow drawer to close smoothly
    setTimeout(() => {
      router.push({ pathname: '/project/[id]', params: { id: projectId } });
    }, 300);
  };

  const handleSearch = () => {
    onClose();
    // Small delay to allow drawer to close smoothy
    setTimeout(() => {
      onSearch();
    }, 300);
  }


  // Folder Modal State
  const { deleteFolder } = useChatContext();
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<any>(null); // Replace any with proper type

  // New States
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isAddToFolderModalVisible, setIsAddToFolderModalVisible] = useState(false);
  const [actionConversationId, setActionConversationId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewFolder = () => {
    setFolderToEdit(null);
    setIsFolderModalVisible(true);
    setFoldersExpanded(true);
  }

  const handleEditFolder = (folder: any) => {
    setFolderToEdit(folder);
    setIsFolderModalVisible(true);
  }

  const handleFolderContextMenu = (folder: any) => {
    Alert.alert(
      folder.name,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => handleEditFolder(folder)
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Folder',
              `Are you sure you want to delete "${folder.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteFolder(folder.id)
                }
              ]
            );
          }
        }
      ]
    );
  };

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const tierLabel = user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';

  const sections = useMemo(() => {
    const s = [];
    if (pinnedConversations.length > 0) {
      s.push({
        title: 'Pinned',
        data: pinnedExpanded ? pinnedConversations : [],
        expanded: pinnedExpanded,
        onToggle: () => toggleSection(setPinnedExpanded)
      });
    }
    if (recentConversations.length > 0) {
      s.push({
        title: 'Today',
        data: recentExpanded ? recentConversations : [],
        expanded: recentExpanded,
        onToggle: () => toggleSection(setRecentExpanded)
      });
    }
    if (olderConversations.length > 0) {
      s.push({
        title: 'Previous 7 Days',
        data: olderExpanded ? olderConversations : [],
        expanded: olderExpanded,
        onToggle: () => toggleSection(setOlderExpanded)
      });
    }
    return s;
  }, [
    pinnedConversations,
    recentConversations,
    olderConversations,
    pinnedExpanded,
    recentExpanded,
    olderExpanded
  ]);

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => {
          if (isUserDropdownOpen) setIsUserDropdownOpen(false);
          else onClose();
        }}
      />

      <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
        {/* User Profile Header */}
        <View style={[styles.header, { zIndex: 201 }]}>
          <TouchableOpacity
            style={styles.userSection}
            activeOpacity={0.8}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setIsUserDropdownOpen(!isUserDropdownOpen);
            }}
          >
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
          </TouchableOpacity>
        </View>

        {/* User Menu (Accordion) - Pushes content down */}
        {isUserDropdownOpen && (
          <UserMenu
            user={user}
            onSignOut={handleSignOut}
          />
        )}

        {/* Action Toolbar (Search + New) */}
        <View style={styles.actionToolbar}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <Search size={14} color={theme.colors.text.tertiary} />
            <Text style={styles.searchText}>Search</Text>
            <View style={styles.commandShortcut}>
              <Text style={styles.commandText}>⌘K</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionIcons}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={handleNewFolder}
              activeOpacity={0.7}
            >
              <FolderPlus size={16} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={handleNewChat}
            >
              <Plus size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={handleNewFolder}
            >
              <FolderPlus size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <SectionList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <CollapsibleSection
              title={section.title}
              expanded={section.expanded}
              onToggle={section.onToggle}
            />
          )}
          renderItem={({ item: c }) => (
            <ConversationListItem
              conversation={c}
              isActive={currentConversationId === c.id}
              onSelect={handleSelectConversation}
              onShowMenu={handleShowMenu}
            />
          )}
          ListHeaderComponent={
            <>
              {/* Projects */}
              {projects.length > 0 && (
                <View style={styles.section}>
                  {/* <Text style={styles.sectionTitle}>Projects</Text> */}
                  {projects.map(p => (
                    <ProjectListItem
                      key={p.id}
                      project={p}
                      onSelect={() => handleSelectProject(p.id)}
                    />
                  ))}
                </View>
              )}

              {/* Folders */}
              {folders.length > 0 && (
                <CollapsibleSection
                  title="Folders"
                  expanded={foldersExpanded}
                  onToggle={() => toggleSection(setFoldersExpanded)}
                >
                  {folders.map(folder => {
                    const isExpanded = expandedFolders.has(folder.id);
                    return (
                      <View key={folder.id}>
                        <FolderListItem
                          folder={folder}
                          itemCount={folder.conversationIds?.length || 0}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleFolderExpand(folder.id)}
                          onLongPress={() => handleFolderContextMenu(folder)}
                        />
                        {isExpanded && folder.conversationIds?.map(convId => {
                          const conv = conversations.find(c => c.id === convId);
                          if (!conv) return null;
                          return (
                            <View key={`folder-conv-${folder.id}-${conv.id}`} style={{ paddingLeft: 16 }}>
                              <ConversationListItem
                                conversation={conv}
                                isActive={currentConversationId === conv.id}
                                onSelect={handleSelectConversation}
                                onShowMenu={handleShowMenu}
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </CollapsibleSection>
              )}
            </>
          }
        />

        {/* Conversation Menu Overlay */}
        <ConversationMenu
          visible={!!menuConversation}
          conversation={menuConversation}
          onClose={() => setMenuConversation(null)}
          onTogglePin={handleTogglePin}
          onDelete={handleDeleteConversation}
          onRename={handleRename}
          onAddToFolder={handleAddToFolder}
          onEditTags={handleEditTags}
        />

        {/* Folder Modal */}
        <FolderCreationModal
          visible={isFolderModalVisible}
          onClose={() => setIsFolderModalVisible(false)}
          folder={folderToEdit}
        />

        {/* Rename Modal */}
        <RenameConversationModal
          visible={isRenameModalVisible}
          onClose={() => {
            setIsRenameModalVisible(false);
            setActionConversationId(null);
          }}
          conversationId={actionConversationId}
          currentTitle={conversations.find(c => c.id === actionConversationId)?.title || ''}
        />

        {/* Add To Folder Modal */}
        <AddToFolderModal
          visible={isAddToFolderModalVisible}
          onClose={() => {
            setIsAddToFolderModalVisible(false);
            setActionConversationId(null);
          }}
          conversationId={actionConversationId}
        />

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
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg, // Sharp
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg, // Sharp
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
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: theme.colors.accent.primary + '15',
    borderRadius: 2, // Tiny rounding ok
  },
  tierText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.accent.primary,
  },
  closeButton: {
    padding: 4,
  },

  // Action Toolbar Styles
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.secondary + '80', // 50% opacity
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.lg, // Sharp
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  commandShortcut: {
    backgroundColor: theme.colors.background.primary + '50',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  commandText: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg, // Sharp
    backgroundColor: 'transparent', // Ghost
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    marginBottom: 4,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
