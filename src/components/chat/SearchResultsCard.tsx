/**
 * SearchResultsCard - Display search sources/citations
 * Shows sources used by AI when generating responses
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { ExternalLink, Search, Globe } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { SearchResult } from '../../lib/hooks/useStreaming';

interface SearchResultsCardProps {
  searchResults: SearchResult;
  maxSources?: number;
}

export function SearchResultsCard({ searchResults, maxSources = 3 }: SearchResultsCardProps) {
  if (!searchResults?.sources?.length) return null;

  const displayedSources = searchResults.sources.slice(0, maxSources);
  const remainingCount = Math.max(0, (searchResults.totalResults || searchResults.sources.length) - maxSources);

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.length > 25 ? domain.substring(0, 22) + '...' : domain;
    } catch {
      return url.substring(0, 25);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Search size={12} color={theme.colors.text.tertiary} />
        <Text style={styles.headerText}>
          Sources ({searchResults.totalResults || searchResults.sources.length})
        </Text>
      </View>

      {/* Sources List */}
      <View style={styles.sourcesList}>
        {displayedSources.map((source, index) => (
          <TouchableOpacity
            key={`${source.url}-${index}`}
            style={styles.sourceItem}
            onPress={() => handleOpenLink(source.url)}
            activeOpacity={0.7}
          >
            <View style={styles.sourceIcon}>
              <Globe size={12} color={theme.colors.text.tertiary} />
            </View>
            <View style={styles.sourceContent}>
              <Text style={styles.sourceTitle} numberOfLines={1}>
                {source.title || 'Untitled'}
              </Text>
              <Text style={styles.sourceDomain} numberOfLines={1}>
                {getDomainFromUrl(source.url)}
              </Text>
            </View>
            <ExternalLink size={12} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Show more indicator */}
      {remainingCount > 0 && (
        <Text style={styles.moreText}>
          +{remainingCount} more source{remainingCount > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary, // Light background block
    borderRadius: 8, // Tighter radius
    padding: 10, // Reduced padding
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 10, // Smaller header
    fontWeight: '600',
    color: theme.colors.text.tertiary, // Softer color
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sourcesList: {
    gap: 6, // Tighter gap
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6, // Compact
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  sourceIcon: {
    width: 20, // Smaller icon
    height: 20,
    borderRadius: 5,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceContent: {
    flex: 1,
    minWidth: 0,
  },
  sourceTitle: {
    fontSize: 12, // Compact text
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  sourceDomain: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 0,
  },
  moreText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});
