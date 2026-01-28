import React from 'react';
import { StyleSheet, ImageBackground, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatBackground } from '../../lib/contexts/ChatBackgroundContext';
import { theme } from '../../lib/theme';

const { width, height } = Dimensions.get('window');

export function ChatBackground() {
  const { currentBackground, isLoaded } = useChatBackground();

  if (!isLoaded || !currentBackground) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Background Image with low opacity */}
      <ImageBackground
        source={currentBackground.source}
        style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} // Matches web dark mode opacity
        resizeMode="cover"
      />
      
      {/* Gradient Overlay to blend with UI */}
      {/* Web uses: from-background/50 via-transparent to-background/80 */}
      <LinearGradient
        colors={[
          `${theme.colors.background.primary}80`, // 50% opacity
          'transparent', 
          `${theme.colors.background.primary}CC`  // 80% opacity
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}
