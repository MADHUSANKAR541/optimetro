export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'commuter';
  avatar?: string;
}

export interface Train {
  id: string;
  trainNumber: string;
  status: 'active' | 'maintenance' | 'standby';
  mileage: number;
  lastService: string;
  nextService: string;
  fitness: {
    rollingStock: boolean;
    signalling: boolean;
    telecom: boolean;
  };
}

export interface JobCard {
  id: string;
  trainId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  dueDate: string;
  createdAt: string;
}

export interface BrandingContract {
  id: string;
  advertiser: string;
  contractValue: number;
  exposureHours: number;
  hoursDelivered: number;
  slaRisk: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
}

export interface StablingBay {
  id: string;
  bayNumber: string;
  capacity: number;
  occupied: number;
  trainIds: string[];
  estimatedTurnout: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  affectedLines: string[];
  affectedStations: string[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'resolved';
}

export interface Journey {
  id: string;
  from: string;
  to: string;
  steps: JourneyStep[];
  totalTime: number;
  totalFare: number;
  createdAt: string;
}

export interface JourneyStep {
  type: 'metro' | 'bus' | 'walk';
  from: string;
  to: string;
  duration: number;
  fare?: number;
  line?: string;
  platform?: string;
}

export interface KPI {
  date: string;
  punctuality: number;
  energyUsage: number;
  slaBreaches: number;
  mtbf: number;
  waitTimeReduction: number;
}

export interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  fare: number;
  duration: number;
  status: 'completed' | 'cancelled';
}

export interface Ticket {
  id: string;
  type: 'single' | 'daily' | 'monthly';
  validFrom: string;
  validTo: string;
  fare: number;
  status: 'active' | 'expired' | 'used';
  qrCode: string;
}

export interface OptimizationResult {
  trainId: string;
  action: 'revenue' | 'standby' | 'IBL';
  score: number;
  reason: string;
  constraints: string[];
}

export interface Conflict {
  id: string;
  type: 'fitness' | 'jobcard' | 'branding';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedTrains: string[];
  resolution?: string;
  status: 'open' | 'resolved';
}

export interface MaintenanceRecord {
  id: string;
  trainId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  assignedTo: string;
  scheduledDate: string;
  completedDate?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Map-related types
export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lineId: string;
  facilities: string[];
  accessibility: boolean;
  firstTrain: string;
  lastTrain: string;
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  stations: string[];
  coordinates: [number, number][];
}

export interface RouteStep {
  type: 'metro' | 'bus' | 'walk';
  from: string;
  to: string;
  duration: number;
  fare?: number;
  line?: string;
  platform?: string;
  coordinates: [number, number][];
}

export interface Route {
  id: string;
  from: string;
  to: string;
  steps: RouteStep[];
  totalTime: number;
  totalFare: number;
  polyline: [number, number][];
  createdAt: string;
}

export interface MapAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  type: 'maintenance' | 'crowding' | 'weather' | 'technical';
  lat: number;
  lng: number;
  affectedLines: string[];
  affectedStations: string[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'resolved';
}

export interface DepotBay {
  id: string;
  bayNumber: string;
  x: number;
  y: number;
  capacity: number;
  occupied: number;
  trainIds: string[];
  estimatedTurnout: string;
}

export interface DepotSchematic {
  id: string;
  name: string;
  bounds: [[number, number], [number, number]];
  bays: DepotBay[];
  tracks: [number, number][][];
  entryPoints: [number, number][];
  exitPoints: [number, number][];
}

export interface TrainRake {
  id: string;
  trainNumber: string;
  status: 'revenue' | 'standby' | 'IBL' | 'maintenance';
  mileage: number;
  fitness: {
    rollingStock: boolean;
    signalling: boolean;
    telecom: boolean;
  };
  position?: {
    bayId?: string;
    lat?: number;
    lng?: number;
    x?: number;
    y?: number;
  };
  jobCards: number;
  conflicts: number;
}

export interface ShuntingMove {
  trainId: string;
  from: string;
  to: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'stations' | 'lines' | 'alerts' | 'routes' | 'depot';
}

export interface MapState {
  center: [number, number];
  zoom: number;
  layers: MapLayer[];
  selectedStation?: string;
  selectedRoute?: string;
  selectedTrain?: string;
  selectedAlert?: string;
}
