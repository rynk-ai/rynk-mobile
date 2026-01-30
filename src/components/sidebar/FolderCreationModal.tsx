import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useChatContext } from '../../lib/contexts/ChatContext';
import { theme } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';

interface FolderCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  folder?: { id: string, name: string, description?: string | null, conversationIds?: string[] } | null;
}

export const FolderCreationModal: React.FC<FolderCreationModalProps> = ({ visible, onClose, onSuccess, folder }) => {
  const { conversations, createFolder, updateFolder } = useChatContext();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedConversationIds, setSelectedConversationIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset or populate state when modal opens
  React.useEffect(() => {
    if (visible) {
      if (folder) {
        setName(folder.name);
        setDescription(folder.description || '');
        setSelectedConversationIds(new Set(folder.conversationIds || []));
      } else {
        setName('');
        setDescription('');
        setSelectedConversationIds(new Set());
      }
      setSearchQuery('');
      setIsSubmitting(false);
    }
  }, [visible, folder]);

  const toggleConversation = (id: string) => {
    setSelectedConversationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (folder) {
        await updateFolder(folder.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          conversationIds: Array.from(selectedConversationIds)
        });
      } else {
        await createFolder(name.trim(), description.trim() || undefined, Array.from(selectedConversationIds));
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save folder:', error);
      // Could show toast/alert here
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={{ color: theme.colors.primary, fontSize: 17 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {folder ? 'Edit Folder' : 'New Folder'}
          </Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={!name.trim() || isSubmitting}
            style={styles.headerButton}
          >
            <Text style={{ 
              color: !name.trim() || isSubmitting ? theme.colors.text.secondary : theme.colors.primary, 
              fontSize: 17, 
              fontWeight: '600' 
            }}>
              {isSubmitting ? 'Saving...' : (folder ? 'Save' : 'Create')}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Form Fields */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>FOLDER NAME</Text>
              <TextInput
                 style={[styles.input, { 
                   backgroundColor: theme.colors.background.secondary, 
                   color: theme.colors.text.primary,
                   borderColor: theme.colors.border.default
                 }]}
                 placeholder="Name"
                 placeholderTextColor={theme.colors.text.secondary}
                 value={name}
                 onChangeText={setName}
                 autoFocus
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                 style={[styles.input, { 
                   backgroundColor: theme.colors.background.secondary, 
                   color: theme.colors.text.primary,
                   borderColor: theme.colors.border.default,
                   minHeight: 80,
                   paddingTop: 12
                 }]}
                 placeholder="Description"
                 placeholderTextColor={theme.colors.text.secondary}
                 value={description}
                 onChangeText={setDescription}
                 multiline
                 numberOfLines={3}
                 textAlignVertical="top"
              />
            </View>

            {/* Conversation Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>ADD CHATS ({selectedConversationIds.size})</Text>
              
              {/* Search input for chats */}
              <View style={[styles.searchContainer, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.default }]}>
                <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text.primary }]}
                  placeholder="Search chats..."
                  placeholderTextColor={theme.colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={[styles.chatList, { borderColor: theme.colors.border.default }]}>
                {filteredConversations.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                    No conversations found
                  </Text>
                ) : (
                  filteredConversations.map((conv, index) => {
                    const isSelected = selectedConversationIds.has(conv.id);
                    return (
                      <TouchableOpacity 
                        key={conv.id} 
                        style={[
                          styles.chatItem, 
                          { borderBottomColor: theme.colors.border.subtle },
                          index === filteredConversations.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => toggleConversation(conv.id)}
                      >
                        <View style={styles.chatInfo}>
                          <Text 
                            style={[styles.chatTitle, { color: theme.colors.text.primary }]}
                            numberOfLines={1}
                          >
                            {conv.title || 'Untitled Chat'}
                          </Text>
                          <Text style={[styles.chatDate, { color: theme.colors.text.secondary }]}>
                            {format(new Date(conv.updatedAt), 'MMM d, yyyy')}
                          </Text>
                        </View>
                        <View style={[
                          styles.checkbox, 
                          { borderColor: isSelected ? theme.colors.primary : theme.colors.border.default },
                          isSelected && { backgroundColor: theme.colors.primary }
                        ]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  chatList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  chatInfo: {
    flex: 1,
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  }
});
