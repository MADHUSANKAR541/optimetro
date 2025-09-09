// Utility to export mock data for Supabase migration
import stationsJson from '../data/commuter/stations.json';
import linesJson from '../data/commuter/lines.json';
import routesJson from '../data/commuter/routes.json';
import alertsJson from '../data/commuter/alerts.json';
import trainsJson from '../data/admin/trains.json';
import depotJson from '../data/admin/depot.json';

export const mockData = {
  stations: stationsJson,
  metroLines: linesJson,
  routes: routesJson,
  alerts: alertsJson,
  trains: trainsJson,
  depot: depotJson
};

// Export individual data arrays
export const stationsData = stationsJson;
export const metroLinesData = linesJson;
export const routesData = routesJson;
export const alertsData = alertsJson;
export const trainsData = trainsJson;
export const depotData = depotJson;

// Helper function to format data for Supabase
export function formatForSupabase(data: any, tableName: string) {
  switch (tableName) {
    case 'stations':
      return data.map((station: any) => ({
        id: station.id,
        name: station.name,
        lat: station.lat,
        lng: station.lng,
        line_id: station.lineId,
        facilities: station.facilities,
        accessibility: station.accessibility,
        first_train: station.firstTrain,
        last_train: station.lastTrain
      }));

    case 'metro_lines':
      return data.map((line: any) => ({
        id: line.id,
        name: line.name,
        color: line.color,
        stations: line.stations,
        coordinates: line.coordinates
      }));

    case 'routes':
      return data.map((route: any) => ({
        id: route.id,
        from_station: route.from,
        to_station: route.to,
        steps: route.steps,
        total_time: route.totalTime,
        total_fare: route.totalFare,
        polyline: route.polyline,
        created_at: route.createdAt
      }));

    case 'alerts':
      return data.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        type: alert.type,
        lat: alert.lat,
        lng: alert.lng,
        affected_lines: alert.affectedLines,
        affected_stations: alert.affectedStations,
        start_time: alert.startTime,
        end_time: alert.endTime,
        status: alert.status
      }));

    case 'trains':
      return data.map((train: any) => ({
        id: train.id,
        train_number: train.trainNumber,
        status: train.status,
        mileage: train.mileage,
        fitness: train.fitness,
        position: train.position,
        job_cards: train.jobCards,
        conflicts: train.conflicts
      }));

    case 'depot_schematic':
      return [{
        id: data.id,
        name: data.name,
        bounds: data.bounds,
        tracks: data.tracks,
        entry_points: data.entryPoints,
        exit_points: data.exitPoints
      }];

    case 'depot_bays':
      return data.bays.map((bay: any) => ({
        id: bay.id,
        bay_number: bay.bayNumber,
        x: bay.x,
        y: bay.y,
        capacity: bay.capacity,
        occupied: bay.occupied,
        train_ids: bay.trainIds,
        estimated_turnout: bay.estimatedTurnout,
        depot_id: data.id
      }));

    default:
      return data;
  }
}
