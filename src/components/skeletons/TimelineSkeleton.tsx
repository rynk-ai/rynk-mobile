import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const TimelineSkeleton = () => {
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
      {/* Hero */}
      <View style={styles.heroCard}>
        <Bone style={{ width: 48, height: 48, borderRadius: 12, alignSelf: 'center' }} />
        <Bone style={{ width: '70%', height: 28, marginTop: 16, alignSelf: 'center' }} />
        <Bone style={{ width: '50%', height: 16, marginTop: 8, alignSelf: 'center' }} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Bone style={{ width: 50, height: 32, borderRadius: 16 }} />
        <Bone style={{ width: 70, height: 32, borderRadius: 16, marginLeft: 8 }} />
        <Bone style={{ width: 60, height: 32, borderRadius: 16, marginLeft: 8 }} />
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Vertical Line */}
        <View style={styles.timelineLine} />

        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.eventContainer}>
            <Bone style={{ width: 16, height: 16, borderRadius: 8, position: 'absolute', left: -8, top: 20, zIndex: 1 }} />
            <View style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Bone style={{ width: 80, height: 14 }} />
                <Bone style={{ width: 50, height: 20, borderRadius: 6 }} />
              </View>
              <Bone style={{ width: '70%', height: 18, marginTop: 8 }} />
              <Bone style={{ width: '100%', height: 14, marginTop: 8 }} />
              <Bone style={{ width: '80%', height: 14, marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heroCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.subtle },
  filterRow: { flexDirection: 'row', marginBottom: 24 },
  timeline: { position: 'relative', paddingLeft: 28 },
  timelineLine: { position: 'absolute', left: 7, top: 20, bottom: 20, width: 2, backgroundColor: theme.colors.border.subtle },
  eventContainer: { marginBottom: 20, position: 'relative' },
  eventCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border.subtle },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
