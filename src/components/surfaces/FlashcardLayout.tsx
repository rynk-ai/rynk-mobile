import React, { memo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Check, X, Shuffle, RotateCcw, Brain, Trophy, Lightbulb, Sparkles } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { FlashcardMetadata, SurfaceState } from '../../lib/types';

const { width } = Dimensions.get('window');

interface FlashcardLayoutProps {
  metadata: FlashcardMetadata;
  surfaceState: SurfaceState;
  onMarkCard?: (cardIndex: number, known: boolean) => void;
  onNextCard?: () => void;
  onPrevCard?: () => void;
  onShuffleCards?: () => void;
  onRestartDeck?: () => void;
}

export const FlashcardLayout = memo(function FlashcardLayout({
  metadata,
  surfaceState,
  onMarkCard,
  onNextCard,
  onPrevCard,
  onShuffleCards,
  onRestartDeck,
}: FlashcardLayoutProps) {
  const [showHint, setShowHint] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const flashcardState = surfaceState.flashcard;
  const currentIndex = flashcardState?.currentCard ?? 0;
  const currentCard = metadata.cards?.[currentIndex];
  const knownCards = flashcardState?.knownCards ?? [];
  const unknownCards = flashcardState?.unknownCards ?? [];

  const totalCards = metadata.cards?.length || 0;
  const reviewedCount = knownCards.length + unknownCards.length;
  const progressPercent = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;
  const remainingCards = totalCards - reviewedCount;

  const handleFlip = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
    setShowHint(false);
  }, [isFlipped, flipAnim]);

  const handleMark = useCallback((known: boolean) => {
    onMarkCard?.(currentIndex, known);
    flipAnim.setValue(0);
    setIsFlipped(false);
    setShowHint(false);
    onNextCard?.();
  }, [currentIndex, onMarkCard, onNextCard, flipAnim]);

  const handlePrev = useCallback(() => {
    flipAnim.setValue(0);
    setIsFlipped(false);
    setShowHint(false);
    onPrevCard?.();
  }, [onPrevCard, flipAnim]);

  const handleNext = useCallback(() => {
    flipAnim.setValue(0);
    setIsFlipped(false);
    setShowHint(false);
    onNextCard?.();
  }, [onNextCard, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const circumference = 2 * Math.PI * 64;

  // Completion state
  if (reviewedCount >= totalCards && flashcardState?.completed) {
    const knownPercent = totalCards > 0 ? Math.round((knownCards.length / totalCards) * 100) : 0;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.completionContainer}>
        <View style={styles.celebrationIcon}>
          <Trophy size={40} color={theme.colors.accent.primary} />
        </View>
        <Text style={styles.completionTitle}>Deck Complete!</Text>
        <Text style={styles.completionSubtitle}>{metadata.topic}</Text>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRingContainer}>
            <Svg width={140} height={140} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={70} cy={70} r={64} strokeWidth={12} stroke={theme.colors.border.subtle} fill="transparent" />
              <Circle
                cx={70} cy={70} r={64} strokeWidth={12}
                stroke={theme.colors.accent.primary}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - knownPercent / 100)}
              />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scorePercent}>{knownPercent}%</Text>
              <Text style={styles.scoreLabel}>MASTERED</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.statBoxGreen]}>
              <View style={styles.statRow}>
                <Check size={18} color="#22c55e" />
                <Text style={styles.statValueGreen}>{knownCards.length}</Text>
              </View>
              <Text style={styles.statLabel}>KNOWN</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxRed]}>
              <View style={styles.statRow}>
                <X size={18} color="#ef4444" />
                <Text style={styles.statValueRed}>{unknownCards.length}</Text>
              </View>
              <Text style={styles.statLabel}>NEED REVIEW</Text>
            </View>
          </View>
        </View>

        <View style={styles.completionActions}>
          <TouchableOpacity style={styles.restartButton} onPress={onRestartDeck}>
            <RotateCcw size={18} color={theme.colors.text.primary} />
            <Text style={styles.restartButtonText}>Start Over</Text>
          </TouchableOpacity>
          {unknownCards.length > 0 && (
            <TouchableOpacity style={styles.reviewMissedButton} onPress={onShuffleCards}>
              <Shuffle size={18} color="#fff" />
              <Text style={styles.reviewMissedText}>Review Missed ({unknownCards.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  if (!currentCard) {
    return (
      <View style={styles.loadingContainer}>
        <Sparkles size={32} color={theme.colors.text.tertiary} />
        <Text style={styles.loadingText}>Loading cards...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Brain size={20} color={theme.colors.accent.primary} />
          </View>
          <View>
            <Text style={styles.topicTitle}>{metadata.topic}</Text>
            <Text style={styles.topicDescription}>{metadata.description}</Text>
          </View>
        </View>
        <View style={styles.cardCounter}>
          <Text style={styles.cardCounterText}>{currentIndex + 1}</Text>
          <Text style={styles.cardCounterTotal}>/ {totalCards}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Check size={14} color="#22c55e" />
          <Text style={styles.statTextGreen}>{knownCards.length} known</Text>
        </View>
        <View style={styles.statItem}>
          <X size={14} color="#ef4444" />
          <Text style={styles.statTextRed}>{unknownCards.length} reviewing</Text>
        </View>
        <Text style={styles.remainingText}>{remainingCards} remaining</Text>
      </View>

      {/* Flashcard */}
      <TouchableOpacity activeOpacity={0.95} onPress={handleFlip} style={styles.cardWrapper}>
        {/* Front */}
        <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontInterpolate }] }]}>  
          <View style={[
            styles.difficultyBadge,
            currentCard.difficulty === 'easy' && styles.difficultyEasy,
            currentCard.difficulty === 'medium' && styles.difficultyMedium,
            currentCard.difficulty === 'hard' && styles.difficultyHard,
          ]}>
            <Text style={[
              styles.difficultyText,
              currentCard.difficulty === 'easy' && styles.difficultyEasyText,
              currentCard.difficulty === 'medium' && styles.difficultyMediumText,
              currentCard.difficulty === 'hard' && styles.difficultyHardText,
            ]}>{currentCard.difficulty?.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardNumber}>CARD {currentIndex + 1}</Text>
          <Text style={styles.cardText}>{currentCard.front}</Text>
          <View style={styles.flipHint}>
            <Sparkles size={14} color={theme.colors.text.tertiary} />
            <Text style={styles.flipHintText}>Tap to flip</Text>
          </View>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
          <Text style={styles.cardTextBack}>{currentCard.back}</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Hint */}
      {currentCard.hints && currentCard.hints.length > 0 && !isFlipped && (
        <View style={styles.hintContainer}>
          {showHint ? (
            <View style={styles.hintBox}>
              <Lightbulb size={16} color="#eab308" />
              <Text style={styles.hintText}>{currentCard.hints[0]}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.showHintButton} onPress={() => setShowHint(true)}>
              <Lightbulb size={16} color={theme.colors.text.secondary} />
              <Text style={styles.showHintText}>Show Hint</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrev} disabled={currentIndex === 0}>
            <ChevronLeft size={24} color={currentIndex === 0 ? theme.colors.text.tertiary : theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={handleNext} disabled={currentIndex >= totalCards - 1}>
            <ChevronRight size={24} color={currentIndex >= totalCards - 1 ? theme.colors.text.tertiary : theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {isFlipped ? (
          <View style={styles.markButtons}>
            <TouchableOpacity style={styles.missedButton} onPress={() => handleMark(false)}>
              <X size={20} color="#ef4444" />
              <Text style={styles.missedButtonText}>Missed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gotItButton} onPress={() => handleMark(true)}>
              <Check size={20} color="#fff" />
              <Text style={styles.gotItButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.flipPrompt}>Flip to rate</Text>
        )}

        <TouchableOpacity style={styles.shuffleButton} onPress={onShuffleCards}>
          <Shuffle size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  contentContainer: { padding: 16, paddingBottom: 40 },
  completionContainer: { padding: 24, alignItems: 'center', paddingTop: 48 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: theme.colors.text.secondary, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  topicTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  topicDescription: { fontSize: 12, color: theme.colors.text.secondary },
  cardCounter: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: theme.colors.background.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border.subtle },
  cardCounterText: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  cardCounterTotal: { fontSize: 11, color: theme.colors.text.tertiary, marginLeft: 2 },
  progressBar: { height: 6, backgroundColor: theme.colors.background.tertiary, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: theme.colors.accent.primary, borderRadius: 3 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTextGreen: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  statTextRed: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  remainingText: { fontSize: 11, color: theme.colors.text.tertiary, marginLeft: 'auto' },
  cardWrapper: { height: 220, marginBottom: 24 },
  card: { position: 'absolute', width: '100%', height: '100%', borderRadius: 16, padding: 24, justifyContent: 'center', alignItems: 'center', backfaceVisibility: 'hidden' },
  cardFront: { backgroundColor: theme.colors.background.secondary, borderWidth: 1, borderColor: theme.colors.border.subtle },
  cardBack: { backgroundColor: 'rgba(77, 125, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(77, 125, 255, 0.2)' },
  cardNumber: { position: 'absolute', top: 16, left: 16, fontSize: 10, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 1 },
  difficultyBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  difficultyEasy: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  difficultyMedium: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  difficultyHard: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  difficultyText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  difficultyEasyText: { color: '#22c55e' },
  difficultyMediumText: { color: '#f59e0b' },
  difficultyHardText: { color: '#ef4444' },
  cardText: { fontSize: 22, fontWeight: '500', color: theme.colors.text.primary, textAlign: 'center', lineHeight: 32 },
  cardTextBack: { fontSize: 20, fontWeight: '500', color: theme.colors.text.primary, textAlign: 'center', lineHeight: 30 },
  flipHint: { position: 'absolute', bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  flipHintText: { fontSize: 11, color: theme.colors.text.tertiary },
  hintContainer: { minHeight: 40, marginBottom: 20, alignItems: 'center' },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(234, 179, 8, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.2)' },
  hintText: { fontSize: 14, color: '#ca8a04' },
  showHintButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  showHintText: { fontSize: 14, color: theme.colors.text.secondary },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border.subtle },
  navButtons: { flexDirection: 'row', gap: 8 },
  navButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.background.tertiary, justifyContent: 'center', alignItems: 'center' },
  markButtons: { flexDirection: 'row', gap: 12 },
  missedButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(239, 68, 68, 0.3)' },
  missedButtonText: { color: '#ef4444', fontWeight: '600' },
  gotItButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#22c55e' },
  gotItButtonText: { color: '#fff', fontWeight: '600' },
  flipPrompt: { fontSize: 14, color: theme.colors.text.tertiary, fontStyle: 'italic' },
  shuffleButton: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  // Completion Styles
  celebrationIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  completionTitle: { fontSize: 28, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  completionSubtitle: { fontSize: 16, color: theme.colors.text.secondary, marginBottom: 32 },
  scoreCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: theme.colors.border.subtle, marginBottom: 24 },
  scoreRingContainer: { alignItems: 'center', marginBottom: 24 },
  scoreTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  scorePercent: { fontSize: 32, fontWeight: '700', color: theme.colors.text.primary },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statBoxGreen: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  statBoxRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statValueGreen: { fontSize: 24, fontWeight: '700', color: '#22c55e' },
  statValueRed: { fontSize: 24, fontWeight: '700', color: '#ef4444' },
  statLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.text.tertiary, letterSpacing: 0.5 },
  completionActions: { flexDirection: 'row', gap: 12 },
  restartButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.colors.background.secondary, borderWidth: 1, borderColor: theme.colors.border.subtle },
  restartButtonText: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  reviewMissedButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.colors.accent.primary },
  reviewMissedText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default FlashcardLayout;
