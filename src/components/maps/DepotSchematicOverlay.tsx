'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DepotSchematic, DepotBay, TrainRake } from '@/lib/types';
import { FaTrain, FaCog, FaWrench, FaCheckCircle } from 'react-icons/fa';
import styles from './DepotSchematicOverlay.module.scss';

interface DepotSchematicOverlayProps {
  depot: DepotSchematic;
  trains: TrainRake[];
  onTrainMove?: (trainId: string, fromBay: string, toBay: string) => void;
  onTrainClick?: (train: TrainRake) => void;
  selectedTrain?: string;
}

export function DepotSchematicOverlay({
  depot,
  trains,
  onTrainMove,
  onTrainClick,
  selectedTrain
}: DepotSchematicOverlayProps) {
  const [draggedTrain, setDraggedTrain] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Normalize geographic coordinates (lat/lng) into 0..100 SVG space using depot.bounds
  const normalizeX = (lon: number) => {
    const minLon = depot.bounds?.[0]?.[1];
    const maxLon = depot.bounds?.[1]?.[1];
    if (typeof minLon !== 'number' || typeof maxLon !== 'number' || maxLon === minLon) return lon;
    return ((lon - minLon) / (maxLon - minLon)) * 100;
  };

  const normalizeY = (lat: number) => {
    const minLat = depot.bounds?.[0]?.[0];
    const maxLat = depot.bounds?.[1]?.[0];
    if (typeof minLat !== 'number' || typeof maxLat !== 'number' || maxLat === minLat) return lat;
    // SVG y increases downward; choose direct mapping for now
    return ((lat - minLat) / (maxLat - minLat)) * 100;
  };

  const getBayXY = (bay: DepotBay) => {
    // Detect if bay.x/bay.y are geographic by comparing to bounds
    const minLat = depot.bounds?.[0]?.[0];
    const maxLat = depot.bounds?.[1]?.[0];
    const minLon = depot.bounds?.[0]?.[1];
    const maxLon = depot.bounds?.[1]?.[1];

    const looksLikeGeo =
      typeof minLat === 'number' && typeof maxLat === 'number' &&
      typeof minLon === 'number' && typeof maxLon === 'number' &&
      bay.x >= Math.min(minLat, maxLat) && bay.x <= Math.max(minLat, maxLat) &&
      bay.y >= Math.min(minLon, maxLon) && bay.y <= Math.max(minLon, maxLon);

    if (looksLikeGeo) {
      return { x: normalizeX(bay.y as unknown as number), y: normalizeY(bay.x as unknown as number) };
    }

    // Otherwise treat as already-normalized 0..100
    return { x: bay.x as unknown as number, y: bay.y as unknown as number };
  };

  const getTrainXY = (train: TrainRake) => {
    const px = (train.position as any)?.x;
    const py = (train.position as any)?.y;
    if (px != null && py != null) {
      return { x: px, y: py };
    }
    const plat = (train.position as any)?.lat;
    const plng = (train.position as any)?.lng;
    if (plat != null && plng != null) {
      return { x: normalizeX(plng), y: normalizeY(plat) };
    }
    return { x: undefined as unknown as number, y: undefined as unknown as number };
  };

  const getTrainByBay = (bayId: string) => {
    return trains.find(train => train.position?.bayId === bayId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'revenue': return '#059669';
      case 'standby': return '#f59e0b';
      case 'IBL': return '#3b82f6';
      case 'maintenance': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'revenue': return <FaCheckCircle />;
      case 'standby': return <FaTrain />;
      case 'IBL': return <FaCog />;
      case 'maintenance': return <FaWrench />;
      default: return <FaTrain />;
    }
  };

  const handleTrainDragStart = (e: React.MouseEvent, train: TrainRake) => {
    e.preventDefault();
    setDraggedTrain(train.id);
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const { x, y } = getTrainXY(train);
      setDragOffset({
        x: e.clientX - rect.left - (x || 0) * 100,
        y: e.clientY - rect.top - (y || 0) * 100
      });
    }
  };

  const handleTrainDrag = (e: React.MouseEvent) => {
    if (!draggedTrain || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - dragOffset.x) / 100;
    const y = (e.clientY - rect.top - dragOffset.y) / 100;
    
    // Update train position in real-time
    const train = trains.find(t => t.id === draggedTrain);
    if (train) {
      train.position = { ...train.position, x, y };
    }
  };

  const handleTrainDragEnd = (e: React.MouseEvent) => {
    if (!draggedTrain) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - dragOffset.x) / 100;
      const y = (e.clientY - rect.top - dragOffset.y) / 100;
      
      // Find nearest bay (compare in normalized coordinates)
      const nearestBay = depot.bays.reduce((closest, bay) => {
        const { x: bx, y: by } = getBayXY(bay);
        const { x: cx, y: cy } = getBayXY(closest);
        const distance = Math.hypot(bx - x, by - y);
        const closestDistance = Math.hypot(cx - x, cy - y);
        return distance < closestDistance ? bay : closest;
      });
      
      const train = trains.find(t => t.id === draggedTrain);
      if (train && onTrainMove) {
        onTrainMove(train.id, train.position?.bayId || '', nearestBay.id);
      }
    }
    
    setDraggedTrain(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTrainClick = (train: TrainRake) => {
    onTrainClick?.(train);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedTrain) {
        handleTrainDrag(e as any);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggedTrain) {
        handleTrainDragEnd(e as any);
      }
    };

    if (draggedTrain) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTrain, dragOffset]);

  return (
    <div className={styles.depotOverlay}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className={styles.depotSvg}
        onMouseMove={handleTrainDrag}
        onMouseUp={handleTrainDragEnd}
      >
        {/* Depot Tracks */}
        {depot.tracks.map((track, index) => (
          <path
            key={`track-${index}`}
            d={`M ${track.map(([lat, lon]) => `${normalizeX(lon)},${normalizeY(lat)}`).join(' L ')}`}
            stroke="#4b5563"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="1,1"
          />
        ))}

        {/* Entry Points */}
        {depot.entryPoints.map((point, index) => (
          <circle
            key={`entry-${index}`}
            cx={normalizeX(point[1])}
            cy={normalizeY(point[0])}
            r="1"
            fill="#059669"
            className={styles.entryPoint}
          />
        ))}

        {/* Exit Points */}
        {depot.exitPoints.map((point, index) => (
          <circle
            key={`exit-${index}`}
            cx={normalizeX(point[1])}
            cy={normalizeY(point[0])}
            r="1"
            fill="#dc2626"
            className={styles.exitPoint}
          />
        ))}

        {/* Depot Bays */}
        {depot.bays.map((bay) => {
          const train = getTrainByBay(bay.id);
          const isOccupied = bay.occupied > 0;
          const isSelected = selectedTrain && train?.id === selectedTrain;
          const { x: bx, y: by } = getBayXY(bay);
          
          return (
            <g key={bay.id}>
              {/* Bay Outline */}
              <rect
                x={bx - 1}
                y={by - 1}
                width="2"
                height="2"
                fill="none"
                stroke={isOccupied ? '#059669' : '#6b7280'}
                strokeWidth="0.2"
                strokeDasharray={isOccupied ? 'none' : '0.2,0.2'}
                className={styles.bayOutline}
              />
              
              {/* Bay Label */}
              <text
                x={bx}
                y={by - 1.5}
                textAnchor="middle"
                fontSize="0.8"
                fill="#6b7280"
                className={styles.bayLabel}
              >
                {bay.bayNumber}
              </text>
              
              {/* Occupancy Indicator */}
              <text
                x={bx}
                y={by + 1.5}
                textAnchor="middle"
                fontSize="0.6"
                fill="#6b7280"
                className={styles.occupancyLabel}
              >
                {bay.occupied}/{bay.capacity}
              </text>
            </g>
          );
        })}

        {/* Trains */}
        {trains.map((train) => {
          const { x, y } = getTrainXY(train);
          if (x == null || y == null) return null;
          
          const isDragging = draggedTrain === train.id;
          const isSelected = selectedTrain === train.id;
          const statusColor = getStatusColor(train.status);
          
          return (
            <motion.g
              key={train.id}
              initial={{ scale: 0 }}
              animate={{ scale: isDragging ? 1.2 : 1 }}
              transition={{ duration: 0.2 }}
              className={`${styles.trainGroup} ${isDragging ? styles.dragging : ''} ${isSelected ? styles.selected : ''}`}
            >
              {/* Train Circle */}
              <circle
                cx={x}
                cy={y}
                r="1.2"
                fill={statusColor}
                stroke="white"
                strokeWidth="0.2"
                className={styles.trainCircle}
                onMouseDown={(e) => handleTrainDragStart(e, train)}
                onClick={() => handleTrainClick(train)}
                style={{ cursor: 'grab' }}
              />
              
              {/* Train Icon */}
              <text
                x={x}
                y={y + 0.3}
                textAnchor="middle"
                fontSize="0.8"
                fill="white"
                className={styles.trainIcon}
              >
                {getStatusIcon(train.status)}
              </text>
              
              {/* Train Label */}
              <text
                x={x}
                y={y - 2}
                textAnchor="middle"
                fontSize="0.6"
                fill={statusColor}
                fontWeight="bold"
                className={styles.trainLabel}
              >
                {train.trainNumber}
              </text>
              
              {/* Status Badge */}
              <rect
                x={x - 0.8}
                y={y + 1.5}
                width="1.6"
                height="0.6"
                fill={statusColor}
                rx="0.3"
                className={styles.statusBadge}
              />
              <text
                x={x}
                y={y + 1.8}
                textAnchor="middle"
                fontSize="0.4"
                fill="white"
                className={styles.statusText}
              >
                {train.status.toUpperCase()}
              </text>
            </motion.g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className={styles.legend}>
        <h4 className={styles.legendTitle}>Train Status</h4>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#059669' }} />
            <span>Revenue</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#f59e0b' }} />
            <span>Standby</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }} />
            <span>IBL</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#dc2626' }} />
            <span>Maintenance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
