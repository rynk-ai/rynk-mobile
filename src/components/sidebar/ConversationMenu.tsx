import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../../lib/theme';
import { 
  Pin, 
  PinOff,
  FolderPlus, 
  Pencil, 
  Hash, 
  Trash2 
} from 'lucide-react-native';
import type { Conversation } from '../../lib/types';

interface ConversationMenuProps {
  visible: boolean;
  conversation: Conversation | null;
  onClose: () => void;
  onTogglePin?: (id: string) => void;
  onAddToFolder?: (id: string) => void;
  onRename?: (id: string) => void;
  onEditTags?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ConversationMenu({
  visible,
  conversation,
  onClose,
  onTogglePin,
  onAddToFolder,
  onRename,
  onEditTags,
  onDelete,
}: ConversationMenuProps) {
  if (!conversation) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

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
            <View style={styles.menuContainer}>
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                  {conversation.title || 'Untitled Chat'}
                </Text>
              </View>
              
              <View style={styles.separator} />

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => onTogglePin && handleAction(() => onTogglePin(conversation.id))}
              >
                {conversation.isPinned ? (
                   <PinOff size={18} color={theme.colors.text.secondary} />
                ) : (
                   <Pin size={18} color={theme.colors.text.secondary} />
                )}
                <Text style={styles.menuText}>
                  {conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => onAddToFolder && handleAction(() => onAddToFolder(conversation.id))}
              >
                <FolderPlus size={18} color={theme.colors.text.secondary} />
                <Text style={styles.menuText}>Add to folder</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => onRename && handleAction(() => onRename(conversation.id))}
              >
                <Pencil size={18} color={theme.colors.text.secondary} />
                <Text style={styles.menuText}>Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => onEditTags && handleAction(() => onEditTags(conversation.id))}
              >
                <Hash size={18} color={theme.colors.text.secondary} />
                <Text style={styles.menuText}>Edit tags</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => onDelete && handleAction(() => onDelete(conversation.id))}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={[styles.menuText, { color: '#ef4444' }]}>Delete conversation</Text>
              </TouchableOpacity>

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
  menuContainer: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg, // Sharp
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    padding: 12,
    borderBottomWidth: 0, 
  },
  title: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
