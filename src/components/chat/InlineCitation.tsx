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

const styles = StyleSheet.create({
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Light blue bg
    overflow: 'hidden',
    lineHeight: 16,
    // Negative offset to act as superscript over baseline
    top: Platform.OS === 'ios' ? -3 : -2,
  },
});

export function InlineCitation({ id, citation }: InlineCitationProps) {
  const handlePress = () => {
    if (citation.url) {
      Linking.openURL(citation.url).catch(err =>
        console.error("Couldn't open URL", err)
      );
    }
  };

  // Render highly compact non-breaking inline block
  return (
    <Text
      onPress={handlePress}
      style={styles.badgeText}
      suppressHighlighting={true}
    >
      {"\u00A0"}{id}{"\u00A0"}
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
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationId = parseInt(match[1]);
    const citation = citations.find(c => c.id === citationId);

    if (citation) {
      // Add a small space before the citation if the preceding character isn't a space
      if (match.index > 0 && text[match.index - 1] !== ' ') {
        parts.push(' ');
      }
      parts.push(
        <InlineCitation
          key={`citation-${keyIndex++}`}
          id={citationId}
          citation={citation}
        />
      );
    } else {
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

