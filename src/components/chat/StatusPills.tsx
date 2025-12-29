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
  building_context: { icon: BookOpen, color: '#8B5CF6', label: 'Building context' },
  searching: { icon: Search, color: '#3B82F6', label: 'Searching' },
  reading_sources: { icon: BookOpen, color: '#F59E0B', label: 'Reading sources' },
  synthesizing: { icon: Zap, color: '#10B981', label: 'Synthesizing' },
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
