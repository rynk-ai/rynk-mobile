import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { theme } from '../../lib/theme';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react-native';

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
  maxVisible = 4
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
          >
            {expanded ? (
              <>
                <ChevronUp size={12} color={theme.colors.text.tertiary} />
                <Text style={styles.expandText}>Less</Text>
              </>
            ) : (
              <>
                <ChevronDown size={12} color={theme.colors.text.tertiary} />
                <Text style={styles.expandText}>All ({uniqueCitations.length})</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Source cards grid */}
      <View style={styles.grid}>
        {visibleCitations.map((citation, index) => (
          <TouchableOpacity 
            key={`${citation.url}-${index}`}
            style={styles.sourceCard}
            onPress={() => handlePress(citation.url)}
            activeOpacity={0.7}
          >
            {/* Numbered badge */}
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>{citation.id || index + 1}</Text>
            </View>
            
            {/* Favicon + Title */}
            <View style={styles.cardContent}>
              <Image
                source={{ uri: citation.favicon || getFaviconUrl(citation.url) }}
                style={styles.favicon}
                resizeMode="contain"
              />
              <Text style={styles.sourceTitle} numberOfLines={1}>
                {citation.title || getHostname(citation.url)}
              </Text>
            </View>
            
            {/* External link indicator */}
            <ExternalLink size={10} color={theme.colors.text.tertiary} style={styles.externalIcon} />
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
    borderTopColor: theme.colors.border.subtle,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.tertiary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expandText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: '48%',
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  numberBadge: {
    width: 18,
    height: 18,
    backgroundColor: theme.colors.accent.primary + '20', // 20% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent.primary,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favicon: {
    width: 14,
    height: 14,
    opacity: 0.9,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  externalIcon: {
    opacity: 0.5,
  },
});
