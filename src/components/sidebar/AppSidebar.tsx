import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
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
  ChevronRight
} from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useChatContext } from '../../lib/contexts/ChatContext';
import type { Conversation } from '../../lib/types';
import { ConversationListItem } from './ConversationListItem';
import { FolderListItem } from './FolderListItem';
import { ProjectListItem } from './ProjectListItem';
import { UserMenu } from './UserMenu';
import { ConversationMenu } from './ConversationMenu';

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
    children: React.ReactNode 
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

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };
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
     Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
             deleteConversation(id);
             if (currentConversationId === id) {
                // Navigate away or clear? user navigates usually
             }
          }
        }
      ]
    );
  }, [deleteConversation, currentConversationId]);

  const handleRename = (id: string) => {
      Alert.alert("Coming Soon", "Rename feature is under development.");
  };

  const handleAddToFolder = (id: string) => {
      Alert.alert("Coming Soon", "Add to Folder feature is under development.");
  };

  const handleEditTags = (id: string) => {
      Alert.alert("Coming Soon", "Edit Tags feature is under development.");
  };

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
  
  const handleSelectProject = () => {
    Alert.alert("Coming Soon", "Project view is under development.");
  };

  const handleSearch = () => {
     Alert.alert("Coming Soon", "Search is under development.");
  }
  
  const handleNewFolder = () => {
     Alert.alert("Coming Soon", "Folder creation is under development.");
  }

  if (!isOpen) return null;

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'User';
  const tierLabel = user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';

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

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={[]} 
          renderItem={() => null} 
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
                      onSelect={handleSelectProject}
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
                   {folders.map(f => (
                     <FolderListItem
                       key={f.id}
                       folder={f}
                       itemCount={f.conversationIds.length}
                       isExpanded={true}
                       onToggleExpand={() => {}} 
                     />
                   ))}
                </CollapsibleSection>
              )}
              
              {/* Pinned */}
              {pinnedConversations.length > 0 && (
                <CollapsibleSection 
                  title="Pinned" 
                  expanded={pinnedExpanded} 
                  onToggle={() => toggleSection(setPinnedExpanded)}
                >
                  {pinnedConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                      onShowMenu={handleShowMenu}
                    />
                  ))}
                </CollapsibleSection>
              )}
              
              {/* Recent */}
              {recentConversations.length > 0 && (
                <CollapsibleSection 
                  title="Today" 
                  expanded={recentExpanded} 
                  onToggle={() => toggleSection(setRecentExpanded)}
                >
                  {recentConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                      onShowMenu={handleShowMenu}
                    />
                  ))}
                </CollapsibleSection>
              )}

              {/* Older */}
              {olderConversations.length > 0 && (
                <CollapsibleSection 
                  title="Previous 7 Days" 
                  expanded={olderExpanded} 
                  onToggle={() => toggleSection(setOlderExpanded)}
                >
                  {olderConversations.map(c => (
                    <ConversationListItem 
                      key={c.id} 
                      conversation={c} 
                      isActive={currentConversationId === c.id}
                      onSelect={handleSelectConversation}
                      onShowMenu={handleShowMenu}
                    />
                  ))}
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
});
