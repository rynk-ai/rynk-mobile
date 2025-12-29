import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ChatInput, type ChatInputProps } from './ChatInput';
import { Paperclip } from 'lucide-react-native';
import { theme } from '../../lib/theme';
// import * as DocumentPicker from 'expo-document-picker'; // TODO: Install and uncomment

interface AuthenticatedChatInputProps extends Omit<ChatInputProps, 'isGuest' | 'onShowSignIn'> {
  onAttachFile?: (file: any) => void;
}

export function AuthenticatedChatInput(props: AuthenticatedChatInputProps) {
  const [isAttaching, setIsAttaching] = useState(false);

  const handleAttach = async () => {
    Alert.alert('Coming Soon', 'File uploads will be available shortly.');
  };

  const handleTextChange = (text: string) => {
    props.onValueChange?.(text);
    
    // Simple trigger for context picker on '@'
    if (text.endsWith('@')) {
       // We'll rely on the parent to handle the actual picker opening
       // but we could also detect it here and signal.
       // For now, let's assume the explicit "+" button is the primary way,
       // or the user manually triggers it.
       props.onAddContext?.();
    }
  };

  return (
     <ChatInput
       {...props}
       isGuest={false}
       onValueChange={handleTextChange}
       onAttach={handleAttach}
       showContextPicker={true} // Always show context picker for auth users
     />
  );
}

const styles = StyleSheet.create({
  container: {
    // width: '100%',
  }
});
