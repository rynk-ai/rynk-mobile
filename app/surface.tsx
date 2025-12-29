
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';

import { theme } from '../src/lib/theme';
import { api, ApiError } from '../src/lib/api/client';
import { WikiLayout } from '../src/components/surfaces/WikiLayout';
import { QuizLayout } from '../src/components/surfaces/QuizLayout';
import type { SurfaceState, SurfaceType } from '../src/lib/types';

export default function SurfaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    type: SurfaceType; 
    query: string; 
    surfaceId?: string;
    conversationId?: string;
  }>();

  const [surfaceState, setSurfaceState] = useState<SurfaceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurface = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const messageId = Crypto.randomUUID();
      const response = await api.generateSurface(
        messageId,
        params.query || '',
        params.type as any,
        params.conversationId
      );

      if (response.surfaceState) {
        setSurfaceState(response.surfaceState);
      } else {
        // Fallback if structure differs slightly
        setError('Failed to generate surface');
      }
    } catch (err: any) {
        console.error('Surface generation error:', err);
        setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [params.query, params.type, params.conversationId]);

  useEffect(() => {
    if (params.type && params.query) {
      fetchSurface();
    }
  }, [fetchSurface, params.type, params.query]);

  const handleBack = () => router.back();

  // Handlers for interaction (Quiz)
  const handleAnswerQuestion = (index: number, answer: string | number) => {
     // Local state update for interactivity
     setSurfaceState(prev => {
         if (!prev || !prev.quiz) return prev;
         const newAnswers = { ...prev.quiz.answers, [index]: answer };
         
         const question = prev.metadata.questions[index];
         const isCorrect = question.correctAnswer === answer;
         
         return {
             ...prev,
             quiz: {
                 ...prev.quiz,
                 answers: newAnswers,
                 correctCount: isCorrect ? (prev.quiz.correctCount || 0) + 1 : prev.quiz.correctCount,
                 incorrectCount: !isCorrect ? (prev.quiz.incorrectCount || 0) + 1 : prev.quiz.incorrectCount,
             }
         };
     });
  };

  const handleNextQuestion = () => {
      setSurfaceState(prev => {
          if (!prev || !prev.quiz) return prev;
          const nextIndex = (prev.quiz.currentQuestion || 0) + 1;
          const completed = nextIndex >= prev.metadata.questions.length;
          
          return {
              ...prev,
              quiz: {
                  ...prev.quiz,
                  currentQuestion: completed ? prev.quiz.currentQuestion : nextIndex,
                  completed: completed,
                  completedAt: completed ? Date.now() : undefined
              }
          };
      });
  };

  const handleRestartQuiz = () => {
      setSurfaceState(prev => {
          if (!prev || !prev.quiz) return prev;
          return {
              ...prev,
              quiz: {
                  ...prev.quiz,
                  currentQuestion: 0,
                  answers: {},
                  correctCount: 0,
                  incorrectCount: 0,
                  completed: false,
                  startedAt: Date.now()
              }
          };
      });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <Text style={styles.loadingText}>Generating {params.type}...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSurface}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!surfaceState) return null;

    if (surfaceState.surfaceType === 'wiki') {
      return (
        <WikiLayout 
          metadata={surfaceState.metadata} 
          surfaceState={surfaceState}
          onNavigateTopic={(topic) => router.push({
            pathname: '/surface', // Authenticated route
            params: { type: 'wiki', query: topic }
          })}
        />
      );
    }

    if (surfaceState.surfaceType === 'quiz') {
      return (
        <QuizLayout 
          metadata={surfaceState.metadata}
          surfaceState={surfaceState}
          onAnswerQuestion={handleAnswerQuestion}
          onNextQuestion={handleNextQuestion}
          onRestartQuiz={handleRestartQuiz}
        />
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Unsupported surface type</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <ChevronLeft color={theme.colors.text.primary} size={24} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
            {params.type ? params.type.charAt(0).toUpperCase() + params.type.slice(1) : 'Surface'}
        </Text>
        
        <TouchableOpacity style={styles.iconButton}>
          <Share2 color={theme.colors.text.primary} size={20} />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  iconButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  errorText: {
    color: theme.colors.accent.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  retryText: {
    color: theme.colors.text.primary,
  },
});
