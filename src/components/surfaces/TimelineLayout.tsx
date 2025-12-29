import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Calendar, ChevronDown, ChevronUp, Star, Clock, MapPin } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { TimelineMetadata } from '../../lib/types';

interface TimelineLayoutProps {
  metadata: TimelineMetadata;
}

export const TimelineLayout = memo(function TimelineLayout({ metadata }: TimelineLayoutProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const events = metadata.events || [];
  const categories = [...new Set(events.map(e => e.category).filter(Boolean))] as string[];

  const filteredEvents = selectedCategory
    ? events.filter(e => e.category === selectedCategory)
    : events;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Calendar size={24} color={theme.colors.accent.primary} />
        </View>
        <Text style={styles.heroTitle}>{metadata.title}</Text>
        <Text style={styles.heroDescription}>{metadata.description}</Text>
        {metadata.startDate && metadata.endDate && (
          <View style={styles.dateRange}>
            <Text style={styles.dateRangeText}>{metadata.startDate} — {metadata.endDate}</Text>
          </View>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Clock size={14} color={theme.colors.text.secondary} />
          <Text style={styles.statText}>{events.length} Events</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={14} color="#f59e0b" />
          <Text style={styles.statText}>{events.filter(e => e.importance === 'major').length} Major</Text>
        </View>
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Timeline Line */}
        <View style={styles.timelineLine} />

        {filteredEvents.map((event, index) => {
          const isExpanded = expandedEvent === event.id;
          const isMajor = event.importance === 'major';

          return (
            <View key={event.id} style={styles.eventContainer}>
              {/* Timeline Dot */}
              <View style={[styles.timelineDot, isMajor && styles.timelineDotMajor]}>
                {isMajor && <Star size={10} color="#fff" />}
              </View>

              {/* Event Card */}
              <TouchableOpacity
                style={[styles.eventCard, isMajor && styles.eventCardMajor]}
                onPress={() => setExpandedEvent(isExpanded ? null : event.id)}
                activeOpacity={0.8}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventDate}>
                    <Calendar size={12} color={theme.colors.text.tertiary} />
                    <Text style={styles.eventDateText}>{event.date}</Text>
                  </View>
                  {event.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{event.category}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.eventTitle, isMajor && styles.eventTitleMajor]}>{event.title}</Text>
                
                {!isExpanded && event.description && (
                  <Text style={styles.eventPreview} numberOfLines={2}>{event.description}</Text>
                )}

                {isExpanded && (
                  <View style={styles.eventExpanded}>
                    {event.description && (
                      <Markdown style={markdownStyles}>{event.description}</Markdown>
                    )}
                    {event.location && (
                      <View style={styles.locationRow}>
                        <MapPin size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.locationText}>{event.location}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.expandIcon}>
                  {isExpanded ? (
                    <ChevronUp size={18} color={theme.colors.text.tertiary} />
                  ) : (
                    <ChevronDown size={18} color={theme.colors.text.tertiary} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
});

const markdownStyles = StyleSheet.create({
  body: { color: theme.colors.text.secondary, fontSize: 14, lineHeight: 22 },
  paragraph: { marginBottom: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  contentContainer: { padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border.subtle },
  heroIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 8 },
  heroDescription: { fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  dateRange: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.background.tertiary, borderRadius: 8 },
  dateRangeText: { fontSize: 12, color: theme.colors.text.secondary },
  statsBar: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  filterScroll: { marginBottom: 24 },
  filterContent: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background.secondary, borderWidth: 1, borderColor: theme.colors.border.subtle },
  filterChipActive: { backgroundColor: theme.colors.accent.primary, borderColor: theme.colors.accent.primary },
  filterChipText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  timeline: { position: 'relative', paddingLeft: 28 },
  timelineLine: { position: 'absolute', left: 7, top: 20, bottom: 20, width: 2, backgroundColor: theme.colors.border.subtle },
  eventContainer: { marginBottom: 20, position: 'relative' },
  timelineDot: { position: 'absolute', left: -28, top: 20, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.background.secondary, borderWidth: 2, borderColor: theme.colors.border.default, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  timelineDotMajor: { backgroundColor: '#f59e0b', borderColor: '#f59e0b', width: 20, height: 20, borderRadius: 10, left: -30 },
  eventCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border.subtle },
  eventCardMajor: { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventDate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDateText: { fontSize: 12, color: theme.colors.text.tertiary },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.colors.background.tertiary },
  categoryBadgeText: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600' },
  eventTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  eventTitleMajor: { fontSize: 17, fontWeight: '700' },
  eventPreview: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
  eventExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  locationText: { fontSize: 13, color: theme.colors.text.secondary },
  expandIcon: { position: 'absolute', bottom: 12, right: 12 },
});

export default TimelineLayout;
