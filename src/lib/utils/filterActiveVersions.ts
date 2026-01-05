import type { Message } from '../types';

/**
 * Filters messages to show only active versions (highest versionNumber per version group).
 * This prevents duplicate messages from appearing when message versioning is used.
 * 
 * @param messages - Array of messages that may contain multiple versions
 * @returns Filtered array with only the active version of each message, sorted by createdAt
 */
export function filterActiveVersions(messages: Message[]): Message[] {
  const activeMessages: Message[] = [];
  const versionGroups = new Map<string, Message[]>();

  // Group messages by their version root
  messages.forEach((msg) => {
    const rootId = msg.versionOf || msg.id;
    if (!versionGroups.has(rootId)) {
      versionGroups.set(rootId, []);
    }
    versionGroups.get(rootId)!.push(msg);
  });

  // For each version group, select the active version (highest versionNumber)
  versionGroups.forEach((versions) => {
    const activeVersion = versions.reduce((latest, current) => {
      return (current.versionNumber || 1) > (latest.versionNumber || 1) ? current : latest;
    });
    activeMessages.push(activeVersion);
  });

  // Sort by createdAt to maintain conversation order
  return activeMessages.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
}
