import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Svg, { Circle } from 'react-native-svg';
import { Check, Clock, Lock, ChevronDown, ChevronUp, Sparkles, Trophy, Circle as CircleIcon } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { GuideMetadata, SurfaceState } from '../../lib/types';

interface GuideLayoutProps {
  metadata: GuideMetadata;
  surfaceState: SurfaceState;
  onGenerateCheckpoint?: (checkpointIndex: number) => Promise<void>;
  onMarkComplete?: (checkpointIndex: number) => void;
  isGenerating?: boolean;
}

export const GuideLayout = memo(function GuideLayout({
  metadata,
  surfaceState,
  onGenerateCheckpoint,
  onMarkComplete,
  isGenerating = false,
}: GuideLayoutProps) {
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<number>(-1);

  const checkpoints = metadata.checkpoints || [];
  const currentCheckpoint = surfaceState?.guide?.currentCheckpoint ?? 0;
  const completedCheckpoints = surfaceState?.guide?.completedCheckpoints || [];
  const checkpointContent = surfaceState?.guide?.checkpointContent || {};
  
  const progress = checkpoints.length > 0 
    ? Math.round((completedCheckpoints.length / checkpoints.length) * 100) 
    : 0;
  const isComplete = completedCheckpoints.length === checkpoints.length && checkpoints.length > 0;

  const getCheckpointStatus = useCallback((index: number): 'completed' | 'current' | 'locked' => {
    if (completedCheckpoints.includes(index)) return 'completed';
    if (index === currentCheckpoint) return 'current';
    return 'locked';
  }, [completedCheckpoints, currentCheckpoint]);

  const handleCheckpointClick = useCallback((index: number) => {
    const status = getCheckpointStatus(index);
    if (status === 'locked') return;
    
    if (expandedCheckpoint === index) {
      setExpandedCheckpoint(-1);
    } else {
      setExpandedCheckpoint(index);
      if (!checkpointContent[index] && status === 'current' && onGenerateCheckpoint) {
        onGenerateCheckpoint(index);
      }
    }
  }, [expandedCheckpoint, checkpointContent, getCheckpointStatus, onGenerateCheckpoint]);

  const handleMarkComplete = useCallback((index: number) => {
    onMarkComplete?.(index);
    setExpandedCheckpoint(-1);
  }, [onMarkComplete]);

  const circumference = 2 * Math.PI * 34;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroLeft}>
            <View style={[
              styles.difficultyBadge,
              metadata.difficulty === 'beginner' && styles.difficultyBeginner,
              metadata.difficulty === 'intermediate' && styles.difficultyIntermediate,
              metadata.difficulty === 'advanced' && styles.difficultyAdvanced,
            ]}>
              <Text style={[
                styles.difficultyText,
                metadata.difficulty === 'beginner' && styles.difficultyBeginnerText,
                metadata.difficulty === 'intermediate' && styles.difficultyIntermediateText,
                metadata.difficulty === 'advanced' && styles.difficultyAdvancedText,
              ]}>{metadata.difficulty?.toUpperCase()}</Text>
            </View>
            
            <Text style={styles.title}>{metadata.title}</Text>
            <Text style={styles.description}>{metadata.description}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Check size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>{checkpoints.length} checkpoints</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>~{metadata.estimatedTime} min</Text>
              </View>
            </View>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <Svg width={80} height={80} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={40} cy={40} r={34} strokeWidth={6} stroke={theme.colors.border.subtle} fill="transparent" />
              <Circle
                cx={40} cy={40} r={34} strokeWidth={6}
                stroke={theme.colors.accent.primary}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress / 100)}
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <Text style={styles.progressMeta}>{completedCheckpoints.length} of {checkpoints.length}</Text>
          </View>
        </View>
      </View>

      {/* Completion Banner */}
      {isComplete && (
        <View style={styles.completionBanner}>
          <View style={styles.completionIcon}>
            <Trophy size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.completionTitle}>Checklist Complete!</Text>
            <Text style={styles.completionSubtitle}>You've successfully completed all checkpoints.</Text>
          </View>
        </View>
      )}

      {/* Checkpoints */}
      <View style={styles.checkpointsContainer}>
        {checkpoints.map((checkpoint, index) => {
          const status = getCheckpointStatus(index);
          const isExpanded = expandedCheckpoint === index;
          const content = checkpointContent[index] || null;
          const isCheckpointGenerating = isGenerating && expandedCheckpoint === index && !content;

          return (
            <View key={checkpoint.id} style={[
              styles.checkpointCard,
              status === 'completed' && styles.checkpointCompleted,
              status === 'current' && styles.checkpointCurrent,
              status === 'locked' && styles.checkpointLocked,
            ]}>
              <TouchableOpacity
                onPress={() => handleCheckpointClick(index)}
                disabled={status === 'locked'}
                style={styles.checkpointHeader}
              >
                {/* Status Icon */}
                <View style={[
                  styles.statusIcon,
                  status === 'completed' && styles.statusCompleted,
                  status === 'current' && styles.statusCurrent,
                  status === 'locked' && styles.statusLocked,
                ]}>
                  {status === 'completed' ? (
                    <Check size={16} color="#fff" />
                  ) : status === 'locked' ? (
                    <Lock size={14} color={theme.colors.text.tertiary} />
                  ) : (
                    <CircleIcon size={16} color={theme.colors.accent.primary} />
                  )}
                </View>

                <View style={styles.checkpointInfo}>
                  <View style={styles.checkpointTitleRow}>
                    <Text style={[
                      styles.checkpointTitle,
                      status === 'locked' && styles.checkpointTitleLocked,
                    ]}>{checkpoint.title}</Text>
                    {status === 'current' && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  {checkpoint.description && (
                    <Text style={styles.checkpointDescription}>{checkpoint.description}</Text>
                  )}
                  <View style={styles.checkpointMeta}>
                    <Clock size={12} color={theme.colors.text.tertiary} />
                    <Text style={styles.checkpointMetaText}>~{checkpoint.estimatedTime} min</Text>
                  </View>
                </View>

                {status !== 'locked' && (
                  <View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={theme.colors.text.tertiary} />
                    ) : (
                      <ChevronDown size={20} color={theme.colors.text.tertiary} />
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {/* Expanded Content */}
              {isExpanded && status !== 'locked' && (
                <View style={styles.expandedContent}>
                  {isCheckpointGenerating ? (
                    <View style={styles.loadingContainer}>
                      <Sparkles size={24} color={theme.colors.text.tertiary} />
                      <Text style={styles.loadingText}>Generating content...</Text>
                    </View>
                  ) : content ? (
                    <View>
                      <Markdown style={markdownStyles}>{content}</Markdown>
                      {status === 'current' && (
                        <TouchableOpacity
                          style={styles.markCompleteButton}
                          onPress={() => handleMarkComplete(index)}
                        >
                          <Check size={16} color="#fff" />
                          <Text style={styles.markCompleteText}>Mark Complete</Text>
                        </TouchableOpacity>
                      )}
                      {status === 'completed' && (
                        <View style={styles.completedRow}>
                          <Check size={18} color="#22c55e" />
                          <Text style={styles.completedText}>Checkpoint completed!</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => onGenerateCheckpoint?.(index)}
                    >
                      <Sparkles size={16} color="#fff" />
                      <Text style={styles.generateButtonText}>Generate Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
});

const markdownStyles = StyleSheet.create({
  body: { color: theme.colors.text.primary, fontSize: 15, lineHeight: 24 },
  heading2: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8, color: theme.colors.text.primary },
  paragraph: { marginBottom: 12 },
  code_inline: { backgroundColor: theme.colors.background.secondary, paddingHorizontal: 4, borderRadius: 4, color: theme.colors.accent.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  contentContainer: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border.subtle },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  heroLeft: { flex: 1 },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  difficultyBeginner: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  difficultyIntermediate: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  difficultyAdvanced: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  difficultyText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  difficultyBeginnerText: { color: '#22c55e' },
  difficultyIntermediateText: { color: '#f59e0b' },
  difficultyAdvancedText: { color: '#ef4444' },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  description: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: theme.colors.text.secondary },
  progressContainer: { alignItems: 'center', justifyContent: 'center' },
  progressTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 20, justifyContent: 'center', alignItems: 'center' },
  progressPercent: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  progressMeta: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 4 },
  completionBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(77, 125, 255, 0.1)', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(77, 125, 255, 0.2)' },
  completionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.accent.primary, justifyContent: 'center', alignItems: 'center' },
  completionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  completionSubtitle: { fontSize: 14, color: theme.colors.text.secondary },
  checkpointsContainer: { gap: 12 },
  checkpointCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  checkpointCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' },
  checkpointCurrent: { backgroundColor: theme.colors.background.secondary, borderColor: 'rgba(77, 125, 255, 0.3)' },
  checkpointLocked: { backgroundColor: theme.colors.background.tertiary, borderColor: theme.colors.border.subtle, opacity: 0.6 },
  checkpointHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  statusIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statusCompleted: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  statusCurrent: { backgroundColor: 'rgba(77, 125, 255, 0.1)', borderColor: theme.colors.accent.primary },
  statusLocked: { backgroundColor: theme.colors.background.tertiary, borderColor: theme.colors.border.subtle },
  checkpointInfo: { flex: 1 },
  checkpointTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  checkpointTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  checkpointTitleLocked: { color: theme.colors.text.tertiary },
  currentBadge: { backgroundColor: 'rgba(77, 125, 255, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  currentBadgeText: { fontSize: 9, fontWeight: '700', color: theme.colors.accent.primary, letterSpacing: 0.5 },
  checkpointDescription: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
  checkpointMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  checkpointMetaText: { fontSize: 12, color: theme.colors.text.tertiary },
  expandedContent: { padding: 20, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.primary },
  loadingContainer: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.colors.text.secondary },
  markCompleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  markCompleteText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle },
  completedText: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.accent.primary, paddingVertical: 12, borderRadius: 10 },
  generateButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default GuideLayout;
