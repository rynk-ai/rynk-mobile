/**
 * ScrollToBottomButton - Floating button to scroll to bottom of chat
 * Features:
 * - Animated appearance/disappearance
 * - Semi-transparent backdrop blur effect
 * - Positioned above the input area
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export interface ScrollToBottomButtonProps {
  /** Called when the button is clicked */
  onPress: () => void;
  /** Controls visibility of the button */
  visible: boolean;
}

export const ScrollToBottomButton = memo(function ScrollToBottomButton({
  onPress,
  visible,
}: ScrollToBottomButtonProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 15,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  // Always render but hide via opacity for smoother animations
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.button}
      >
        <ChevronDown size={18} color={theme.colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    zIndex: 30,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
});
