/**
 * Onboarding Conversation Content
 * 
 * This module contains the pre-defined back-and-forth conversation
 * that new users see when they first sign up.
 * 
 * Themes aligned with landing page:
 * - "Ask. Read. Done." (Efficiency)
 * - Structured Output (Tables, timelines vs walls of text)
 * - Infinite Memory (Persists across sessions)
 * - File Analysis (Instant understanding)
 */

// Image imports for React Native
export const ONBOARDING_IMAGES = {
  addConvo: require('../../../assets/images/onboarding/add-convo.png'),
  addFolder: require('../../../assets/images/onboarding/add-folder.png'),
  deepResearch: require('../../../assets/images/onboarding/deep-research.png'),
  files: require('../../../assets/images/onboarding/files.png'),
  newFolder: require('../../../assets/images/onboarding/new-folder.png'),
  userDropdown: require('../../../assets/images/onboarding/user-dropdown.png'),
};

export interface OnboardingMessage {
  role: 'user' | 'assistant'
  content: string
  // Optional image references for mobile (key from ONBOARDING_IMAGES)
  images?: (keyof typeof ONBOARDING_IMAGES)[]
}

export const ONBOARDING_MESSAGES: OnboardingMessage[] = [
  {
    role: 'user',
    content: "Hi! I just signed up. What makes Rynk different?"
  },
  {
    role: 'assistant',
    content: `**Ask. Read. Done.**

I'm designed to cut through the noise. No fluff, just the answers you need, formatted for instant understanding.`
  },
  {
    role: 'user',
    content: "Sounds efficient. How does the memory work?"
  },
  {
    role: 'assistant',
    content: `**Infinite Memory.**

I remember context across all your projects and sessions. You don't need to repeat yourself.

You can explicitly **reference other conversations** or entire **folders** in your current chat. Just type '@' to pull them in as context.

*Tip: Use the folder button to organize your chats.*`,
    images: ['addConvo', 'addFolder', 'newFolder']
  },
  {
    role: 'user',
    content: "Can I use my own files?"
  },
  {
    role: 'assistant',
    content: `Yes. **File Analysis** is instant.

Drop in PDFs, CSVs, or code files. I don't just "read" them—I understand the structure. 

Try dragging a file here or use the attachment button. I'll extract the key insights properly.`,
    images: ['files']
  },
  {
    role: 'user',
    content: "What about accurate search results?"
  },
  {
    role: 'assistant',
    content: `I search multiple verticals (news, academic, code) and synthesize the facts.

Every claim I make is cited. You get the raw truth, organized and ready to use.`,
    images: ['deepResearch']
  },
  {
    role: 'user',
    content: "Where can I change my settings?"
  },
  {
    role: 'assistant',
    content: `The **User Menu** (bottom left) controls your experience.

From here you can:
- **Humanize Text**: Toggle the AI humanizer.
- **Theme**: Switch between Light/Dark mode.
- **Chat Backgrounds**: Customize your view.
- **Subscription**: Manage your plan.`,
    images: ['userDropdown']
  },
  {
    role: 'assistant',
    content: `Ready to start? Just ask anything.`
  }
]

export const ONBOARDING_CONVERSATION_TITLE = "Welcome to Rynk"
