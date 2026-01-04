import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowRight, 
  BookOpen, 
  ListChecks, 
  Target, 
  Scale, 
  Layers, 
  Calendar, 
  TrendingUp, 
  Search 
} from 'lucide-react-native';
import { theme } from '../../lib/theme';

interface SurfaceTriggerProps {
  surfaces: string[];
  conversationId?: string;
  userQuery?: string;
}

const SURFACE_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: any; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  learning: {
    label: "Course",
    description: "Start a structured learning path",
    icon: BookOpen,
    color: '#3b82f6', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  guide: {
    label: "Guide",
    description: "View step-by-step instructions",
    icon: ListChecks,
    color: '#22c55e', // green-500
    bgColor: 'rgba(34, 197, 94, 0.05)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  quiz: {
    label: "Quiz",
    description: "Test your knowledge",
    icon: Target,
    color: '#ec4899', // pink-500
    bgColor: 'rgba(236, 72, 153, 0.05)',
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  comparison: {
    label: "Compare",
    description: "See side-by-side analysis",
    icon: Scale,
    color: '#6366f1', // indigo-500
    bgColor: 'rgba(99, 102, 241, 0.05)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  flashcard: {
    label: "Flashcards",
    description: "Review key concepts",
    icon: Layers,
    color: '#14b8a6', // teal-500
    bgColor: 'rgba(20, 184, 166, 0.05)',
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  timeline: {
    label: "Timeline",
    description: "View chronological events",
    icon: Calendar,
    color: '#f59e0b', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  wiki: {
    label: "Wiki",
    description: "Read encyclopedic overview",
    icon: BookOpen, // Reusing BookOpen for wiki
    color: '#f97316', // orange-500
    bgColor: 'rgba(249, 115, 22, 0.05)',
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  finance: {
    label: "Finance",
    description: "View charts and market data",
    icon: TrendingUp,
    color: '#10b981', // emerald-500
    bgColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  research: {
    label: "Research",
    description: "Deep-dive analysis with sources",
    icon: Search,
    color: '#8b5cf6', // violet-500
    bgColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
};

export function SurfaceTrigger({
  surfaces,
  conversationId,
  userQuery,
}: SurfaceTriggerProps) {
  const router = useRouter();

  const handleOpenSurface = (type: string) => {
    if (!conversationId) return;
    const query = userQuery || "";
    // Navigation logic - adjust route as per mobile app structure
    // router.push(`/surface/${type}/${conversationId}?q=${encodeURIComponent(query)}`);
    console.log(`Navigating to surface: ${type}`);
    // For now, consistent with sidebar logic, maybe navigate to a surface screen?
    // Assuming /surfaces/[type] exists or similar. If not, just log or alert for now.
    // router.push(`/surfaces/${type}?id=${conversationId}`);
  };

  if (!surfaces || surfaces.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {surfaces.map((type) => {
        const config = SURFACE_CONFIG[type];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <TouchableOpacity
            key={type}
            onPress={() => handleOpenSurface(type)}
            style={[
              styles.card,
              { 
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              }
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { borderColor: config.borderColor }]}>
              <Icon size={20} color={config.color} />
            </View>
            
            <View style={styles.content}>
              <Text style={[styles.label, { color: config.color }]}>
                Open {config.label}
              </Text>
              <Text style={styles.description}>
                {config.description}
              </Text>
            </View>
            
            <View style={styles.arrowWrapper}>
              <ArrowRight size={16} color={config.color} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 8,
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    // Sharp corners
    borderRadius: 0, 
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    // Sharp corners? Maybe keep circle for icon wrapper contrast
    borderRadius: 20, 
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  arrowWrapper: {
    marginLeft: 8,
    opacity: 0.8,
  },
});
