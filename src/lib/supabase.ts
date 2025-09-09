import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create clients if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// For server-side operations that require elevated permissions
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database table names
export const TABLES = {
  STATIONS: 'stations',
  METRO_LINES: 'metro_lines',
  ROUTES: 'routes',
  ALERTS: 'alerts',
  TRAINS: 'trains',
  DEPOT_BAYS: 'depot_bays',
  DEPOT_SCHEMATIC: 'depot_schematic',
  JOB_CARDS: 'job_cards',
  BRANDING_CONTRACTS: 'branding_contracts',
  STABLING_BAYS: 'stabling_bays',
  KPIS: 'kpis',
  TRIPS: 'trips',
  TICKETS: 'tickets',
  CONFLICTS: 'conflicts',
  MAINTENANCE_RECORDS: 'maintenance_records',
  USERS: 'users'
} as const;

// GTFS tables
export const GTFS_TABLES = {
  AGENCY: 'gtfs_agency',
  ROUTES: 'gtfs_routes',
  TRIPS: 'gtfs_trips',
  STOPS: 'gtfs_stops',
  STOP_TIMES: 'gtfs_stop_times',
  SHAPES: 'gtfs_shapes',
  CALENDAR: 'gtfs_calendar',
  FARE_ATTRIBUTES: 'gtfs_fare_attributes',
  FARE_RULES: 'gtfs_fare_rules',
  FEED_INFO: 'gtfs_feed_info',
  TRANSLATIONS: 'gtfs_translations'
} as const;