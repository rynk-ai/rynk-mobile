import { Redirect } from 'expo-router';

/**
 * Index route - redirects to chat (guest mode default)
 * This is the entry point of the app
 */
export default function IndexRedirect() {
  // Use Redirect component instead of programmatic navigation
  // This ensures the layout is mounted before navigation occurs
  return <Redirect href="/chat" />;
}
