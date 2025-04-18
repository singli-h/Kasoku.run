// Polyfill for React.useEffectEvent on React <18.3
import React from 'react';

if (!React.useEffectEvent) {
  // Fallback to stable callback using useCallback
  React.useEffectEvent = function useEffectEventPolyfill(callback) {
    const callbackRef = React.useRef(callback);
    callbackRef.current = callback;
    return React.useCallback((...args) => {
      return callbackRef.current(...args);
    }, []);
  };
} 