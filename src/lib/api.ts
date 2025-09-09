import { ApiResponse } from './types';

// Mock API delay to simulate real API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Simulate network delay
  await delay(300 + Math.random() * 500);

  try {
    // In a real app, this would make actual HTTP requests
    // For now, we'll simulate responses based on the endpoint
    const response = await mockApiCall<T>(endpoint, options);
    
    return {
      data: response,
      success: true,
      message: 'Success'
    };
  } catch (error) {
    throw new ApiError(500, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function mockApiCall<T>(endpoint: string, options: RequestInit): Promise<T> {
  // Mock different endpoints
  switch (endpoint) {
    case '/ai/optimize':
      return mockOptimizationResult() as T;
    case '/journeys/plan':
      return mockJourneyPlan() as T;
    case '/trains':
      return mockTrains() as T;
    case '/jobcards':
      return mockJobCards() as T;
    case '/branding':
      return mockBrandingContracts() as T;
    case '/stabling':
      return mockStablingBays() as T;
    case '/alerts':
      return mockAlerts() as T;
    case '/kpi':
      return mockKPIs() as T;
    case '/trips':
      return mockTrips() as T;
    case '/tickets':
      return mockTickets() as T;
    case '/conflicts':
      return mockConflicts() as T;
    case '/maintenance':
      return mockMaintenanceRecords() as T;
    case '/stations':
      return mockStations() as T;
    case '/lines':
      return mockMetroLines() as T;
    case '/routes':
      return mockRoutes() as T;
    case '/alerts':
      return mockMapAlerts() as T;
    case '/depot':
      return mockDepot() as T;
    case '/trains':
      return mockTrains() as T;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

// Mock data generators
function mockOptimizationResult() {
  return {
    results: [
      {
        trainId: 'KMRL-001',
        action: 'revenue',
        score: 95,
        reason: 'High passenger demand on Line 1',
        constraints: ['peak_hours', 'line_1']
      },
      {
        trainId: 'KMRL-002',
        action: 'standby',
        score: 78,
        reason: 'Backup for Line 2 during maintenance',
        constraints: ['maintenance_window']
      },
      {
        trainId: 'KMRL-003',
        action: 'IBL',
        score: 82,
        reason: 'Interchange service between Lines 1 and 2',
        constraints: ['interchange_demand']
      }
    ]
  };
}

function mockJourneyPlan() {
  return {
    from: 'Aluva',
    to: 'Thykoodam',
    steps: [
      {
        type: 'metro',
        from: 'Aluva',
        to: 'Thykoodam',
        duration: 25,
        fare: 25,
        line: 'Line 1',
        platform: 'Platform 1'
      }
    ],
    totalTime: 25,
    totalFare: 25
  };
}


function mockJobCards() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: `JC-${String(i + 1).padStart(3, '0')}`,
    trainId: `KMRL-${String(i + 1).padStart(3, '0')}`,
    title: ['Brake Inspection', 'Door Mechanism Check', 'AC Service', 'Wheel Alignment'][i % 4],
    description: `Detailed inspection and maintenance for ${['brake system', 'door mechanism', 'air conditioning', 'wheel alignment'][i % 4]}`,
    status: ['open', 'in_progress', 'completed'][i % 3] as 'open' | 'in_progress' | 'completed',
    priority: ['low', 'medium', 'high', 'critical'][i % 4] as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: `Technician ${i + 1}`,
    dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
    createdAt: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)).toISOString()
  }));
}

function mockBrandingContracts() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `BC-${String(i + 1).padStart(3, '0')}`,
    advertiser: ['Tech Corp', 'Fashion Brand', 'Food Chain', 'Bank', 'Insurance', 'Retail', 'Automotive', 'Healthcare'][i],
    contractValue: 50000 + (i * 25000),
    exposureHours: 1000 + (i * 200),
    hoursDelivered: 800 + (i * 150),
    slaRisk: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
    startDate: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    endDate: new Date(Date.now() + ((8 - i) * 30 * 24 * 60 * 60 * 1000)).toISOString(),
    status: ['active', 'expired', 'pending'][i % 3] as 'active' | 'expired' | 'pending'
  }));
}

function mockStablingBays() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `BAY-${String(i + 1).padStart(2, '0')}`,
    bayNumber: `Bay ${i + 1}`,
    capacity: 2,
    occupied: i % 3,
    trainIds: Array.from({ length: i % 3 }, (_, j) => `KMRL-${String(i * 2 + j + 1).padStart(3, '0')}`),
    estimatedTurnout: new Date(Date.now() + (i * 30 * 60 * 1000)).toISOString()
  }));
}

function mockAlerts() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ALERT-${String(i + 1).padStart(3, '0')}`,
    title: ['Signal Failure', 'Platform Maintenance', 'Power Outage', 'Weather Delay', 'Technical Issue'][i % 5],
    description: `Service disruption affecting ${['Line 1', 'Line 2', 'Multiple Lines'][i % 3]} due to ${['signal failure', 'maintenance work', 'power issues', 'weather conditions', 'technical problems'][i % 5]}`,
    severity: ['info', 'warning', 'error'][i % 3] as 'info' | 'warning' | 'error',
    affectedLines: [`Line ${(i % 2) + 1}`],
    affectedStations: [`Station ${i + 1}`],
    startTime: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
    endTime: i % 2 === 0 ? new Date(Date.now() + (i * 2 * 60 * 60 * 1000)).toISOString() : undefined,
    status: ['active', 'resolved'][i % 2] as 'active' | 'resolved'
  }));
}

function mockKPIs() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
    punctuality: 85 + Math.random() * 10,
    energyUsage: 1000 + Math.random() * 200,
    slaBreaches: Math.floor(Math.random() * 5),
    mtbf: 500 + Math.random() * 100,
    waitTimeReduction: 10 + Math.random() * 5
  }));
}

function mockTrips() {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `TRIP-${String(i + 1).padStart(3, '0')}`,
    from: ['Aluva', 'Edapally', 'Palarivattom', 'JLN Stadium', 'Kaloor'][i % 5],
    to: ['Thykoodam', 'Vytilla', 'SN Junction', 'MG Road', 'Maharaja\'s College'][i % 5],
    date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
    fare: 15 + (i % 3) * 5,
    duration: 20 + (i % 10),
    status: ['completed', 'cancelled'][i % 2] as 'completed' | 'cancelled'
  }));
}

function mockTickets() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `TICKET-${String(i + 1).padStart(3, '0')}`,
    type: ['single', 'daily', 'monthly'][i % 3] as 'single' | 'daily' | 'monthly',
    validFrom: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
    validTo: new Date(Date.now() + ((i + 1) * 24 * 60 * 60 * 1000)).toISOString(),
    fare: [25, 50, 500][i % 3],
    status: ['active', 'expired', 'used'][i % 3] as 'active' | 'expired' | 'used',
    qrCode: `QR-${String(i + 1).padStart(6, '0')}`
  }));
}

function mockConflicts() {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `CONFLICT-${String(i + 1).padStart(3, '0')}`,
    type: ['fitness', 'jobcard', 'branding'][i % 3] as 'fitness' | 'jobcard' | 'branding',
    severity: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
    description: `Conflict detected in ${['fitness certificate', 'job card assignment', 'branding schedule'][i % 3]} for train KMRL-${String(i + 1).padStart(3, '0')}`,
    affectedTrains: [`KMRL-${String(i + 1).padStart(3, '0')}`],
    resolution: i % 2 === 0 ? `Resolved by ${['automatic scheduling', 'manual intervention'][i % 2]}` : undefined,
    status: ['open', 'resolved'][i % 2] as 'open' | 'resolved'
  }));
}

function mockMaintenanceRecords() {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `MAINT-${String(i + 1).padStart(3, '0')}`,
    trainId: `KMRL-${String(i + 1).padStart(3, '0')}`,
    type: ['preventive', 'corrective', 'emergency'][i % 3] as 'preventive' | 'corrective' | 'emergency',
    description: `${['Preventive', 'Corrective', 'Emergency'][i % 3]} maintenance for ${['brake system', 'door mechanism', 'air conditioning', 'wheel alignment'][i % 4]}`,
    status: ['scheduled', 'in_progress', 'completed'][i % 3] as 'scheduled' | 'in_progress' | 'completed',
    assignedTo: `Technician ${i + 1}`,
    scheduledDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
    completedDate: i % 3 === 2 ? new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString() : undefined
  }));
}

// Map-specific mock data generators
function mockStations() {
  return [
    {
      id: 'ALUVA',
      name: 'Aluva',
      lat: 10.1089,
      lng: 76.3515,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'food_court', 'atm'],
      accessibility: true,
      firstTrain: '05:30',
      lastTrain: '22:30'
    },
    {
      id: 'EDAPALLY',
      name: 'Edapally',
      lat: 10.0258,
      lng: 76.3071,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'shopping'],
      accessibility: true,
      firstTrain: '05:35',
      lastTrain: '22:35'
    },
    {
      id: 'PALARIVATTOM',
      name: 'Palarivattom',
      lat: 10.0069,
      lng: 76.2931,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom'],
      accessibility: true,
      firstTrain: '05:40',
      lastTrain: '22:40'
    },
    {
      id: 'JLN_STADIUM',
      name: 'JLN Stadium',
      lat: 9.9881,
      lng: 76.2791,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'food_court'],
      accessibility: true,
      firstTrain: '05:45',
      lastTrain: '22:45'
    },
    {
      id: 'KALOOR',
      name: 'Kaloor',
      lat: 9.9692,
      lng: 76.2651,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'shopping', 'atm'],
      accessibility: true,
      firstTrain: '05:50',
      lastTrain: '22:50'
    },
    {
      id: 'TOWN_HALL',
      name: 'Town Hall',
      lat: 9.9503,
      lng: 76.2511,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'food_court'],
      accessibility: true,
      firstTrain: '05:55',
      lastTrain: '22:55'
    },
    {
      id: 'MG_ROAD',
      name: 'MG Road',
      lat: 9.9314,
      lng: 76.2371,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'shopping', 'atm', 'food_court'],
      accessibility: true,
      firstTrain: '06:00',
      lastTrain: '23:00'
    },
    {
      id: 'MAHARAJA_COLLEGE',
      name: 'Maharaja\'s College',
      lat: 9.9125,
      lng: 76.2231,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom'],
      accessibility: true,
      firstTrain: '06:05',
      lastTrain: '23:05'
    },
    {
      id: 'ERNAKULAM_SOUTH',
      name: 'Ernakulam South',
      lat: 9.8936,
      lng: 76.2091,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'shopping', 'atm'],
      accessibility: true,
      firstTrain: '06:10',
      lastTrain: '23:10'
    },
    {
      id: 'THYKOODAM',
      name: 'Thykoodam',
      lat: 9.8747,
      lng: 76.1951,
      lineId: 'LINE_1',
      facilities: ['parking', 'restroom', 'food_court'],
      accessibility: true,
      firstTrain: '06:15',
      lastTrain: '23:15'
    },
    {
      id: 'VYTILLA',
      name: 'Vytilla',
      lat: 9.8558,
      lng: 76.1811,
      lineId: 'LINE_2',
      facilities: ['parking', 'restroom', 'shopping'],
      accessibility: true,
      firstTrain: '06:20',
      lastTrain: '23:20'
    },
    {
      id: 'SN_JUNCTION',
      name: 'SN Junction',
      lat: 9.8369,
      lng: 76.1671,
      lineId: 'LINE_2',
      facilities: ['parking', 'restroom', 'food_court', 'atm'],
      accessibility: true,
      firstTrain: '06:25',
      lastTrain: '23:25'
    }
  ];
}

function mockMetroLines() {
  return [
    {
      id: 'LINE_1',
      name: 'Line 1',
      color: '#059669',
      stations: ['ALUVA', 'EDAPALLY', 'PALARIVATTOM', 'JLN_STADIUM', 'KALOOR', 'TOWN_HALL', 'MG_ROAD', 'MAHARAJA_COLLEGE', 'ERNAKULAM_SOUTH', 'THYKOODAM'],
      coordinates: [
        [10.1089, 76.3515],
        [10.0258, 76.3071],
        [10.0069, 76.2931],
        [9.9881, 76.2791],
        [9.9692, 76.2651],
        [9.9503, 76.2511],
        [9.9314, 76.2371],
        [9.9125, 76.2231],
        [9.8936, 76.2091],
        [9.8747, 76.1951]
      ]
    },
    {
      id: 'LINE_2',
      name: 'Line 2',
      color: '#2563eb',
      stations: ['THYKOODAM', 'VYTILLA', 'SN_JUNCTION'],
      coordinates: [
        [9.8747, 76.1951],
        [9.8558, 76.1811],
        [9.8369, 76.1671]
      ]
    },
    {
      id: 'LINE_3',
      name: 'Line 3',
      color: '#dc2626',
      stations: ['MG_ROAD', 'KALOOR', 'EDAPALLY'],
      coordinates: [
        [9.9314, 76.2371],
        [9.9692, 76.2651],
        [10.0258, 76.3071]
      ]
    }
  ];
}

function mockRoutes() {
  return [
    {
      id: 'ROUTE_001',
      from: 'ALUVA',
      to: 'THYKOODAM',
      steps: [
        {
          type: 'metro',
          from: 'ALUVA',
          to: 'THYKOODAM',
          duration: 25,
          fare: 25,
          line: 'Line 1',
          platform: 'Platform 1',
          coordinates: [
            [10.1089, 76.3515],
            [10.0258, 76.3071],
            [10.0069, 76.2931],
            [9.9881, 76.2791],
            [9.9692, 76.2651],
            [9.9503, 76.2511],
            [9.9314, 76.2371],
            [9.9125, 76.2231],
            [9.8936, 76.2091],
            [9.8747, 76.1951]
          ]
        }
      ],
      totalTime: 25,
      totalFare: 25,
      polyline: [
        [10.1089, 76.3515],
        [10.0258, 76.3071],
        [10.0069, 76.2931],
        [9.9881, 76.2791],
        [9.9692, 76.2651],
        [9.9503, 76.2511],
        [9.9314, 76.2371],
        [9.9125, 76.2231],
        [9.8936, 76.2091],
        [9.8747, 76.1951]
      ],
      createdAt: '2024-01-15T10:30:00Z'
    }
  ];
}

function mockMapAlerts() {
  return [
    {
      id: 'ALERT_001',
      title: 'Signal Maintenance',
      description: 'Signal maintenance work between Kaloor and Town Hall stations. Expect delays of 5-10 minutes.',
      severity: 'warning',
      type: 'maintenance',
      lat: 9.9597,
      lng: 76.2581,
      affectedLines: ['Line 1'],
      affectedStations: ['KALOOR', 'TOWN_HALL'],
      startTime: '2024-01-15T22:00:00Z',
      endTime: '2024-01-16T04:00:00Z',
      status: 'active'
    },
    {
      id: 'ALERT_002',
      title: 'Platform Crowding',
      description: 'Heavy crowding at MG Road station during peak hours. Please use alternative entrances.',
      severity: 'info',
      type: 'crowding',
      lat: 9.9314,
      lng: 76.2371,
      affectedLines: ['Line 1'],
      affectedStations: ['MG_ROAD'],
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T10:00:00Z',
      status: 'active'
    },
    {
      id: 'ALERT_003',
      title: 'Weather Advisory',
      description: 'Heavy rain expected. Reduced visibility may affect train operations.',
      severity: 'warning',
      type: 'weather',
      lat: 9.9312,
      lng: 76.2673,
      affectedLines: ['Line 1', 'Line 2'],
      affectedStations: ['ALUVA', 'EDAPALLY', 'PALARIVATTOM', 'JLN_STADIUM', 'KALOOR', 'TOWN_HALL', 'MG_ROAD', 'MAHARAJA_COLLEGE', 'ERNAKULAM_SOUTH', 'THYKOODAM', 'VYTILLA', 'SN_JUNCTION'],
      startTime: '2024-01-15T14:00:00Z',
      endTime: '2024-01-15T18:00:00Z',
      status: 'active'
    }
  ];
}

function mockDepot() {
  return {
    id: 'DEPOT_001',
    name: 'Kochi Metro Depot',
    bounds: [
      [9.85, 76.15],
      [9.95, 76.25]
    ],
    bays: [
      {
        id: 'BAY_001',
        bayNumber: 'Bay 1',
        x: 9.88,
        y: 76.18,
        capacity: 2,
        occupied: 1,
        trainIds: ['KMRL-001'],
        estimatedTurnout: '05:30'
      },
      {
        id: 'BAY_002',
        bayNumber: 'Bay 2',
        x: 9.89,
        y: 76.19,
        capacity: 2,
        occupied: 2,
        trainIds: ['KMRL-002', 'KMRL-003'],
        estimatedTurnout: '05:35'
      },
      {
        id: 'BAY_003',
        bayNumber: 'Bay 3',
        x: 9.90,
        y: 76.20,
        capacity: 2,
        occupied: 1,
        trainIds: ['KMRL-004'],
        estimatedTurnout: '05:40'
      },
      {
        id: 'BAY_004',
        bayNumber: 'Bay 4',
        x: 9.91,
        y: 76.21,
        capacity: 2,
        occupied: 0,
        trainIds: [],
        estimatedTurnout: '05:45'
      },
      {
        id: 'BAY_005',
        bayNumber: 'Bay 5',
        x: 9.92,
        y: 76.22,
        capacity: 2,
        occupied: 2,
        trainIds: ['KMRL-005', 'KMRL-006'],
        estimatedTurnout: '05:50'
      }
    ],
    tracks: [
      [
        [9.87, 76.17],
        [9.88, 76.18],
        [9.89, 76.19],
        [9.90, 76.20],
        [9.91, 76.21],
        [9.92, 76.22],
        [9.93, 76.23]
      ],
      [
        [9.87, 76.18],
        [9.88, 76.19],
        [9.89, 76.20],
        [9.90, 76.21],
        [9.91, 76.22],
        [9.92, 76.23],
        [9.93, 76.24]
      ]
    ],
    entryPoints: [
      [9.87, 76.17],
      [9.87, 76.18]
    ],
    exitPoints: [
      [9.93, 76.23],
      [9.93, 76.24]
    ]
  };
}

function mockTrains() {
  return [
    {
      id: 'KMRL-001',
      trainNumber: 'KMRL-001',
      status: 'revenue',
      mileage: 15420,
      fitness: {
        rollingStock: true,
        signalling: true,
        telecom: true
      },
      position: {
        bayId: 'BAY_001',
        lat: 9.88,
        lng: 76.18
      },
      jobCards: 0,
      conflicts: 0
    },
    {
      id: 'KMRL-002',
      trainNumber: 'KMRL-002',
      status: 'standby',
      mileage: 12850,
      fitness: {
        rollingStock: true,
        signalling: true,
        telecom: false
      },
      position: {
        bayId: 'BAY_002',
        lat: 9.89,
        lng: 76.19
      },
      jobCards: 1,
      conflicts: 1
    },
    {
      id: 'KMRL-003',
      trainNumber: 'KMRL-003',
      status: 'IBL',
      mileage: 18920,
      fitness: {
        rollingStock: true,
        signalling: false,
        telecom: true
      },
      position: {
        bayId: 'BAY_002',
        lat: 9.89,
        lng: 76.19
      },
      jobCards: 2,
      conflicts: 1
    },
    {
      id: 'KMRL-004',
      trainNumber: 'KMRL-004',
      status: 'maintenance',
      mileage: 22100,
      fitness: {
        rollingStock: false,
        signalling: true,
        telecom: true
      },
      position: {
        bayId: 'BAY_003',
        lat: 9.90,
        lng: 76.20
      },
      jobCards: 3,
      conflicts: 2
    },
    {
      id: 'KMRL-005',
      trainNumber: 'KMRL-005',
      status: 'revenue',
      mileage: 16750,
      fitness: {
        rollingStock: true,
        signalling: true,
        telecom: true
      },
      position: {
        bayId: 'BAY_005',
        lat: 9.92,
        lng: 76.22
      },
      jobCards: 0,
      conflicts: 0
    },
    {
      id: 'KMRL-006',
      trainNumber: 'KMRL-006',
      status: 'standby',
      mileage: 14230,
      fitness: {
        rollingStock: true,
        signalling: true,
        telecom: true
      },
      position: {
        bayId: 'BAY_005',
        lat: 9.92,
        lng: 76.22
      },
      jobCards: 1,
      conflicts: 0
    }
  ];
}
