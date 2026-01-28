
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProcessingTimeline, IndexingJob, PDFJob } from './ProcessingTimeline';
import type { StatusPill } from '../../lib/types';

interface SearchSource {
  url: string;
  title: string;
  snippet?: string;
}

interface SearchResults {
  sources: SearchSource[];
}

interface ReasoningDisplayProps {
  statuses: StatusPill[];
  searchResults?: SearchResults | null;
  isComplete?: boolean;
  indexingJobs?: IndexingJob[];
  isStreaming?: boolean;
  hasContent?: boolean;
}

export function ReasoningDisplay({
  statuses,
  searchResults,
  isComplete = false,
  indexingJobs = [],
  isStreaming = false,
  hasContent = false,
}: ReasoningDisplayProps) {
  // Mobile currently doesn't have usePdfJobs hook yet, so we pass empty
  const pdfJobs: PDFJob[] = []; 

  const sourceCount = searchResults?.sources?.length || 0;
  
  // Create optimistic "thinking" status
  const effectiveStatuses = useMemo(() => {
    if (isStreaming && (!statuses || statuses.length === 0)) {
      return [{
        status: "analyzing" as const, // Cast as const to match literal type
        message: "Thinking...",
        timestamp: Date.now(),
      }];
    }
    return statuses || [];
  }, [statuses, isStreaming]);
  
  const shouldShow = 
    (isStreaming && effectiveStatuses.length > 0) ||
    (effectiveStatuses.length > 0 && !(isComplete && sourceCount === 0));

  if (!shouldShow) return null;

  return (
    <View style={styles.container}>
      <ProcessingTimeline
        statusPills={effectiveStatuses}
        indexingJobs={indexingJobs}
        pdfJobs={pdfJobs}
        isStreaming={isStreaming}
        hasContent={hasContent}
        searchResults={searchResults}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  }
});
