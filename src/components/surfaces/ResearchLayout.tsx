import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { FileText, ChevronDown, ChevronUp, ExternalLink, BookOpen, Lightbulb, Tag } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ResearchMetadata, SurfaceState } from '../../lib/types';

interface ResearchLayoutProps {
  metadata: ResearchMetadata;
  surfaceState?: SurfaceState;
}

export const ResearchLayout = memo(function ResearchLayout({ metadata, surfaceState }: ResearchLayoutProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(metadata.sections?.[0]?.id || null);

  const { title, summary, keyFindings = [], sections = [], sources = [], keywords = [] } = metadata;
  const citations = surfaceState?.citations || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <FileText size={24} color={theme.colors.accent.primary} />
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        {keywords.length > 0 && (
          <View style={styles.keywordsRow}>
            {keywords.slice(0, 4).map((kw, idx) => (
              <View key={idx} style={styles.keywordBadge}>
                <Tag size={10} color={theme.colors.text.tertiary} />
                <Text style={styles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Abstract */}
      {summary && (
        <View style={styles.abstractCard}>
          <Text style={styles.abstractLabel}>ABSTRACT</Text>
          <Text style={styles.abstractText}>{summary}</Text>
        </View>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={16} color={theme.colors.accent.primary} />
            <Text style={styles.sectionTitle}>Key Findings</Text>
          </View>
          <View style={styles.findingsGrid}>
            {keyFindings.map((finding, idx) => (
              <View key={idx} style={styles.findingCard}>
                <View style={styles.findingNumber}>
                  <Text style={styles.findingNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sections */}
      {sections.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={16} color={theme.colors.accent.primary} />
            <Text style={styles.sectionTitle}>Contents</Text>
          </View>
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <View key={section.id} style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.sectionCardHeader}
                  onPress={() => setExpandedSection(isExpanded ? null : section.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionCardTitle}>{section.title}</Text>
                  {isExpanded ? <ChevronUp size={20} color={theme.colors.text.tertiary} /> : <ChevronDown size={20} color={theme.colors.text.tertiary} />}
                </TouchableOpacity>
                {isExpanded && section.content && (
                  <View style={styles.sectionCardContent}>
                    <Markdown style={markdownStyles}>{section.content}</Markdown>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Sources */}
      {(sources.length > 0 || citations.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>
          <View style={styles.sourcesGrid}>
            {(citations.length > 0 ? citations : sources).slice(0, 6).map((source, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sourceCard}
                onPress={() => source.url && Linking.openURL(source.url).catch(() => {})}
              >
                <Text style={styles.sourceTitle} numberOfLines={2}>{source.title}</Text>
                {source.url && (
                  <View style={styles.sourceLink}>
                    <ExternalLink size={12} color={theme.colors.accent.primary} />
                    <Text style={styles.sourceLinkText} numberOfLines={1}>{new URL(source.url).hostname.replace('www.', '')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
});

const markdownStyles = StyleSheet.create({
  body: { color: theme.colors.text.primary, fontSize: 15, lineHeight: 24 },
  heading2: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8, color: theme.colors.text.primary },
  paragraph: { marginBottom: 12 },
  code_inline: { backgroundColor: theme.colors.background.tertiary, paddingHorizontal: 4, borderRadius: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  contentContainer: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 12 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  keywordBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.colors.background.secondary, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  keywordText: { fontSize: 11, color: theme.colors.text.secondary },
  abstractCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 14, padding: 18, marginBottom: 24, borderLeftWidth: 3, borderLeftColor: theme.colors.accent.primary },
  abstractLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.accent.primary, letterSpacing: 1, marginBottom: 8 },
  abstractText: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary, letterSpacing: 0.5 },
  findingsGrid: { gap: 10 },
  findingCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle },
  findingNumber: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  findingNumberText: { fontSize: 13, fontWeight: '700', color: theme.colors.accent.primary },
  findingText: { flex: 1, fontSize: 14, color: theme.colors.text.primary, lineHeight: 22 },
  sectionCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border.subtle, overflow: 'hidden' },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  sectionCardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, flex: 1 },
  sectionCardContent: { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle },
  sourcesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sourceCard: { width: '48%', backgroundColor: theme.colors.background.secondary, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  sourceTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 6 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceLinkText: { fontSize: 11, color: theme.colors.accent.primary },
});

export default ResearchLayout;
