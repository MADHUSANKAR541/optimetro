'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapLayer } from '@/lib/types';
import { FaTrain, FaMapMarkerAlt, FaExclamationTriangle, FaRoute, FaBuilding } from 'react-icons/fa';
import styles from './LayerToggles.module.scss';

interface LayerTogglesProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  className?: string;
}

export function LayerToggles({
  layers,
  onToggleLayer,
  className = ''
}: LayerTogglesProps) {
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'stations': return <FaMapMarkerAlt />;
      case 'lines': return <FaTrain />;
      case 'alerts': return <FaExclamationTriangle />;
      case 'routes': return <FaRoute />;
      case 'depot': return <FaBuilding />;
      default: return <FaMapMarkerAlt />;
    }
  };

  const getLayerColor = (type: string) => {
    switch (type) {
      case 'stations': return '#059669';
      case 'lines': return '#2563eb';
      case 'alerts': return '#dc2626';
      case 'routes': return '#ea580c';
      case 'depot': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${styles.layerToggles} ${className}`}
    >
      <div className={styles.toggleHeader}>
        <h3 className={styles.toggleTitle}>Map Layers</h3>
      </div>
      
      <div className={styles.toggleList}>
        {layers.map((layer, index) => (
          <motion.button
            key={layer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`${styles.toggleButton} ${layer.visible ? styles.active : ''}`}
            onClick={() => onToggleLayer(layer.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div 
              className={styles.toggleIcon}
              style={{ color: getLayerColor(layer.type) }}
            >
              {getLayerIcon(layer.type)}
            </div>
            <div className={styles.toggleContent}>
              <span className={styles.toggleLabel}>{layer.name}</span>
              <div className={styles.toggleIndicator}>
                <div className={`${styles.toggleSwitch} ${layer.visible ? styles.on : ''}`}>
                  <div className={styles.toggleThumb} />
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
