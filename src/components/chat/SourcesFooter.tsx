import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { theme } from '../../lib/theme';
import { Globe, BookOpen } from 'lucide-react-native';

// Simplified citation interface match
export interface Citation {
  title: string;
  url: string;
  snippet?: string;
  hostname?: string; // Optional if not pre-parsed
}

interface SourcesFooterProps {
  citations: Citation[];
  onSourcePress?: (url: string) => void;
}

export function SourcesFooter({ citations, onSourcePress }: SourcesFooterProps) {
  if (!citations || citations.length === 0) return null;

  // Deduplicate citations by URL
  const uniqueCitations = citations.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);
  const displayCitations = uniqueCitations.slice(0, 4); // Show max 4 initially
  const remainingcount = uniqueCitations.length - 4;

  const handlePress = (url: string) => {
    if (onSourcePress) {
      onSourcePress(url);
    } else {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const getHostname = (url: string) => {
    try {
      // Basic extraction for React Native where URL API might differ or be strict
      const matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      return matches && matches[1] ? matches[1].replace('www.', '') : 'source';
    } catch {
      return 'source';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sources</Text>
      <View style={styles.grid}>
        {displayCitations.map((citation, index) => (
          <TouchableOpacity 
            key={`${citation.url}-${index}`}
            style={styles.sourceCard}
            onPress={() => handlePress(citation.url)}
          >
             <View style={styles.iconWrapper}>
               <Globe size={10} color={theme.colors.text.tertiary} />
             </View>
             <Text style={styles.sourceTitle} numberOfLines={1}>
               {citation.title || getHostname(citation.url)}
             </Text>
             <Text style={styles.sourceCount}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
        {remainingcount > 0 && (
           <View style={styles.moreCard}>
             <Text style={styles.moreText}>+{remainingcount} more</Text>
           </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 4,
    width: '100%',
  },
  label: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    maxWidth: '48%', // Allow 2 per row roughly
    // Sharp corners
    borderRadius: 0, 
    gap: 6,
  },
  iconWrapper: {
    opacity: 0.7,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  sourceCount: {
    fontSize: 9,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    // borderRadius: 2,
    opacity: 0.8,
  },
  moreCard: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: 0,
  },
  moreText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  }
});
