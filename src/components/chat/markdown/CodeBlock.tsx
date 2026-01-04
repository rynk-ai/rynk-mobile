import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'plaintext' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.language}>{language}</Text>
        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          {copied ? (
            <Check size={14} color={theme.colors.accent.success} />
          ) : (
            <Copy size={14} color={theme.colors.text.tertiary} />
          )}
          <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Code Content */}
      <View style={styles.codeContainer}>
        <Text style={styles.code}>{code.trim()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    // Sharp corners (Swiss)
    borderRadius: 0, 
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
  },
  language: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  copyTextSuccess: {
    color: theme.colors.accent.success,
  },
  codeContainer: {
    padding: 12,
    backgroundColor: theme.colors.background.primary, // Slightly darker contrast inside? Or keep secondary. 
    // Usually code blocks are darker in dark mode. Let's try matching web "bg-muted" which is secondary.
    // Actually typically code is on secondary, so maybe primary is better contrast if bubble is transparent.
    // Assistant bubble is transparent. So code block should be secondary.
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
});
