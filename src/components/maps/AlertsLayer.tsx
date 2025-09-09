'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapAlert } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';
import { FaExclamationTriangle, FaWrench, FaUsers, FaCloudRain, FaCog } from 'react-icons/fa';

// Dynamically import Leaflet components
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Circle })), { ssr: false });

interface AlertsLayerProps {
  alerts: MapAlert[];
  isVisible?: boolean;
  onAlertClick?: (alert: MapAlert) => void;
  showPulseEffect?: boolean;
}

export function AlertsLayer({
  alerts,
  isVisible = true,
  onAlertClick,
  showPulseEffect = true
}: AlertsLayerProps) {
  if (!isVisible) return null;

  // Get icon for alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return FaWrench;
      case 'crowding': return FaUsers;
      case 'weather': return FaCloudRain;
      case 'technical': return FaCog;
      default: return FaExclamationTriangle;
    }
  };


  // Create pulse circle for high-priority alerts
  const createPulseCircle = (alert: MapAlert) => {
    if (!showPulseEffect || alert.severity !== 'error') return null;
    
    const color = MAP_CONFIG.alertColors[alert.severity];
    
    return (
      <Circle
        key={`pulse-${alert.id}`}
        center={[alert.lat, alert.lng]}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.3
        }}
        radius={100}
      />
    );
  };

  return (
    <>
      {/* Alert markers */}
      {alerts.map((alert) => (
        <React.Fragment key={alert.id}>
          <Marker
            position={[alert.lat, alert.lng]}
            eventHandlers={{
              click: () => onAlertClick?.(alert)
            }}
          >
            <Popup>
              <div className="alert-popup">
                <div className="alert-header">
                  <FaExclamationTriangle 
                    style={{ 
                      color: MAP_CONFIG.alertColors[alert.severity], 
                      marginRight: '8px' 
                    }} 
                  />
                  <strong>{alert.title}</strong>
                  <span className={`severity-badge ${alert.severity}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <div className="alert-details">
                  <div className="alert-description">
                    {alert.description}
                  </div>
                  <div className="alert-info">
                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{alert.type}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Status:</span>
                      <span className="info-value">{alert.status}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Start Time:</span>
                      <span className="info-value">
                        {new Date(alert.startTime).toLocaleString()}
                      </span>
                    </div>
                    {alert.endTime && (
                      <div className="info-row">
                        <span className="info-label">End Time:</span>
                        <span className="info-value">
                          {new Date(alert.endTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {alert.affectedLines.length > 0 && (
                      <div className="info-row">
                        <span className="info-label">Affected Lines:</span>
                        <div className="affected-items">
                          {alert.affectedLines.map((line, index) => (
                            <span key={index} className="affected-chip">
                              {line}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {alert.affectedStations.length > 0 && (
                      <div className="info-row">
                        <span className="info-label">Affected Stations:</span>
                        <div className="affected-items">
                          {alert.affectedStations.slice(0, 3).map((station, index) => (
                            <span key={index} className="affected-chip">
                              {station}
                            </span>
                          ))}
                          {alert.affectedStations.length > 3 && (
                            <span className="affected-chip">
                              +{alert.affectedStations.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Pulse circle for high-priority alerts */}
          {createPulseCircle(alert)}
        </React.Fragment>
      ))}
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .pulse-circle {
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  );
}
