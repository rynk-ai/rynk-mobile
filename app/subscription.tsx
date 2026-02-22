import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Sparkles, Zap } from 'lucide-react-native';
import { theme } from '../src/lib/theme';
import { useAuth } from '../src/lib/auth';

// Mock Subscription Data Types
type Tier = 'free' | 'standard';

interface SubscriptionInfo {
    tier: Tier;
    status: 'none' | 'active' | 'canceled' | 'past_due';
    credits: number;
    carryoverCredits: number;
    creditsResetAt: string | null;
}

const tierConfig = {
    free: {
        name: 'Free',
        price: '$0',
        queries: 20,
        icon: Sparkles,
        color: theme.colors.text.secondary,
        features: [
            '20 queries per month',
            'Basic AI chat',
            'File uploads',
            'Credits reset monthly',
        ],
    },
    standard: {
        name: 'rynk+',
        price: '$5.99',
        period: '/mo',
        queries: 2500,
        icon: Zap,
        color: '#3B82F6', // Blue accent for pro
        features: [
            '2,500 queries per month',
            'Everything in Free',
            'Priority support',
            'Credits reset monthly (no rollover)',
        ],
    },
};

export default function SubscriptionScreen() {
    const router = useRouter();
    const { session, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<Tier | null>(null);

    useEffect(() => {
        // Mock fetching subscription status
        const fetchSubscription = async () => {
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Mock data
                setSubscription({
                    tier: 'free',
                    status: 'active',
                    credits: 20,
                    carryoverCredits: 0,
                    creditsResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                });
            } catch (error) {
                Alert.alert('Error', 'Failed to load subscription info');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    const handleUpgrade = async (tier: Tier) => {
        if (!isAuthenticated) {
            Alert.alert('Authentication Required', 'Please sign in to subscribe.');
            return;
        }

        setCheckoutLoading(tier);
        // TODO: Implement actual IAP logic here (RevenueCat or react-native-iap)
        setTimeout(() => {
            setCheckoutLoading(null);
            Alert.alert(
                'Subscription integration pending',
                'This will trigger the native in-app purchase flow once configured.'
            );
        }, 1500);
    };

    const currentTier = subscription?.tier || 'free';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription</Text>
                <View style={{ width: 40 }} /> {/* Spacer for centering */}
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Pricing & Plans</Text>
                    <Text style={styles.subtitle}>Manage your plan and usage</Text>
                </View>

                {/* Current Plan Stats */}
                {isAuthenticated && subscription && (
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Credits</Text>
                                <Text style={styles.statValue}>{subscription.credits}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Allowance</Text>
                                <Text style={styles.statValue}>{tierConfig[currentTier].queries}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Reset</Text>
                                <Text style={styles.statValue}>
                                    {subscription.creditsResetAt ? new Date(subscription.creditsResetAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Available Plans</Text>

                <View style={styles.plansContainer}>
                    {(Object.entries(tierConfig) as [Tier, typeof tierConfig.free][]).map(([tier, config]) => {
                        const isCurrentPlan = currentTier === tier;

                        return (
                            <View
                                key={tier}
                                style={[
                                    styles.planCard,
                                    isCurrentPlan && styles.currentPlanCard
                                ]}
                            >
                                {isCurrentPlan && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>Current Plan</Text>
                                    </View>
                                )}

                                <View style={styles.planHeader}>
                                    <Text style={styles.planName}>{config.name}</Text>
                                    <config.icon size={20} color={config.color} />
                                </View>

                                <View style={styles.priceContainer}>
                                    <Text style={styles.planPrice}>{config.price}</Text>
                                    {config.period && <Text style={styles.planPeriod}>{config.period}</Text>}
                                </View>

                                <View style={styles.featuresList}>
                                    {config.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <Check size={16} color={config.color} style={styles.featureIcon} />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.upgradeButton,
                                        isCurrentPlan && styles.upgradeButtonDisabled,
                                        !isCurrentPlan && styles.upgradeButtonActive
                                    ]}
                                    disabled={isCurrentPlan || checkoutLoading === tier}
                                    onPress={() => handleUpgrade(tier)}
                                >
                                    {checkoutLoading === tier ? (
                                        <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                    ) : (
                                        <Text style={[
                                            styles.upgradeButtonText,
                                            isCurrentPlan ? styles.upgradeButtonTextDisabled : styles.upgradeButtonTextActive
                                        ]}>
                                            {isCurrentPlan ? 'Current Plan' : (tier === 'standard' ? 'Upgrade' : 'Downgrade')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footerText}>
                    Have questions? Contact us at support@rynk.io
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    container: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.xxxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    statsCard: {
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border.subtle,
    },
    statLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    statValue: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    plansContainer: {
        gap: theme.spacing.lg,
    },
    planCard: {
        backgroundColor: theme.colors.background.card,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border.default,
        position: 'relative',
    },
    currentPlanCard: {
        borderColor: theme.colors.accent.primary,
    },
    currentBadge: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        backgroundColor: theme.colors.accent.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    currentBadgeText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        textTransform: 'uppercase',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    planName: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: theme.spacing.xl,
    },
    planPrice: {
        fontSize: 36,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    planPeriod: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        marginLeft: 4,
    },
    featuresList: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
    },
    featureIcon: {
        marginTop: 2,
    },
    featureText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        flex: 1,
        lineHeight: 20,
    },
    upgradeButton: {
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upgradeButtonActive: {
        backgroundColor: theme.colors.accent.primary,
    },
    upgradeButtonDisabled: {
        backgroundColor: theme.colors.background.tertiary,
    },
    upgradeButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    upgradeButtonTextActive: {
        color: theme.colors.text.inverse,
    },
    upgradeButtonTextDisabled: {
        color: theme.colors.text.secondary,
    },
    footerText: {
        marginTop: theme.spacing.xxxl,
        textAlign: 'center',
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    }
});
