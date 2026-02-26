/**
 * Onboarding Conversation Content
 * 
 * Simplified: just a single welcome message created on signup.
 * The real onboarding happens via the empty state with suggestion
 * cards that nudge users to ask their first question.
 */

export interface OnboardingMessage {
  role: 'user' | 'assistant'
  content: string
}

export const ONBOARDING_MESSAGES: OnboardingMessage[] = [
  {
    role: 'assistant',
    content: `Welcome to Rynk! I'm your research assistant.

Ask me anything — I can research topics with **real citations**, analyze your files, and remember your past conversations. 

Toggle **Deep Research** for cited reports, or just start chatting.`
  }
]

export const ONBOARDING_CONVERSATION_TITLE = "Welcome to Rynk"
