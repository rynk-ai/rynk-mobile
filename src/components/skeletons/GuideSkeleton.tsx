import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const GuideSkeleton = () => {
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
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroLeft}>
            <Bone style={{ width: 80, height: 24, borderRadius: 12 }} />
            <Bone style={{ width: '80%', height: 32, marginTop: 12 }} />
            <Bone style={{ width: '100%', height: 16, marginTop: 8 }} />
            <View style={styles.metaRow}>
              <Bone style={{ width: 100, height: 18 }} />
              <Bone style={{ width: 80, height: 18, marginLeft: 16 }} />
            </View>
          </View>
          {/* Progress Ring Placeholder */}
          <Bone style={{ width: 80, height: 80, borderRadius: 40 }} />
        </View>
      </View>

      {/* Checkpoint Rows */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.checkpointRow}>
          <Bone style={{ width: 36, height: 36, borderRadius: 8 }} />
          <View style={styles.checkpointText}>
            <Bone style={{ width: '60%', height: 18 }} />
            <Bone style={{ width: '40%', height: 14, marginTop: 6 }} />
          </View>
          <Bone style={{ width: 20, height: 20, borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heroCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border.subtle },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  heroLeft: { flex: 1 },
  metaRow: { flexDirection: 'row', marginTop: 16 },
  checkpointRow: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, backgroundColor: theme.colors.background.secondary, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  checkpointText: { flex: 1, marginLeft: 12 },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
