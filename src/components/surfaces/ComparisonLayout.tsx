import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Scale, Trophy, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Check, Zap } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import type { ComparisonMetadata } from '../../lib/types';

interface ComparisonLayoutProps {
  metadata: ComparisonMetadata;
}

export const ComparisonLayout = memo(function ComparisonLayout({ metadata }: ComparisonLayoutProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { title, summary, items = [], verdict, criteria = [], scenarios = [] } = metadata;
  const winnerItem = verdict?.winnerId ? items.find(i => i.id === verdict.winnerId) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Scale size={24} color={theme.colors.accent.primary} />
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSummary}>{summary}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>{items.length} Items</Text>
          <Text style={styles.heroMetaDot}>•</Text>
          <Text style={styles.heroMetaText}>{criteria.length} Criteria</Text>
        </View>
      </View>

      {/* Verdict Banner */}
      {winnerItem && (
        <View style={styles.verdictBanner}>
          <View style={styles.verdictIcon}>
            <Trophy size={24} color="#fff" />
          </View>
          <View style={styles.verdictContent}>
            <Text style={styles.verdictLabel}>RECOMMENDED</Text>
            <Text style={styles.verdictWinner}>{winnerItem.name}</Text>
            {verdict?.bottomLine && (
              <Text style={styles.verdictReason}>{verdict.bottomLine}</Text>
            )}
          </View>
          {verdict?.confidence && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{Math.round(verdict.confidence * 100)}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Scenarios */}
      {scenarios.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best For</Text>
          <View style={styles.scenariosGrid}>
            {scenarios.map((scenario, idx) => (
              <View key={idx} style={styles.scenarioCard}>
                <View style={styles.scenarioHeader}>
                  <Zap size={14} color={theme.colors.accent.primary} />
                  <Text style={styles.scenarioTitle}>{scenario.scenario}</Text>
                </View>
                <Text style={styles.scenarioRecommendation}>
                  → {items.find(i => i.id === scenario.recommendedItemId)?.name || 'N/A'}
                </Text>
                {scenario.reason && (
                  <Text style={styles.scenarioReason}>{scenario.reason}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Comparison Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparison</Text>
        {items.map(item => {
          const isExpanded = expandedItem === item.id;
          const isWinner = item.id === verdict?.winnerId;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, isWinner && styles.itemCardWinner]}
              onPress={() => setExpandedItem(isExpanded ? null : item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {isWinner && (
                    <View style={styles.winnerBadge}>
                      <Trophy size={12} color="#f59e0b" />
                      <Text style={styles.winnerBadgeText}>Best</Text>
                    </View>
                  )}
                </View>
                {isExpanded ? <ChevronUp size={20} color={theme.colors.text.tertiary} /> : <ChevronDown size={20} color={theme.colors.text.tertiary} />}
              </View>

              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={isExpanded ? undefined : 2}>{item.description}</Text>
              )}

              {isExpanded && (
                <View style={styles.prosConsContainer}>
                  {/* Pros */}
                  {item.pros && item.pros.length > 0 && (
                    <View style={styles.prosSection}>
                      <View style={styles.prosHeader}>
                        <ThumbsUp size={14} color="#22c55e" />
                        <Text style={styles.prosTitle}>Pros</Text>
                      </View>
                      {item.pros.map((pro, idx) => (
                        <View key={idx} style={styles.proConItem}>
                          <Check size={12} color="#22c55e" />
                          <Text style={styles.proText}>{pro}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Cons */}
                  {item.cons && item.cons.length > 0 && (
                    <View style={styles.consSection}>
                      <View style={styles.consHeader}>
                        <ThumbsDown size={14} color="#ef4444" />
                        <Text style={styles.consTitle}>Cons</Text>
                      </View>
                      {item.cons.map((con, idx) => (
                        <View key={idx} style={styles.proConItem}>
                          <Text style={styles.conBullet}>•</Text>
                          <Text style={styles.conText}>{con}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Criteria Table */}
      {criteria.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Criteria Analysis</Text>
          <View style={styles.criteriaTable}>
            {criteria.map((criterion, idx) => (
              <View key={idx} style={styles.criteriaRow}>
                <Text style={styles.criteriaName}>{criterion.name}</Text>
                <View style={styles.criteriaScores}>
                  {criterion.scores?.map((score, sIdx) => (
                    <View key={sIdx} style={styles.scoreItem}>
                      <Text style={styles.scoreItemName}>{items[sIdx]?.name?.slice(0, 8) || `Item ${sIdx + 1}`}</Text>
                      <View style={[styles.scoreBadge, score.rating > 7 ? styles.scoreBadgeGood : score.rating > 4 ? styles.scoreBadgeMedium : styles.scoreBadgeLow]}>
                        <Text style={[styles.scoreValue, score.rating > 7 ? styles.scoreValueGood : score.rating > 4 ? styles.scoreValueMedium : styles.scoreValueLow]}>{score.rating}/10</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  contentContainer: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(77, 125, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 8 },
  heroSummary: { fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  heroMetaText: { fontSize: 12, color: theme.colors.text.tertiary },
  heroMetaDot: { color: theme.colors.text.tertiary },
  verdictBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  verdictIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center' },
  verdictContent: { flex: 1 },
  verdictLabel: { fontSize: 10, fontWeight: '700', color: '#f59e0b', letterSpacing: 1, marginBottom: 2 },
  verdictWinner: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary },
  verdictReason: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 8 },
  confidenceText: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary, marginBottom: 12, letterSpacing: 0.5 },
  scenariosGrid: { gap: 10 },
  scenarioCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.border.subtle },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  scenarioTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
  scenarioRecommendation: { fontSize: 14, color: theme.colors.accent.primary, fontWeight: '600' },
  scenarioReason: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 },
  itemCard: { backgroundColor: theme.colors.background.secondary, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border.subtle },
  itemCardWinner: { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 17, fontWeight: '600', color: theme.colors.text.primary },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 8 },
  winnerBadgeText: { fontSize: 11, fontWeight: '600', color: '#f59e0b' },
  itemDescription: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
  prosConsContainer: { marginTop: 16, gap: 16 },
  prosSection: { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderRadius: 10, padding: 12 },
  prosHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  prosTitle: { fontSize: 12, fontWeight: '700', color: '#22c55e' },
  consSection: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 10, padding: 12 },
  consHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  consTitle: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  proConItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  proText: { fontSize: 13, color: theme.colors.text.primary, flex: 1 },
  conBullet: { color: '#ef4444', fontWeight: '700' },
  conText: { fontSize: 13, color: theme.colors.text.primary, flex: 1 },
  criteriaTable: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border.subtle },
  criteriaRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  criteriaName: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
  criteriaScores: { flexDirection: 'row', gap: 12 },
  scoreItem: { alignItems: 'center' },
  scoreItemName: { fontSize: 10, color: theme.colors.text.tertiary, marginBottom: 4 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  scoreBadgeGood: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  scoreBadgeMedium: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  scoreBadgeLow: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  scoreValue: { fontSize: 12, fontWeight: '600' },
  scoreValueGood: { color: '#22c55e' },
  scoreValueMedium: { color: '#f59e0b' },
  scoreValueLow: { color: '#ef4444' },
});

export default ComparisonLayout;
