'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DepotSchematic, DepotBay, TrainRake } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';
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
      setDragOffset({
        x: e.clientX - rect.left - (train.position?.x || 0) * 100,
        y: e.clientY - rect.top - (train.position?.y || 0) * 100
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
      
      // Find nearest bay
      const nearestBay = depot.bays.reduce((closest, bay) => {
        const distance = Math.sqrt((bay.x - x) ** 2 + (bay.y - y) ** 2);
        const closestDistance = Math.sqrt((closest.x - x) ** 2 + (closest.y - y) ** 2);
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
            d={`M ${track.map(([x, y]) => `${x},${y}`).join(' L ')}`}
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
            cx={point[0]}
            cy={point[1]}
            r="1"
            fill="#059669"
            className={styles.entryPoint}
          />
        ))}

        {/* Exit Points */}
        {depot.exitPoints.map((point, index) => (
          <circle
            key={`exit-${index}`}
            cx={point[0]}
            cy={point[1]}
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
          
          return (
            <g key={bay.id}>
              {/* Bay Outline */}
              <rect
                x={bay.x - 1}
                y={bay.y - 1}
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
                x={bay.x}
                y={bay.y - 1.5}
                textAnchor="middle"
                fontSize="0.8"
                fill="#6b7280"
                className={styles.bayLabel}
              >
                {bay.bayNumber}
              </text>
              
              {/* Occupancy Indicator */}
              <text
                x={bay.x}
                y={bay.y + 1.5}
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
          if (!train.position?.x || !train.position?.y) return null;
          
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
                cx={train.position.x}
                cy={train.position.y}
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
                x={train.position.x}
                y={train.position.y + 0.3}
                textAnchor="middle"
                fontSize="0.8"
                fill="white"
                className={styles.trainIcon}
              >
                {getStatusIcon(train.status)}
              </text>
              
              {/* Train Label */}
              <text
                x={train.position.x}
                y={train.position.y - 2}
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
                x={train.position.x - 0.8}
                y={train.position.y + 1.5}
                width="1.6"
                height="0.6"
                fill={statusColor}
                rx="0.3"
                className={styles.statusBadge}
              />
              <text
                x={train.position.x}
                y={train.position.y + 1.8}
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
