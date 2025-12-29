import { Redirect } from 'expo-router';

/**
 * Index route - redirects to guest-chat (guest mode default)
 * This is the entry point of the app
 */
export default function IndexRedirect() {
  // Use Redirect component - works with expo-router's layout system
  // Using href object to bypass TypeScript strict route types
  return <Redirect href={{ pathname: '/guest-chat' } as any} />;
}
