-- Kochi Metro Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'commuter');
CREATE TYPE train_status AS ENUM ('revenue', 'standby', 'IBL', 'maintenance');
CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error');
CREATE TYPE alert_type AS ENUM ('maintenance', 'crowding', 'weather', 'technical');
CREATE TYPE alert_status AS ENUM ('active', 'resolved');
CREATE TYPE ticket_type AS ENUM ('single', 'daily', 'monthly');
CREATE TYPE ticket_status AS ENUM ('active', 'expired', 'used');
CREATE TYPE conflict_type AS ENUM ('fitness', 'jobcard', 'branding');
CREATE TYPE conflict_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'emergency');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed');
CREATE TYPE step_type AS ENUM ('metro', 'bus', 'walk');
CREATE TYPE trip_status AS ENUM ('completed', 'cancelled');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'commuter',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Create function to prevent multiple admin accounts
CREATE OR REPLACE FUNCTION check_admin_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND id != NEW.id) THEN
      RAISE EXCEPTION 'Only one admin account is allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce admin limit
CREATE TRIGGER enforce_admin_limit
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_limit();

-- Metro Lines table
CREATE TABLE metro_lines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL,
  stations TEXT[] NOT NULL,
  coordinates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stations table
CREATE TABLE stations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(11, 7) NOT NULL,
  line_id VARCHAR(50) REFERENCES metro_lines(id),
  facilities TEXT[] DEFAULT '{}',
  accessibility BOOLEAN DEFAULT false,
  first_train TIME,
  last_train TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for stations
CREATE INDEX idx_stations_location ON stations USING GIST (ST_Point(lng, lat));

-- Routes table
CREATE TABLE routes (
  id VARCHAR(50) PRIMARY KEY,
  from_station VARCHAR(50) REFERENCES stations(id),
  to_station VARCHAR(50) REFERENCES stations(id),
  steps JSONB NOT NULL,
  total_time INTEGER NOT NULL,
  total_fare DECIMAL(10, 2) NOT NULL,
  polyline JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity alert_severity NOT NULL,
  type alert_type NOT NULL,
  lat DECIMAL(10, 7),
  lng DECIMAL(11, 7),
  affected_lines TEXT[] DEFAULT '{}',
  affected_stations TEXT[] DEFAULT '{}',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status alert_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for alerts
CREATE INDEX idx_alerts_location ON alerts USING GIST (ST_Point(lng, lat));

-- Trains table
CREATE TABLE trains (
  id VARCHAR(50) PRIMARY KEY,
  train_number VARCHAR(50) UNIQUE NOT NULL,
  status train_status NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  fitness JSONB NOT NULL DEFAULT '{"rollingStock": false, "signalling": false, "telecom": false}',
  position JSONB,
  job_cards INTEGER DEFAULT 0,
  conflicts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Depot Schematic table
CREATE TABLE depot_schematic (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bounds JSONB NOT NULL,
  tracks JSONB NOT NULL,
  entry_points JSONB NOT NULL,
  exit_points JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Depot Bays table
CREATE TABLE depot_bays (
  id VARCHAR(50) PRIMARY KEY,
  bay_number VARCHAR(50) NOT NULL,
  x DECIMAL(10, 7) NOT NULL,
  y DECIMAL(11, 7) NOT NULL,
  capacity INTEGER NOT NULL,
  occupied INTEGER NOT NULL DEFAULT 0,
  train_ids TEXT[] DEFAULT '{}',
  estimated_turnout TIME,
  depot_id VARCHAR(50) REFERENCES depot_schematic(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Cards table
CREATE TABLE job_cards (
  id VARCHAR(50) PRIMARY KEY,
  train_id VARCHAR(50) REFERENCES trains(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'open',
  priority priority_level NOT NULL DEFAULT 'medium',
  assigned_to VARCHAR(255) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branding Contracts table
CREATE TABLE branding_contracts (
  id VARCHAR(50) PRIMARY KEY,
  advertiser VARCHAR(255) NOT NULL,
  contract_value DECIMAL(15, 2) NOT NULL,
  exposure_hours INTEGER NOT NULL,
  hours_delivered INTEGER NOT NULL DEFAULT 0,
  sla_risk priority_level NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stabling Bays table
CREATE TABLE stabling_bays (
  id VARCHAR(50) PRIMARY KEY,
  bay_number VARCHAR(50) NOT NULL,
  capacity INTEGER NOT NULL,
  occupied INTEGER NOT NULL DEFAULT 0,
  train_ids TEXT[] DEFAULT '{}',
  estimated_turnout TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  punctuality DECIMAL(5, 2) NOT NULL,
  energy_usage DECIMAL(10, 2) NOT NULL,
  sla_breaches INTEGER NOT NULL DEFAULT 0,
  mtbf DECIMAL(10, 2) NOT NULL,
  wait_time_reduction DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  from_station VARCHAR(50) REFERENCES stations(id),
  to_station VARCHAR(50) REFERENCES stations(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  fare DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  status trip_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type ticket_type NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  fare DECIMAL(10, 2) NOT NULL,
  status ticket_status NOT NULL,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conflicts table
CREATE TABLE conflicts (
  id VARCHAR(50) PRIMARY KEY,
  type conflict_type NOT NULL,
  severity conflict_severity NOT NULL,
  description TEXT NOT NULL,
  affected_trains TEXT[] NOT NULL,
  resolution TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Records table
CREATE TABLE maintenance_records (
  id VARCHAR(50) PRIMARY KEY,
  train_id VARCHAR(50) REFERENCES trains(id),
  type maintenance_type NOT NULL,
  description TEXT NOT NULL,
  status maintenance_status NOT NULL,
  assigned_to VARCHAR(255) NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stations_line_id ON stations(line_id);
CREATE INDEX idx_routes_from_station ON routes(from_station);
CREATE INDEX idx_routes_to_station ON routes(to_station);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_start_time ON alerts(start_time);
CREATE INDEX idx_trains_status ON trains(status);
CREATE INDEX idx_job_cards_train_id ON job_cards(train_id);
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_maintenance_records_train_id ON maintenance_records(train_id);
CREATE INDEX idx_maintenance_records_status ON maintenance_records(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metro_lines_updated_at BEFORE UPDATE ON metro_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trains_updated_at BEFORE UPDATE ON trains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depot_schematic_updated_at BEFORE UPDATE ON depot_schematic FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depot_bays_updated_at BEFORE UPDATE ON depot_bays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON job_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branding_contracts_updated_at BEFORE UPDATE ON branding_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stabling_bays_updated_at BEFORE UPDATE ON stabling_bays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conflicts_updated_at BEFORE UPDATE ON conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- GTFS tables (read-only public)
-- ======================================

CREATE TABLE IF NOT EXISTS gtfs_agency (
  agency_id TEXT PRIMARY KEY,
  agency_name TEXT NOT NULL,
  agency_url TEXT,
  agency_timezone TEXT,
  agency_lang TEXT,
  agency_phone TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_routes (
  route_id TEXT PRIMARY KEY,
  agency_id TEXT,
  route_short_name TEXT,
  route_long_name TEXT,
  route_type INTEGER,
  route_color TEXT,
  route_text_color TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_trips (
  trip_id TEXT PRIMARY KEY,
  route_id TEXT,
  service_id TEXT,
  trip_headsign TEXT,
  direction_id INTEGER,
  shape_id TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_stops (
  stop_id TEXT PRIMARY KEY,
  stop_name TEXT,
  stop_lat DOUBLE PRECISION,
  stop_lon DOUBLE PRECISION,
  zone_id TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_stop_times (
  trip_id TEXT,
  arrival_time TEXT,
  departure_time TEXT,
  stop_id TEXT,
  stop_sequence INTEGER,
  pickup_type INTEGER,
  drop_off_type INTEGER,
  PRIMARY KEY (trip_id, stop_sequence)
);

CREATE TABLE IF NOT EXISTS gtfs_shapes (
  shape_id TEXT,
  shape_pt_sequence INTEGER,
  shape_pt_lat DOUBLE PRECISION,
  shape_pt_lon DOUBLE PRECISION,
  shape_dist_traveled DOUBLE PRECISION,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);

CREATE TABLE IF NOT EXISTS gtfs_calendar (
  service_id TEXT PRIMARY KEY,
  monday INTEGER,
  tuesday INTEGER,
  wednesday INTEGER,
  thursday INTEGER,
  friday INTEGER,
  saturday INTEGER,
  sunday INTEGER,
  start_date TEXT,
  end_date TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_fare_attributes (
  fare_id TEXT PRIMARY KEY,
  price NUMERIC,
  currency_type TEXT,
  payment_method INTEGER,
  transfers INTEGER
);

CREATE TABLE IF NOT EXISTS gtfs_fare_rules (
  fare_id TEXT,
  route_id TEXT,
  origin_id TEXT,
  destination_id TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_feed_info (
  feed_publisher_name TEXT,
  feed_publisher_url TEXT,
  feed_lang TEXT
);

CREATE TABLE IF NOT EXISTS gtfs_translations (
  table_name TEXT,
  field_name TEXT,
  language TEXT,
  translation TEXT,
  record_id TEXT
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_gtfs_trips_route ON gtfs_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_trip ON gtfs_stop_times(trip_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_stop ON gtfs_stop_times(stop_id);
CREATE INDEX IF NOT EXISTS idx_gtfs_shapes_id ON gtfs_shapes(shape_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own trips and tickets
CREATE POLICY "Users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);

-- Public data (stations, lines, routes, alerts) are readable by everyone
-- No RLS policies needed for these tables as they should be publicly readable

-- Admin-only tables (trains, depot, job cards, etc.) should have admin-only access
-- You can create more specific policies based on your authentication setup
