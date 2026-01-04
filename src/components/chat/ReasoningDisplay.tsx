/**
 * ReasoningDisplay - Enhanced with ProcessingTimeline and LiveSourcePills
 * Shows processing stages during AI response generation
 * Swiss Modern: Sharp corners, minimal design
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { StatusPill, SearchResult } from '../../lib/hooks/useStreaming';
import { ProcessingTimeline } from './ProcessingTimeline';
import { LiveSourcePills, extractSourcesFromSearchResults } from './LiveSourcePills';

interface ReasoningDisplayProps {
  content?: string | null;
  statusPills?: StatusPill[];
  searchResults?: SearchResult | null;
  isStreaming?: boolean;
}

export function ReasoningDisplay({
  content,
  statusPills = [],
  searchResults,
  isStreaming = false,
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default open for better UX

  // Extract sources for pills
  const discoveredSources = useMemo(
    () => extractSourcesFromSearchResults(searchResults),
    [searchResults]
  );

  // Check if we're in search phase
  const isSearching = useMemo(() => {
    const latestStatus = statusPills[statusPills.length - 1]?.status;
    return latestStatus === 'searching' || latestStatus === 'reading_sources';
  }, [statusPills]);

  // Determine if we have anything to show
  const hasContent = !!content;
  const hasStatusPills = statusPills.length > 0;
  const hasSources = discoveredSources.length > 0;
  const shouldShow = hasContent || hasStatusPills || isStreaming || hasSources;

  if (!shouldShow) return null;

  // Get latest status for header
  const latestPill = statusPills[statusPills.length - 1];
  const statusLabel = latestPill?.message || (isStreaming ? 'Thinking...' : 'Reasoning complete');

  return (
    <View style={styles.container}>
      {/* Header / Toggle */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Brain size={14} color={theme.colors.accent.primary} />
          </View>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        {isExpanded ? (
          <ChevronDown size={16} color={theme.colors.text.tertiary} />
        ) : (
          <ChevronRight size={16} color={theme.colors.text.tertiary} />
        )}
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.contentContainer}>
          {/* Processing Timeline */}
          <ProcessingTimeline
            statusPills={statusPills}
            isStreaming={isStreaming}
            hasContent={hasContent}
          />

          {/* Live Source Pills - shown during/after search */}
          {(hasSources || isSearching) && (
            <LiveSourcePills
              sources={discoveredSources}
              isSearching={isSearching}
            />
          )}

          {/* Reasoning Text Content (if available) */}
          {content && (
            <View style={styles.reasoningTextContainer}>
              <Text style={styles.reasoningText}>{content}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    letterSpacing: -0.1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
  },
  reasoningTextContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  reasoningText: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
