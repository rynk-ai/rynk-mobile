import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const ResearchSkeleton = () => {
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
        <Bone style={{ width: '80%', height: 28, marginTop: 12, alignSelf: 'center' }} />
        <View style={styles.keywordsRow}>
          <Bone style={{ width: 60, height: 24, borderRadius: 12 }} />
          <Bone style={{ width: 80, height: 24, borderRadius: 12 }} />
          <Bone style={{ width: 70, height: 24, borderRadius: 12 }} />
        </View>
      </View>

      {/* Abstract Card */}
      <View style={styles.abstractCard}>
        <Bone style={{ width: 80, height: 12, marginBottom: 12 }} />
        <Bone style={{ width: '100%', height: 16 }} />
        <Bone style={{ width: '100%', height: 16, marginTop: 6 }} />
        <Bone style={{ width: '75%', height: 16, marginTop: 6 }} />
      </View>

      {/* Key Findings */}
      <View style={styles.section}>
        <Bone style={{ width: 100, height: 14, marginBottom: 12 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.findingCard}>
            <Bone style={{ width: 28, height: 28, borderRadius: 8 }} />
            <Bone style={{ flex: 1, height: 16, marginLeft: 12 }} />
          </View>
        ))}
      </View>

      {/* Sections */}
      <View style={styles.section}>
        <Bone style={{ width: 80, height: 14, marginBottom: 12 }} />
        {[1, 2].map((i) => (
          <View key={i} style={styles.sectionCard}>
            <Bone style={{ width: '60%', height: 18 }} />
            <Bone style={{ width: 20, height: 20 }} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: { marginBottom: 24, alignItems: 'center' },
  keywordsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' },
  abstractCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 14, padding: 18, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: theme.colors.accent.primary },
  section: { marginBottom: 24 },
  findingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border.subtle },
  sectionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border.subtle },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
