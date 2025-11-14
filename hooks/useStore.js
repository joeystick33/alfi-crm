'use client';

import { useState, useEffect } from 'react';
import { globalStore } from '@/lib/store';

export function useStore(selector) {
  const [state, setState] = useState(() => 
    selector ? selector(globalStore.getState()) : globalStore.getState()
  );

  useEffect(() => {
    const unsubscribe = globalStore.subscribe((newState) => {
      const selected = selector ? selector(newState) : newState;
      setState(selected);
    });

    return unsubscribe;
  }, [selector]);

  return state;
}

export function useStoreActions() {
  return {
    setState: (updates) => globalStore.setState(updates),
    getState: () => globalStore.getState(),
    reset: () => globalStore.reset()
  };
}

export default useStore;
