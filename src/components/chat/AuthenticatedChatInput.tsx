import React, { useState, useCallback } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import { ChatInput, type ChatInputProps } from './ChatInput';
import { useFileUpload, type UploadedFile } from '../../lib/hooks/useFileUpload';

interface AuthenticatedChatInputProps extends Omit<ChatInputProps, 'isGuest' | 'onShowSignIn' | 'onSend'> {
  /** When sending, include attachments */
  onSend: (text: string, attachments?: UploadedFile[]) => void;
  /** Optional callback to add context (handled via ActionSheet) */
  onAddContext?: () => void;
}

export function AuthenticatedChatInput(props: AuthenticatedChatInputProps) {
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const { pickDocument, pickImage, uploadFile, isUploading, uploadError, clearError } = useFileUpload();

  // Handlers for specific attachment actions (passed to Menu)
  const handlePickPhoto = useCallback(async () => {
    const file = await pickImage(false); // Gallery
    if (file) {
      const uploaded = await uploadFile(file);
      if (uploaded) setAttachments(prev => [...prev, uploaded]);
    }
  }, [pickImage, uploadFile]);

  const handleTakePhoto = useCallback(async () => {
    const file = await pickImage(true); // Camera
    if (file) {
      const uploaded = await uploadFile(file);
      if (uploaded) setAttachments(prev => [...prev, uploaded]);
    }
  }, [pickImage, uploadFile]);

  const handlePickDocument = useCallback(async () => {
    const file = await pickDocument();
    if (file) {
      const uploaded = await uploadFile(file);
      if (uploaded) setAttachments(prev => [...prev, uploaded]);
    }
  }, [pickDocument, uploadFile]);

  const handleAddContext = useCallback(() => {
     props.onAddContext?.();
  }, [props.onAddContext]);

  const handleRemoveAttachment = useCallback((url: string) => {
    setAttachments(prev => prev.filter(a => a.url !== url));
  }, []);

  const handleSend = useCallback((text: string) => {
    props.onSend(text, attachments.length > 0 ? attachments : undefined);
    setAttachments([]); // Clear attachments after send
  }, [props.onSend, attachments]);

  const handleTextChange = (text: string) => {
    props.onValueChange?.(text);
    
    // Simple trigger for context picker on '@'
    if (text.endsWith('@')) {
       props.onAddContext?.();
    }
  };

  // Show error if any
  if (uploadError) {
    Alert.alert('Upload Error', uploadError, [
      { text: 'OK', onPress: clearError }
    ]);
  }

  return (
     <ChatInput
       {...props}
       isGuest={false}
       onSend={handleSend}
       onValueChange={handleTextChange}
       // Pass granular actions
       onAddContext={handleAddContext}
       onPickImage={handlePickPhoto}
       onTakePhoto={handleTakePhoto}
       onPickDocument={handlePickDocument}
       attachments={attachments}
       onRemoveAttachment={handleRemoveAttachment}
       isLoading={props.isLoading || isUploading}
     />
  );
}
