'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainRake } from '@/lib/types';
import { MAP_CONFIG } from '@/lib/mapConfig';
import { FaTrain, FaCog, FaWrench, FaCheckCircle, FaTimes, FaInfo } from 'react-icons/fa';
import styles from './RakeMarker.module.scss';

interface RakeMarkerProps {
  train: TrainRake;
  isSelected?: boolean;
  onClick?: (train: TrainRake) => void;
  onClose?: () => void;
  showPopup?: boolean;
}

export function RakeMarker({
  train,
  isSelected = false,
  onClick,
  onClose,
  showPopup = false
}: RakeMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    return MAP_CONFIG.statusColors[status as keyof typeof MAP_CONFIG.statusColors] || '#6b7280';
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

  const getFitnessStatus = () => {
    const { rollingStock, signalling, telecom } = train.fitness;
    const total = [rollingStock, signalling, telecom].filter(Boolean).length;
    return { total, max: 3, percentage: (total / 3) * 100 };
  };

  const fitnessStatus = getFitnessStatus();

  return (
    <div className={styles.rakeMarker}>
      <motion.div
        className={`${styles.marker} ${isSelected ? styles.selected : ''}`}
        style={{ 
          backgroundColor: getStatusColor(train.status),
          borderColor: isSelected ? '#3b82f6' : 'white'
        }}
        onClick={() => onClick?.(train)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.markerIcon}>
          {getStatusIcon(train.status)}
        </div>
        
        <div className={styles.markerLabel}>
          {train.trainNumber}
        </div>
        
        {train.conflicts > 0 && (
          <div className={styles.conflictBadge}>
            {train.conflicts}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {(showPopup || isHovered) && (
          <motion.div
            className={styles.popup}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.popupHeader}>
              <h3 className={styles.popupTitle}>
                {train.trainNumber}
              </h3>
              <div className={styles.popupStatus}>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(train.status) }}
                >
                  {train.status.toUpperCase()}
                </span>
                {onClose && (
                  <button
                    className={styles.closeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.popupContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mileage:</span>
                <span className={styles.infoValue}>{train.mileage.toLocaleString()} km</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Job Cards:</span>
                <span className={styles.infoValue}>{train.jobCards}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Conflicts:</span>
                <span className={styles.infoValue}>{train.conflicts}</span>
              </div>

              <div className={styles.fitnessSection}>
                <h4 className={styles.fitnessTitle}>Fitness Status</h4>
                <div className={styles.fitnessBar}>
                  <div 
                    className={styles.fitnessProgress}
                    style={{ width: `${fitnessStatus.percentage}%` }}
                  />
                </div>
                <div className={styles.fitnessDetails}>
                  <div className={styles.fitnessItem}>
                    <span className={styles.fitnessLabel}>Rolling Stock:</span>
                    <span className={`${styles.fitnessValue} ${train.fitness.rollingStock ? styles.healthy : styles.unhealthy}`}>
                      {train.fitness.rollingStock ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className={styles.fitnessItem}>
                    <span className={styles.fitnessLabel}>Signalling:</span>
                    <span className={`${styles.fitnessValue} ${train.fitness.signalling ? styles.healthy : styles.unhealthy}`}>
                      {train.fitness.signalling ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className={styles.fitnessItem}>
                    <span className={styles.fitnessLabel}>Telecom:</span>
                    <span className={`${styles.fitnessValue} ${train.fitness.telecom ? styles.healthy : styles.unhealthy}`}>
                      {train.fitness.telecom ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>

              {train.position?.bayId && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Current Bay:</span>
                  <span className={styles.infoValue}>{train.position.bayId}</span>
                </div>
              )}
            </div>

            <div className={styles.popupActions}>
              <button
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(train);
                }}
              >
                <FaInfo />
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
