import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const FlashcardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const Bone = ({ style }: { style: ViewStyle }) => (
    <Animated.View style={[styles.skeleton, style, { opacity }]} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bone style={{ width: 40, height: 40, borderRadius: 10 }} />
          <View style={{ marginLeft: 12 }}>
            <Bone style={{ width: 140, height: 18 }} />
            <Bone style={{ width: 100, height: 12, marginTop: 4 }} />
          </View>
        </View>
        <Bone style={{ width: 60, height: 28, borderRadius: 8 }} />
      </View>

      {/* Progress Bar */}
      <Bone style={{ width: '100%', height: 6, borderRadius: 3, marginTop: 16, marginBottom: 12 }} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Bone style={{ width: 80, height: 16 }} />
        <Bone style={{ width: 90, height: 16 }} />
        <Bone style={{ width: 70, height: 14, marginLeft: 'auto' }} />
      </View>

      {/* Card */}
      <View style={styles.cardPlaceholder}>
        <Bone style={{ width: '70%', height: 28 }} />
        <Bone style={{ width: '50%', height: 20, marginTop: 16 }} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.navButtons}>
          <Bone style={{ width: 48, height: 48, borderRadius: 12 }} />
          <Bone style={{ width: 48, height: 48, borderRadius: 12, marginLeft: 8 }} />
        </View>
        <Bone style={{ width: 100, height: 18 }} />
        <Bone style={{ width: 48, height: 48, borderRadius: 12 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  cardPlaceholder: { height: 200, backgroundColor: theme.colors.background.secondary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border.subtle },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border.subtle },
  navButtons: { flexDirection: 'row' },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
