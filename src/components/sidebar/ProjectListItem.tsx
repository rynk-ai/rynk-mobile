import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { theme } from '../../lib/theme';
import { Briefcase, MoreHorizontal } from 'lucide-react-native';
import type { Project } from '../../lib/types';

interface ProjectListItemProps {
  project: Project;
  isActive?: boolean;
  onSelect?: () => void;
}

export function ProjectListItem({
  project,
  isActive,
  onSelect,
}: ProjectListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Briefcase size={14} color={isActive ? theme.colors.text.primary : theme.colors.text.tertiary} />
      </View>
      
      <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
        {project.name}
      </Text>
      
      {/* Placeholder for future actions */}
      {/* <TouchableOpacity style={styles.moreButton}>
         <MoreHorizontal size={12} color={theme.colors.text.tertiary} />
      </TouchableOpacity> */}
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
    borderRadius: 6,
  },
  activeContainer: {
    backgroundColor: theme.colors.background.secondary,
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  moreButton: {
    padding: 4,
  },
});
