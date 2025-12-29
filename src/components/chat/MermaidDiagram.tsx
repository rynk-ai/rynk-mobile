/**
 * MermaidDiagram - Renders mermaid diagrams using mermaid.rynk.io service
 * Uses the service to convert mermaid code to PNG images
 */

import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { theme } from '../../lib/theme';

const MERMAID_SERVICE_URL = 'https://mermaid.rynk.io/img';

interface MermaidDiagramProps {
  /** Mermaid diagram code */
  code: string;
  /** Optional width */
  width?: number;
  /** Optional height */
  height?: number;
}

/**
 * Convert string to base64 (works in React Native)
 */
function toBase64(str: string): string {
  // React Native has btoa in newer versions, but for safety use this approach
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

export function MermaidDiagram({ code, width, height }: MermaidDiagramProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Clean and encode the mermaid code
  const cleanedCode = code.trim();
  const base64Code = toBase64(cleanedCode);
  const imageUrl = `${MERMAID_SERVICE_URL}/${base64Code}`;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to render diagram</Text>
        <Text style={styles.codePreview} numberOfLines={3}>
          {cleanedCode.substring(0, 100)}...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent.primary} />
        </View>
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 100,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  image: {
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginVertical: 8,
  },
  errorText: {
    color: theme.colors.text.tertiary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  codePreview: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
