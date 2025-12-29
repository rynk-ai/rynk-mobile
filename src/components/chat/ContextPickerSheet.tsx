/**
 * ContextPickerSheet - Bottom sheet for selecting conversation context
 * Allows users to add previous conversations as context for new messages
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Search, Check, MessageSquare, FolderOpen } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export interface ContextItem {
  type: 'conversation' | 'folder';
  id: string;
  title: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface ContextPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  selectedItems: ContextItem[];
  onSelectionChange: (items: ContextItem[]) => void;
  currentConversationId?: string | null;
}

export function ContextPickerSheet({
  open,
  onOpenChange,
  conversations,
  selectedItems,
  onSelectionChange,
  currentConversationId,
}: ContextPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search and exclude current
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter(conv => {
      // Exclude current conversation
      if (conv.id === currentConversationId) return false;
      // Filter by search
      if (query && !conv.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [conversations, searchQuery, currentConversationId]);

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => selectedItems.some(item => item.id === id),
    [selectedItems]
  );

  // Toggle item selection
  const toggleSelection = useCallback(
    (conversation: Conversation) => {
      const item: ContextItem = {
        type: 'conversation',
        id: conversation.id,
        title: conversation.title,
      };

      if (isSelected(conversation.id)) {
        onSelectionChange(selectedItems.filter(i => i.id !== conversation.id));
      } else {
        onSelectionChange([...selectedItems, item]);
      }
    },
    [selectedItems, onSelectionChange, isSelected]
  );

  // Clear all selections
  const clearSelections = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Close sheet
  const handleClose = useCallback(() => {
    setSearchQuery('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Render conversation item
  const renderItem = useCallback(
    ({ item: conversation }: { item: Conversation }) => {
      const selected = isSelected(conversation.id);
      
      return (
        <TouchableOpacity
          style={[styles.itemRow, selected && styles.itemRowSelected]}
          onPress={() => toggleSelection(conversation)}
          activeOpacity={0.7}
        >
          <View style={styles.itemIcon}>
            <MessageSquare 
              size={18} 
              color={selected ? theme.colors.accent.primary : theme.colors.text.tertiary} 
            />
          </View>
          <View style={styles.itemContent}>
            <Text 
              style={[styles.itemTitle, selected && styles.itemTitleSelected]} 
              numberOfLines={1}
            >
              {conversation.title || 'Untitled'}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(conversation.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {selected && (
            <View style={styles.checkIcon}>
              <Check size={18} color={theme.colors.accent.primary} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [isSelected, toggleSelection]
  );

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
            <View style={styles.headerRow}>
              <Text style={styles.title}>Add Context</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <X size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Select conversations to use as context
            </Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={18} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={theme.colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected count */}
          {selectedItems.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionCount}>
                {selectedItems.length} selected
              </Text>
              <TouchableOpacity onPress={clearSelections}>
                <Text style={styles.clearButton}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Conversation list */}
          <FlatList
            data={filteredConversations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FolderOpen size={40} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No matching conversations' : 'No conversations available'}
                </Text>
              </View>
            }
          />

          {/* Done button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 400,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.accent.primary + '10',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectionCount: {
    fontSize: 13,
    color: theme.colors.accent.primary,
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 13,
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.background.secondary,
    marginBottom: 8,
    gap: 12,
  },
  itemRowSelected: {
    backgroundColor: theme.colors.accent.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary + '30',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  itemTitleSelected: {
    color: theme.colors.accent.primary,
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  doneButton: {
    backgroundColor: theme.colors.text.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: theme.colors.background.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
