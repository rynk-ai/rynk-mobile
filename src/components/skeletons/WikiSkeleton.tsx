import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '../../lib/theme';

export const WikiSkeleton = () => {
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
      {/* Hero Header */}
      <View style={styles.section}>
        <View style={styles.row}>
            <SkeletonItem style={{ width: 80, height: 24, borderRadius: 12 }} />
            <SkeletonItem style={{ width: 100, height: 24, borderRadius: 12, marginLeft: 8 }} />
        </View>
        <SkeletonItem style={{ width: '80%', height: 40, marginTop: 16, marginBottom: 8 }} />
        <SkeletonItem style={{ width: '100%', height: 20, marginTop: 4 }} />
        <SkeletonItem style={{ width: '90%', height: 20, marginTop: 4 }} />
      </View>

      {/* Hero Images Strip */}
      <View style={styles.imagesRow}>
        {[1, 2, 3].map((i) => (
            <SkeletonItem 
                key={i} 
                style={{ 
                    width: 120, 
                    height: 80, 
                    borderRadius: 8, 
                    marginRight: 12 
                }} 
            />
        ))}
      </View>

      {/* Content Sections */}
      {[1, 2].map((i) => (
        <View key={i} style={styles.section}>
            <SkeletonItem style={{ width: '40%', height: 28, marginBottom: 12 }} />
            <SkeletonItem style={{ width: '100%', height: 16, marginBottom: 8 }} />
            <SkeletonItem style={{ width: '100%', height: 16, marginBottom: 8 }} />
            <SkeletonItem style={{ width: '95%', height: 16, marginBottom: 8 }} />
             <SkeletonItem style={{ width: '90%', height: 16, marginBottom: 8 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: 32,
    overflow: 'hidden', // Simple crop if they overflow
  },
  skeleton: {
    backgroundColor: theme.colors.background.secondary, // Or a specific skeleton color
    borderRadius: 4,
  },
});
