import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api/client';
import { theme } from '../../src/lib/theme';
import { useAuth } from '../../src/lib/auth';
import { MessageItem, ChatBackground } from '../../src/components/chat';
import type { Message } from '../../src/lib/types';
import { useChatContext } from '../../src/lib/contexts/ChatContext';

interface ShareData {
    share: {
        id: string;
        title: string;
        viewCount: number;
        cloneCount: number;
        createdAt: string;
    };
    conversation: {
        title: string;
        tags: string[];
        createdAt: number;
    };
    messages: any[];
}

export default function ShareScreen() {
    const params = useLocalSearchParams<{ id: string; action?: string }>();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { loadConversations } = useChatContext();

    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cloning, setCloning] = useState(false);

    // Load shared conversation
    useEffect(() => {
        if (!params.id) return;

        async function loadShare() {
            try {
                setLoading(true);
                // Using bare fetch since this might be a public endpoint and api.get injects auth
                const res = await fetch(`https://rynk.io/api/share/${params.id}`);
                // If testing locally, we should use the configured API URL instead:
                // const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rynk.io';
                // const res = await fetch(`${baseUrl}/api/share/${params.id}`);

                if (!res.ok) {
                    throw new Error('Failed to load shared conversation');
                }

                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // Convert the shared message format to our mobile Message format for rendering
                const formattedMessages = data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    createdAt: new Date(m.timestamp).toISOString(),
                    // Passing reasoning metadata through so MessageItem handles it natively
                    reasoning_metadata: m.reasoning_metadata
                        ? typeof m.reasoning_metadata === 'string'
                            ? m.reasoning_metadata
                            : JSON.stringify(m.reasoning_metadata)
                        : null,
                } as unknown as Message));

                setShareData({
                    ...data,
                    messages: formattedMessages,
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load share');
            } finally {
                setLoading(false);
            }
        }

        loadShare();
    }, [params.id]);

    // Handle Clone
    const handleClone = useCallback(async () => {
        if (!shareData || !params.id) return;

        if (!isAuthenticated) {
            // Redirect to login, then come back here with action=clone
            router.push({
                pathname: '/login',
                params: { returnTo: `/share/${params.id}?action=clone` }
            });
            return;
        }

        try {
            setCloning(true);
            // Use authenticated mobile API client 
            const response = await api.post<{ conversationId: string }>(`/share/${params.id}/clone`, {});

            if (response && response.conversationId) {
                // Refresh conversatons list in the background
                if (loadConversations) loadConversations();

                // Navigate to the newly cloned conversation
                router.replace({
                    pathname: '/chat',
                    params: { id: response.conversationId }
                });
            } else {
                throw new Error('No conversation ID returned');
            }
        } catch (err: any) {
            console.error('Failed to clone:', err);
            setError(err.message || 'Failed to clone conversation');
            setCloning(false);
        }
    }, [shareData, params.id, isAuthenticated, router, loadConversations]);

    // Auto-clone if returning from login
    useEffect(() => {
        if (params.action === 'clone' && shareData && !cloning && isAuthenticated) {
            handleClone();
        }
    }, [params.action, shareData, cloning, isAuthenticated, handleClone]);


    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={theme.colors.accent.primary} />
                <Text style={styles.loadingText}>Loading shared conversation...</Text>
            </View>
        );
    }

    if (error || !shareData) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.accent.error} />
                <Text style={styles.errorText}>{error || 'Conversation not found'}</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
                    <Text style={styles.buttonText}>Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ChatBackground />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {shareData.conversation.title || 'Shared Conversation'}
                </Text>
            </View>

            {/* Messages List */}
            <ScrollView style={styles.messageList} contentContainerStyle={styles.messageListContent}>
                {shareData.messages.map((msg, index) => (
                    <MessageItem
                        key={msg.id || index}
                        message={msg}
                        isLastMessage={index === shareData.messages.length - 1}
                        isStreaming={false}
                        streamingContent=""
                    />
                ))}

                {/* Clone CTA */}
                <View style={styles.cloneContainer}>
                    <Text style={styles.cloneTitle}>Continue this conversation</Text>
                    <Text style={styles.cloneSubtitle}>Clone this conversation to your account and keep chatting with AI.</Text>
                    <TouchableOpacity
                        style={[styles.cloneButton, cloning && styles.cloneButtonDisabled]}
                        onPress={handleClone}
                        disabled={cloning}
                    >
                        {cloning ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <>
                                <Ionicons name="log-in-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                                <Text style={styles.cloneButtonText}>Clone to My Account</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    loadingText: {
        marginTop: 16,
        color: theme.colors.text.secondary,
        fontSize: 16,
    },
    errorText: {
        marginTop: 16,
        marginBottom: 24,
        color: theme.colors.text.secondary,
        fontSize: 16,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.accent.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
    },
    buttonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 16,
    },
    cloneContainer: {
        margin: 16,
        marginTop: 32,
        padding: 20,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
    },
    cloneTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    cloneSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    cloneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.accent.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
        width: '100%',
        justifyContent: 'center',
    },
    cloneButtonDisabled: {
        opacity: 0.7,
    },
    cloneButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 16,
    },
});
