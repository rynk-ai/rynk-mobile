
import React, { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { QuizMetadata, SurfaceState } from '../../lib/types';

interface QuizLayoutProps {
  metadata: QuizMetadata;
  surfaceState: SurfaceState;
  onAnswerQuestion: (questionIndex: number, answer: string | number) => void;
  onNextQuestion: () => void;
  onRestartQuiz: () => void;
  isGenerating?: boolean;
}

export const QuizLayout = memo(function QuizLayout({
  metadata,
  surfaceState,
  onAnswerQuestion,
  onNextQuestion,
  onRestartQuiz,
  isGenerating = false,
}: QuizLayoutProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const quizState = surfaceState.quiz;
  const currentQuestionIndex = quizState?.currentQuestion ?? 0;
  const currentQuestion = metadata.questions[currentQuestionIndex];
  const isCompleted = quizState?.completed ?? false;
  const answers = quizState?.answers ?? {};
  const totalQuestions = metadata.questions.length;
  
  // Handle answer selection
  const handleSelectAnswer = useCallback((answer: string | number) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  }, [showFeedback]);
  
  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
    onAnswerQuestion(currentQuestionIndex, selectedAnswer);
  }, [currentQuestionIndex, selectedAnswer, onAnswerQuestion]);
  
  // Handle next question
  const handleNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    onNextQuestion();
  }, [onNextQuestion]);
  
  const isCorrect = selectedAnswer !== null && 
    (typeof currentQuestion?.correctAnswer === 'number' 
      ? selectedAnswer === currentQuestion.correctAnswer
      : selectedAnswer === currentQuestion?.correctAnswer);

  // Completed View
  if (isCompleted && quizState) {
    const score = quizState.correctCount;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={[styles.trophyRing, percentage >= 60 ? styles.trophyRingSuccess : styles.trophyRingWarning]}>
            <Trophy 
              size={48} 
              color={percentage >= 60 ? theme.colors.accent.primary : theme.colors.accent.warning} 
            />
          </View>
          
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          <Text style={styles.resultTopic}>{metadata.topic}</Text>
          
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>FINAL SCORE</Text>
            <Text style={styles.scoreValue}>{score} / {totalQuestions}</Text>
            <View style={styles.scoreBarBg}>
              <View style={[styles.scoreBarFill, { width: `${percentage}%` }]} />
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <CheckCircle size={20} color={theme.colors.accent.success} style={{marginBottom: 4}}/>
              <Text style={styles.statValue}>{quizState.correctCount}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <XCircle size={20} color={theme.colors.accent.error} style={{marginBottom: 4}}/>
              <Text style={styles.statValue}>{quizState.incorrectCount}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.restartButton} onPress={onRestartQuiz}>
            <RotateCcw size={16} color={theme.colors.text.primary} />
            <Text style={styles.restartButtonText}>Retake Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading State
  if (!currentQuestion) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading Question...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.topicLabel}>{metadata.topic}</Text>
          <Text style={styles.questionCount}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{metadata.difficulty}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalQuestions }).map((_, i) => {
          const isCurrent = i === currentQuestionIndex;
          const isAnswered = answers.hasOwnProperty(i);
          return (
            <View 
              key={i} 
              style={[
                styles.progressSegment,
                isCurrent && styles.progressSegmentCurrent,
                isAnswered && styles.progressSegmentDone
              ]} 
            />
          );
        })}
      </View>

      {/* Question Card */}
      <View style={[
        styles.questionCard,
        showFeedback && isCorrect && styles.questionCardCorrect,
        showFeedback && !isCorrect && styles.questionCardIncorrect
      ]}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = currentQuestion.correctAnswer === index;
            
            const optionStyles = [styles.optionButton];
            if (showFeedback) {
              if (isCorrectOption) optionStyles.push(styles.optionCorrect);
              else if (isSelected) optionStyles.push(styles.optionIncorrect);
              else optionStyles.push(styles.optionDimmed);
            } else if (isSelected) {
               optionStyles.push(styles.optionSelected);
            }

            return (
              <TouchableOpacity
                key={index}
                style={optionStyles}
                onPress={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.optionIndex, 
                  showFeedback && isCorrectOption && styles.optionIndexCorrect,
                  showFeedback && isSelected && !isCorrectOption && styles.optionIndexIncorrect,
                  isSelected && !showFeedback && styles.optionIndexSelected
                ]}>
                  {showFeedback && isCorrectOption ? (
                     <CheckCircle size={14} color="#FFF" />
                  ) : showFeedback && isSelected && !isCorrectOption ? (
                     <XCircle size={14} color="#FFF" />
                  ) : (
                    <Text style={[styles.optionIndexText, isSelected && !showFeedback && {color: theme.colors.background.primary}]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.optionText, 
                  isSelected && !showFeedback && {color: theme.colors.accent.primary}
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feedback & Actions */}
      <View style={styles.footerArea}>
        {showFeedback ? (
          <View style={[
            styles.feedbackCard,
            isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
          ]}>
            <View style={styles.feedbackHeader}>
              {isCorrect ? <CheckCircle size={24} color={theme.colors.accent.success} /> : <XCircle size={24} color={theme.colors.accent.error} />}
              <Text style={[styles.feedbackTitle, isCorrect ? styles.textSuccess : styles.textError]}>
                {isCorrect ? "That's correct!" : "Not quite right"}
              </Text>
            </View>
            <Text style={styles.feedbackExplanation}>{currentQuestion.explanation}</Text>
            
            <TouchableOpacity style={[
                styles.nextButton, 
                isCorrect ? {backgroundColor: theme.colors.accent.success} : {backgroundColor: theme.colors.accent.primary}
              ]} 
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < totalQuestions - 1 ? "Next Question" : "See Results"}
              </Text>
              <ArrowRight size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.submitButton, selectedAnswer === null && styles.submitButtonDisabled]}
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={[styles.submitButtonText, selectedAnswer === null && styles.submitButtonTextDisabled]}>
              Submit Answer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  topicLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  questionCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 2,
  },
  progressSegmentCurrent: {
    backgroundColor: theme.colors.accent.primary,
  },
  progressSegmentDone: {
    backgroundColor: 'rgba(77, 125, 255, 0.5)',
  },
  questionCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: 24,
  },
  questionCardCorrect: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  questionCardIncorrect: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  optionSelected: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(77, 125, 255, 0.1)',
  },
  optionCorrect: {
    borderColor: theme.colors.accent.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionIncorrect: {
    borderColor: theme.colors.accent.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionDimmed: {
    opacity: 0.5,
  },
  optionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  optionIndexSelected: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  optionIndexCorrect: {
    backgroundColor: theme.colors.accent.success,
    borderColor: theme.colors.accent.success,
  },
  optionIndexIncorrect: {
    backgroundColor: theme.colors.accent.error,
    borderColor: theme.colors.accent.error,
  },
  optionIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    flex: 1,
  },
  footerArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.background.secondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: theme.colors.background.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  submitButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  feedbackCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  feedbackIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textSuccess: { color: theme.colors.accent.success },
  textError: { color: theme.colors.accent.error },
  feedbackExplanation: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  
  // Results
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  trophyRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  trophyRingSuccess: {
    backgroundColor: 'rgba(77, 125, 255, 0.1)',
    borderColor: 'rgba(77, 125, 255, 0.2)',
  },
  trophyRingWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  resultTopic: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 32,
  },
  scoreCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  scoreBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  restartButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
