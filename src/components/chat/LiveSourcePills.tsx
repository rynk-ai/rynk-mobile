/**
 * LiveSourcePills - Animated source pills during web search
 * Shows favicon + domain for each discovered source
 * Swiss Modern: Sharp corners, minimal design
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Image } from 'react-native';
import { Loader2 } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export interface DiscoveredSource {
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  snippet?: string;
}

interface LiveSourcePillsProps {
  sources: DiscoveredSource[];
  isSearching: boolean;
}

function getDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

function SourcePill({ source }: { source: DiscoveredSource }) {
  const handlePress = () => {
    Linking.openURL(source.url);
  };

  return (
    <Pressable style={styles.pill} onPress={handlePress}>
      {source.favicon && (
        <Image
          source={{ uri: source.favicon }}
          style={styles.favicon}
          resizeMode="contain"
        />
      )}
      <Text style={styles.domain} numberOfLines={1}>
        {source.domain}
      </Text>
    </Pressable>
  );
}

export function LiveSourcePills({ sources, isSearching }: LiveSourcePillsProps) {
  if (sources.length === 0 && !isSearching) {
    return null;
  }

  return (
    <View style={styles.container}>
      {sources.map((source, index) => (
        <SourcePill key={`${source.url}-${index}`} source={source} />
      ))}
      {isSearching && (
        <View style={styles.searchingPill}>
          <Loader2 size={10} color={theme.colors.text.tertiary} />
          <Text style={styles.searchingText}>Finding sources...</Text>
        </View>
      )}
    </View>
  );
}

// Helper to extract sources from search results
export function extractSourcesFromSearchResults(
  searchResults: any
): DiscoveredSource[] {
  if (!searchResults?.sources) return [];

  return searchResults.sources.map((source: any) => ({
    url: source.url,
    title: source.title,
    domain: getDomainName(source.url),
    favicon: getFaviconUrl(source.url),
    snippet: source.snippet,
  }));
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 0, // Swiss Modern sharp corners
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 4,
  },
  favicon: {
    width: 12,
    height: 12,
    opacity: 0.8,
  },
  domain: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    maxWidth: 100,
  },
  searchingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 4,
  },
  searchingText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
});
