/**
 * ChatSearchSheet - Bottom sheet for searching conversations
 * Allows users to find and switch to a conversation.
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
import { X, Search } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { Conversation } from '../../lib/types';

interface ChatSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

export function ChatSearchSheet({
  open,
  onOpenChange,
  conversations,
  onSelectConversation,
}: ChatSearchSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return conversations; // Show all if recent? Or filtered?
    return conversations.filter(conv => 
      (conv.title || '').toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Handle close
  const handleClose = useCallback(() => {
    setSearchQuery('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle select
  const handleSelect = useCallback((conversation: Conversation) => {
    onSelectConversation(conversation);
    handleClose();
  }, [onSelectConversation, handleClose]);

  // Render conversation item
  const renderItem = useCallback(({ item: conversation }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => handleSelect(conversation)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemDate}>
          {new Date(conversation.updatedAt || conversation.createdAt).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {conversation.title || 'Untitled'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleSelect]);

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
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Go to...</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Search size={16} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={theme.colors.text.tertiary}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
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
                  {searchQuery ? 'No results found' : 'Recent conversations'}
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
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    height: '85%', // Taller for search
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
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
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
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
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 4,
    backgroundColor: 'transparent',
    // Hover style simulation could go here
  },
  itemContent: {
    flex: 1,
  },
  itemDate: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500', // Slightly lighter than selected context
    color: theme.colors.text.primary,
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
