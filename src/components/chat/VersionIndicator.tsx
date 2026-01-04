/**
 * VersionIndicator - Shows message version navigation
 * Swiss Modern: Sharp corners, minimal design
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { Message } from '../../lib/types';

interface VersionIndicatorProps {
  message: Message;
  versions: Message[];
  onSwitchVersion: (versionId: string) => Promise<void>;
}

export function VersionIndicator({
  message,
  versions,
  onSwitchVersion,
}: VersionIndicatorProps) {
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't show for single version
  if (versions.length <= 1) {
    return null;
  }

  // Sort by version number
  const sortedVersions = [...versions].sort(
    (a, b) => (a.versionNumber || 1) - (b.versionNumber || 1)
  );
  const currentIndex = sortedVersions.findIndex((v) => v.id === message.id);
  const currentVersion = currentIndex + 1;
  const totalVersions = sortedVersions.length;

  const handleSwitch = useCallback(
    async (direction: 'prev' | 'next') => {
      const targetIndex =
        direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= sortedVersions.length) {
        return;
      }

      const targetVersion = sortedVersions[targetIndex];
      if (targetVersion.id === message.id) return;

      try {
        setIsSwitching(true);
        await onSwitchVersion(targetVersion.id);
      } catch (err) {
        console.error('Failed to switch version:', err);
      } finally {
        setIsSwitching(false);
      }
    },
    [currentIndex, sortedVersions, message.id, onSwitchVersion]
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalVersions - 1;

  return (
    <View style={[styles.container, isSwitching && styles.disabled]}>
      <Pressable
        onPress={() => handleSwitch('prev')}
        disabled={!canGoPrev || isSwitching}
        style={[styles.button, !canGoPrev && styles.buttonDisabled]}
        hitSlop={8}
      >
        <ChevronLeft
          size={14}
          color={canGoPrev ? theme.colors.text.secondary : theme.colors.text.tertiary}
        />
      </Pressable>

      <Text style={styles.indicator}>
        {currentVersion}/{totalVersions}
      </Text>

      <Pressable
        onPress={() => handleSwitch('next')}
        disabled={!canGoNext || isSwitching}
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
        hitSlop={8}
      >
        <ChevronRight
          size={14}
          color={canGoNext ? theme.colors.text.secondary : theme.colors.text.tertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    padding: 2,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  indicator: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.text.tertiary,
    paddingHorizontal: 4,
  },
});
