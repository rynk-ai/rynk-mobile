import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import { Folder, ChevronDown, ChevronRight } from 'lucide-react-native';
import type { Folder as FolderType } from '../../lib/types';

interface FolderListItemProps {
  folder: FolderType;
  isActive?: boolean;
  itemCount: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onLongPress?: () => void;
}

export function FolderListItem({
  folder,
  isActive,
  itemCount,
  isExpanded,
  onToggleExpand,
  onLongPress,
}: FolderListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onToggleExpand}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.iconRow}>
        {onToggleExpand && (
          <View style={styles.chevron}>
             {isExpanded ? (
                <ChevronDown size={12} color={theme.colors.text.tertiary} />
             ) : (
                <ChevronRight size={12} color={theme.colors.text.tertiary} />
             )}
          </View>
        )}
        <Folder size={14} color={isActive ? theme.colors.text.primary : theme.colors.text.tertiary} />
      </View>
      
      <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
        {folder.name}
      </Text>
      
      <Text style={styles.count}>{itemCount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: theme.borderRadius.lg,
  },
  activeContainer: {
    backgroundColor: theme.colors.background.secondary,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4
  },
  chevron: {
    width: 14,
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  activeName: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  count: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginLeft: 8,
  },
});
