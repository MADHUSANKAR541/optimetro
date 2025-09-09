"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaMapMarkerAlt } from 'react-icons/fa';

const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })), { ssr: false });

interface GTFSLayerProps {
  showStops?: boolean;
  shapeId?: string;
  // Optional proximity filter
  center?: [number, number];
  radiusKm?: number; // if provided, only stops within radius are shown
  maxStops?: number; // cap number of rendered stops after sorting by distance
}

export function GTFSLayer({ showStops = true, shapeId, center, radiusKm, maxStops }: GTFSLayerProps) {
  const [stops, setStops] = useState<any[]>([]);
  const [shapePoints, setShapePoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!showStops) return;
    const loadStops = async () => {
      try {
        const params = new URLSearchParams();
        if (center) params.set('center', `${center[0]},${center[1]}`);
        if (typeof radiusKm === 'number') params.set('radiusKm', String(radiusKm));
        const url = `/api/gtfs/stops${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        setStops(Array.isArray(data.stops) ? data.stops : []);
      } catch (e) {
        setStops([]);
      }
    };
    loadStops();
  }, [showStops, center?.[0], center?.[1], radiusKm]);

  useEffect(() => {
    if (!shapeId) {
      setShapePoints([]);
      return;
    }
    const loadShape = async () => {
      try {
        const res = await fetch(`/api/gtfs/shapes/${encodeURIComponent(shapeId)}`);
        const data = await res.json();
        const pts: [number, number][] = (data.shapes || []).map((p: any) => [Number(p.shape_pt_lat), Number(p.shape_pt_lon)]);
        setShapePoints(pts);
      } catch (e) {
        setShapePoints([]);
      }
    };
    loadShape();
  }, [shapeId]);

  // Helper to compute distance in km using Haversine
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Apply proximity filtering if a center is provided
  let stopsToRender = stops;
  if (showStops && Array.isArray(stopsToRender) && center) {
    const [clat, clon] = center;
    stopsToRender = stopsToRender
      .map((s: any) => ({
        ...s,
        __distanceKm: distanceKm(clat, clon, Number(s.stop_lat), Number(s.stop_lon))
      }))
      .filter((s: any) => (typeof radiusKm === 'number' ? s.__distanceKm <= radiusKm : true))
      .sort((a: any, b: any) => a.__distanceKm - b.__distanceKm);
    if (typeof maxStops === 'number') {
      stopsToRender = stopsToRender.slice(0, maxStops);
    }
  }

  return (
    <>
      {showStops && stopsToRender.map((s) => (
        <Marker key={s.stop_id} position={[Number(s.stop_lat), Number(s.stop_lon)]}>
          <Popup>
            <div className="gtfs-stop-popup">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaMapMarkerAlt style={{ color: '#2563eb' }} />
                <strong>{s.stop_name}</strong>
              </div>
              {typeof s.__distanceKm === 'number' && (
                <div style={{ marginTop: 4 }}>{s.__distanceKm.toFixed(1)} km away</div>
              )}
              {s.zone_id && (
                <div style={{ marginTop: 4 }}>Zone: {s.zone_id}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      {shapePoints.length > 1 && (
        <Polyline
          positions={shapePoints}
          pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8 }}
        />
      )}
    </>
  );
}
