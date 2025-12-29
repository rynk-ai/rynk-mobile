import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const ComparisonSkeleton = () => {
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
      <View style={styles.hero}>
        <Bone style={{ width: 48, height: 48, borderRadius: 12, alignSelf: 'center' }} />
        <Bone style={{ width: '70%', height: 28, marginTop: 12, alignSelf: 'center' }} />
        <Bone style={{ width: '90%', height: 16, marginTop: 8, alignSelf: 'center' }} />
      </View>

      {/* Verdict Banner */}
      <View style={styles.verdictBanner}>
        <Bone style={{ width: 48, height: 48, borderRadius: 12 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Bone style={{ width: 80, height: 12 }} />
          <Bone style={{ width: 150, height: 20, marginTop: 4 }} />
        </View>
        <Bone style={{ width: 50, height: 24, borderRadius: 8 }} />
      </View>

      {/* Scenarios */}
      <Bone style={{ width: 80, height: 14, marginBottom: 12 }} />
      <View style={styles.scenariosRow}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.scenarioCard}>
            <Bone style={{ width: '60%', height: 16 }} />
            <Bone style={{ width: '80%', height: 14, marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Item Cards */}
      <Bone style={{ width: 80, height: 14, marginTop: 16, marginBottom: 12 }} />
      {[1, 2].map((i) => (
        <View key={i} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Bone style={{ width: 120, height: 20 }} />
            <Bone style={{ width: 20, height: 20 }} />
          </View>
          <Bone style={{ width: '100%', height: 14, marginTop: 8 }} />
          <Bone style={{ width: '80%', height: 14, marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: { marginBottom: 24, alignItems: 'center' },
  verdictBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  scenariosRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  scenarioCard: { flex: 1, backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle },
  itemCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
