'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Route, RouteStep } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';
import { FaArrowRight, FaClock, FaRupeeSign, FaMapMarkerAlt } from 'react-icons/fa';

// Dynamically import Leaflet components
const Polyline = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });

interface RouteLayerProps {
  route?: Route;
  isVisible?: boolean;
  onRouteClick?: (route: Route) => void;
}

export function RouteLayer({
  route,
  isVisible = true,
  onRouteClick
}: RouteLayerProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  // Normalize possibly swapped coordinates ([lng, lat] -> [lat, lng]) using Kochi bounds
  const normalizeLatLng = (pos: [number, number]): [number, number] => {
    if (!pos || pos.length !== 2) return pos;
    const [a, b] = pos;
    const inBounds = (lat: number, lng: number) => (
      lat >= MAP_CONFIG.bounds[0][0] && lat <= MAP_CONFIG.bounds[1][0] &&
      lng >= MAP_CONFIG.bounds[0][1] && lng <= MAP_CONFIG.bounds[1][1]
    );
    // If as-is not in bounds but swapped is, return swapped
    if (!inBounds(a, b) && inBounds(b, a)) return [b, a];
    return pos;
  };

  const normalizePolyline = (poly: [number, number][]) => poly.map(normalizeLatLng);

  useEffect(() => {
    if (!route || !isVisible) {
      setAnimationProgress(0);
      return;
    }

    // Animate route drawing
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [route, isVisible]);

  if (!route || !isVisible) return null;


  // Calculate animated polyline
  const getAnimatedPolyline = () => {
    if (!route.polyline || route.polyline.length < 2) return [];
    
    const normalized = normalizePolyline(route.polyline);
    const totalPoints = normalized.length;
    const visiblePoints = Math.ceil(totalPoints * animationProgress);
    
    return normalized.slice(0, visiblePoints);
  };

  // Get origin and destination positions
  const originPos = normalizeLatLng(route.polyline[0]);
  const destinationPos = normalizeLatLng(route.polyline[route.polyline.length - 1]);

  return (
    <>
      {/* Animated route polyline */}
      <Polyline
        positions={getAnimatedPolyline()}
        pathOptions={{
          color: '#059669',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '10, 5'
        }}
        eventHandlers={{
          click: () => onRouteClick?.(route)
        }}
      />

      {/* Origin marker */}
      {originPos && (
        <Marker
          position={originPos}
        >
          <Popup>
            <div className="route-popup">
              <div className="route-header">
                <FaMapMarkerAlt style={{ color: '#059669', marginRight: '8px' }} />
                <strong>Origin: {route.from}</strong>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destinationPos && (
        <Marker
          position={destinationPos}
        >
          <Popup>
            <div className="route-popup">
              <div className="route-header">
                <FaMapMarkerAlt style={{ color: '#dc2626', marginRight: '8px' }} />
                <strong>Destination: {route.to}</strong>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Direction arrows for route steps */}
      {route.steps.map((step, index) => {
        if (step.coordinates.length < 2) return null;
        
        // Place arrow at midpoint of each step
        const midpointIndex = Math.floor(step.coordinates.length / 2);
        const arrowPosition = normalizeLatLng(step.coordinates[midpointIndex] as [number, number]);
        
        return (
          <Marker
            key={`arrow-${index}`}
            position={arrowPosition}
          >
            <Popup>
              <div className="step-popup">
                <div className="step-header">
                  <FaArrowRight style={{ color: '#059669', marginRight: '8px' }} />
                  <strong>{step.type.toUpperCase()}</strong>
                </div>
                <div className="step-details">
                  <div className="step-info">
                    <span className="info-label">From:</span>
                    <span className="info-value">{step.from}</span>
                  </div>
                  <div className="step-info">
                    <span className="info-label">To:</span>
                    <span className="info-value">{step.to}</span>
                  </div>
                  <div className="step-info">
                    <FaClock style={{ color: '#6b7280', marginRight: '4px' }} />
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{step.duration} min</span>
                  </div>
                  {step.fare && (
                    <div className="step-info">
                      <FaRupeeSign style={{ color: '#6b7280', marginRight: '4px' }} />
                      <span className="info-label">Fare:</span>
                      <span className="info-value">₹{step.fare}</span>
                    </div>
                  )}
                  {step.line && (
                    <div className="step-info">
                      <span className="info-label">Line:</span>
                      <span className="info-value">{step.line}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
