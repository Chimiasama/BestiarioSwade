import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { backNavigation } from '../services/backNavigation';

const BackNavigationEnabled = createContext(true);
export const BackNavigationScope = BackNavigationEnabled.Provider;

export function useBackNavigation(enabled: boolean, onBack: () => void, priority = 100) {
  const scopeEnabled = useContext(BackNavigationEnabled);
  const callback = useRef(onBack);
  callback.current = onBack;
  useLayoutEffect(() => {
    if (!enabled || !scopeEnabled) return;
    return backNavigation.register(() => callback.current(), priority);
  }, [enabled, scopeEnabled, priority]);
}
