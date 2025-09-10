'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapCard } from '@/components/maps/MapCard';
import { MapContainer } from '@/components/maps/MapContainer';
import { MetroLayers } from '@/components/maps/MetroLayers';
import { RouteLayer } from '@/components/maps/RouteLayer';
import { LayerToggles } from '@/components/maps/LayerToggles';
import { useMapState } from '@/hooks/useMapState';
import { useStations, useMetroLines, useTrains, useGtfsRoutes, useGtfsTripsByRoute, useGtfsShapesById } from '@/hooks/useSupabaseApi';
import { api } from '@/lib/api';
import { OptimizationResult, Station, MetroLine, TrainRake, Route } from '@/lib/types';
import { 
  FaPlay, 
  FaDownload, 
  FaInfoCircle, 
  FaTrain,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaRoute
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './induction.module.scss';

export default function InductionPage() {
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [constraints, setConstraints] = useState({
    peakHours: true,
    maintenanceWindow: false,
    interchangeDemand: true,
    energyOptimization: true
  });
  const [showMap, setShowMap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedGtfsRoute, setSelectedGtfsRoute] = useState<string>('');
  const [selectedGtfsTrip, setSelectedGtfsTrip] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  // Map state and data
  const { mapState, toggleLayer, selectTrain, clearSelection } = useMapState();
  const { data: stationsData, loading: stationsLoading } = useStations();
  const { data: linesData, loading: linesLoading } = useMetroLines();
  const { data: trainsData, loading: trainsLoading } = useTrains();
  const { data: gtfsRoutes } = useGtfsRoutes();
  const { data: gtfsTrips } = useGtfsTripsByRoute(selectedGtfsRoute);
  const shapeId = Array.isArray(gtfsTrips) && gtfsTrips.length > 0
    ? gtfsTrips.find((t: any) => t.trip_id === selectedGtfsTrip)?.shape_id || gtfsTrips[0]?.shape_id
    : undefined;

  // Restore optimizer results from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = window.localStorage.getItem('induction_optimizer_results');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOptimizationResults(parsed as OptimizationResult[]);
        }
      }
    } catch {}
    finally {
      setHydrated(true);
    }
  }, []);

  // Persist results whenever they change
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem('induction_optimizer_results', JSON.stringify(optimizationResults));
    } catch {}
  }, [hydrated, optimizationResults]);

  const handleRunOptimizer = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/induction/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Bad response');
      const data = await res.json();
      const mapped: OptimizationResult[] = (data?.results || []).map((r: any) => {
        const decision = String(r.decision || '').toLowerCase();
        const action = decision === 'run' ? 'revenue' : decision === 'standby' ? 'standby' : 'IBL';
        const reasons = Array.isArray(r.reasons) ? r.reasons : [];
        return {
          trainId: r.train_id || r.trainId || 'UNKNOWN',
          action,
          score: typeof r.score === 'number' ? r.score : 0,
          reason: reasons.join('; ') || 'Optimizer recommendation',
          constraints: reasons
        } as OptimizationResult;
      });
      setOptimizationResults(mapped);
      toast.success('Optimization completed successfully!');
    } catch (error) {
      toast.error('Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    toast.success('CSV export started!');
  };

  const handleResultClick = (result: OptimizationResult) => {
    setSelectedResult(result.trainId);
    selectTrain(result.trainId);
    toast.success(`Selected ${result.trainId} - ${result.action}`);
  };

  const handleStationClick = (station: Station) => {
    toast.success(`Station: ${station.name}`);
  };

  const handleTrainClick = (train: TrainRake) => {
    toast.success(`Train: ${train.trainNumber}`);
  };

  const generateTrainRoute = (trainId: string, action: string) => {
    // Mock route generation based on train action
    const mockRoutes: { [key: string]: Route } = {
      'KMRL-001': {
        id: 'ROUTE_001',
        from: 'ALUVA',
        to: 'THYKOODAM',
        steps: [{
          type: 'metro',
          from: 'ALUVA',
          to: 'THYKOODAM',
          duration: 25,
          fare: 25,
          line: 'Line 1',
          platform: 'Platform 1',
          coordinates: [
            [10.1089, 76.3515],
            [10.0258, 76.3071],
            [10.0069, 76.2931],
            [9.9881, 76.2791],
            [9.9692, 76.2651],
            [9.9503, 76.2511],
            [9.9314, 76.2371],
            [9.9125, 76.2231],
            [9.8936, 76.2091],
            [9.8747, 76.1951]
          ]
        }],
        totalTime: 25,
        totalFare: 25,
        polyline: [
          [10.1089, 76.3515],
          [10.0258, 76.3071],
          [10.0069, 76.2931],
          [9.9881, 76.2791],
          [9.9692, 76.2651],
          [9.9503, 76.2511],
          [9.9314, 76.2371],
          [9.9125, 76.2231],
          [9.8936, 76.2091],
          [9.8747, 76.1951]
        ],
        createdAt: new Date().toISOString()
      }
    };

    if (mockRoutes[trainId]) return mockRoutes[trainId];

    // Prefer using actual metro line geometry if available to avoid off-shore lines
    if (Array.isArray(linesData) && linesData.length > 0) {
      const line: any = linesData[0];
      const coords: [number, number][] = Array.isArray(line?.coordinates) ? line.coordinates : [];
      if (coords.length > 1) {
        const fromName = Array.isArray(line?.stations) && line.stations[0]?.name ? line.stations[0].name : 'Origin';
        const toName = Array.isArray(line?.stations) && line.stations[line.stations.length - 1]?.name ? line.stations[line.stations.length - 1].name : 'Destination';
        return {
          id: `ROUTE_LINE_${trainId}_${action}`,
          from: fromName,
          to: toName,
          steps: [{
            type: 'metro', from: fromName, to: toName, duration: 25, fare: 25, line: line?.name || 'Line', platform: 'Platform 1',
            coordinates: coords
          }],
          totalTime: 25,
          totalFare: 25,
          polyline: coords,
          createdAt: new Date().toISOString()
        } as Route;
      }
    }

    // Fallback placeholder routes so clicks always show something
    const templates: Route[] = [
      {
        id: `ROUTE_A_${trainId}`,
        from: 'ALUVA',
        to: 'M. G. ROAD',
        steps: [{
          type: 'metro', from: 'ALUVA', to: 'M. G. ROAD', duration: 18, fare: 18, line: 'Line 1', platform: 'Platform 1',
          coordinates: [
            [10.1089, 76.3515], [10.0370, 76.3150], [10.0069, 76.2931], [9.9881, 76.2791]
          ]
        }],
        totalTime: 18,
        totalFare: 18,
        polyline: [[10.1089, 76.3515], [10.0370, 76.3150], [10.0069, 76.2931], [9.9881, 76.2791]],
        createdAt: new Date().toISOString()
      },
      {
        id: `ROUTE_B_${trainId}`,
        from: 'EDAPALLY',
        to: 'THYKOODAM',
        steps: [{
          type: 'metro', from: 'EDAPALLY', to: 'THYKOODAM', duration: 22, fare: 22, line: 'Line 1', platform: 'Platform 2',
          coordinates: [
            [10.0276, 76.3089], [10.0069, 76.2931], [9.9692, 76.2651], [9.8747, 76.1951]
          ]
        }],
        totalTime: 22,
        totalFare: 22,
        polyline: [[10.0276, 76.3089], [10.0069, 76.2931], [9.9692, 76.2651], [9.8747, 76.1951]],
        createdAt: new Date().toISOString()
      },
      {
        id: `ROUTE_C_${trainId}`,
        from: 'KALAMASSERY',
        to: 'VYTTILA',
        steps: [{
          type: 'metro', from: 'KALAMASSERY', to: 'VYTTILA', duration: 20, fare: 20, line: 'Line 1', platform: 'Platform 1',
          coordinates: [
            [10.0510, 76.3270], [10.0258, 76.3071], [9.9503, 76.2511]
          ]
        }],
        totalTime: 20,
        totalFare: 20,
        polyline: [[10.0510, 76.3270], [10.0258, 76.3071], [9.9503, 76.2511]],
        createdAt: new Date().toISOString()
      }
    ];

    // Simple deterministic pick based on trainId
    let charSum = 0;
    for (let i = 0; i < trainId.length; i++) {
      charSum += trainId.charCodeAt(i);
    }
    const idx = Math.abs(charSum) % templates.length;
    const base = templates[idx];

    // Slight variation by action
    const actionOffset = action === 'revenue' ? 0.0015 : action === 'standby' ? 0.0005 : -0.0008;
    const shiftedPolyline = base.polyline.map(([lat, lng]) => [lat + actionOffset, lng]);
    const shiftedSteps = base.steps.map(s => ({
      ...s,
      coordinates: s.coordinates.map(([lat, lng]) => [lat + actionOffset, lng])
    }));

    return {
      ...base,
      id: `${base.id}_${action}`,
      steps: shiftedSteps,
      polyline: shiftedPolyline
    } as Route;
  };

  const filteredResults = optimizationResults.filter(result => {
    if (filterStatus === 'all') return true;
    return result.action === filterStatus;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'revenue': return styles.revenue;
      case 'standby': return styles.standby;
      case 'IBL': return styles.ibl;
      default: return styles.default;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'revenue': return <FaChartLine />;
      case 'standby': return <FaClock />;
      case 'IBL': return <FaTrain />;
      default: return <FaInfoCircle />;
    }
  };

  return (
    <div className={styles.induction}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Train Induction Optimizer</h1>
        <p className={styles.subtitle}>
          AI-powered optimization for efficient train scheduling and resource allocation
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
              <div className={styles.constraints}>
                <h3 className={styles.constraintsTitle}>Active Constraints</h3>
                <div className={styles.constraintChips}>
                  {Object.entries(constraints).map(([key, value]) => (
                    <button
                      key={key}
                      className={`${styles.constraintChip} ${value ? styles.active : ''}`}
                      onClick={() => setConstraints(prev => ({ ...prev, [key]: !value }))}
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onClick={handleRunOptimizer}
                  icon={<FaPlay />}
                >
                  Run Optimizer
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleExportCSV}
                  icon={<FaDownload />}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className={styles.content}>
        {/* Geographic Context Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MapCard
            title="Geographic Context"
            height="500px"
            showHelp={true}
            onHelpClick={() => toast.success('Hover over results to highlight train paths on the map')}
            actions={
              <div className={styles.mapActions}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={styles.statusFilter}
                >
                  <option value="all">All Status</option>
                  <option value="revenue">Revenue</option>
                  <option value="standby">Standby</option>
                  <option value="IBL">IBL</option>
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
                  {/* Optional GTFS route/shape demo */}
                  {Array.isArray(gtfsRoutes) && gtfsRoutes.length > 0 && (
                    <div style={{ position: 'absolute', zIndex: 1000, right: 12, top: 12, background: 'var(--color-surface)', padding: 8, borderRadius: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={selectedGtfsRoute}
                          onChange={(e) => { setSelectedGtfsRoute(e.target.value); setSelectedGtfsTrip(''); }}
                          style={{ padding: 6 }}
                        >
                          <option value="">GTFS Route</option>
                          {gtfsRoutes.map((r: any) => (
                            <option key={r.route_id} value={r.route_id}>
                              {r.route_short_name || r.route_long_name || r.route_id}
                            </option>
                          ))}
                        </select>
                        {Array.isArray(gtfsTrips) && gtfsTrips.length > 0 && (
                          <select
                            value={selectedGtfsTrip}
                            onChange={(e) => setSelectedGtfsTrip(e.target.value)}
                            style={{ padding: 6 }}
                          >
                            <option value="">Trip</option>
                            {gtfsTrips.map((t: any) => (
                              <option key={t.trip_id} value={t.trip_id}>
                                {t.trip_headsign || t.trip_id}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metro Lines and Stations */}
                  <MetroLayers
                    lines={Array.isArray(linesData) ? linesData : []}
                    stations={Array.isArray(stationsData) ? stationsData : []}
                    showLines={mapState.layers.find(l => l.id === 'lines')?.visible}
                    showStations={mapState.layers.find(l => l.id === 'stations')?.visible}
                    onStationClick={handleStationClick}
                  />

                  {/* Train Routes for Selected Results */}
                  {selectedResult && (() => {
                    const result = optimizationResults.find(r => r.trainId === selectedResult);
                    if (!result) return null;
                    
                    const route = generateTrainRoute(result.trainId, result.action);
                    if (!route) return null;
                    
                    return (
                      <RouteLayer
                        route={route}
                        isVisible={true}
                      />
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

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.resultsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaChartLine className={styles.cardIcon} />
                Optimization Results ({filteredResults.length})
              </h2>
            </CardHeader>
            <CardContent>
              {optimizationResults.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaChartLine className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>No Results Yet</h3>
                  <p className={styles.emptyDescription}>
                    Run the optimizer to see AI-powered train induction recommendations.
                  </p>
                </div>
              ) : (
                <div className={styles.resultsList}>
                  {filteredResults.map((result, index) => (
                    <motion.div
                      key={result.trainId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${styles.resultItem} ${selectedResult === result.trainId ? styles.selected : ''}`}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className={styles.resultHeader}>
                        <div className={styles.trainInfo}>
                          <FaTrain className={styles.trainIcon} />
                          <span className={styles.trainId}>{result.trainId}</span>
                        </div>
                        <div className={styles.score}>
                          <span className={styles.scoreValue}>{result.score}</span>
                          <span className={styles.scoreLabel}>Score</span>
                        </div>
                      </div>
                      
                      <div className={styles.resultContent}>
                        <div className={`${styles.actionBadge} ${getActionColor(result.action)}`}>
                          {getActionIcon(result.action)}
                          <span>{result.action.toUpperCase()}</span>
                        </div>
                        
                        <div className={styles.reason}>
                          <h4 className={styles.reasonTitle}>Recommendation</h4>
                          <p className={styles.reasonText}>{result.reason}</p>
                        </div>
                        
                        <div className={styles.constraints}>
                          <h4 className={styles.constraintsTitle}>Applied Constraints</h4>
                          <div className={styles.constraintTags}>
                            {result.constraints.map((constraint, idx) => (
                              <span key={idx} className={styles.constraintTag}>
                                {constraint.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
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
