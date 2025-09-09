'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  stationsApi, 
  metroLinesApi, 
  routesApi, 
  alertsApi, 
  trainsApi, 
  depotApi,
  jobCardsApi,
  brandingContractsApi,
  stablingBaysApi,
  kpisApi,
  tripsApi,
  ticketsApi,
  conflictsApi,
  maintenanceRecordsApi,
  gtfsApi
} from '@/lib/supabaseApi';
import { ApiResponse } from '@/lib/types';

export function useSupabaseApi<T>(
  apiFunction: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction();
      setData(response.data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const updateData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

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
  return useSupabaseApi<any[]>(() => stationsApi.getAll());
}

export function useStation(id: string) {
  return useSupabaseApi<any>(() => stationsApi.getById(id), [id]);
}

export function useStationsByLine(lineId: string) {
  return useSupabaseApi<any[]>(() => stationsApi.getByLine(lineId), [lineId]);
}

export function useMetroLines() {
  return useSupabaseApi<any[]>(() => metroLinesApi.getAll());
}

export function useMetroLine(id: string) {
  return useSupabaseApi<any>(() => metroLinesApi.getById(id), [id]);
}

export function useRoutes() {
  return useSupabaseApi<any[]>(() => routesApi.getAll());
}

export function useRoute(id: string) {
  return useSupabaseApi<any>(() => routesApi.getById(id), [id]);
}

export function useRouteByStations(fromStation: string, toStation: string) {
  return useSupabaseApi<any[]>(() => routesApi.getByStations(fromStation, toStation), [fromStation, toStation]);
}

export function useAlerts() {
  return useSupabaseApi<any[]>(() => alertsApi.getAll());
}

export function useActiveAlerts() {
  return useSupabaseApi<any[]>(() => alertsApi.getActive());
}

export function useAlert(id: string) {
  return useSupabaseApi<any>(() => alertsApi.getById(id), [id]);
}

export function useAlertsBySeverity(severity: string) {
  return useSupabaseApi<any[]>(() => alertsApi.getBySeverity(severity), [severity]);
}

export function useTrains() {
  return useSupabaseApi<any[]>(() => trainsApi.getAll());
}

export function useTrain(id: string) {
  return useSupabaseApi<any>(() => trainsApi.getById(id), [id]);
}

export function useTrainsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => trainsApi.getByStatus(status), [status]);
}

export function useDepot() {
  return useSupabaseApi<any>(() => depotApi.getSchematic());
}

export function useDepotBays() {
  return useSupabaseApi<any[]>(() => depotApi.getBays());
}

export function useDepotBay(id: string) {
  return useSupabaseApi<any>(() => depotApi.getBayById(id), [id]);
}

export function useJobCards() {
  return useSupabaseApi<any[]>(() => jobCardsApi.getAll());
}

export function useJobCard(id: string) {
  return useSupabaseApi<any>(() => jobCardsApi.getById(id), [id]);
}

export function useJobCardsByTrain(trainId: string) {
  return useSupabaseApi<any[]>(() => jobCardsApi.getByTrain(trainId), [trainId]);
}

export function useJobCardsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => jobCardsApi.getByStatus(status), [status]);
}

export function useBrandingContracts() {
  return useSupabaseApi<any[]>(() => brandingContractsApi.getAll());
}

export function useBrandingContract(id: string) {
  return useSupabaseApi<any>(() => brandingContractsApi.getById(id), [id]);
}

export function useBrandingContractsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => brandingContractsApi.getByStatus(status), [status]);
}

export function useStablingBays() {
  return useSupabaseApi<any[]>(() => stablingBaysApi.getAll());
}

export function useStablingBay(id: string) {
  return useSupabaseApi<any>(() => stablingBaysApi.getById(id), [id]);
}

export function useKPIs() {
  return useSupabaseApi<any[]>(() => kpisApi.getAll());
}

export function useKPIsByDateRange(startDate: string, endDate: string) {
  return useSupabaseApi<any[]>(() => kpisApi.getByDateRange(startDate, endDate), [startDate, endDate]);
}

export function useTrips() {
  return useSupabaseApi<any[]>(() => tripsApi.getAll());
}

export function useTripsByUser(userId: string) {
  return useSupabaseApi<any[]>(() => tripsApi.getByUser(userId), [userId]);
}

export function useTrip(id: string) {
  return useSupabaseApi<any>(() => tripsApi.getById(id), [id]);
}

export function useTickets() {
  return useSupabaseApi<any[]>(() => ticketsApi.getAll());
}

export function useTicketsByUser(userId: string) {
  return useSupabaseApi<any[]>(() => ticketsApi.getByUser(userId), [userId]);
}

export function useTicket(id: string) {
  return useSupabaseApi<any>(() => ticketsApi.getById(id), [id]);
}

export function useTicketsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => ticketsApi.getByStatus(status), [status]);
}

export function useConflicts() {
  return useSupabaseApi<any[]>(() => conflictsApi.getAll());
}

export function useConflict(id: string) {
  return useSupabaseApi<any>(() => conflictsApi.getById(id), [id]);
}

export function useConflictsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => conflictsApi.getByStatus(status), [status]);
}

export function useMaintenanceRecords() {
  return useSupabaseApi<any[]>(() => maintenanceRecordsApi.getAll());
}

export function useMaintenanceRecord(id: string) {
  return useSupabaseApi<any>(() => maintenanceRecordsApi.getById(id), [id]);
}

export function useMaintenanceRecordsByTrain(trainId: string) {
  return useSupabaseApi<any[]>(() => maintenanceRecordsApi.getByTrain(trainId), [trainId]);
}

export function useMaintenanceRecordsByStatus(status: string) {
  return useSupabaseApi<any[]>(() => maintenanceRecordsApi.getByStatus(status), [status]);
}

// ===== GTFS hooks =====
export function useGtfsRoutes() {
  return useSupabaseApi<any[]>(() => gtfsApi.getRoutes());
}

export function useGtfsStops() {
  return useSupabaseApi<any[]>(() => gtfsApi.getStops());
}

export function useGtfsTripsByRoute(routeId: string) {
  return useSupabaseApi<any[]>(() => gtfsApi.getTripsByRoute(routeId), [routeId]);
}

export function useGtfsShapesById(shapeId: string) {
  return useSupabaseApi<any[]>(() => gtfsApi.getShapesById(shapeId), [shapeId]);
}

export function useGtfsStopTimesByTrip(tripId: string) {
  return useSupabaseApi<any[]>(() => gtfsApi.getStopTimesByTrip(tripId), [tripId]);
}
