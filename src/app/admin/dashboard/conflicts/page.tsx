'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapCard } from '@/components/maps/MapCard';
import { MapContainer } from '@/components/maps/MapContainer';
import { MetroLayers } from '@/components/maps/MetroLayers';
import { AlertsLayer } from '@/components/maps/AlertsLayer';
import { LayerToggles } from '@/components/maps/LayerToggles';
import { useMapState } from '@/hooks/useMapState';
import { useStations, useMetroLines, useAlerts } from '@/hooks/useSupabaseApi';
import { useConflictsBackend } from '@/hooks/useConflictsBackend';
import { Conflict, Station, MetroLine, MapAlert } from '@/lib/types';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt,
  FaLayerGroup,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './conflicts.module.scss';

export default function ConflictsPage() {
  const { data: conflictsData, loading, updateData } = useConflictsBackend();
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Map state and data
  const { mapState, toggleLayer, selectAlert, clearSelection } = useMapState();
  const { data: stationsData, loading: stationsLoading } = useStations();
  const { data: linesData, loading: linesLoading } = useMetroLines();
  const { data: alertsData, loading: alertsLoading } = useAlerts();

  const handleConflictClick = (conflict: Conflict) => {
    setSelectedConflict(conflict.id);
    toast(`Selected conflict: ${conflict.description}`);
  };

  const handleResolveConflict = async (conflictId: string) => {
    try {
      const response = await fetch('/api/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictId, action: 'resolve' })
      });
      
      if (response.ok) {
        // Update local state to mark conflict as resolved
        if (conflictsData) {
          const updatedConflicts = conflictsData.map(conflict => 
            conflict.id === conflictId 
              ? { ...conflict, status: 'resolved' as const }
              : conflict
          );
          updateData(updatedConflicts);
        }
        toast.success('Conflict resolved successfully!');
      } else {
        throw new Error('Failed to resolve conflict');
      }
    } catch (error) {
      toast.error('Failed to resolve conflict');
    }
  };

  const handleStationClick = (station: Station) => {
    toast(`Station: ${station.name}`);
  };

  const handleAlertClick = (alert: MapAlert) => {
    toast(`Alert: ${alert.title}`);
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'scheduling': return <FaClock />;
      case 'resource': return <FaExclamationTriangle />;
      case 'maintenance': return <FaMapMarkerAlt />;
      default: return <FaExclamationTriangle />;
    }
  };

  const getConflictColor = (type: string) => {
    switch (type) {
      case 'scheduling': return styles.scheduling;
      case 'resource': return styles.resource;
      case 'maintenance': return styles.maintenance;
      default: return styles.default;
    }
  };

  const filteredConflicts = (Array.isArray(conflictsData) ? conflictsData : []).filter(conflict => {
    if (filterStatus === 'all') return true;
    return conflict.status === filterStatus;
  });

  const getAffectedStations = (conflict: Conflict) => {
    // Mock function to get affected stations for a conflict
    if (!stationsData || !Array.isArray(stationsData)) {
      return [];
    }
    return stationsData.filter(station => 
      conflict.affectedTrains.some(trainId => 
        trainId.includes(station.id) || station.name.includes(trainId)
      )
    );
  };

  return (
    <div className={styles.conflicts}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Conflict Management</h1>
        <p className={styles.subtitle}>
          Monitor and resolve scheduling conflicts and resource allocation issues
        </p>
      </motion.div>

      <div className={styles.content}>
        {/* Spotlight Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <MapCard
            title="Conflict Spotlight Map"
            height="500px"
            showHelp={true}
            onHelpClick={() => toast('Click on conflicts to highlight affected areas on the map')}
            actions={
              <div className={styles.mapActions}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.statusFilter}
                >
                  <option value="all">All Conflicts</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLayers(!showLayers)}
                  icon={<FaLayerGroup />}
                >
                  Layers
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  icon={showMap ? <FaEyeSlash /> : <FaEye />}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>
            }
          >
            {showMap && (
              <div className={styles.mapWrapper}>
                <MapContainer
                  center={mapState.center}
                  zoom={mapState.zoom}
                  height="100%"
                >
                  {/* Metro Lines and Stations */}
                  <MetroLayers
                    lines={Array.isArray(linesData) ? linesData : []}
                    stations={Array.isArray(stationsData) ? stationsData : []}
                    showLines={mapState.layers.find(l => l.id === 'lines')?.visible}
                    showStations={mapState.layers.find(l => l.id === 'stations')?.visible}
                    onStationClick={handleStationClick}
                  />

                  {/* Service Alerts */}
                  <AlertsLayer
                    alerts={Array.isArray(alertsData) ? alertsData : []}
                    isVisible={mapState.layers.find(l => l.id === 'alerts')?.visible}
                    onAlertClick={handleAlertClick}
                    showPulseEffect={true}
                  />

                  {/* Conflict Spotlight Effects */}
                  {selectedConflict && (() => {
                    const conflict = (conflictsData || []).find((c: any) => c.id === selectedConflict);
                    if (!conflict) return null;
                    
                    const affectedStations = getAffectedStations(conflict);
                    
                    return (
                      <>
                        {affectedStations.map((station, index) => (
                          <motion.div
                            key={station.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={styles.spotlightEffect}
                            style={{
                              position: 'absolute',
                              left: `${(station.lng - 76.1) / 0.3 * 100}%`,
                              top: `${(10.1 - station.lat) / 0.3 * 100}%`,
                              width: '40px',
                              height: '40px',
                              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                              borderRadius: '50%',
                              pointerEvents: 'none',
                              zIndex: 1000
                            }}
                          />
                        ))}
                      </>
                    );
                  })()}
                </MapContainer>

                {/* Layer Controls */}
                {showLayers && (
                  <div className={styles.layerControls}>
                    <LayerToggles
                      layers={mapState.layers}
                      onToggleLayer={toggleLayer}
                    />
                  </div>
                )}
              </div>
            )}
          </MapCard>
        </motion.div>

        {/* Conflicts List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="elevated" className={styles.conflictsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaExclamationTriangle className={styles.cardIcon} />
                Active Conflicts ({filteredConflicts.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : filteredConflicts.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaCheckCircle className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Conflicts Found</h3>
                  <p className={styles.emptyDescription}>
                    All systems are running smoothly! No conflicts detected.
                  </p>
                </div>
              ) : (
                <div className={styles.conflictsList}>
                  {filteredConflicts.map((conflict, index) => (
                    <motion.div
                      key={conflict.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${styles.conflictItem} ${getConflictColor(conflict.type)} ${selectedConflict === conflict.id ? styles.selected : ''}`}
                      onClick={() => handleConflictClick(conflict)}
                    >
                      <div className={styles.conflictHeader}>
                        <div className={styles.conflictInfo}>
                          <div className={styles.conflictIcon}>
                            {getConflictIcon(conflict.type)}
                          </div>
                          <div className={styles.conflictDetails}>
                            <h3 className={styles.conflictTitle}>{conflict.description}</h3>
                            <div className={styles.conflictMeta}>
                              <span className={styles.conflictType}>
                                {conflict.type.toUpperCase()}
                              </span>
                              <span className={styles.conflictTime}>
                                {conflict.status === 'open' ? 'Active' : 'Resolved'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.conflictStatus}>
                          <span className={`${styles.statusBadge} ${conflict.status === 'open' ? styles.open : styles.resolved}`}>
                            {conflict.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className={styles.conflictBody}>
                        <p className={styles.conflictDescription}>{conflict.description}</p>
                        
                        <div className={styles.affectedTrains}>
                          <h4 className={styles.affectedTitle}>Affected Trains:</h4>
                          <div className={styles.trainTags}>
                            {conflict.affectedTrains.map((trainId, idx) => (
                              <span key={idx} className={styles.trainTag}>
                                {trainId}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className={styles.conflictActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveConflict(conflict.id);
                            }}
                            disabled={conflict.status === 'resolved'}
                            icon={<FaCheckCircle />}
                          >
                            {conflict.status === 'resolved' ? 'Resolved' : 'Resolve'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
