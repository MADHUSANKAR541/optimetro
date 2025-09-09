'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/lib/theme';
import { MAP_CONFIG, getTileConfig } from '@/lib/mapConfig';
import { MapState } from '@/lib/types';
import styles from './MapContainer.module.scss';

// Dynamically import Leaflet components to avoid SSR issues
const Map = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
// const MarkerClusterGroup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MarkerClusterGroup })), { ssr: false });

interface MapContainerProps {
  children: React.ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  bounds?: [[number, number], [number, number]];
  onMapReady?: (map: any) => void;
}

export function MapContainer({
  children,
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  className = '',
  height = '400px',
  bounds,
  onMapReady
}: MapContainerProps) {
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (mapInstance && bounds) {
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [mapInstance, bounds]);

  const handleMapReady = (map: any) => {
    setMapInstance(map);
    onMapReady?.(map);
  };

  if (!isClient) {
    return (
      <div 
        className={`${styles.mapSkeleton} ${className}`}
        style={{ height }}
      >
        <div className={styles.skeletonContent}>
          <div className={styles.skeletonSpinner} />
          <span className={styles.skeletonText}>Loading map...</span>
        </div>
      </div>
    );
  }

  const tileConfig = getTileConfig(theme === 'dark');

  return (
    <div className={`${styles.mapContainer} ${className}`} style={{ height }}>
      <Map
        center={center}
        zoom={zoom}
        className={styles.map}
        ref={handleMapReady}
      >
        <TileLayer
          url={tileConfig.url}
        />
        {children}
      </Map>
    </div>
  );
}
