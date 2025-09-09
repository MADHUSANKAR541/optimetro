import { supabase, supabaseAdmin, TABLES, GTFS_TABLES } from './supabase';
import { ApiResponse } from './types';

export class SupabaseApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SupabaseApiError';
  }
}

// Define filter types
interface FilterValue {
  operator: string;
  value: any;
}

type FilterObject = Record<string, any[] | FilterValue | any>;

export async function supabaseApi<T = any>(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  data?: any,
  filters?: FilterObject
): Promise<ApiResponse<T>> {
  try {
    if (!supabase) {
      return { data: [] as T, success: false, message: 'Supabase is not configured' };
    }

    let result;

    switch (operation) {
      case 'select':
        let query = supabase.from(table).select('*');
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value !== null && 'operator' in value && 'value' in value) {
              const filterValue = value as FilterValue;
              query = query.filter(key, filterValue.operator, filterValue.value);
            } else {
              query = query.eq(key, value);
            }
          });
        }
        
        result = await query;
        break;

      case 'insert':
        result = await supabase.from(table).insert(data).select();
        break;

      case 'update':
        let updateQuery = supabase.from(table).update(data);
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value);
          });
        }
        
        result = await updateQuery.select();
        break;

      case 'delete':
        let deleteQuery = supabase.from(table).delete();
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value);
          });
        }
        
        result = await deleteQuery;
        break;

      default:
        throw new SupabaseApiError(400, `Unsupported operation: ${operation}`);
    }

    if (result.error) {
      throw new SupabaseApiError(result.status || 500, result.error.message);
    }

    return {
      data: result.data as T,
      success: true,
      message: 'Success'
    };
  } catch (error) {
    if (error instanceof SupabaseApiError) {
      throw error;
    }
    throw new SupabaseApiError(500, error instanceof Error ? error.message : 'Unknown error');
  }
}

// Specialized API functions for different data types
export const stationsApi = {
  getAll: () => supabaseApi(TABLES.STATIONS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.STATIONS, 'select', undefined, { id }),
  getByLine: (lineId: string) => supabaseApi(TABLES.STATIONS, 'select', undefined, { line_id: lineId }),
  create: (station: any) => supabaseApi(TABLES.STATIONS, 'insert', station),
  update: (id: string, station: any) => supabaseApi(TABLES.STATIONS, 'update', station, { id }),
  delete: (id: string) => supabaseApi(TABLES.STATIONS, 'delete', undefined, { id })
};

export const metroLinesApi = {
  getAll: () => supabaseApi(TABLES.METRO_LINES, 'select'),
  getById: (id: string) => supabaseApi(TABLES.METRO_LINES, 'select', undefined, { id }),
  create: (line: any) => supabaseApi(TABLES.METRO_LINES, 'insert', line),
  update: (id: string, line: any) => supabaseApi(TABLES.METRO_LINES, 'update', line, { id }),
  delete: (id: string) => supabaseApi(TABLES.METRO_LINES, 'delete', undefined, { id })
};

export const routesApi = {
  getAll: () => supabaseApi(TABLES.ROUTES, 'select'),
  getById: (id: string) => supabaseApi(TABLES.ROUTES, 'select', undefined, { id }),
  getByStations: (fromStation: string, toStation: string) => 
    supabaseApi(TABLES.ROUTES, 'select', undefined, { 
      from_station: fromStation, 
      to_station: toStation 
    }),
  create: (route: any) => supabaseApi(TABLES.ROUTES, 'insert', route),
  update: (id: string, route: any) => supabaseApi(TABLES.ROUTES, 'update', route, { id }),
  delete: (id: string) => supabaseApi(TABLES.ROUTES, 'delete', undefined, { id })
};

export const alertsApi = {
  getAll: () => supabaseApi(TABLES.ALERTS, 'select'),
  getActive: () => supabaseApi(TABLES.ALERTS, 'select', undefined, { status: 'active' }),
  getById: (id: string) => supabaseApi(TABLES.ALERTS, 'select', undefined, { id }),
  getBySeverity: (severity: string) => supabaseApi(TABLES.ALERTS, 'select', undefined, { severity }),
  create: (alert: any) => supabaseApi(TABLES.ALERTS, 'insert', alert),
  update: (id: string, alert: any) => supabaseApi(TABLES.ALERTS, 'update', alert, { id }),
  delete: (id: string) => supabaseApi(TABLES.ALERTS, 'delete', undefined, { id })
};

export const trainsApi = {
  getAll: () => supabaseApi(TABLES.TRAINS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.TRAINS, 'select', undefined, { id }),
  getByStatus: (status: string) => supabaseApi(TABLES.TRAINS, 'select', undefined, { status }),
  create: (train: any) => supabaseApi(TABLES.TRAINS, 'insert', train),
  update: (id: string, train: any) => supabaseApi(TABLES.TRAINS, 'update', train, { id }),
  delete: (id: string) => supabaseApi(TABLES.TRAINS, 'delete', undefined, { id })
};

export const depotApi = {
  getSchematic: () => supabaseApi(TABLES.DEPOT_SCHEMATIC, 'select'),
  getBays: () => supabaseApi(TABLES.DEPOT_BAYS, 'select'),
  getBayById: (id: string) => supabaseApi(TABLES.DEPOT_BAYS, 'select', undefined, { id }),
  updateBay: (id: string, bay: any) => supabaseApi(TABLES.DEPOT_BAYS, 'update', bay, { id })
};

export const jobCardsApi = {
  getAll: () => supabaseApi(TABLES.JOB_CARDS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.JOB_CARDS, 'select', undefined, { id }),
  getByTrain: (trainId: string) => supabaseApi(TABLES.JOB_CARDS, 'select', undefined, { train_id: trainId }),
  getByStatus: (status: string) => supabaseApi(TABLES.JOB_CARDS, 'select', undefined, { status }),
  create: (jobCard: any) => supabaseApi(TABLES.JOB_CARDS, 'insert', jobCard),
  update: (id: string, jobCard: any) => supabaseApi(TABLES.JOB_CARDS, 'update', jobCard, { id }),
  delete: (id: string) => supabaseApi(TABLES.JOB_CARDS, 'delete', undefined, { id })
};

export const brandingContractsApi = {
  getAll: () => supabaseApi(TABLES.BRANDING_CONTRACTS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.BRANDING_CONTRACTS, 'select', undefined, { id }),
  getByStatus: (status: string) => supabaseApi(TABLES.BRANDING_CONTRACTS, 'select', undefined, { status }),
  create: (contract: any) => supabaseApi(TABLES.BRANDING_CONTRACTS, 'insert', contract),
  update: (id: string, contract: any) => supabaseApi(TABLES.BRANDING_CONTRACTS, 'update', contract, { id }),
  delete: (id: string) => supabaseApi(TABLES.BRANDING_CONTRACTS, 'delete', undefined, { id })
};

export const stablingBaysApi = {
  getAll: () => supabaseApi(TABLES.STABLING_BAYS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.STABLING_BAYS, 'select', undefined, { id }),
  create: (bay: any) => supabaseApi(TABLES.STABLING_BAYS, 'insert', bay),
  update: (id: string, bay: any) => supabaseApi(TABLES.STABLING_BAYS, 'update', bay, { id }),
  delete: (id: string) => supabaseApi(TABLES.STABLING_BAYS, 'delete', undefined, { id })
};

export const kpisApi = {
  getAll: () => supabaseApi(TABLES.KPIS, 'select'),
  getByDateRange: (startDate: string, endDate: string) => 
    supabaseApi(TABLES.KPIS, 'select', undefined, {
      date: { operator: 'gte', value: startDate }
    }),
  create: (kpi: any) => supabaseApi(TABLES.KPIS, 'insert', kpi)
};

export const tripsApi = {
  getAll: () => supabaseApi(TABLES.TRIPS, 'select'),
  getByUser: (userId: string) => supabaseApi(TABLES.TRIPS, 'select', undefined, { user_id: userId }),
  getById: (id: string) => supabaseApi(TABLES.TRIPS, 'select', undefined, { id }),
  create: (trip: any) => supabaseApi(TABLES.TRIPS, 'insert', trip),
  update: (id: string, trip: any) => supabaseApi(TABLES.TRIPS, 'update', trip, { id })
};

export const ticketsApi = {
  getAll: () => supabaseApi(TABLES.TICKETS, 'select'),
  getByUser: (userId: string) => supabaseApi(TABLES.TICKETS, 'select', undefined, { user_id: userId }),
  getById: (id: string) => supabaseApi(TABLES.TICKETS, 'select', undefined, { id }),
  getByStatus: (status: string) => supabaseApi(TABLES.TICKETS, 'select', undefined, { status }),
  create: (ticket: any) => supabaseApi(TABLES.TICKETS, 'insert', ticket),
  update: (id: string, ticket: any) => supabaseApi(TABLES.TICKETS, 'update', ticket, { id })
};

export const conflictsApi = {
  getAll: () => supabaseApi(TABLES.CONFLICTS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.CONFLICTS, 'select', undefined, { id }),
  getByStatus: (status: string) => supabaseApi(TABLES.CONFLICTS, 'select', undefined, { status }),
  create: (conflict: any) => supabaseApi(TABLES.CONFLICTS, 'insert', conflict),
  update: (id: string, conflict: any) => supabaseApi(TABLES.CONFLICTS, 'update', conflict, { id }),
  delete: (id: string) => supabaseApi(TABLES.CONFLICTS, 'delete', undefined, { id })
};

export const maintenanceRecordsApi = {
  getAll: () => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'select'),
  getById: (id: string) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'select', undefined, { id }),
  getByTrain: (trainId: string) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'select', undefined, { train_id: trainId }),
  getByStatus: (status: string) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'select', undefined, { status }),
  create: (record: any) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'insert', record),
  update: (id: string, record: any) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'update', record, { id }),
  delete: (id: string) => supabaseApi(TABLES.MAINTENANCE_RECORDS, 'delete', undefined, { id })
};

// GTFS convenience APIs
export const gtfsApi = {
  getRoutes: () => supabaseApi(GTFS_TABLES.ROUTES, 'select'),
  getStops: () => supabaseApi(GTFS_TABLES.STOPS, 'select'),
  getShapesById: (shapeId: string) => supabaseApi(GTFS_TABLES.SHAPES, 'select', undefined, { shape_id: shapeId }),
  getTripsByRoute: (routeId: string) => supabaseApi(GTFS_TABLES.TRIPS, 'select', undefined, { route_id: routeId }),
  getStopTimesByTrip: (tripId: string) => supabaseApi(GTFS_TABLES.STOP_TIMES, 'select', undefined, { trip_id: tripId }),
};
