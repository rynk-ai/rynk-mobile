import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ArrowRight, MessageSquare, Sparkles, BookOpen, Target, HelpCircle } from 'lucide-react-native';
import { theme } from '../src/lib/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/chat?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/chat');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>rynk.</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          {/* Badge */}
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>RESEARCH ENGINE</Text>
            <ArrowRight size={10} color={theme.colors.text.secondary} style={{ marginLeft: 4 }} />
          </View>

          {/* Headline */}
          <Text style={styles.headline}>
            Ask once.{'\n'}
            <Text style={styles.headlineSecondary}>Get it your way.</Text>
          </Text>

          {/* Subheadline */}
          <Text style={styles.subheadline}>
            Timelines, comparisons, quizzes, courses—{'\n'}
            <Text style={styles.subheadlineHighlight}>pick the format that fits your brain.</Text>
          </Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Ask anything..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <ArrowRight size={18} color={theme.colors.text.inverse} />
            </TouchableOpacity>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/chat')}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={theme.colors.text.secondary} />
              <Text style={styles.quickActionText}>New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/conversations')}
              activeOpacity={0.7}
            >
              <Sparkles size={16} color={theme.colors.text.secondary} />
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What can you do?</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MessageSquare size={20} color="#3b82f6" />
              </View>
              <Text style={styles.featureTitle}>Chat</Text>
              <Text style={styles.featureDescription}>Ask anything and get intelligent responses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <BookOpen size={20} color="#22c55e" />
              </View>
              <Text style={styles.featureTitle}>Research</Text>
              <Text style={styles.featureDescription}>Deep dive into topics with sources</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                <Target size={20} color="#ec4899" />
              </View>
              <Text style={styles.featureTitle}>Quiz</Text>
              <Text style={styles.featureDescription}>Test your knowledge interactively</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} activeOpacity={0.7}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <HelpCircle size={20} color="#a855f7" />
              </View>
              <Text style={styles.featureTitle}>Compare</Text>
              <Text style={styles.featureDescription}>Analyze differences between topics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: -1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 24,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  headline: {
    fontSize: width > 380 ? 36 : 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: width > 380 ? 44 : 40,
    letterSpacing: -1,
    marginBottom: 16,
  },
  headlineSecondary: {
    color: 'rgba(229, 229, 229, 0.85)',
  },
  subheadline: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  subheadlineHighlight: {
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
});
