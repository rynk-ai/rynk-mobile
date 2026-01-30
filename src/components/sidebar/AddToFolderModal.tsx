import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../../lib/theme';
import { useChatContext } from '../../lib/contexts/ChatContext';
import { Folder as FolderIcon, Check } from 'lucide-react-native';
import type { Folder } from '../../lib/types';

interface AddToFolderModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export function AddToFolderModal({ visible, onClose, conversationId }: AddToFolderModalProps) {
  const { folders, updateFolder } = useChatContext();
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize selection based on folders that contain this conversation
  useEffect(() => {
    if (visible && conversationId) {
      const containing = new Set<string>();
      folders.forEach(f => {
        if (f.conversationIds.includes(conversationId)) {
          containing.add(f.id);
        }
      });
      setSelectedFolderIds(containing);
      setIsSubmitting(false);
    }
  }, [visible, conversationId, folders]);

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!conversationId) return;
    
    setIsSubmitting(true);
    try {
      // We need to update *each* folder to add/remove this conversation.
      // This is slightly inefficient but given folder count is small, it's fine.
      // Ideally backend would have "updateConversationFolders", but we have "updateFolder".
      
      const promises = folders.map(async (folder) => {
        const isCurrentlyIn = folder.conversationIds.includes(conversationId);
        const shouldBeIn = selectedFolderIds.has(folder.id);

        if (isCurrentlyIn && !shouldBeIn) {
          // Remove
          const newIds = folder.conversationIds.filter(id => id !== conversationId);
          await updateFolder(folder.id, { conversationIds: newIds });
        } else if (!isCurrentlyIn && shouldBeIn) {
          // Add
          const newIds = [...folder.conversationIds, conversationId];
          await updateFolder(folder.id, { conversationIds: newIds });
        }
      });

      await Promise.all(promises);
      onClose();
    } catch (error) {
      console.error('Failed to update folder associations:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedFolders = [...folders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Add to Folder</Text>
                <TouchableOpacity 
                   onPress={handleSave} 
                   disabled={isSubmitting}
                   style={styles.saveButton}
                >
                  <Text style={[styles.saveText, isSubmitting && { opacity: 0.7 }]}>
                    {isSubmitting ? 'Saving...' : 'Done'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {sortedFolders.length === 0 ? (
                  <Text style={styles.emptyText}>No folders created yet</Text>
                ) : (
                  sortedFolders.map(folder => {
                    const isSelected = selectedFolderIds.has(folder.id);
                    return (
                      <TouchableOpacity
                        key={folder.id}
                        style={styles.folderItem}
                        onPress={() => toggleFolder(folder.id)}
                      >
                        <View style={styles.folderInfo}>
                          <FolderIcon 
                            size={20} 
                            color={isSelected ? theme.colors.primary : theme.colors.text.tertiary} 
                          />
                          <Text style={[
                            styles.folderName, 
                            isSelected && { color: theme.colors.primary, fontWeight: '500' }
                          ]}>
                            {folder.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Check size={18} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '60%',
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  content: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderName: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});
