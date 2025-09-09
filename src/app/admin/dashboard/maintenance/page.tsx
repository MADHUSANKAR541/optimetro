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
import { useStations, useMetroLines, useAlerts, useMaintenanceRecords } from '@/hooks/useSupabaseApi';
import { MaintenanceRecord, Station, MetroLine, MapAlert } from '@/lib/types';
import { 
  FaWrench, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt,
  FaLayerGroup,
  FaEye,
  FaEyeSlash,
  FaTools,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './maintenance.module.scss';

export default function MaintenancePage() {
  const { data: maintenanceRecordsData, loading } = useMaintenanceRecords();
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Map state and data
  const { mapState, toggleLayer, selectAlert, clearSelection } = useMapState();
  const { data: stationsData, loading: stationsLoading } = useStations();
  const { data: linesData, loading: linesLoading } = useMetroLines();
  const { data: alertsData, loading: alertsLoading } = useAlerts();

  const handleRecordClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record.id);
    toast(`Selected maintenance: ${record.description}`);
  };

  const handleCompleteMaintenance = async (recordId: string) => {
    try {
      // Mock complete maintenance
      setMaintenanceRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, status: 'completed' as const, completedDate: new Date().toISOString() }
          : record
      ));
      toast.success('Maintenance completed successfully!');
    } catch (error) {
      toast.error('Failed to complete maintenance');
    }
  };

  const handleStationClick = (station: Station) => {
    toast(`Station: ${station.name}`);
  };

  const handleAlertClick = (alert: MapAlert) => {
    toast(`Alert: ${alert.title}`);
  };

  const getMaintenanceIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <FaTools />;
      case 'corrective': return <FaWrench />;
      case 'emergency': return <FaExclamationTriangle />;
      default: return <FaWrench />;
    }
  };

  const getMaintenanceColor = (type: string) => {
    switch (type) {
      case 'preventive': return styles.preventive;
      case 'corrective': return styles.corrective;
      case 'emergency': return styles.emergency;
      default: return styles.default;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return styles.scheduled;
      case 'in_progress': return styles.inProgress;
      case 'completed': return styles.completed;
      default: return styles.default;
    }
  };

  const filteredRecords = (Array.isArray(maintenanceRecordsData) ? maintenanceRecordsData : []).filter(record => {
    if (filterStatus === 'all') return true;
    return record.status === filterStatus;
  });

  const getAffectedStations = (record: MaintenanceRecord) => {
    // Mock function to get affected stations for a maintenance record
    if (!stationsData || !Array.isArray(stationsData)) {
      return [];
    }
    return stationsData.filter(station =>
      record.trainId.includes(station.id) || station.name.includes(record.trainId)
    );
  };

  return (
    <div className={styles.maintenance}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Maintenance Management</h1>
        <p className={styles.subtitle}>
          Track and manage maintenance activities across the metro network
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
            title="Maintenance Spotlight Map"
            height="500px"
            showHelp={true}
            onHelpClick={() => toast('Click on maintenance records to highlight affected areas on the map')}
            actions={
              <div className={styles.mapActions}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.statusFilter}
                >
                  <option value="all">All Records</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
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

                  {/* Maintenance Spotlight Effects */}
                  {selectedRecord && (() => {
                    const record = (maintenanceRecordsData || []).find((r: any) => r.id === selectedRecord);
                    if (!record) return null;
                    
                    const affectedStations = getAffectedStations(record);
                    
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
                              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
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

        {/* Maintenance Records List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="elevated" className={styles.recordsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaWrench className={styles.cardIcon} />
                Maintenance Records ({filteredRecords.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaWrench className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Maintenance Records</h3>
                  <p className={styles.emptyDescription}>
                    No maintenance records found for the selected filter.
                  </p>
                </div>
              ) : (
                <div className={styles.recordsList}>
                  {filteredRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${styles.recordItem} ${getMaintenanceColor(record.type)} ${selectedRecord === record.id ? styles.selected : ''}`}
                      onClick={() => handleRecordClick(record)}
                    >
                      <div className={styles.recordHeader}>
                        <div className={styles.recordInfo}>
                          <div className={styles.recordIcon}>
                            {getMaintenanceIcon(record.type)}
                          </div>
                          <div className={styles.recordDetails}>
                            <h3 className={styles.recordTitle}>{record.description}</h3>
                            <div className={styles.recordMeta}>
                              <span className={styles.recordType}>
                                {record.type.toUpperCase()}
                              </span>
                              <span className={styles.trainId}>
                                {record.trainId}
                              </span>
                              <span className={styles.assignedTo}>
                                {record.assignedTo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.recordStatus}>
                          <span className={`${styles.statusBadge} ${getStatusColor(record.status)}`}>
                            {record.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className={styles.recordBody}>
                        <div className={styles.recordDates}>
                          <div className={styles.dateItem}>
                            <span className={styles.dateLabel}>Scheduled:</span>
                            <span className={styles.dateValue}>
                              {new Date(record.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>
                          {record.completedDate && (
                            <div className={styles.dateItem}>
                              <span className={styles.dateLabel}>Completed:</span>
                              <span className={styles.dateValue}>
                                {new Date(record.completedDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={styles.recordActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteMaintenance(record.id);
                            }}
                            disabled={record.status === 'completed'}
                            icon={<FaCheckCircle />}
                          >
                            {record.status === 'completed' ? 'Completed' : 'Mark Complete'}
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
