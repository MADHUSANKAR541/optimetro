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
import { useStations, useMetroLines, useAlerts } from '@/hooks/useMockApi';
import { api } from '@/lib/api';
import { Alert, Station, MetroLine, MapAlert } from '@/lib/types';
import { 
  FaBell, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaToggleOn,
  FaToggleOff,
  FaRoute,
  FaLayerGroup
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './alerts.module.scss';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [subscribed, setSubscribed] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  // Map state and data
  const { mapState, toggleLayer, selectAlert, clearSelection } = useMapState();
  const { data: stationsData = [], loading: stationsLoading } = useStations();
  const { data: linesData = [], loading: linesLoading } = useMetroLines();
  const { data: mapAlertsData = [], loading: mapAlertsLoading } = useAlerts();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await api<Alert[]>('/alerts');
      setAlerts(response.data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <FaExclamationTriangle className={styles.errorIcon} />;
      case 'warning': return <FaExclamationTriangle className={styles.warningIcon} />;
      case 'info': return <FaInfoCircle className={styles.infoIcon} />;
      default: return <FaBell className={styles.defaultIcon} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return styles.error;
      case 'warning': return styles.warning;
      case 'info': return styles.info;
      default: return styles.default;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleSubscription = () => {
    setSubscribed(!subscribed);
    toast.success(subscribed ? 'Notifications disabled' : 'Notifications enabled');
  };

  const handleAlertClick = (alert: MapAlert) => {
    setSelectedAlert(alert.id);
    selectAlert(alert.id);
    toast(`Alert: ${alert.title}`);
  };

  const handleStationClick = (station: Station) => {
    toast(`Station: ${station.name}`);
  };

  const handlePlanDetour = (alert: MapAlert) => {
    toast.success(`Planning detour for: ${alert.title}`);
    // Could navigate to plan page with detour flag
  };

  const filteredMapAlerts = mapAlertsData?.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  }) || [];

  return (
    <div className={styles.alerts}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Service Alerts</h1>
        <p className={styles.subtitle}>
          Stay informed about metro service updates and disruptions
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card variant="elevated" className={styles.controlsCard}>
          <CardContent>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Filter by severity:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Alerts</option>
                  <option value="error">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Information</option>
                </select>
              </div>

              <div className={styles.subscriptionGroup}>
                <button
                  className={styles.subscriptionButton}
                  onClick={handleToggleSubscription}
                >
                  {subscribed ? <FaToggleOn className={styles.toggleOn} /> : <FaToggleOff className={styles.toggleOff} />}
                  <span className={styles.subscriptionText}>
                    {subscribed ? 'Notifications On' : 'Notifications Off'}
                  </span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className={styles.content}>
        {/* Alerts Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MapCard
            title="Service Alerts Map"
            height="500px"
            showHelp={true}
            onHelpClick={() => toast('Click on alert markers to view details and plan detours')}
            actions={
              <div className={styles.mapActions}>
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
                    lines={linesData || []}
                    stations={stationsData || []}
                    showLines={mapState.layers.find(l => l.id === 'lines')?.visible}
                    showStations={mapState.layers.find(l => l.id === 'stations')?.visible}
                    onStationClick={handleStationClick}
                  />

                  {/* Service Alerts */}
                  <AlertsLayer
                    alerts={filteredMapAlerts}
                    isVisible={mapState.layers.find(l => l.id === 'alerts')?.visible}
                    onAlertClick={handleAlertClick}
                    showPulseEffect={true}
                  />
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

        {/* Alerts List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.alertsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaBell className={styles.cardIcon} />
                Service Alerts ({filteredAlerts.length})
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaBell className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No alerts found</h3>
                  <p className={styles.emptyDescription}>
                    {filter === 'all' 
                      ? 'All systems are running smoothly! No service alerts at this time.'
                      : `No ${filter} alerts found. Try selecting a different filter.`
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.alertsList}>
                  {filteredAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${styles.alertItem} ${getSeverityColor(alert.severity)} ${selectedAlert === alert.id ? styles.selected : ''}`}
                      onClick={() => setSelectedAlert(alert.id)}
                    >
                      <div className={styles.alertHeader}>
                        <div className={styles.alertIcon}>
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className={styles.alertContent}>
                          <h3 className={styles.alertTitle}>{alert.title}</h3>
                          <div className={styles.alertMeta}>
                            <span className={styles.alertSeverity}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className={styles.alertTime}>
                              <FaClock className={styles.timeIcon} />
                              {formatDate(alert.startTime)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.alertStatus}>
                          <span className={`${styles.statusBadge} ${alert.status === 'active' ? styles.active : styles.resolved}`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className={styles.alertBody}>
                        <p className={styles.alertDescription}>{alert.description}</p>
                        
                        {alert.affectedLines.length > 0 && (
                          <div className={styles.affectedInfo}>
                            <h4 className={styles.affectedTitle}>Affected Lines:</h4>
                            <div className={styles.affectedItems}>
                              {alert.affectedLines.map((line, idx) => (
                                <span key={idx} className={styles.affectedItem}>
                                  {line}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {alert.affectedStations.length > 0 && (
                          <div className={styles.affectedInfo}>
                            <h4 className={styles.affectedTitle}>Affected Stations:</h4>
                            <div className={styles.affectedItems}>
                              {alert.affectedStations.map((station, idx) => (
                                <span key={idx} className={styles.affectedItem}>
                                  <FaMapMarkerAlt className={styles.stationIcon} />
                                  {station}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {alert.endTime && (
                          <div className={styles.alertDuration}>
                            <span className={styles.durationLabel}>Expected Resolution:</span>
                            <span className={styles.durationValue}>{formatDate(alert.endTime)}</span>
                          </div>
                        )}

                        <div className={styles.alertActions}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlanDetour(alert as any)}
                            icon={<FaRoute />}
                          >
                            Plan Detour
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
