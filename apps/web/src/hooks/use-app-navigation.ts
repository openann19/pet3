/**
 * useAppNavigation Hook
 *
 * Manages view navigation state and handlers.
 * Extracted from App.tsx to follow mobile screen patterns.
 */

import { useState } from 'react';

type View = 'discover' | 'matches' | 'chat' | 'community' | 'adoption' | 'lost-found' | 'profile';

interface UseAppNavigationReturn {
  currentView: View;
  setCurrentView: (view: View) => void;
  navigateToChat: () => void;
}

export function useAppNavigation(): UseAppNavigationReturn {
  const [currentView, setCurrentView] = useState<View>('discover');

  const navigateToChat = (): void => {
    setCurrentView('chat');
  };

  return {
    currentView,
    setCurrentView,
    navigateToChat,
  };
}
