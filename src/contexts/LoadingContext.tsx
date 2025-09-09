'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loading } from '@/components/ui/Loading';

interface LoadingContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const showLoading = (loadingMessage?: string) => {
    setMessage(loadingMessage);
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
    setMessage(undefined);
  };

  return (
    <LoadingContext.Provider value={{ loading, setLoading, showLoading, hideLoading }}>
      {children}
      {loading && (
        <div className="loading-overlay">
          <Loading size="lg" />
          {message && (
            <div className="loading-message">
              {message}
            </div>
          )}
        </div>
      )}
    </LoadingContext.Provider>
  );
};
