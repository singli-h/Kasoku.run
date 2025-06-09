// Shim for '@radix-ui/react-use-effect-event'
import { useRef, useCallback } from 'react';

// Polyfill fallback for useEffectEvent (React 19 compatible)
function useEffectEventPolyfill(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args) => callbackRef.current(...args), []);
}

// Always use polyfill for React 19 compatibility
export const useEffectEvent = useEffectEventPolyfill; 