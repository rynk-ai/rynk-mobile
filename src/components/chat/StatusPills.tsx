/**
 * StatusPills - Enhanced streaming status indicator
 * Shows current AI processing status with smooth animations
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Search, BookOpen, Sparkles, Check, Brain, Zap } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export interface StatusPill {
  status: 'analyzing' | 'building_context' | 'searching' | 'reading_sources' | 'synthesizing' | 'complete';
  message: string;
  timestamp: number;
}

interface StatusPillsProps {
  pills: StatusPill[];
}

const statusConfig: Record<StatusPill['status'], { icon: any; color: string; label: string }> = {
  analyzing: { icon: Brain, color: theme.colors.accent.primary, label: 'Analyzing' },
  building_context: { icon: BookOpen, color: theme.colors.accent.primary, label: 'Building context' },
  searching: { icon: Search, color: theme.colors.accent.primary, label: 'Searching' },
  reading_sources: { icon: BookOpen, color: theme.colors.accent.primary, label: 'Reading sources' },
  synthesizing: { icon: Zap, color: theme.colors.accent.primary, label: 'Synthesizing' },
  complete: { icon: Check, color: theme.colors.accent.success, label: 'Complete' },
};

export function StatusPills({ pills }: StatusPillsProps) {
  const latestPill = pills[pills.length - 1];
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the dot
    if (latestPill && latestPill.status !== 'complete') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [latestPill?.status, pulseAnim, fadeAnim]);

  if (!latestPill) return null;

  const config = statusConfig[latestPill.status] || statusConfig.analyzing;
  const Icon = config.icon;
  const isComplete = latestPill.status === 'complete';

  const dotScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const dotOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.pill, { borderColor: config.color + '30' }]}>
        {/* Animated dot or checkmark */}
        {isComplete ? (
          <View style={[styles.iconWrapper, { backgroundColor: config.color + '20' }]}>
            <Icon size={12} color={config.color} />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: config.color,
                transform: [{ scale: dotScale }],
                opacity: dotOpacity,
              },
            ]}
          />
        )}
        <Text style={[styles.text, { color: config.color }]}>
          {latestPill.message || config.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Reduced gap
    paddingHorizontal: 10, // Compact padding
    paddingVertical: 6, // Compact vertical padding
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 999, // Pill shape
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6, // Smaller dot
    height: 6,
    borderRadius: 3,
  },
  iconWrapper: {
    width: 16, // Smaller icon wrapper
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12, // Smaller font (xs/sm boundary)
    fontWeight: '500',
    letterSpacing: -0.2, // Tighter tracking
  },
});
