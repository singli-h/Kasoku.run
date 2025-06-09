// Safer polyfill approach for React.useEffectEvent
import { useRef, useCallback } from 'react';

// Export a safe polyfill function that doesn't modify React object
export function useEffectEvent(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
} 