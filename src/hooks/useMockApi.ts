'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ApiResponse } from '@/lib/types';

export function useMockApi<T>(
  endpoint: string,
  initialData?: T
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api<T>(endpoint);
      setData(response.data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const updateData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    fetchData,
    updateData,
    reset
  };
}

// Specialized hooks for different data types
export function useStations() {
  return useMockApi<any[]>('stations');
}

export function useMetroLines() {
  return useMockApi<any[]>('lines');
}

export function useRoutes() {
  return useMockApi<any[]>('routes');
}

export function useAlerts() {
  return useMockApi<any[]>('alerts');
}

export function useDepot() {
  return useMockApi<any>('depot');
}

export function useTrains() {
  return useMockApi<any[]>('trains');
}
