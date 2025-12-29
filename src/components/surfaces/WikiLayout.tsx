
import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { BookOpen, ExternalLink, Info, ArrowUp } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { WikiMetadata, SurfaceState } from '../../lib/types';

interface WikiLayoutProps {
  metadata: WikiMetadata;
  surfaceState?: SurfaceState;
  onNavigateTopic?: (topic: string) => void;
}

export const WikiLayout = memo(function WikiLayout({
  metadata,
  surfaceState,
  onNavigateTopic,
}: WikiLayoutProps) {
  const { title, summary, infobox, sections, relatedTopics, references, categories } = metadata;
  const availableImages = surfaceState?.availableImages || [];

  // Hero Image
  const heroImage = 
    (sections[0]?.images && sections[0].images[0]) || 
    (availableImages && availableImages[0]);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Image */}
      {heroImage && (
        <View style={styles.heroImageContainer}>
          <Image 
            source={{ uri: heroImage.url }} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          {heroImage.title && (
            <Text style={styles.imageCaption}>{heroImage.title}</Text>
          )}
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoriesRow}>
          {categories.map((cat, idx) => (
            <View key={idx} style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      {/* Infobox */}
      {infobox.facts.length > 0 && (
        <View style={styles.infobox}>
          <View style={styles.infoboxHeader}>
            <Info size={14} color={theme.colors.accent.primary} style={{ marginRight: 6 }} />
            <Text style={styles.infoboxTitle}>Quick Facts</Text>
          </View>
          <View style={styles.infoboxContent}>
            {infobox.facts.map((fact, idx) => (
              <View key={idx} style={[styles.factRow, idx === infobox.facts.length - 1 && styles.lastFactRow]}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sections */}
      <View style={styles.sectionsContainer}>
        {sections.map((section, idx) => (
          <View key={section.id || idx} style={styles.section}>
            <Text style={styles.sectionHeading}>
              <Text style={styles.sectionNumber}>{String(idx + 1).padStart(2, '0')} </Text>
              {section.heading}
            </Text>
            
            <Markdown style={markdownStyles}>
              {section.content}
            </Markdown>

            {/* Subsections */}
            {section.subsections?.map((sub, subIdx) => (
              <View key={sub.id || subIdx} style={styles.subsection}>
                <Text style={styles.subsectionHeading}>{sub.heading}</Text>
                <Markdown style={markdownStyles}>
                  {sub.content}
                </Markdown>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <View style={styles.relatedTopicsContainer}>
          <Text style={styles.relatedTopicsTitle}>Related Topics</Text>
          <View style={styles.topicsGrid}>
            {relatedTopics.map((topic, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.topicButton}
                onPress={() => onNavigateTopic?.(topic)}
              >
                <BookOpen size={14} color={theme.colors.text.secondary} />
                <Text style={styles.topicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* References */}
      {references.length > 0 && (
        <View style={styles.referencesContainer}>
          <Text style={styles.referencesTitle}>References</Text>
          {references.map((ref, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.referenceItem}
              onPress={() => ref.url && Linking.openURL(ref.url).catch(() => {})}
            >
              <Text style={styles.referenceText}>
                {idx + 1}. {ref.title}
              </Text>
              {ref.url && <ExternalLink size={12} color={theme.colors.accent.primary} style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroImageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageCaption: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 40,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
  },
  infobox: {
    marginHorizontal: 20,
    marginBottom: 32,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  infoboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
  },
  infoboxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
  },
  infoboxContent: {
    padding: 16,
  },
  factRow: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 8,
  },
  lastFactRow: {
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  factLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  factValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  sectionNumber: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  subsection: {
    marginTop: 20,
    paddingLeft: 4,
  },
  subsectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  relatedTopicsContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(77, 125, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 125, 255, 0.1)',
  },
  relatedTopicsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 8,
  },
  topicText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  referencesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  referencesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  referenceText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontSize: 16,
    lineHeight: 26,
  },
  paragraph: {
    marginBottom: 16,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
    marginTop: 24,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    marginTop: 20,
  },
  strong: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  link: {
    color: theme.colors.accent.primary,
    textDecorationLine: 'underline',
  },
  list_item: {
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 16,
  },
});
