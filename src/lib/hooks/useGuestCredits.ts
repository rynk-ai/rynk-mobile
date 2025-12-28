import { useState, useEffect, useCallback } from 'react';
import { guestApi } from '../api/guest';

/**
 * Hook to track guest credits remaining
 */
export function useGuestCredits() {
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(
    guestApi.creditsRemaining
  );

  useEffect(() => {
    // Subscribe to credits changes
    const unsubscribe = guestApi.onCreditsChange(setCreditsRemaining);
    return unsubscribe;
  }, []);

  const isExhausted = creditsRemaining !== null && creditsRemaining <= 0;

  return {
    creditsRemaining,
    isExhausted,
  };
}

export default useGuestCredits;
