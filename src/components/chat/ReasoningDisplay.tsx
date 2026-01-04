/**
 * ReasoningDisplay - Replicates Web App "reasoning-display.tsx"
 * Thin wrapper around ProcessingTimeline.
 * Swiss Modern: Sharp corners, minimal design
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StatusPill, SearchResult } from '../../lib/hooks/useStreaming';
import { ProcessingTimeline } from './ProcessingTimeline';
import { extractSourcesFromSearchResults } from './LiveSourcePills';

interface ReasoningDisplayProps {
  content?: string | null; // Kept for interface compatibility but unused for text rendering
  statusPills?: StatusPill[];
  searchResults?: SearchResult | null;
  isStreaming?: boolean;
  hasContent?: boolean; // Prop from Web App logic
}

export function ReasoningDisplay({
  content,
  statusPills = [],
  searchResults,
  isStreaming = false,
  hasContent = false,
}: ReasoningDisplayProps) {
  
  // Ensure statusPills is an array even if null is passed
  const safeStatusPills = statusPills || [];

  // Extract sources to check counts (for visibility logic)
  const discoveredSources = useMemo(
    () => extractSourcesFromSearchResults(searchResults),
    [searchResults]
  );
  
  // Determine if we should show the timeline (Ported from Web)
  // Show if: streaming (even if pills empty, we show optimistic 'Thinking' in timeline derived logic)
  // OR has real statuses
  const shouldShow = isStreaming || safeStatusPills.length > 0;

  if (!shouldShow) return null;

  return (
    <View style={styles.container}>
      <ProcessingTimeline
        statusPills={safeStatusPills}
        isStreaming={isStreaming}
        hasContent={hasContent} // Pass hasContent to allow timeline to complete/hide
        searchResults={searchResults}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    // No border or background here, ProcessingTimeline handles its own steps
  },
});
