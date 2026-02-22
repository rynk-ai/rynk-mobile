import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatProvider } from '../../src/lib/contexts/ChatContext';
import ChatScreen from '../chat';

/**
 * Project Details Screen
 * Wraps the ChatScreen with a ChatProvider initialized for a specific project
 * This mimics the desktop functionality where viewing a project opens its scoped chat context.
 */
export default function ProjectScreen() {
    const { id, conversationId } = useLocalSearchParams<{ id: string; conversationId?: string }>();
    const router = useRouter();

    // If no ID is provided, fallback or show error
    if (!id) {
        return null;
    }

    // Wrap ChatScreen with ChatProvider scoped to this projectId
    return (
        <ChatProvider projectId={id} initialConversationId={conversationId}>
            <ChatScreen />
        </ChatProvider>
    );
}
