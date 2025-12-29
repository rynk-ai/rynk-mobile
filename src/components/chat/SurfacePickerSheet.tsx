/**
 * SurfacePickerSheet - Bottom sheet for selecting surface mode
 * Allows users to switch between Chat, Wiki, Quiz, etc.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { MessageCircle, BookOpen, CheckSquare, Layers, FileText, TrendingUp, Search, Check, Lock } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { SurfaceMode } from '../../lib/types';

interface SurfacePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMode: SurfaceMode;
  onSelectMode: (mode: SurfaceMode) => void;
  isGuest?: boolean;
  onShowSignIn?: () => void;
}

const MODES: { id: SurfaceMode; label: string; icon: any; color: string; description: string }[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, color: theme.colors.text.primary, description: 'Ask anything' },
  { id: 'wiki', label: 'Wiki', icon: FileText, color: '#f97316', description: 'Explain topic...' }, // orange-500
  { id: 'quiz', label: 'Quiz', icon: CheckSquare, color: '#ec4899', description: 'Test me on...' }, // pink-500
  { id: 'research', label: 'Research', icon: Search, color: '#a855f7', description: 'Research topic in depth...' }, // purple-500
  { id: 'learning', label: 'Course', icon: BookOpen, color: '#3b82f6', description: 'Teach me about...' }, // blue-500
  { id: 'guide', label: 'Guide', icon: Layers, color: '#22c55e', description: 'Guide me through...' }, // green-500
  { id: 'comparison', label: 'Compare', icon: Layers, color: '#6366f1', description: 'Compare A vs B...' }, // indigo-500
  { id: 'timeline', label: 'Timeline', icon: Layers, color: '#f59e0b', description: 'Show timeline of...' }, // amber-500
  { id: 'flashcard', label: 'Cards', icon: Layers, color: '#14b8a6', description: 'Create flashcards about...' }, // teal-500
  { id: 'finance', label: 'Finance', icon: TrendingUp, color: '#10b981', description: 'Show price of...' }, // emerald-500
];

const GUEST_ALLOWED_MODES: SurfaceMode[] = ['chat', 'wiki', 'quiz'];

export function SurfacePickerSheet({
  open,
  onOpenChange,
  selectedMode,
  onSelectMode,
  isGuest = false,
  onShowSignIn,
}: SurfacePickerSheetProps) {

  // Close sheet
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSelect = (mode: SurfaceMode) => {
    // Check if guest is allowed
    if (isGuest && !GUEST_ALLOWED_MODES.includes(mode)) {
      onShowSignIn?.();
      handleClose();
      return;
    }

    onSelectMode(mode);
    handleClose();
  };

  // Render mode item
  const renderItem = ({ item }: { item: typeof MODES[0] }) => {
    const isSelected = selectedMode === item.id;
    const isLocked = isGuest && !GUEST_ALLOWED_MODES.includes(item.id);
    const Icon = item.icon;
    
    return (
      <TouchableOpacity
        style={[styles.itemRow, isSelected && styles.itemRowSelected, isLocked && styles.itemRowLocked]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: item.color + (isSelected ? '25' : '10') },
          isLocked && { backgroundColor: theme.colors.background.secondary, opacity: 0.5 }
        ]}>
          <Icon size={18} color={isLocked ? theme.colors.text.tertiary : item.color} />
        </View>

        <View style={[styles.itemContent, isLocked && { opacity: 0.5 }]}>
          <Text style={[styles.itemTitle, isSelected && { color: item.color }]}>
            {item.label}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        
        {isSelected && !isLocked && (
          <View style={styles.checkIcon}>
            <Check size={18} color={item.color} />
          </View>
        )}

        {isLocked && (
          <View style={styles.checkIcon}>
            <Lock size={16} color={theme.colors.text.tertiary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select mode</Text>
            <TouchableOpacity
              style={styles.doneButtonHeader}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.doneButtonTextHeader}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Mode list */}
          <FlatList
            data={MODES}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%', // Slightly shorter than context picker
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  doneButtonHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.text.primary,
    borderRadius: 6,
  },
  doneButtonTextHeader: {
    color: theme.colors.background.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemRowSelected: {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.subtle,
  },
  itemRowLocked: {
    backgroundColor: theme.colors.background.primary,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  checkIcon: {
    marginLeft: 8,
  },
});
