/**
 * InlineCitation - Tappable citation badge for [n] patterns in text
 * Renders as superscript number that opens source URL
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
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

  // Use Text with onPress for better compatibility nested inside other Text nodes
  return (
    <Text
      onPress={handlePress}
      style={styles.badgeContainer}
      suppressHighlighting={true}
    >
      <Text style={styles.badgeText}>
        {` ${id} `}
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
  badgeContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Light blue bg to match web bg-primary/15
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.accent.primary,
    lineHeight: 18, // Adjusted height to not clip pill
    // Lift the pill slightly to match superscript feel
    top: Platform.OS === 'ios' ? -3 : -2,
  },
});

