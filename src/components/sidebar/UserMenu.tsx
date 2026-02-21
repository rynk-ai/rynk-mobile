import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { theme } from '../../lib/theme';
import {
  CreditCard,
  House,
  Type,
  Sun,
  LogOut,
  Twitter,
  Gamepad2,
  Image as ImageIcon
} from 'lucide-react-native';
import { useChatBackground } from '../../lib/contexts/ChatBackgroundContext';

interface UserMenuProps {
  user: any;
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const tier = user?.subscriptionTier || 'free';
  const tierName = tier === 'standard_plus' ? 'Standard+' : tier === 'standard' ? 'Standard' : 'Free';
  const tierColor = tier === 'standard_plus' ? theme.colors.accent.primary : tier === 'standard' ? '#3B82F6' : theme.colors.text.tertiary;

  const { preference, setPreference, backgrounds } = useChatBackground();

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* Tier Info */}
        <View style={styles.tierSection}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '15' }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{tierName}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Subscription */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLink('https://rynk.io/subscription')}
        >
          <CreditCard size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>Manage Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLink('https://rynk.io')}
        >
          <House size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>Landing Page</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLink('https://rynk.io/humanizer')}
        >
          <Type size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>AI Humanizer</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Background Settings */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            // Cycle through preferences: auto -> bg1 -> bg2 -> ... -> none -> auto
            if (preference === 'auto') setPreference(backgrounds[0].id);
            else if (preference === 'none') setPreference('auto');
            else {
              const idx = backgrounds.findIndex((b) => b.id === preference);
              if (idx > -1 && idx < backgrounds.length - 1) {
                setPreference(backgrounds[idx + 1].id);
              } else {
                setPreference('none');
              }
            }
          }}
        >
          <ImageIcon size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>Background</Text>
          <Text style={styles.valueText}>
            {preference === 'auto' ? 'Auto' : preference === 'none' ? 'None' : backgrounds.find(b => b.id === preference)?.name || 'Custom'}
          </Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionLabel}>Contact</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLink('https://discord.gg/dq7U4Ydx')}
        >
          <Gamepad2 size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>Discord</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleLink('https://x.com/farsn_')}
        >
          <Twitter size={18} color={theme.colors.text.secondary} />
          <Text style={styles.menuText}>X (Twitter)</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onSignOut}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Log out</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.colors.background.secondary, // Subtle contrast
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  content: {
    paddingVertical: 8,
  },
  tierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border.subtle, // Using border color for subtle lines inside
    marginVertical: 4,
    opacity: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  sectionLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
