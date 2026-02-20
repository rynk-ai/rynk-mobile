import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../../lib/theme';
import api from '../../lib/api/client';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check, Expand, X } from 'lucide-react-native';

const MERMAID_SERVICE_URL = 'https://mermaid.rynk.io/img';

interface MermaidDiagramProps {
  /** Mermaid diagram code */
  code: string;
  /** Optional width */
  width?: number;
  /** Optional height */
  height?: number;
  /** Optional message ID for auto-fix persistence */
  messageId?: string;
  /** Optional conversation ID for auto-fix persistence */
  conversationId?: string;
}

/**
 * Convert string to base64 (works in React Native)
 */
function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';

  for (let i = 0; i < str.length; i += 3) {
    const chr1 = str.charCodeAt(i);
    const chr2 = str.charCodeAt(i + 1);
    const chr3 = str.charCodeAt(i + 2);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
}

export function MermaidDiagram({ code, width, height, messageId, conversationId }: MermaidDiagramProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [isFixing, setIsFixing] = useState(false);
  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [fixAttempted, setFixAttempted] = useState(false);

  const currentCode = fixedCode || code;
  const cleanedCode = currentCode.trim();
  const base64Code = toBase64(cleanedCode);
  const imageUrl = `${MERMAID_SERVICE_URL}/${base64Code}?theme=dark&bgColor=transparent`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const attemptFix = useCallback(async () => {
    if (fixAttempted || isFixing) return;

    setIsFixing(true);
    setFixAttempted(true);

    try {
      const data = await api.fixMermaidDiagram(code.trim(), messageId, conversationId);

      if (data.fixed && data.code) {
        setFixedCode(data.code);
        setError(null);
        setLoading(true);
      } else {
        setError('Diagram syntax error - could not auto-fix');
      }
    } catch (err) {
      console.error('[MermaidDiagram] Failed to fix mermaid:', err);
      setError('Failed to render diagram');
    } finally {
      setIsFixing(false);
    }
  }, [code, messageId, conversationId, fixAttempted, isFixing]);

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    if (!fixAttempted && !isFixing) {
      attemptFix();
    } else {
      setLoading(false);
      setError('Failed to render diagram');
    }
  };

  // Expanded Modal View
  if (isExpanded) {
    return (
      <View>
        <TouchableOpacity
          style={styles.expandPlaceholder}
          onPress={() => setIsExpanded(true)}
        >
          <Text style={styles.expandPlaceholderText}>Diagram expanded (tap to open again)</Text>
        </TouchableOpacity>
        <Modal
          visible={isExpanded}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsExpanded(false)}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mermaid Diagram</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
                    {copied ? <Check size={20} color={theme.colors.accent.success} /> : <Copy size={20} color={theme.colors.text.secondary} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsExpanded(false)} style={styles.iconButton}>
                    <X size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView contentContainerStyle={styles.modalScrollContent} maximumZoomScale={3} minimumZoomScale={1}>
                {loading && <ActivityIndicator size="large" color={theme.colors.accent.primary} style={styles.modalLoader} />}
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.modalImage, loading && styles.hidden]}
                  resizeMode="contain"
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyErrorButton}>
          <Text style={styles.copyErrorText}>Copy code to debug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fixing State
  if (isFixing) {
    return (
      <View style={styles.fixingContainer}>
        <ActivityIndicator size="small" color={theme.colors.text.tertiary} />
        <Text style={styles.fixingText}>Fixing diagram syntax...</Text>
      </View>
    );
  }

  // Normal View
  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleCopy} style={styles.toolbarButton}>
          {copied ? <Check size={16} color={theme.colors.accent.success} /> : <Copy size={16} color={theme.colors.text.secondary} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsExpanded(true)} style={styles.toolbarButton}>
          <Expand size={16} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.imageContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.accent.primary} />
          </View>
        )}
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsExpanded(true)}>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              { width: width || '100%', height: height || 200 },
              loading && styles.hidden,
            ]}
            resizeMode="contain"
            onLoad={handleLoad}
            onError={handleError}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker header logic like web
  },
  toolbarButton: {
    padding: 4,
  },
  imageContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Redish background for error
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginVertical: 12,
  },
  errorText: {
    color: theme.colors.accent.error,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  copyErrorButton: {
    marginTop: 8,
  },
  copyErrorText: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  fixingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginVertical: 12,
    gap: 12,
  },
  fixingText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
  },
  expandPlaceholder: {
    padding: 16,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginVertical: 12,
    alignItems: 'center',
  },
  expandPlaceholderText: {
    color: theme.colors.text.tertiary,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalLoader: {
    position: 'absolute',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
});
