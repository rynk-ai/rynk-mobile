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
          {/* Content */}
          <View style={styles.itemContent}>
            <Text style={styles.itemDate}>
              {new Date(conversation.createdAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <Text 
              style={[styles.itemTitle, selected && styles.itemTitleSelected]} 
              numberOfLines={1}
            >
              {conversation.title || 'Untitled'}
            </Text>
          </View>
          
          {/* Check */}
          {selected && (
            <View style={styles.checkIcon}>
              <Check size={16} color={theme.colors.text.primary} />
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
            <Text style={styles.title}>Select chats</Text>
            <TouchableOpacity
              style={styles.doneButtonHeader}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.doneButtonTextHeader}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={16} color={theme.colors.text.tertiary} />
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
                <X size={14} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected count (Integrated visually) */}
          {selectedItems.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionCount}>
                {selectedItems.length} selected
              </Text>
              <TouchableOpacity onPress={clearSelections}>
                <Text style={styles.clearButton}>Clear</Text>
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
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No results found' : 'No conversations'}
                </Text>
              </View>
            }
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
    height: '75%',
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
    paddingVertical: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    height: '100%',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  selectionCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Item Styles matching Web "Cognitive Minimalist"
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  itemRowSelected: {
    backgroundColor: theme.colors.background.secondary, // Light bg for selected
    borderColor: theme.colors.text.primary, // Dark border for selected (inspired by web's ring)
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  itemTitleSelected: {
    color: theme.colors.text.primary,
  },
  checkIcon: {
    marginTop: 2,
  },
  itemIcon: {
    display: 'none', // Remove big icon box
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
});
