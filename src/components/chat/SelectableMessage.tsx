/**
 * SelectableMessage - Text selection using TextInput
 * Uses a read-only TextInput with onSelectionChange to track selection
 * Shows action buttons (Quote/Deep Dive) when text is selected
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Quote, MessageSquare, X } from 'lucide-react-native';
import { theme } from '../../lib/theme';

export interface TextHighlight {
  id: string;
  start: number;
  end: number;
}

interface SelectableMessageProps {
  /** The text content to display */
  content: string;
  /** Called when user selects "Quote" */
  onQuote?: (selectedText: string, start: number, end: number) => void;
  /** Called when user selects "Deep Dive" */
  onDeepDive?: (selectedText: string, start: number, end: number) => void;
  /** Additional style */
  style?: any;
  /** Whether this is a user message */
  isUser?: boolean;
  /** Optional custom renderer for content (e.g. Markdown) instead of simple TextInput */
  renderCustomContent?: () => React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SelectableMessage({
  content,
  onQuote,
  onDeepDive,
  style,
  isUser = false,
  renderCustomContent,
}: SelectableMessageProps) {
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const selectedText = selection.start !== selection.end
    ? content.substring(selection.start, selection.end)
    : '';

  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = event.nativeEvent.selection;
      setSelection({ start, end });

      // Show actions when text is selected
      if (start !== end) {
        setShowActions(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      } else {
        hideActions();
      }
    },
    [fadeAnim]
  );

  const hideActions = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => setShowActions(false));
  }, [fadeAnim]);

  const handleQuote = useCallback(() => {
    if (selectedText && onQuote) {
      onQuote(selectedText, selection.start, selection.end);
      hideActions();
    }
  }, [selectedText, selection, onQuote, hideActions]);

  const handleDeepDive = useCallback(() => {
    if (selectedText && onDeepDive) {
      onDeepDive(selectedText, selection.start, selection.end);
      hideActions();
    }
  }, [selectedText, selection, onDeepDive, hideActions]);

  const handleDismiss = useCallback(() => {
    setSelection({ start: 0, end: 0 });
    hideActions();
  }, [hideActions]);

  const renderContent = () => {
    // Basic blockquote parsing for user messages
    // Find lines starting with >
    const lines = content.split('\n');
    const quoteLines: string[] = [];
    const regularLines: string[] = [];

    let inQuoteBlock = false;

    for (const line of lines) {
      if (line.startsWith('> ')) {
        quoteLines.push(line.substring(2));
        inQuoteBlock = true;
      } else if (line.trim() === '' && inQuoteBlock) {
        // Skip empty lines immediately following quotes if part of the block
        continue;
      } else {
        regularLines.push(line);
        inQuoteBlock = false;
      }
    }

    const hasQuotes = quoteLines.length > 0;
    const regularContent = regularLines.join('\n').trim();

    return (
      <View style={{ width: '100%' }}>
        {hasQuotes && (
          <View style={styles.quoteBlock}>
            <View style={styles.quoteBar} />
            <Text style={styles.quoteText} numberOfLines={3}>{quoteLines.join('\n')}</Text>
          </View>
        )}

        {renderCustomContent ? (
          <View style={[styles.customContentWrapper, style]}>
            {renderCustomContent()}
          </View>
        ) : regularContent ? (
          <TextInput
            value={regularContent} // Show the rest of the content here
            editable={false}
            multiline
            scrollEnabled={false}
            style={[
              styles.textInput,
              isUser ? styles.userText : styles.assistantText,
              style,
            ]}
            onSelectionChange={handleSelectionChange}
            selection={selection}
            selectionColor={theme.colors.accent.primary + '40'}
            contextMenuHidden={true} // Hide default context menu
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Floating action bar */}
      {showActions && selectedText && (
        <Animated.View
          style={[
            styles.actionBar,
            { opacity: fadeAnim },
          ]}
        >
          {onQuote && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleQuote}
              activeOpacity={0.7}
            >
              <Quote size={14} color={theme.colors.text.primary} />
              <Text style={styles.actionText}>Quote</Text>
            </TouchableOpacity>
          )}

          {onDeepDive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleDeepDive}
              activeOpacity={0.7}
            >
              <MessageSquare size={14} color="#fff" />
              <Text style={styles.primaryActionText}>Deep Dive</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <X size={14} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  customContentWrapper: {
    width: '100%',
  },
  textInput: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
  },
  userText: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  assistantText: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 24,
  },
  actionBar: {
    position: 'absolute',
    bottom: -44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  primaryAction: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 4,
  },
  quoteBlock: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quoteBar: {
    width: 3,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
