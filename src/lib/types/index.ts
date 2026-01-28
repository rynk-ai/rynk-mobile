/**
 * Shared types for rynk Mobile
 * Mirrors the types from rynk-web
 */

// User & Auth
export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  credits: number;
  subscriptionTier: 'free' | 'pro' | 'unlimited';
  createdAt: string;
}

export interface Session {
  user: User;
  expires: string;
}

// Conversations
export interface Conversation {
  id: string;
  userId: string;
  projectId: string | null;
  title: string | null;
  path: string[] | null;
  tags: string[] | null;
  isPinned: boolean;
  activeBranchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: Attachment[] | null;
  parentMessageId: string | null;
  versionOf: string | null;
  versionNumber: number;
  branchId: string | null;
  reasoningContent: string | null;
  reasoningMetadata: ReasoningMetadata | null;
  webAnnotations: WebAnnotation[] | null;
  modelUsed: string | null;
  createdAt: string;
  // Context references
  referencedConversations?: { id: string; title: string }[] | null;
  referencedFolders?: { id: string; name: string }[] | null;
  // Onboarding images for mobile (keys from ONBOARDING_IMAGES)
  onboardingImages?: string[];
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ReasoningMetadata {
  isReasoning: boolean;
  thinkingTime?: number;
  reasoningTokens?: number;
}

export interface WebAnnotation {
  title: string;
  url: string;
  snippet?: string;
}

// Projects
export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

// Chat
export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  attachments?: string[];
  parentMessageId?: string;
  referencedConversations?: string[];
  referencedFolders?: string[];
}

export interface ChatStreamChunk {
  type: 'content' | 'reasoning' | 'done' | 'error';
  content?: string;
  messageId?: string;
  conversationId?: string;
  error?: string;
}

// API Responses
export interface ConversationsResponse {
  conversations: Conversation[];
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
}

export interface CreateConversationResponse {
  conversationId: string;
}

export interface Folder {
  id: string;
  name: string;
  conversationIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Surfaces
export type SurfaceType = 'chat' | 'learning' | 'guide' | 'quiz' | 'comparison' | 'flashcard' | 'timeline' | 'wiki' | 'finance' | 'research';
export type SurfaceMode = SurfaceType; // Alias for backward compatibility


export interface SurfaceState {
  surfaceType: SurfaceType;
  metadata: any;
  createdAt: number;
  updatedAt: number;
  availableImages?: { url: string; title: string; sourceUrl: string }[];
  citations?: any[];
  quiz?: {
    currentQuestion: number;
    answers: Record<number, string | number>;
    correctCount: number;
    incorrectCount: number;
    completed: boolean;
    startedAt: number;
    completedAt?: number;
  };
  guide?: {
    currentCheckpoint: number;
    completedCheckpoints: number[];
    checkpointContent: Record<number, string>;
  };
  flashcard?: {
    currentCard: number;
    knownCards: number[];
    unknownCards: number[];
    completed: boolean;
  };
  learning?: {
    currentChapter: number;
    completedChapters: number[];
    chapterContent: Record<number, string>;
  };
}

export interface WikiMetadata {
  type: 'wiki';
  title: string;
  summary: string;
  infobox: {
    facts: { label: string; value: string }[];
  };
  sections: {
    id: string;
    heading: string;
    content: string;
    subsections?: { id: string; heading: string; content: string }[];
    images?: { url: string; title: string; sourceUrl: string }[];
    citations?: any[];
  }[];
  relatedTopics: string[];
  references: { id: string; title: string; url: string }[];
  categories: string[];
  lastUpdated: string;
}

export interface QuizMetadata {
  type: 'quiz';
  topic: string;
  description: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'multiple-choice' | 'mixed';
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number | string;
    explanation: string;
  }[];
}

export interface GuideMetadata {
  type: 'guide';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  checkpoints: {
    id: string;
    title: string;
    description?: string;
    substeps: string[];
    estimatedTime: number;
  }[];
}

export interface FlashcardMetadata {
  type: 'flashcard';
  topic: string;
  description: string;
  cards: {
    id: string;
    front: string;
    back: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    hints?: string[];
  }[];
}

export interface TimelineMetadata {
  type: 'timeline';
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  events: {
    id: string;
    title: string;
    date: string;
    description?: string;
    category?: string;
    importance?: 'major' | 'minor';
    location?: string;
  }[];
}

export interface ComparisonMetadata {
  type: 'comparison';
  title: string;
  summary: string;
  items: {
    id: string;
    name: string;
    description?: string;
    pros?: string[];
    cons?: string[];
  }[];
  verdict?: {
    winnerId: string;
    bottomLine?: string;
    confidence?: number;
  };
  criteria: {
    name: string;
    category?: string;
    scores?: { itemId: string; rating: number }[];
  }[];
  scenarios?: {
    scenario: string;
    recommendedItemId: string;
    reason?: string;
  }[];
  sources?: { title: string; url: string; snippet?: string }[];
}

export interface ResearchMetadata {
  type: 'research';
  title: string;
  summary?: string;
  keyFindings?: string[];
  keywords?: string[];
  sections: {
    id: string;
    title: string;
    content?: string;
  }[];
  sources?: { title: string; url: string }[];
}

export interface LearningMetadata {
  type: 'learning';
  title: string;
  description: string;
  chapters: {
    id: string;
    title: string;
    estimatedTime?: number;
  }[];
}

// Streaming Types
export interface StatusMetadata {
  contextChunks?: number;
  sourceCount?: number;
  currentSource?: string;
}

export interface StatusPill {
  status: 'analyzing' | 'building_context' | 'searching' | 'reading_sources' | 'synthesizing' | 'complete' | 'planning' | 'researching';
  message: string;
  timestamp: number;
  metadata?: StatusMetadata;
}

export interface SearchResult {
  query: string;
  sources: Array<{
    type: string;
    url: string;
    title: string;
    snippet: string;
    image?: string;
    images?: string[];
  }>;
  strategy?: string[];
  totalResults?: number;
}
