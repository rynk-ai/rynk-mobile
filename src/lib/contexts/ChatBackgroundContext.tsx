import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageSourcePropType } from 'react-native';

const STORAGE_KEY = 'chat-background-preference';
const LAST_AUTO_CHANGE_KEY = 'chat-background-last-auto-change';
const CURRENT_AUTO_INDEX_KEY = 'chat-background-auto-index';

// 24 hours in milliseconds
const DAY_MS = 24 * 60 * 60 * 1000;

export interface BackgroundImage {
  id: string;
  source: ImageSourcePropType;
  name: string;
}

// Map web background IDs to local assets
export const CHAT_BACKGROUNDS: BackgroundImage[] = [
  { id: '1', source: require('../../../assets/images/chat-background/1.jpg'), name: 'Blue & Red Gradient' },
  { id: '2', source: require('../../../assets/images/chat-background/2.jpg'), name: 'Ocean Blue' },
  { id: '3', source: require('../../../assets/images/chat-background/3.jpg'), name: 'Sunset Swirl' },
  { id: '4', source: require('../../../assets/images/chat-background/4.jpg'), name: 'Purple Haze' },
];

export type BackgroundPreference = 'auto' | 'none' | string;

interface ChatBackgroundContextType {
  preference: BackgroundPreference;
  setPreference: (pref: BackgroundPreference) => void;
  currentBackground: BackgroundImage | null;
  backgrounds: BackgroundImage[];
  isLoaded: boolean;
}

const ChatBackgroundContext = createContext<ChatBackgroundContextType | null>(null);

export function ChatBackgroundProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<BackgroundPreference>('auto');
  const [autoIndex, setAutoIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedPref = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedPref) {
          setPreferenceState(storedPref);
        }

        // Handle auto-rotation
        const lastChange = await AsyncStorage.getItem(LAST_AUTO_CHANGE_KEY);
        const storedIndex = await AsyncStorage.getItem(CURRENT_AUTO_INDEX_KEY);
        const now = Date.now();

        let currentIndex = storedIndex ? parseInt(storedIndex, 10) : 0;

        // Check if 24 hours have passed
        if (!lastChange || now - parseInt(lastChange, 10) > DAY_MS) {
          // Rotate to next image
          currentIndex = (currentIndex + 1) % CHAT_BACKGROUNDS.length;
          await AsyncStorage.setItem(LAST_AUTO_CHANGE_KEY, now.toString());
          await AsyncStorage.setItem(CURRENT_AUTO_INDEX_KEY, currentIndex.toString());
        }

        setAutoIndex(currentIndex);
      } catch (error) {
        console.error('[ChatBackground] Failed to load state:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadState();
  }, []);

  // Set preference and persist
  const setPreference = useCallback(async (newPref: BackgroundPreference) => {
    setPreferenceState(newPref);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newPref);
    } catch (error) {
      console.error('[ChatBackground] Failed to save preference:', error);
    }
  }, []);

  // Get current background based on preference
  const currentBackground = useMemo(() => {
    if (!isLoaded) return null;
    
    if (preference === 'none') {
      return null;
    }

    if (preference === 'auto') {
      return CHAT_BACKGROUNDS[autoIndex] || CHAT_BACKGROUNDS[0];
    }

    // Find specific background by id
    return CHAT_BACKGROUNDS.find((bg) => bg.id === preference) || CHAT_BACKGROUNDS[0];
  }, [preference, autoIndex, isLoaded]);

  const value = useMemo(() => ({
    preference,
    setPreference,
    currentBackground,
    backgrounds: CHAT_BACKGROUNDS,
    isLoaded,
  }), [preference, setPreference, currentBackground, isLoaded]);

  return (
    <ChatBackgroundContext.Provider value={value}>
      {children}
    </ChatBackgroundContext.Provider>
  );
}

export function useChatBackground() {
  const context = useContext(ChatBackgroundContext);
  if (!context) {
    throw new Error('useChatBackground must be used within a ChatBackgroundProvider');
  }
  return context;
}
