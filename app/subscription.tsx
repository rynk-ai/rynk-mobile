import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Sparkles, Zap, RotateCcw } from 'lucide-react-native';
import { theme } from '../src/lib/theme';
import { useAuth } from '../src/lib/auth';
import { IAP_PRODUCT_IDS, IAP_SKUS } from '../src/lib/hooks/useIAP';
import { useIAP as useLibIAP } from 'react-native-iap';

// Subscription tier config for display
type Tier = 'free' | 'standard';

const tierConfig = {
    free: {
        name: 'Free',
        price: '$0',
        queries: 20,
        icon: Sparkles,
        color: theme.colors.text.secondary,
        description: 'Get started with AI-powered chat',
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
        productId: IAP_PRODUCT_IDS.standardMonthly,
        queries: 2500,
        icon: Zap,
        color: '#3B82F6',
        description: 'Power users and professionals',
        features: [
            '2,500 queries per month',
            'Everything in Free',
            'Priority AI model access',
            'Credits reset monthly',
        ],
    },
} as const;

export default function SubscriptionScreen() {
    const router = useRouter();
    const { user, isAuthenticated, refreshSession } = useAuth();
    const [isPurchasingLocal, setIsPurchasingLocal] = useState(false);

    // Library's built-in hook manages the store connection and product state
    const {
        subscriptions,
        fetchProducts,
        requestPurchase,
        restorePurchases,
    } = useLibIAP({
        onPurchaseSuccess: async (purchase) => {
            await handlePurchaseVerification(purchase);
        },
        onPurchaseError: (err) => {
            if ((err as any).code !== 'E_USER_CANCELLED') {
                Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
            }
            setIsPurchasingLocal(false);
        },
    });

    // Fetch subscription products from store on mount
    useEffect(() => {
        fetchProducts({ skus: IAP_SKUS, type: 'subs' }).catch(() => { });
    }, [fetchProducts]);

    const currentTier = (user?.subscriptionTier as Tier) ?? 'free';

    const getProductPrice = (productId: string): string => {
        const product = subscriptions.find((p) => (p as any).productId === productId);
        return (product as any)?.localizedPrice ?? '$5.99';
    };

    const handlePurchaseVerification = async (purchase: any) => {
        try {
            const session = await import('../src/lib/auth/storage').then(m => m.loadSession());
            if (!session) return;
            const receipt = purchase.purchaseToken;
            if (!receipt) return;
            const response = await fetch('https://rynk.io/api/mobile/subscription/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                    platform: Platform.OS === 'ios' ? 'ios' : 'android',
                    receipt,
                    productId: purchase.productId,
                    transactionId: purchase.transactionId ?? '',
                }),
            });
            const data = await response.json() as any;
            if (!response.ok) throw new Error(data.error || 'Verification failed');
            await refreshSession();
            setIsPurchasingLocal(false);
            Alert.alert(
                '🎉 Welcome to rynk+!',
                'Your subscription is now active. Enjoy 2,500 queries per month.',
                [{ text: "Let's Go!", onPress: () => router.back() }]
            );
        } catch (err: any) {
            Alert.alert('Verification Pending', 'Payment received. If tier is not updated in 24h, contact support@rynk.io.');
            setIsPurchasingLocal(false);
        }
    };

    const handleUpgrade = async (tier: keyof typeof tierConfig) => {
        if (tier === 'free') return;
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please sign in to subscribe.');
            return;
        }
        const config = tierConfig[tier];
        if (!('productId' in config)) return;
        setIsPurchasingLocal(true);
        try {
            await requestPurchase({
                type: 'subs',
                request: {
                    apple: { sku: config.productId },
                    google: { skus: [config.productId] },
                },
            });
        } catch (err: any) {
            if ((err as any).code !== 'E_USER_CANCELLED') {
                setIsPurchasingLocal(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => restorePurchases()}>
                    <RotateCcw size={18} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Pricing & Plans</Text>
                    <Text style={styles.subtitle}>Manage your plan and usage</Text>
                </View>

                {/* Current Usage Stats */}
                {isAuthenticated && user && (
                    <View style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Credits Left</Text>
                                <Text style={styles.statValue}>{user.credits}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Monthly Limit</Text>
                                <Text style={styles.statValue}>{tierConfig[currentTier].queries.toLocaleString()}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Plan</Text>
                                <Text style={[styles.statValue, { color: tierConfig[currentTier].color }]}>
                                    {tierConfig[currentTier].name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Available Plans</Text>

                <View style={styles.plansContainer}>
                    {(Object.entries(tierConfig) as [Tier, typeof tierConfig.free][]).map(([tier, config]) => {
                        const isCurrentPlan = currentTier === tier;
                        const isPro = tier === 'standard';
                        const livePrice = isPro ? getProductPrice(IAP_PRODUCT_IDS.standardMonthly) : '$0';

                        return (
                            <View
                                key={tier}
                                style={[
                                    styles.planCard,
                                    isCurrentPlan && styles.currentPlanCard,
                                    isPro && styles.proPlanCard,
                                ]}
                            >
                                {isCurrentPlan && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>Current Plan</Text>
                                    </View>
                                )}

                                <View style={styles.planHeader}>
                                    <Text style={[styles.planName, isPro ? styles.proName : undefined]}>{config.name}</Text>
                                    <config.icon size={20} color={config.color} />
                                </View>

                                <Text style={styles.planDescription}>{config.description}</Text>

                                <View style={styles.priceContainer}>
                                    <Text style={[styles.planPrice, isPro && styles.proPlanPrice]}>{livePrice}</Text>
                                    {'period' in config && (
                                        <Text style={styles.planPeriod}>{String((config as any).period)}</Text>
                                    )}
                                </View>

                                <View style={styles.featuresList}>
                                    {config.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <Check size={16} color={config.color} />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.upgradeButton,
                                        isCurrentPlan && styles.upgradeButtonDisabled,
                                        !isCurrentPlan && isPro && styles.upgradeButtonPro,
                                        !isCurrentPlan && !isPro && styles.upgradeButtonDowngrade,
                                    ]}
                                    disabled={isCurrentPlan || isPurchasingLocal}
                                    onPress={() => handleUpgrade(tier)}
                                >
                                    {isPurchasingLocal && !isCurrentPlan ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.upgradeButtonText,
                                                isCurrentPlan && styles.upgradeButtonTextDisabled,
                                                !isCurrentPlan && styles.upgradeButtonTextActive,
                                            ]}
                                        >
                                            {isCurrentPlan
                                                ? 'Current Plan'
                                                : isPro
                                                    ? `Upgrade to rynk+`
                                                    : 'Downgrade to Free'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footerText}>
                    Prices shown in your local currency. Subscription auto-renews monthly.
                    Cancel anytime through {Platform.OS === 'ios' ? 'App Store Settings' : 'Google Play'}.
                </Text>

                <TouchableOpacity onPress={() => restorePurchases()} style={styles.restoreButton}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                <Text style={styles.legalText}>
                    Questions? Contact support@rynk.io
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
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    container: {
        padding: theme.spacing.lg,
        paddingBottom: 60,
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
    proPlanCard: {
        borderColor: '#3B82F6' + '50',
        backgroundColor: '#3B82F6' + '08',
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
        letterSpacing: 0.5,
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
    proName: {
        color: '#3B82F6',
    },
    planDescription: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
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
    proPlanPrice: {
        color: '#3B82F6',
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
    upgradeButtonPro: {
        backgroundColor: '#3B82F6',
    },
    upgradeButtonDowngrade: {
        borderWidth: 1,
        borderColor: theme.colors.border.default,
    },
    upgradeButtonDisabled: {
        backgroundColor: theme.colors.background.tertiary,
    },
    upgradeButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    upgradeButtonTextActive: {
        color: '#fff',
    },
    upgradeButtonTextDisabled: {
        color: theme.colors.text.secondary,
    },
    footerText: {
        marginTop: theme.spacing.xxxl,
        textAlign: 'center',
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
        lineHeight: 18,
    },
    restoreButton: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    restoreText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.accent.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    legalText: {
        marginTop: theme.spacing.md,
        textAlign: 'center',
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
    },
});
