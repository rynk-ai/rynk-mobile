/**
 * InlineCitation - Tappable citation badge for [n] patterns in text
 * Renders as superscript number that opens source URL
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { theme } from '../../lib/theme';
import type { Citation } from './SourcesFooter';

interface InlineCitationProps {
  id: number;
  citation: Citation;
}

export function InlineCitation({ id, citation }: InlineCitationProps) {
  const handlePress = () => {
    if (citation.url) {
      Linking.openURL(citation.url).catch(err => 
        console.error("Couldn't open URL", err)
      );
    }
  };

  // Use Text with onPress for better compatibility nested inside other Text nodes (Markdown paragraphs)
  return (
    <Text 
      onPress={handlePress}
      style={styles.superscriptPlaceholder} // Helper to lift layout
    >
      <Text style={styles.badgeText}>
       {/* Zero-width space to force height if needed, or just padding */}
       {` [${id}] `}
      </Text>
    </Text>
  );
}

/**
 * Parse text content to detect [n] citation patterns
 * Returns array of text segments and InlineCitation components
 */
export function parseCitationsInText(
  text: string, 
  citations: Citation[]
): (string | React.ReactElement)[] {
  if (!text || citations.length === 0) return [text];
  
  const citationRegex = /\[(\d+)\]/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  while ((match = citationRegex.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const citationId = parseInt(match[1]);
    const citation = citations.find(c => c.id === citationId);
    
    if (citation) {
      parts.push(
        <InlineCitation 
          key={`citation-${keyIndex++}`} 
          id={citationId} 
          citation={citation} 
        />
      );
    } else {
      // Keep original if citation not found
      parts.push(match[0]);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

const styles = StyleSheet.create({
  superscriptPlaceholder: {
    // Attempt to lift via lineHeight or textAlignVertical if supported
    lineHeight: 18, 
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent.primary,
    // Add vertical align details if needed, or simply color/bold
  },
  // Used for non-text nesting if needed later
  badge: {
     backgroundColor: theme.colors.accent.primary,
  }
});
