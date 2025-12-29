import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { StatusPills, type StatusPill } from './StatusPills';

interface ReasoningDisplayProps {
  content?: string | null;
  statusPills?: StatusPill[];
  isStreaming?: boolean;
}

export function ReasoningDisplay({ content, statusPills = [], isStreaming = false }: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Determine if we should show the toggle
  // Show if we have content OR if we have pills (even if empty content for now)
  const hasContent = !!content || statusPills.length > 0;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Height animation needs false
    }).start();
  }, [isExpanded, animation]);

  if (!hasContent) return null;

  const latestPill = statusPills[statusPills.length - 1];
  const statusLabel = latestPill?.message || (isStreaming ? 'Thinking...' : 'Reasoning complete');
  
  // Calculate height interpolation (simplified, ideally we measure content)
  // For now we just animate opacity/transform of the content container
  
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

      {/* Content */}
      {isExpanded && (
        <View style={styles.contentContainer}>
          {/* Status Pills Visualization */}
          {statusPills.length > 0 && (
            <View style={styles.pillsContainer}>
               <StatusPills pills={statusPills} />
            </View>
          )}

          {/* Reasoning Text Content */}
          {content ? (
            <View style={styles.reasoningTextContainer}>
              <Text style={styles.reasoningText}>{content}</Text>
            </View>
          ) : isStreaming ? (
            <Text style={styles.placeholderText}>Generating reasoning...</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.primary + '40', // Slight transparency
  },
  pillsContainer: {
    marginVertical: 12,
  },
  reasoningTextContainer: {
    padding: 12, // Inner card look
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  reasoningText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace for technical look
  },
  placeholderText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    padding: 8,
  },
});
