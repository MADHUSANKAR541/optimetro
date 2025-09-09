'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer } from './MapContainer';
import { MetroLayers } from './MetroLayers';
import { GTFSLayer } from './GTFSLayer';
import { AlertsLayer } from './AlertsLayer';
import { useStations, useMetroLines, useAlerts } from '@/hooks/useMockApi';
import { Station, MapAlert } from '@/lib/types';
import { FaMapMarkerAlt, FaExclamationTriangle, FaLocationArrow } from 'react-icons/fa';
import styles from './MiniMap.module.scss';

interface MiniMapProps {
  className?: string;
  onStationClick?: (station: Station) => void;
  onAlertClick?: (alert: MapAlert) => void;
  userLocation?: [number, number];
  showUserLocation?: boolean;
}

export function MiniMap({
  className = '',
  onStationClick,
  onAlertClick,
  userLocation,
  showUserLocation = true
}: MiniMapProps) {
  const [nearestStations, setNearestStations] = useState<Station[]>([]);
  const [nearbyAlerts, setNearbyAlerts] = useState<MapAlert[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(userLocation || null);

  const { data: stationsData, loading: stationsLoading } = useStations();
  const { data: linesData, loading: linesLoading } = useMetroLines();
  const { data: alertsData, loading: alertsLoading } = useAlerts();

  // Get user location
  useEffect(() => {
    if (showUserLocation && !userLocation) {
      // Check if we're on the client side
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserPos([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            console.warn('Geolocation error:', error);
            // Fallback to Kochi city center
            setUserPos([9.9312, 76.2673]);
          }
        );
      } else {
        setUserPos([9.9312, 76.2673]);
      }
    }
  }, [showUserLocation, userLocation]);

  // Calculate nearest stations
  useEffect(() => {
    if (stationsData && Array.isArray(stationsData) && userPos) {
      const stationsWithDistance = stationsData.map((station: any) => ({
        ...station,
        distance: calculateDistance(
          userPos[0], userPos[1],
          station.lat, station.lng
        )
      }));

      const nearest = stationsWithDistance
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 3);

      setNearestStations(nearest);
    }
  }, [stationsData, userPos]);

  // Filter nearby alerts
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData) && userPos) {
      const nearby = alertsData.filter((alert: any) => {
        const distance = calculateDistance(
          userPos[0], userPos[1],
          alert.lat, alert.lng
        );
        return distance <= 5; // Within 5km
      });
      setNearbyAlerts(nearby);
    }
  }, [alertsData, userPos]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleStationClick = (station: Station) => {
    onStationClick?.(station);
  };

  const handleAlertClick = (alert: MapAlert) => {
    onAlertClick?.(alert);
  };

  if (stationsLoading || linesLoading || alertsLoading) {
    return (
      <div className={`${styles.miniMap} ${className}`}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonSpinner} />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`${styles.miniMap} ${className}`}
    >
      <div className={styles.mapHeader}>
        <h3 className={styles.mapTitle}>
          <FaMapMarkerAlt className={styles.mapIcon} />
          Nearby Stations
        </h3>
        {nearbyAlerts.length > 0 && (
          <div className={styles.alertBadge}>
            <FaExclamationTriangle />
            <span>{nearbyAlerts.length}</span>
          </div>
        )}
      </div>

      <div className={styles.mapContainer}>
        <MapContainer
          center={userPos || [9.9312, 76.2673]}
          zoom={13}
          height="280px"
        >
          {/* GTFS Stops (filtered to nearby) */}
          <GTFSLayer
            showStops={true}
            center={userPos || [9.9312, 76.2673]}
            radiusKm={5}
            maxStops={10}
          />

          {/* Nearby Alerts */}
          <AlertsLayer
            alerts={nearbyAlerts}
            isVisible={true}
            onAlertClick={handleAlertClick}
            showPulseEffect={true}
          />

          {/* User Location */}
          {userPos && (
            <div className={styles.userLocation}>
              <FaLocationArrow />
            </div>
          )}
        </MapContainer>
      </div>

      {/* Nearest Stations List */}
      <div className={styles.stationsList}>
        {nearestStations.map((station, index) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={styles.stationItem}
            onClick={() => handleStationClick(station)}
          >
            <div className={styles.stationInfo}>
              <span className={styles.stationName}>{station.name}</span>
              <span className={styles.stationDistance}>
                {(station as any).distance?.toFixed(1)} km
              </span>
            </div>
            <div className={styles.stationStatus}>
              {station.accessibility && (
                <span className={styles.accessibilityBadge}>♿</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          className={styles.actionButton}
          onClick={() => onStationClick?.(nearestStations[0])}
          disabled={nearestStations.length === 0}
        >
          Plan from {nearestStations[0]?.name || 'Nearest Station'}
        </button>
      </div>
    </motion.div>
  );
}
