import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import { MessageSquare, Pin } from 'lucide-react-native';
import type { Conversation } from '../../lib/types';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onTogglePin,
}: ConversationListItemProps) {
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
      <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
        {conversation.isPinned ? (
          <Pin size={12} color={theme.colors.accent.primary} fill={theme.colors.accent.primary} />
        ) : (
          <MessageSquare 
            size={14} 
            color={isActive ? theme.colors.text.primary : theme.colors.text.tertiary} 
          />
        )}
      </View>
      <Text
        style={[styles.title, isActive && styles.activeTitle]}
        numberOfLines={1}
      >
        {conversation.title || 'Untitled Chat'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  activeContainer: {
    backgroundColor: theme.colors.background.secondary,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  activeIconContainer: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  title: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  activeTitle: {
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});
