import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const LearningSkeleton = () => {
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
            <Bone style={{ width: 80, height: 12, marginTop: 4 }} />
          </View>
        </View>
        <Bone style={{ width: 50, height: 50, borderRadius: 25 }} />
      </View>

      {/* Main Layout */}
      <View style={styles.mainLayout}>
        {/* Chapter Sidebar */}
        <View style={styles.sidebar}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.chapterItem}>
              <Bone style={{ width: 24, height: 24, borderRadius: 6 }} />
              <Bone style={{ flex: 1, height: 14, marginLeft: 10 }} />
            </View>
          ))}
        </View>

        {/* Content Panel */}
        <View style={styles.contentPanel}>
          <Bone style={{ width: 80, height: 12, marginBottom: 8 }} />
          <Bone style={{ width: '70%', height: 24, marginBottom: 20 }} />
          <Bone style={{ width: '100%', height: 16, marginBottom: 8 }} />
          <Bone style={{ width: '100%', height: 16, marginBottom: 8 }} />
          <Bone style={{ width: '90%', height: 16, marginBottom: 8 }} />
          <Bone style={{ width: '85%', height: 16, marginBottom: 8 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  mainLayout: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 140, borderRightWidth: 1, borderRightColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.secondary, paddingTop: 8 },
  chapterItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  contentPanel: { flex: 1, padding: 20 },
  skeleton: { backgroundColor: theme.colors.background.elevated, borderRadius: 4 },
});
