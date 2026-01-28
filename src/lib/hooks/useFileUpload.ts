/**
 * useFileUpload Hook
 * Handles file picking and uploading for chat attachments
 */

import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';

export interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface PendingFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Pick a document (PDF, text, etc.)
   */
  const pickDocument = useCallback(async (): Promise<PendingFile | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      };
    } catch (error) {
      console.error('[useFileUpload] Document picker error:', error);
      setUploadError('Failed to pick document');
      return null;
    }
  }, []);

  /**
   * Pick an image from camera roll or take a photo
   */
  const pickImage = useCallback(async (useCamera = false): Promise<PendingFile | null> => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setUploadError('Camera permission required');
          return null;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setUploadError('Photo library permission required');
          return null;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
            allowsMultipleSelection: false,
          });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      
      return {
        uri: asset.uri,
        name: fileName,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      };
    } catch (error) {
      console.error('[useFileUpload] Image picker error:', error);
      setUploadError('Failed to pick image');
      return null;
    }
  }, []);

  /**
   * Upload a single file to the server
   */
  const uploadFile = useCallback(async (file: PendingFile): Promise<UploadedFile | null> => {
    try {
      setIsUploading(true);
      setUploadError(null);

      console.log('[useFileUpload] Uploading file:', file.name);
      
      const result = await api.uploadFile(file.uri, file.name, file.type);
      
      console.log('[useFileUpload] ✅ Upload complete:', result.url);
      return result;
    } catch (error: any) {
      console.error('[useFileUpload] Upload error:', error);
      setUploadError(error.message || 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(async (files: PendingFile[]): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [uploadFile]);

  /**
   * Clear any upload error
   */
  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    // State
    isUploading,
    uploadError,
    
    // Pickers
    pickDocument,
    pickImage,
    
    // Upload
    uploadFile,
    uploadFiles,
    
    // Utils
    clearError,
  };
}
