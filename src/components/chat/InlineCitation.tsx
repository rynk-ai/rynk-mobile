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

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.badge}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Text style={styles.text}>{id}</Text>
    </TouchableOpacity>
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
  badge: {
    backgroundColor: theme.colors.accent.primary,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: 2,
    // Superscript positioning
    transform: [{ translateY: -4 }],
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
