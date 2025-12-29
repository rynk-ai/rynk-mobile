/**
 * EmptyStateChat - Empty state component with suggestions
 * Features:
 * - Animated brand text with shimmer effect
 * - Suggestion cards that fill the input
 * - Centered layout matching web design
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  BookOpen,
} from 'lucide-react-native';
import { theme } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SuggestionItem {
  icon: React.ReactNode;
  title: string;
  prompt: string;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    icon: <Sparkles size={16} color={theme.colors.accent.primary || theme.colors.text.secondary} />,
    title: 'Explain a concept',
    prompt: 'Explain quantum computing in simple terms',
  },
  {
    icon: <MessageSquare size={16} color={theme.colors.accent.primary || theme.colors.text.secondary} />,
    title: 'Write for me',
    prompt: 'Help me write a professional email',
  },
  {
    icon: <Lightbulb size={16} color={theme.colors.accent.primary || theme.colors.text.secondary} />,
    title: 'Brainstorm ideas',
    prompt: 'Give me creative project ideas for the weekend',
  },
  {
    icon: <BookOpen size={16} color={theme.colors.accent.primary || theme.colors.text.secondary} />,
    title: 'Learn something',
    prompt: 'Teach me about machine learning basics',
  },
];

interface EmptyStateChatProps {
  onSelectSuggestion: (prompt: string) => void;
}

export function EmptyStateChat({ onSelectSuggestion }: EmptyStateChatProps) {
  // Shimmer animation for brand text
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerValue]);

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Brand Section */}
      <View style={styles.brandSection}>
        <Animated.Text style={[styles.brandName, { opacity: shimmerOpacity }]}>
          rynk.
        </Animated.Text>
        <Text style={styles.tagline}>What would you like to explore today?</Text>
      </View>

      {/* Suggestions Grid */}
      <View style={styles.suggestionsContainer}>
        {SUGGESTIONS.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionCard}
            onPress={() => onSelectSuggestion(suggestion.prompt)}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionIcon}>{suggestion.icon}</View>
            <Text style={styles.suggestionTitle} numberOfLines={1}>
              {suggestion.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 120, // Space for input below
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandName: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -3,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: SCREEN_WIDTH - 48,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  suggestionIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
});
