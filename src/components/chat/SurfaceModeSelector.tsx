import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MessageCircle, BookOpen, CheckSquare, Layers, FileText, TrendingUp, Search } from 'lucide-react-native';
import { theme } from '../../lib/theme';

import type { SurfaceMode } from '../../lib/types';

interface SurfaceModeSelectorProps {
  selectedMode: SurfaceMode;
  onSelectMode: (mode: SurfaceMode) => void;
}

const MODES: { id: SurfaceMode; label: string; icon: any; color: string }[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, color: theme.colors.text.primary },
  { id: 'learning', label: 'Course', icon: BookOpen, color: '#3b82f6' }, // blue-500
  { id: 'guide', label: 'Guide', icon: Layers, color: '#22c55e' }, // green-500
  { id: 'quiz', label: 'Quiz', icon: CheckSquare, color: '#ec4899' }, // pink-500
  { id: 'comparison', label: 'Compare', icon: Layers, color: '#6366f1' }, // indigo-500
  { id: 'flashcard', label: 'Cards', icon: Layers, color: '#14b8a6' }, // teal-500
  { id: 'timeline', label: 'Timeline', icon: Layers, color: '#f59e0b' }, // amber-500
  { id: 'wiki', label: 'Wiki', icon: FileText, color: '#f97316' }, // orange-500
  { id: 'finance', label: 'Finance', icon: TrendingUp, color: '#10b981' }, // emerald-500
  { id: 'research', label: 'Research', icon: Search, color: '#a855f7' }, // purple-500
];

export function SurfaceModeSelector({ selectedMode, onSelectMode }: SurfaceModeSelectorProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {MODES.map((mode) => {
        const isSelected = selectedMode === mode.id;
        const Icon = mode.icon;
        
        return (
          <TouchableOpacity
            key={mode.id}
            style={[
              styles.modePill,
              isSelected && styles.modePillActive,
              isSelected && { borderColor: mode.color + '40' }
            ]}
            onPress={() => onSelectMode(mode.id)}
            activeOpacity={0.7}
          >
            <Icon 
              size={13} 
              color={isSelected ? mode.color : theme.colors.text.tertiary} 
            />
            <Text 
              style={[
                styles.modeLabel,
                isSelected && styles.modeLabelActive,
                isSelected && { color: mode.color }
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 32,
  },
  contentContainer: {
    paddingHorizontal: 0,
    gap: 6,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: theme.colors.background.primary,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  modeLabelActive: {
    fontWeight: '600',
  },
});
