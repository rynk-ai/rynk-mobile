/**
 * ProcessingTimeline - Replicated from Web App
 * Features:
 * - Chain of Thought vertical structure
 * - 4 Stages: Files, Context, Search, Generate
 * - Collapsible steps with LayoutAnimation
 * - Embedded LiveSourcePills
 */

import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import {
  FileText,
  Database,
  Globe,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { StatusPill, SearchResult } from '../../lib/hooks/useStreaming';
import { LiveSourcePills, extractSourcesFromSearchResults, type DiscoveredSource } from './LiveSourcePills';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export interface ProcessingStage {
  id: 'files' | 'context' | 'search' | 'generate';
  label: string;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  description?: string;
  metadata?: any;
}

interface ProcessingTimelineProps {
  statusPills: StatusPill[];
  isStreaming: boolean;
  hasContent: boolean;
  searchResults?: SearchResult | null;
}

// ----------------------------------------------------------------------
// 1. Data Logic (Ported from Web)
// ----------------------------------------------------------------------

function deriveStages(
  statusPills: StatusPill[],
  isStreaming: boolean,
  hasContent: boolean
): ProcessingStage[] {
  const stages: ProcessingStage[] = [];
  
  // Safe access
  const safePills = statusPills || [];
  const latestStatus = safePills.length > 0 ? safePills[safePills.length - 1] : null;
  const currentStatus = latestStatus?.status;
  
  // Check if we have any status that indicates web search happened
  const hasSearched = safePills.some(s => 
    s.status === 'searching' || s.status === 'reading_sources'
  );
  
  // Check if context was built
  const hasBuiltContext = safePills.some(s => s.status === 'building_context');
  const contextPill = safePills.find(s => s.status === 'building_context');
  
  // Note: 'Files' stage skipped as we don't have indexingJobs prop yet in mobile
  
  // 2. Context stage
  if (hasBuiltContext || hasSearched || currentStatus === 'synthesizing' || hasContent) {
    const isContextComplete = hasSearched || currentStatus === 'synthesizing' || hasContent;
    // Mobile metadata might differ, checking generic metadata structure
    const contextChunks = (contextPill?.metadata as any)?.contextChunks;
    
    stages.push({
      id: 'context',
      label: isContextComplete 
        ? `Retrieved ${contextChunks || 'relevant'} context${contextChunks && contextChunks > 1 ? ' chunks' : ' chunk'}` 
        : 'Building context',
      status: isContextComplete
        ? 'complete' 
        : currentStatus === 'building_context' 
          ? 'active' 
          : 'pending',
      description: contextChunks 
        ? `Found ${contextChunks} relevant pieces of information` 
        : 'Searching through conversation history',
      metadata: contextPill?.metadata
    });
  }
  
  // 3. Search stage
  if (hasSearched) {
    const searchPill = safePills.find(s => s.status === 'reading_sources' || s.status === 'searching');
    const isSearchComplete = currentStatus === 'synthesizing' || hasContent;
    const sourceCount = (searchPill?.metadata as any)?.sourceCount;
    const currentSource = (searchPill?.metadata as any)?.currentSource;
    
    stages.push({
      id: 'search',
      label: isSearchComplete 
        ? `Found ${sourceCount || ''} sources` 
        : 'Searching the web',
      status: isSearchComplete 
        ? 'complete' 
        : (currentStatus === 'searching' || currentStatus === 'reading_sources')
          ? 'active'
          : 'pending',
      description: currentSource 
        ? `Currently reading: ${currentSource}`
        : sourceCount 
          ? `Gathered information from ${sourceCount} web sources`
          : 'Finding relevant sources from the web',
      metadata: searchPill?.metadata
    });
  }
  
  // 4. Generate stage
  if (isStreaming || hasContent || currentStatus === 'synthesizing') {
    stages.push({
      id: 'generate',
      label: hasContent ? 'Response complete' : 'Generating response',
      status: hasContent 
        ? 'complete' 
        : isStreaming || currentStatus === 'synthesizing'
          ? 'active'
          : 'pending',
      description: hasContent 
        ? undefined
        : 'Synthesizing information into a comprehensive answer'
    });
  }
  
  // Fallback: If no stages derived but streaming (e.g. very start), show generic "Thinking"
  if (stages.length === 0 && isStreaming) {
      // We can use 'context' or 'generate' as placeholder
      stages.push({
          id: 'generate', // Use generate icon (Sparkles)
          label: 'Thinking...',
          status: 'active',
          description: 'Analyzing your request'
      });
  }
  
  return stages;
}

// ----------------------------------------------------------------------
// 2. UI Components (Chain of Thought)
// ----------------------------------------------------------------------

function StageIcon({ stageId, status }: { stageId: ProcessingStage['id'], status: ProcessingStage['status'] }) {
  const size = 14;
  const color = status === 'active' ? theme.colors.accent.primary : 
                status === 'complete' ? theme.colors.accent.primary : // Web uses primary for check too? Web uses text-primary which is black/white. Mobile uses accent for check.
                theme.colors.text.tertiary;

  if (status === 'complete') {
    return <Check size={size} color={color} />;
  }
  
  if (status === 'active') {
    return <Loader2 size={size} color={theme.colors.accent.primary} />; // Animate this via parent or effect if possible
  }
  
  switch (stageId) {
    case 'files': return <FileText size={size} color={color} />;
    case 'context': return <Database size={size} color={color} />;
    case 'search': return <Globe size={size} color={color} />;
    case 'generate': return <Sparkles size={size} color={color} />;
    default: return <Sparkles size={size} color={color} />;
  }
}

function ChainOfThoughtStep({ 
    stage, 
    isLast, 
    children 
}: { 
    stage: ProcessingStage, 
    isLast: boolean, 
    children?: React.ReactNode 
}) {
    // Default open if active
    const [isOpen, setIsOpen] = useState(stage.status === 'active');
    
    // Auto-open when becoming active
    useEffect(() => {
        if (stage.status === 'active') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setIsOpen(true);
        }
    }, [stage.status]);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    const isComplete = stage.status === 'complete';
    const isActive = stage.status === 'active';
    
    return (
        <View style={styles.stepContainer}>
            {/* Header */}
            <Pressable onPress={toggleOpen} style={styles.stepHeader}>
                <View style={styles.iconContainer}>
                    <StageIcon stageId={stage.id} status={stage.status} />
                </View>
                <Text style={[
                    styles.stepLabel, 
                    isActive && styles.labelActive,
                    isComplete && styles.labelComplete
                ]}>
                    {stage.label}
                </Text>
                 {/* Optional: Add chevron if desired, web has it on hover or implicit */}
            </Pressable>

            {/* Vertical Connector Line */}
            {!isLast && <View style={[styles.connectorLine, { backgroundColor: theme.colors.border.subtle }]} />}

            {/* Content */}
            {isOpen && (
                <View style={styles.stepContent}>
                    {stage.description && (
                        <Text style={styles.stepDescription}>{stage.description}</Text>
                    )}
                    {children}
                </View>
            )}
        </View>
    );
}

// ----------------------------------------------------------------------
// 3. Main Component
// ----------------------------------------------------------------------

export const ProcessingTimeline = memo(function ProcessingTimeline({
  statusPills,
  isStreaming,
  hasContent,
  searchResults,
}: ProcessingTimelineProps) {
  const stages = useMemo(
    () => deriveStages(statusPills, isStreaming, hasContent),
    [statusPills, isStreaming, hasContent]
  );
  
  // Filter visible stages
  const visibleStages = useMemo(
    () => stages.filter(s => s.status === 'active' || s.status === 'complete'),
    [stages]
  );
  
  const discoveredSources = useMemo(
      () => extractSourcesFromSearchResults(searchResults), 
      [searchResults]
  );
  
  if (visibleStages.length === 0) return null;

  // Web Logic: Don't render if everything is complete and we have content
  // "const allComplete = visibleStages.every(s => s.status === 'complete')"
  // "if (allComplete && hasContent && !isStreaming) return null"
  const allComplete = visibleStages.every(s => s.status === 'complete');
  if (allComplete && hasContent && !isStreaming) {
      return null;
  }

  return (
    <View style={styles.container}>
      {visibleStages.map((stage, index) => (
        <ChainOfThoughtStep
          key={stage.id}
          stage={stage}
          isLast={index === visibleStages.length - 1}
        >
            {/* Inject LiveSourcePills into Search stage */}
            {stage.id === 'search' && discoveredSources.length > 0 && (
                <View style={{ marginTop: 8 }}>
                    <LiveSourcePills 
                        sources={discoveredSources} 
                        isSearching={stage.status === 'active'} 
                    />
                </View>
            )}
        </ChainOfThoughtStep>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepContainer: {
    position: 'relative',
    paddingBottom: 4, 
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    zIndex: 2, // Ensure clickability
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: theme.colors.background.secondary, // Mask the line behind it? No, line starts below.
    zIndex: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  labelActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  labelComplete: {
    color: theme.colors.text.secondary,
  },
  connectorLine: {
    position: 'absolute',
    left: 9.5, // Center of 20px icon is 10. Line width 1. Left = 10 - 0.5 = 9.5
    top: 24, // Start below icon (20 height + pad 4?)
    bottom: 0,
    width: 1,
    zIndex: 1,
  },
  stepContent: {
    marginLeft: 30, // Indent content (20 icon + 10 gap)
    paddingBottom: 12,
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 18,
  },
});
