/**
 * ProcessingTimeline - Collapsible processing stages display
 * Shows analyzing → searching → generating stages with status icons
 * Swiss Modern: Sharp corners, minimal design
 */

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Sparkles,
  Search,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { StatusPill } from '../../lib/hooks/useStreaming';

interface ProcessingStage {
  id: 'analyzing' | 'searching' | 'generating';
  label: string;
  status: 'pending' | 'active' | 'complete';
  description?: string;
}

interface ProcessingTimelineProps {
  statusPills: StatusPill[];
  isStreaming: boolean;
  hasContent: boolean;
}

// Map status types to stages
// StatusPill types: 'analyzing' | 'building_context' | 'searching' | 'reading_sources' | 'synthesizing' | 'complete'
function deriveStages(
  statusPills: StatusPill[],
  isStreaming: boolean,
  hasContent: boolean
): ProcessingStage[] {
  const stages: ProcessingStage[] = [
    { id: 'analyzing', label: 'Analyzing', status: 'pending' },
    { id: 'searching', label: 'Searching', status: 'pending' },
    { id: 'generating', label: 'Generating', status: 'pending' },
  ];

  // Get most recent status
  const latestStatus = statusPills[statusPills.length - 1]?.status;
  const latestMessage = statusPills[statusPills.length - 1]?.message;

  // Determine stage states based on status pills
  if (latestStatus === 'analyzing' || latestStatus === 'building_context') {
    stages[0].status = 'active';
    stages[0].description = latestMessage;
  } else if (latestStatus === 'searching' || latestStatus === 'reading_sources') {
    stages[0].status = 'complete';
    stages[1].status = 'active';
    stages[1].description = latestMessage;
  } else if (latestStatus === 'synthesizing') {
    stages[0].status = 'complete';
    stages[1].status = 'complete';
    stages[2].status = 'active';
    stages[2].description = latestMessage;
  } else if (latestStatus === 'complete' || (hasContent && !isStreaming)) {
    // All complete
    stages[0].status = 'complete';
    stages[1].status = 'complete';
    stages[2].status = 'complete';
  }

  // If streaming but no statuses yet, show analyzing as active
  if (isStreaming && statusPills.length === 0) {
    stages[0].status = 'active';
    stages[0].description = 'Thinking...';
  }

  return stages;
}

function StageIcon({
  stageId,
  status,
}: {
  stageId: ProcessingStage['id'];
  status: ProcessingStage['status'];
}) {
  const size = 14;
  
  // Status-based coloring
  if (status === 'complete') {
    return <Check size={size} color={theme.colors.accent.success} />;
  }
  
  if (status === 'active') {
    return <Loader2 size={size} color={theme.colors.accent.primary} />;
  }

  // Pending - show stage icon in muted color
  const color = theme.colors.text.tertiary;
  switch (stageId) {
    case 'analyzing':
      return <Brain size={size} color={color} />;
    case 'searching':
      return <Search size={size} color={color} />;
    case 'generating':
      return <Sparkles size={size} color={color} />;
  }
}

function StageItem({
  stage,
  isLast,
}: {
  stage: ProcessingStage;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(stage.status === 'active');

  const labelColor =
    stage.status === 'active'
      ? theme.colors.text.primary
      : stage.status === 'complete'
      ? theme.colors.text.secondary
      : theme.colors.text.tertiary;

  return (
    <View style={styles.stageItem}>
      <Pressable
        style={styles.stageHeader}
        onPress={() => setExpanded(!expanded)}
        disabled={!stage.description}
      >
        <View style={styles.stageIconContainer}>
          <StageIcon stageId={stage.id} status={stage.status} />
        </View>
        <Text style={[styles.stageLabel, { color: labelColor }]}>
          {stage.label}
        </Text>
        {stage.description && (
          <View style={styles.chevron}>
            {expanded ? (
              <ChevronDown size={12} color={theme.colors.text.tertiary} />
            ) : (
              <ChevronRight size={12} color={theme.colors.text.tertiary} />
            )}
          </View>
        )}
      </Pressable>
      
      {expanded && stage.description && (
        <View style={styles.stageContent}>
          <Text style={styles.stageDescription}>{stage.description}</Text>
        </View>
      )}
      
      {!isLast && <View style={styles.connector} />}
    </View>
  );
}

export function ProcessingTimeline({
  statusPills,
  isStreaming,
  hasContent,
}: ProcessingTimelineProps) {
  const stages = useMemo(
    () => deriveStages(statusPills, isStreaming, hasContent),
    [statusPills, isStreaming, hasContent]
  );

  // Don't show if all complete and has content
  const allComplete = stages.every((s) => s.status === 'complete');
  if (allComplete && hasContent && !isStreaming) {
    return null;
  }

  // Only show stages that are active or complete
  const visibleStages = stages.filter(
    (s) => s.status === 'active' || s.status === 'complete'
  );

  if (visibleStages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleStages.map((stage, index) => (
        <StageItem
          key={stage.id}
          stage={stage}
          isLast={index === visibleStages.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  stageItem: {
    position: 'relative',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stageIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    paddingLeft: 4,
  },
  stageContent: {
    marginLeft: 32,
    paddingBottom: 8,
  },
  stageDescription: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  connector: {
    position: 'absolute',
    left: 11.5,
    top: 30,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.border.subtle,
  },
});
