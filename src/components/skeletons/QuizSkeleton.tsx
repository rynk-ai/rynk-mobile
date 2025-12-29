import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const QuizSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const SkeletonItem = ({ style }: { style: ViewStyle }) => (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        { opacity }
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.row}>
             <SkeletonItem style={{ width: 40, height: 40, borderRadius: 8 }} />
             <View style={{ marginLeft: 12 }}>
                <SkeletonItem style={{ width: 120, height: 20, marginBottom: 4 }} />
                <SkeletonItem style={{ width: 80, height: 16 }} />
             </View>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
             {[1,2,3,4,5].map(i => (
                 <SkeletonItem key={i} style={{ flex: 1, height: 4, borderRadius: 2, marginRight: 4 }} />
             ))}
        </View>
      </View>

      {/* Question Card */}
      <View style={styles.card}>
        <SkeletonItem style={{ width: '100%', height: 24, marginBottom: 8 }} />
        <SkeletonItem style={{ width: '80%', height: 24, marginBottom: 24 }} />
        
        {/* Answer Options */}
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.optionRow}>
                <SkeletonItem style={{ width: 32, height: 32, borderRadius: 6, marginRight: 12 }} />
                 <SkeletonItem style={{ width: '70%', height: 20 }} />
            </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
      marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
      flexDirection: 'row',
  },
  card: {
    backgroundColor: theme.colors.background.secondary, // Light background for the card area itself
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.subtle,
      borderRadius: 12,
  },
  skeleton: {
    backgroundColor: theme.colors.border.default, // Slightly darker for skeleton items on the card
    borderRadius: 4,
  },
});
