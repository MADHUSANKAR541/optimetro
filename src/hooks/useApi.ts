'use client';

import { useMockApi } from './useMockApi';
import { 
  useStations as useSupabaseStations,
  useMetroLines as useSupabaseMetroLines,
  useRoutes as useSupabaseRoutes,
  useAlerts as useSupabaseAlerts,
  useTrains as useSupabaseTrains,
  useDepot as useSupabaseDepot
} from './useSupabaseApi';
import { shouldUseSupabase } from '@/lib/apiConfig';

// Unified API hooks that automatically choose between mock and Supabase
export function useStations() {
  if (shouldUseSupabase()) {
    return useSupabaseStations();
  }
  return useMockApi('stations');
}

export function useMetroLines() {
  if (shouldUseSupabase()) {
    return useSupabaseMetroLines();
  }
  return useMockApi('lines');
}

export function useRoutes() {
  if (shouldUseSupabase()) {
    return useSupabaseRoutes();
  }
  return useMockApi('routes');
}

export function useAlerts() {
  if (shouldUseSupabase()) {
    return useSupabaseAlerts();
  }
  return useMockApi('alerts');
}

export function useTrains() {
  if (shouldUseSupabase()) {
    return useSupabaseTrains();
  }
  return useMockApi('trains');
}

export function useDepot() {
  if (shouldUseSupabase()) {
    return useSupabaseDepot();
  }
  return useMockApi('depot');
}

// Re-export all other hooks for backward compatibility
export {
  useMockApi,
  useStations as useMockStations,
  useMetroLines as useMockMetroLines,
  useRoutes as useMockRoutes,
  useAlerts as useMockAlerts,
  useTrains as useMockTrains,
  useDepot as useMockDepot
} from './useMockApi';

export {
  useStations as useSupabaseStations,
  useMetroLines as useSupabaseMetroLines,
  useRoutes as useSupabaseRoutes,
  useAlerts as useSupabaseAlerts,
  useTrains as useSupabaseTrains,
  useDepot as useSupabaseDepot
} from './useSupabaseApi';
