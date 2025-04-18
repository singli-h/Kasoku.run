// Shim for '@radix-ui/react-use-effect-event'
import React, { useRef, useCallback } from 'react';

// Polyfill fallback for useEffectEvent
function useEffectEventPolyfill(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args) => callbackRef.current(...args), []);
}

// Use native if available, otherwise polyfill
export const useEffectEvent = React.useEffectEvent || useEffectEventPolyfill; 