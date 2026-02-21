import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import {
  Paperclip,
  MessageSquare,
  Folder,
  Camera,
  Image as ImageIcon,
  FileText
} from 'lucide-react-native';
import { theme } from '../../lib/theme';

interface ChatInputActionMenuProps {
  visible: boolean;
  onClose: () => void;
  onAttachFiles?: () => void;
  onAddContext?: () => void;
  onAddFolder?: () => void; // Future support
  // Expanded attach options if we want them inline
  onTakePhoto?: () => void;
  onPickImage?: () => void;
  onPickDocument?: () => void;
}

export function ChatInputActionMenu({
  visible,
  onClose,
  onAttachFiles,
  onAddContext,
  onAddFolder,
  onTakePhoto,
  onPickImage,
  onPickDocument,
}: ChatInputActionMenuProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Menu */}
        <Animated.View
          style={[
            styles.menu,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Attach Files Group */}
          {(onPickImage || onAttachFiles || onTakePhoto || onPickDocument) && (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Attachments</Text>

              {(onPickImage || onAttachFiles) && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onPickImage ? onPickImage() : onAttachFiles?.();
                    onClose();
                  }}
                >
                  <ImageIcon size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuItemText}>Photo Library</Text>
                </TouchableOpacity>
              )}

              {onTakePhoto && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onTakePhoto();
                    onClose();
                  }}
                >
                  <Camera size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuItemText}>Take Photo</Text>
                </TouchableOpacity>
              )}

              {(onPickDocument || onAttachFiles) && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onPickDocument ? onPickDocument() : onAttachFiles?.();
                    onClose();
                  }}
                >
                  <Paperclip size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuItemText}>Document</Text>
                </TouchableOpacity>
              )}

              {/* Separator if we have context items too */}
              {(onAddContext || onAddFolder) && <View style={styles.separator} />}
            </View>
          )}

          {/* Context Group */}
          {(onAddContext || onAddFolder) && (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>Context</Text>

              {onAddContext && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onAddContext();
                    onClose();
                  }}
                >
                  <MessageSquare size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuItemText}>Add Conversation</Text>
                </TouchableOpacity>
              )}

              {onAddFolder && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onAddFolder();
                    onClose();
                  }}
                >
                  <Folder size={18} color={theme.colors.text.secondary} />
                  <Text style={styles.menuItemText}>Add Folder</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 110, // increased padding to ensure it places above the chat input completely
    paddingLeft: 10,
  },
  menu: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    width: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    paddingVertical: 8,
  },
  group: {
    paddingVertical: 4,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 4,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    // active state handled by TouchableOpacity
  },
  menuItemText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: 4,
  },
});
