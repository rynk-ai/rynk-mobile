import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import Svg, { Circle } from 'react-native-svg';
import { BookOpen, Check, Lock, ChevronRight, Sparkles, Trophy, Clock } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { LearningMetadata, SurfaceState } from '../../lib/types';

interface LearningLayoutProps {
  metadata: LearningMetadata;
  surfaceState: SurfaceState;
  onGenerateChapter?: (chapterIndex: number) => Promise<void>;
  onMarkChapterComplete?: (chapterIndex: number) => void;
  isGenerating?: boolean;
}

export const LearningLayout = memo(function LearningLayout({
  metadata,
  surfaceState,
  onGenerateChapter,
  onMarkChapterComplete,
  isGenerating = false,
}: LearningLayoutProps) {
  const [activeChapter, setActiveChapter] = useState<number>(0);

  const chapters = metadata.chapters || [];
  const currentChapter = surfaceState?.learning?.currentChapter ?? 0;
  const completedChapters = surfaceState?.learning?.completedChapters || [];
  const chapterContent = surfaceState?.learning?.chapterContent || {};

  const progress = chapters.length > 0 ? Math.round((completedChapters.length / chapters.length) * 100) : 0;
  const isComplete = completedChapters.length === chapters.length && chapters.length > 0;
  const circumference = 2 * Math.PI * 34;

  const getChapterStatus = useCallback((index: number): 'completed' | 'current' | 'locked' => {
    if (completedChapters.includes(index)) return 'completed';
    if (index <= currentChapter) return 'current';
    return 'locked';
  }, [completedChapters, currentChapter]);

  const handleChapterSelect = useCallback((index: number) => {
    const status = getChapterStatus(index);
    if (status === 'locked') return;
    setActiveChapter(index);
    if (!chapterContent[index] && onGenerateChapter) {
      onGenerateChapter(index);
    }
  }, [getChapterStatus, chapterContent, onGenerateChapter]);

  const currentChapterData = chapters[activeChapter];
  const currentContent = chapterContent[activeChapter];
  const isChapterGenerating = isGenerating && !currentContent;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <BookOpen size={20} color={theme.colors.accent.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>{metadata.title}</Text>
            <Text style={styles.headerSubtitle}>{chapters.length} chapters</Text>
          </View>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressRing}>
          <Svg width={50} height={50} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={25} cy={25} r={20} strokeWidth={4} stroke={theme.colors.border.subtle} fill="transparent" />
            <Circle
              cx={25} cy={25} r={20} strokeWidth={4}
              stroke={theme.colors.accent.primary}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
            />
          </Svg>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      {/* Completion Banner */}
      {isComplete && (
        <View style={styles.completionBanner}>
          <Trophy size={20} color="#f59e0b" />
          <Text style={styles.completionText}>Course Complete!</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Chapter List (Sidebar) */}
        <ScrollView style={styles.chapterList} showsVerticalScrollIndicator={false}>
          {chapters.map((chapter, index) => {
            const status = getChapterStatus(index);
            const isActive = activeChapter === index;

            return (
              <TouchableOpacity
                key={chapter.id || index}
                style={[
                  styles.chapterItem,
                  isActive && styles.chapterItemActive,
                  status === 'locked' && styles.chapterItemLocked,
                ]}
                onPress={() => handleChapterSelect(index)}
                disabled={status === 'locked'}
              >
                <View style={[
                  styles.chapterIcon,
                  status === 'completed' && styles.chapterIconCompleted,
                  status === 'current' && isActive && styles.chapterIconActive,
                ]}>
                  {status === 'completed' ? (
                    <Check size={12} color="#fff" />
                  ) : status === 'locked' ? (
                    <Lock size={10} color={theme.colors.text.tertiary} />
                  ) : (
                    <Text style={styles.chapterNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[
                  styles.chapterTitle,
                  isActive && styles.chapterTitleActive,
                  status === 'locked' && styles.chapterTitleLocked,
                ]} numberOfLines={2}>{chapter.title}</Text>
                {isActive && <ChevronRight size={16} color={theme.colors.accent.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chapter Content */}
        <ScrollView style={styles.chapterContent} contentContainerStyle={styles.chapterContentInner}>
          {currentChapterData && (
            <>
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterLabel}>CHAPTER {activeChapter + 1}</Text>
                <Text style={styles.chapterMainTitle}>{currentChapterData.title}</Text>
                {currentChapterData.estimatedTime && (
                  <View style={styles.timeRow}>
                    <Clock size={12} color={theme.colors.text.tertiary} />
                    <Text style={styles.timeText}>~{currentChapterData.estimatedTime} min</Text>
                  </View>
                )}
              </View>

              {isChapterGenerating ? (
                <View style={styles.loadingContainer}>
                  <Sparkles size={24} color={theme.colors.text.tertiary} />
                  <Text style={styles.loadingText}>Generating content...</Text>
                </View>
              ) : currentContent ? (
                <View style={styles.contentBody}>
                  <Markdown style={markdownStyles}>{currentContent}</Markdown>

                  {getChapterStatus(activeChapter) === 'current' && (
                    <TouchableOpacity
                      style={styles.markCompleteButton}
                      onPress={() => onMarkChapterComplete?.(activeChapter)}
                    >
                      <Check size={16} color="#fff" />
                      <Text style={styles.markCompleteText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={() => onGenerateChapter?.(activeChapter)}
                >
                  <Sparkles size={16} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Content</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
});

const markdownStyles = StyleSheet.create({
  body: {},
  textgroup: { color: theme.colors.text.primary, fontSize: 15, lineHeight: 26 },
  heading2: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10, color: theme.colors.text.primary },
  heading3: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: theme.colors.text.primary },
  paragraph: { marginBottom: 14 },
  code_inline: { backgroundColor: theme.colors.background.tertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 13, color: theme.colors.accent.primary },
  list_item: { marginBottom: 6 },
  bullet_list: { marginBottom: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  headerSubtitle: { fontSize: 12, color: theme.colors.text.secondary },
  progressRing: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  progressText: { position: 'absolute', fontSize: 11, fontWeight: '700', color: theme.colors.text.primary },
  completionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(245, 158, 11, 0.2)' },
  completionText: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },
  content: { flex: 1, flexDirection: 'row' },
  chapterList: { width: 140, borderRightWidth: 1, borderRightColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.secondary },
  chapterItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  chapterItemActive: { backgroundColor: theme.colors.background.primary },
  chapterItemLocked: { opacity: 0.5 },
  chapterIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: theme.colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  chapterIconCompleted: { backgroundColor: '#22c55e' },
  chapterIconActive: { backgroundColor: 'rgba(77, 125, 255, 0.2)' },
  chapterNumber: { fontSize: 11, fontWeight: '600', color: theme.colors.text.secondary },
  chapterTitle: { fontSize: 12, color: theme.colors.text.secondary, flex: 1 },
  chapterTitleActive: { color: theme.colors.text.primary, fontWeight: '600' },
  chapterTitleLocked: { color: theme.colors.text.tertiary },
  chapterContent: { flex: 1 },
  chapterContentInner: { padding: 20 },
  chapterHeader: { marginBottom: 20 },
  chapterLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.accent.primary, letterSpacing: 1, marginBottom: 6 },
  chapterMainTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: theme.colors.text.tertiary },
  loadingContainer: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.colors.text.secondary },
  contentBody: {},
  markCompleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  markCompleteText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.accent.primary, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  generateButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default LearningLayout;
