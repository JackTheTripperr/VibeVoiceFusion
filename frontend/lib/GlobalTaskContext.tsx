'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import type { Generation } from '@/types/generation';

interface GlobalTaskContextType {
  currentTask: Generation | null;
  refreshTask: () => Promise<void>;
}

const GlobalTaskContext = createContext<GlobalTaskContextType | undefined>(undefined);

export function GlobalTaskProvider({ children }: { children: React.ReactNode }) {
  const [currentTask, setCurrentTask] = useState<Generation | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refreshTask = useCallback(async () => {
    try {
      const response = await api.getCurrentGeneration();
      setCurrentTask(response.generation);
    } catch (error) {
      console.error('Error checking running generation:', error);
      setCurrentTask(null);
    }
  }, []);

  // Initial check
  useEffect(() => {
    refreshTask();
  }, [refreshTask]);

  // Poll every 60 seconds
  useEffect(() => {
    pollingIntervalRef.current = setInterval(refreshTask, 60000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [refreshTask]);

  const value: GlobalTaskContextType = {
    currentTask,
    refreshTask,
  };

  return (
    <GlobalTaskContext.Provider value={value}>
      {children}
    </GlobalTaskContext.Provider>
  );
}

export function useGlobalTask() {
  const context = useContext(GlobalTaskContext);
  if (context === undefined) {
    throw new Error('useGlobalTask must be used within a GlobalTaskProvider');
  }
  return context;
}
