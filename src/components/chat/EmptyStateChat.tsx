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
          duration: 5000,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40, // Reduced bottom padding
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 48, // Matches chat.tsx empty state
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8, // Tighter gap
    maxWidth: SCREEN_WIDTH - 32,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md, // Rounded (8)
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  suggestionIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.primary,
    letterSpacing: -0.2, // Tighter tracking
  },
});
