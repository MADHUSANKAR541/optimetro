'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MetroLine, Station } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';
import { FaTrain, FaMapMarkerAlt } from 'react-icons/fa';

// Dynamically import Leaflet components
const Polyline = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Tooltip })), { ssr: false });

interface MetroLayersProps {
  lines: MetroLine[];
  stations: Station[];
  showLines?: boolean;
  showStations?: boolean;
  onStationClick?: (station: Station) => void;
  onStationHover?: (station: Station) => void;
  selectedStation?: string;
}

export function MetroLayers({
  lines,
  stations,
  showLines = true,
  showStations = true,
  onStationClick,
  onStationHover,
  selectedStation
}: MetroLayersProps) {
  const normalizeLatLng = (pos: [number, number]): [number, number] => {
    if (!pos || pos.length !== 2) return pos;
    const [a, b] = pos;
    const inBounds = (lat: number, lng: number) => (
      lat >= MAP_CONFIG.bounds[0][0] && lat <= MAP_CONFIG.bounds[1][0] &&
      lng >= MAP_CONFIG.bounds[0][1] && lng <= MAP_CONFIG.bounds[1][1]
    );
    if (!inBounds(a, b) && inBounds(b, a)) return [b, a];
    return pos;
  };

  return (
    <>
      {/* Metro Lines */}
      {showLines && lines.map((line) => (
        <React.Fragment key={line.id}>
          {/* Line polyline */}
          <Polyline
            positions={line.coordinates.map((p: any) => normalizeLatLng(p))}
            pathOptions={{
              color: line.color,
              weight: MAP_CONFIG.styles.polyline.weight,
              opacity: MAP_CONFIG.styles.polyline.opacity,
              lineCap: MAP_CONFIG.styles.polyline.lineCap as any,
              lineJoin: MAP_CONFIG.styles.polyline.lineJoin as any
            }}
            eventHandlers={{
              mouseover: (e: any) => {
                e.target.setStyle({
                  weight: MAP_CONFIG.styles.polylineHover.weight,
                  opacity: MAP_CONFIG.styles.polylineHover.opacity,
                  color: MAP_CONFIG.styles.polylineHover.color
                });
              },
              mouseout: (e: any) => {
                e.target.setStyle({
                  weight: MAP_CONFIG.styles.polyline.weight,
                  opacity: MAP_CONFIG.styles.polyline.opacity,
                  color: line.color
                });
              }
            }}
          />
          
          {/* Line label at midpoint */}
          {line.coordinates.length > 1 && (
            <Marker
              position={normalizeLatLng(line.coordinates[Math.floor(line.coordinates.length / 2)] as any)}
            >
              <Tooltip opacity={1}>
                <div className="line-tooltip">
                  <strong>{line.name}</strong>
                  <br />
                  <span style={{ color: line.color }}>●</span> {line.stations.length} stations
                </div>
              </Tooltip>
            </Marker>
          )}
        </React.Fragment>
      ))}

      {/* Metro Stations */}
      {showStations && stations.map((station) => {
        const isSelected = selectedStation === station.id;
        
        return (
          <Marker
            key={station.id}
            position={normalizeLatLng([station.lat, station.lng])}
            eventHandlers={{
              click: () => onStationClick?.(station),
              mouseover: () => onStationHover?.(station),
              mouseout: () => {}
            }}
          >
            <Popup>
              <div className="station-popup">
                <div className="station-header">
                  <FaMapMarkerAlt style={{ color: '#059669', marginRight: '8px' }} />
                  <strong>{station.name}</strong>
                </div>
                <div className="station-details">
                  <div className="station-info">
                    <span className="info-label">Line:</span>
                    <span className="info-value">{station.lineId}</span>
                  </div>
                  <div className="station-info">
                    <span className="info-label">First Train:</span>
                    <span className="info-value">{station.firstTrain}</span>
                  </div>
                  <div className="station-info">
                    <span className="info-label">Last Train:</span>
                    <span className="info-value">{station.lastTrain}</span>
                  </div>
                  <div className="station-info">
                    <span className="info-label">Accessibility:</span>
                    <span className="info-value">
                      {station.accessibility ? '✓ Available' : '✗ Not Available'}
                    </span>
                  </div>
                  {station.facilities.length > 0 && (
                    <div className="station-facilities">
                      <span className="info-label">Facilities:</span>
                      <div className="facilities-list">
                        {station.facilities.map((facility, index) => (
                          <span key={index} className="facility-chip">
                            {facility.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
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
