import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import { 
  Pin, 
  BookOpen, 
  ListChecks, 
  Target, 
  Scale, 
  Files, 
  Calendar, 
  TrendingUp, 
  Search,
  Hash,
  MoreHorizontal
} from 'lucide-react-native';
import type { Conversation } from '../../lib/types';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onShowMenu?: (conversation: Conversation) => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onTogglePin,
  onShowMenu,
}: ConversationListItemProps) {
  const hasTags = conversation.tags && conversation.tags.length > 0;
  // @ts-ignore - surfaceStates might not be in the type yet
  const surfaceStates = (conversation as any).surfaceStates;
  
  const surfaceConfigs: Record<string, { icon: any, color: string }> = {
    learning: { icon: BookOpen, color: '#3b82f6' }, // blue-500
    guide: { icon: ListChecks, color: '#22c55e' }, // green-500
    quiz: { icon: Target, color: '#ec4899' }, // pink-500
    comparison: { icon: Scale, color: '#6366f1' }, // indigo-500
    flashcard: { icon: Files, color: '#14b8a6' }, // teal-500
    timeline: { icon: Calendar, color: '#f59e0b' }, // amber-500
    wiki: { icon: BookOpen, color: '#f97316' }, // orange-500
    finance: { icon: TrendingUp, color: '#10b981' }, // emerald-500
    research: { icon: Search, color: '#a855f7' }, // purple-500
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.activeContainer,
      ]}
      onPress={() => onSelect(conversation.id)}
      activeOpacity={0.7}
      onLongPress={() => onTogglePin?.(conversation.id)}
    >
      <View style={styles.contentColumn}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isActive && styles.activeTitle]}
            numberOfLines={1}
          >
            {conversation.title || 'Untitled Chat'}
          </Text>
          
          {/* Surface Icons */}
          {surfaceStates && (
            <View style={styles.surfaceIconsContainer}>
              {Object.entries(surfaceConfigs).map(([type, config]) => {
                if (!surfaceStates[type]) return null;
                const Icon = config.icon;
                return (
                 <View key={type} style={styles.surfaceIconWrapper}>
                    <Icon size={12} color={config.color} />
                 </View>
                );
              })}
            </View>
          )}

          {conversation.isPinned && (
            <Pin 
              size={12} 
              color={theme.colors.accent.primary} 
              fill={theme.colors.accent.primary} 
              style={styles.pinIcon}
            />
          )}

          {/* Menu Button - Only show if onShowMenu is provided */}
          {onShowMenu && (
             <TouchableOpacity 
               onPress={(e) => {
                 e.stopPropagation(); // Prevent item selection
                 onShowMenu(conversation);
               }}
               style={styles.menuButton}
               hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
             >
                <MoreHorizontal size={14} color={theme.colors.text.tertiary} />
             </TouchableOpacity>
          )}

        </View>

        {/* Tags Row */}
        {hasTags && (
          <View style={styles.tagsRow}>
            {conversation.tags!.slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tagPill}>
                 <Hash size={8} color={theme.colors.text.secondary} />
                 <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {conversation.tags!.length > 3 && (
              <Text style={styles.moreTagsText}>+{conversation.tags!.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.lg, // 0
    marginHorizontal: 8,
    marginBottom: 2,
  },
  activeContainer: {
    backgroundColor: theme.colors.background.secondary, // or surface
  },
  contentColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.tertiary, // text-muted-foreground
    fontWeight: '400',
  },
  activeTitle: {
    color: theme.colors.text.primary, // text-foreground
    fontWeight: '500',
  },
  surfaceIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  surfaceIconWrapper: {
    // Optional: add opacity background if needed, but web is just colored icon
  },
  pinIcon: {
    marginLeft: 4,
    opacity: 0.6,
  },
  menuButton: {
    padding: 2,
    marginLeft: 4,
    // Mobile has no hover, so visible but subtle is best.
    opacity: 0.5, 
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary, // primary/10 approx
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  tagText: {
    fontSize: 10,
    color: theme.colors.text.secondary, // primary/80
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  }
});
