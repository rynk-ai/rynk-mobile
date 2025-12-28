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
