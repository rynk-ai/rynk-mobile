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
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
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
