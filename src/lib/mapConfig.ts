// Map configuration for Kochi Metro
export const MAP_CONFIG = {
  // Default center (Kochi city center)
  defaultCenter: [9.9312, 76.2673] as [number, number],
  defaultZoom: 12,
  
  // Map bounds for Kochi Metro network
  bounds: [
    [9.8, 76.1], // Southwest
    [10.1, 76.4]  // Northeast
  ] as [[number, number], [number, number]],
  
  // Tile configurations
  tiles: {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© OpenStreetMap contributors © CARTO'
    },
    mapbox: {
      url: `https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      attribution: '© Mapbox'
    }
  },
  
  // Metro line colors (Kochi theme)
  lineColors: {
    'Line 1': '#059669', // Emerald
    'Line 2': '#2563eb', // Blue
    'Line 3': '#dc2626', // Red
    'Line 4': '#ea580c', // Orange
    'Line 5': '#7c3aed'  // Purple
  },
  
  // Status colors
  statusColors: {
    revenue: '#059669',    // Green
    standby: '#f59e0b',    // Yellow
    IBL: '#3b82f6',        // Blue
    maintenance: '#dc2626', // Red
    active: '#059669',     // Green
    inactive: '#6b7280'    // Gray
  },
  
  // Alert severity colors
  alertColors: {
    info: '#3b82f6',       // Blue
    warning: '#f59e0b',    // Yellow
    error: '#dc2626'       // Red
  },
  
  // Map styling
  styles: {
    polyline: {
      weight: 6,
      opacity: 0.8,
      color: '#059669',
      lineCap: 'round',
      lineJoin: 'round'
    },
    polylineHover: {
      weight: 8,
      opacity: 1,
      color: '#10b981'
    },
    marker: {
      iconSize: [25, 35],
      iconAnchor: [12, 35],
      popupAnchor: [0, -35]
    },
    cluster: {
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    }
  }
};

// Check if Mapbox token is available
export const USE_MAPBOX = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Get appropriate tile configuration
export const getTileConfig = (isDark: boolean = false) => {
  if (USE_MAPBOX) {
    return MAP_CONFIG.tiles.mapbox;
  }
  return isDark ? MAP_CONFIG.tiles.dark : MAP_CONFIG.tiles.osm;
};
