import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { theme } from '../lib/theme';

interface InputDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  isLoading?: boolean;
}

export function InputDialog({
  visible,
  onClose,
  onSubmit,
  title,
  description,
  placeholder,
  initialValue = '',
  submitLabel = 'Confirm',
  isLoading = false,
}: InputDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          </View>
          
          {description && <Text style={styles.description}>{description}</Text>}
          
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.tertiary}
            autoFocus
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (!value.trim() || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!value.trim() || isLoading}
            >
              {isLoading ? (
                <Text style={styles.submitText}>Saving...</Text>
              ) : (
                <>
                  <Check size={16} color={theme.colors.text.inverse} />
                  <Text style={styles.submitText}>{submitLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker backdrop
  },
  content: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.sm, // Sharp
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    // Removed shadows
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'transparent', // Minimal input
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 0, // Underline style or minimal box? Let's go minimal box.
    padding: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.sm,
  },
  cancelText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent.primary, // White
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 13,
    color: theme.colors.text.inverse, // Black
    fontWeight: '600',
  },
});
