/**
 * useRynkIAP - Native In-App Purchase integration
 *
 * Wraps the react-native-iap v12 built-in useIAP hook to:
 * - Fetch subscription products from App Store / Google Play
 * - Trigger the native purchase sheet
 * - Verify the receipt against our /api/mobile/subscription/verify backend
 * - Update the local auth session post-purchase
 */

import { useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
    useIAP as useLibIAP,
    type Purchase,
    type ProductSubscription,
} from 'react-native-iap';
import { loadSession, saveSession } from '../auth/storage';

const BASE_URL = 'https://rynk.io';

// Product IDs must exactly match what you configure in:
// - App Store Connect > Subscriptions
// - Google Play Console > Subscriptions
export const IAP_PRODUCT_IDS = {
    standardMonthly: 'rynk_standard_monthly',
    standardYearly: 'rynk_standard_yearly',
};

const ALL_SKUS = Object.values(IAP_PRODUCT_IDS);

export type RynkIAPState = {
    subscriptions: ProductSubscription[];
    connected: boolean;
    isPurchasing: boolean;
    purchase: (productId: string) => Promise<void>;
    restore: () => Promise<void>;
};

export function useRynkIAP(
    onSuccess?: (tier: string, updatedUser: any) => void
): RynkIAPState {

    /**
     * Verify the completed purchase with our backend and update the local session.
     */
    const handlePurchaseSuccess = useCallback(async (purchase: Purchase) => {
        try {
            const session = await loadSession();
            if (!session) {
                console.error('[IAP] No session found for verification');
                return;
            }

            const receipt = Platform.OS === 'ios'
                ? purchase.purchaseToken   // iOS: JWS receipt token
                : purchase.purchaseToken;  // Android: purchase token

            if (!receipt) {
                console.error('[IAP] No receipt token on purchase object');
                return;
            }

            const response = await fetch(`${BASE_URL}/api/mobile/subscription/verify`, {
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

            if (!response.ok) {
                throw new Error(data.error || 'Backend verification failed');
            }

            // Persist updated user tier to local session
            const updatedSession = {
                ...session,
                user: {
                    ...session.user,
                    subscriptionTier: data.user.subscriptionTier,
                    subscriptionStatus: data.user.subscriptionStatus,
                    credits: data.user.credits,
                },
            };
            await saveSession(updatedSession);

            console.log(`[IAP] ✅ Verified tier: ${data.tier}`);
            onSuccess?.(data.tier, data.user);
        } catch (err: any) {
            console.error('[IAP] Verification error:', err);
            Alert.alert(
                'Purchase Recorded — Verification Pending',
                'Your payment went through but we could not confirm it right now. If your tier is not updated within 24 hours, contact support@rynk.io.',
                [{ text: 'OK' }]
            );
        }
    }, [onSuccess]);

    // Use the library's own hook — it manages the StoreKit/Play connection
    const {
        subscriptions,
        connected,
        fetchProducts,
        requestPurchase,
        restorePurchases,
    } = useLibIAP({
        onPurchaseSuccess: handlePurchaseSuccess,
        onPurchaseError: (err) => {
            if ((err as any).code !== 'E_USER_CANCELLED') {
                Alert.alert('Purchase Failed', err.message || 'Something went wrong. Please try again.');
            }
        },
    });

    // Fetch subscriptions on mount — this is called from the screen via useEffect
    const purchase = useCallback(async (productId: string) => {
        // Ensure latest products are loaded before purchasing
        if (subscriptions.length === 0) {
            await fetchProducts({ skus: ALL_SKUS, type: 'subs' });
        }
        await requestPurchase({
            type: 'subs',
            request: {
                apple: { sku: productId },
                google: { skus: [productId] },
            },
        });
    }, [subscriptions.length, fetchProducts, requestPurchase]);

    const restore = useCallback(async () => {
        try {
            await restorePurchases();
            Alert.alert('Purchases Restored', 'Your subscriptions have been checked and applied.');
        } catch (err: any) {
            Alert.alert('Restore Failed', err.message || 'Could not restore your purchases.');
        }
    }, [restorePurchases]);

    return {
        subscriptions,
        connected,
        isPurchasing: false, // library doesn't expose this directly; control via UI state
        purchase,
        restore,
    };
}

/**
 * Call this once on app launch (in _layout.tsx) to pre-load subscription products.
 * Keeps the subscription screen snappy.
 */
export const IAP_SKUS = ALL_SKUS;
