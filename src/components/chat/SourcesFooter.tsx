import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { theme } from '../../lib/theme';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

// Citation interface matching web app
export interface Citation {
  id?: number;
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
  publishedDate?: string;
}

interface SourcesFooterProps {
  citations: Citation[];
  onSourcePress?: (url: string) => void;
  maxVisible?: number;
}

// Helper to get favicon URL
function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

// Helper to get hostname
function getHostname(url: string): string {
  try {
    const matches = url.match(/^https?:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    return matches && matches[1] ? matches[1].replace('www.', '') : 'source';
  } catch {
    return 'source';
  }
}

export function SourcesFooter({
  citations,
  onSourcePress,
  maxVisible = 8 // Match web default for pills
}: SourcesFooterProps) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  // Deduplicate citations by URL
  const uniqueCitations = citations.filter((v, i, a) =>
    a.findIndex(t => t.url === v.url) === i
  );

  const visibleCitations = expanded
    ? uniqueCitations
    : uniqueCitations.slice(0, maxVisible);
  const hasMore = uniqueCitations.length > maxVisible;

  const handlePress = (url: string) => {
    if (onSourcePress) {
      onSourcePress(url);
    } else {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with count badge */}
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Sources</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{uniqueCitations.length}</Text>
          </View>
        </View>

        {hasMore && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {expanded ? (
              <>
                <ChevronUp size={12} color={theme.colors.text.primary} />
                <Text style={styles.expandText}>Show less</Text>
              </>
            ) : (
              <>
                <ChevronDown size={12} color={theme.colors.text.primary} />
                <Text style={styles.expandText}>Show all</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Source pills flex layout */}
      <View style={styles.pillsContainer}>
        {visibleCitations.map((citation, index) => (
          <TouchableOpacity
            key={`${citation.url}-${index}`}
            style={styles.sourcePill}
            onPress={() => handlePress(citation.url)}
            activeOpacity={0.7}
          >
            {/* Number indicator circle */}
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{citation.id || index + 1}</Text>
            </View>

            <Image
              source={{ uri: citation.favicon || getFaviconUrl(citation.url) }}
              style={styles.favicon}
              resizeMode="contain"
            />

            <Text style={styles.sourceTitle} numberOfLines={1}>
              {getHostname(citation.url)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)', // Subtle divider
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Light blue match web
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent.primary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.background.tertiary,
  },
  expandText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Match secondary/50 on web
    borderRadius: 20, // Fully rounded pills
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  numberBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  numberText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    opacity: 0.8,
  },
  sourceTitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    maxWidth: 160,
  },
});
