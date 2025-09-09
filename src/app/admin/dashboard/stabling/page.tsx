'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapCard } from '@/components/maps/MapCard';
import { MapContainer } from '@/components/maps/MapContainer';
import { MetroLayers } from '@/components/maps/MetroLayers';
import { DepotSchematicOverlay } from '@/components/maps/DepotSchematicOverlay';
import { RakeMarker } from '@/components/maps/RakeMarker';
import { LayerToggles } from '@/components/maps/LayerToggles';
import { useMapState } from '@/hooks/useMapState';
import { useStations, useMetroLines, useDepot, useTrains } from '@/hooks/useMockApi';
import { Station, MetroLine, DepotSchematic, TrainRake, ShuntingMove } from '@/lib/types';
import { 
  FaTrain, 
  FaMapMarkerAlt, 
  FaCog, 
  FaWrench, 
  FaCheckCircle,
  FaLayerGroup,
  FaExchangeAlt,
  FaClock,
  FaRoute
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './stabling.module.scss';

export default function StablingPage() {
  const [viewMode, setViewMode] = useState<'depot' | 'city'>('depot');
  const [showLayers, setShowLayers] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<string | undefined>(undefined);
  const [shuntingMoves, setShuntingMoves] = useState<ShuntingMove[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Map state and data
  const { mapState, toggleLayer, selectTrain, clearSelection } = useMapState();
  const stations = useStations();
  const lines = useMetroLines();
  const depot = useDepot();
  const trains = useTrains();

  useEffect(() => {
    // Load mock data on mount
    stations.fetchData();
    lines.fetchData();
    depot.fetchData();
    trains.fetchData();
    loadShuntingMoves();
  }, []);

  const loadShuntingMoves = async () => {
    // Mock shunting moves calculation
    const moves: ShuntingMove[] = [
      {
        trainId: 'KMRL-002',
        from: 'BAY_002',
        to: 'BAY_001',
        estimatedTime: 15,
        priority: 'high'
      },
      {
        trainId: 'KMRL-003',
        from: 'BAY_002',
        to: 'BAY_004',
        estimatedTime: 20,
        priority: 'medium'
      }
    ];
    setShuntingMoves(moves);
  };

  const handleTrainMove = (trainId: string, fromBay: string, toBay: string) => {
    toast.success(`Moved ${trainId} from ${fromBay} to ${toBay}`);
    
    // Update train position in mock data
    if (trains.data) {
      const train = trains.data.find(t => t.id === trainId);
      if (train) {
        train.position = { ...train.position, bayId: toBay };
      }
    }
    
    // Recalculate shunting moves
    loadShuntingMoves();
  };

  const handleTrainClick = (train: TrainRake) => {
    setSelectedTrain(train.id);
    selectTrain(train.id);
  };

  const handleStationClick = (station: Station) => {
    toast(`Station: ${station.name}`);
  };

  const handleSimulateShunting = () => {
    setIsSimulating(true);
    toast('Running shunting simulation...');
    
    // Simulate shunting moves
    setTimeout(() => {
      setIsSimulating(false);
      toast.success('Shunting simulation completed!');
    }, 3000);
  };

  const getStatusCounts = () => {
    if (!trains.data) return { revenue: 0, standby: 0, IBL: 0, maintenance: 0 };
    
    return trains.data.reduce((counts, train) => {
      counts[train.status]++;
      return counts;
    }, { revenue: 0, standby: 0, IBL: 0, maintenance: 0 });
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={styles.stabling}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Stabling & Depot Management</h1>
        <p className={styles.subtitle}>
          Manage train positioning, shunting operations, and depot layout
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
              <div className={styles.viewToggle}>
                <Button
                  variant={viewMode === 'depot' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('depot')}
                  icon={<FaCog />}
                >
                  Depot View
                </Button>
                <Button
                  variant={viewMode === 'city' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('city')}
                  icon={<FaMapMarkerAlt />}
                >
                  City View
                </Button>
              </div>

              <div className={styles.actions}>
                <Button
                  variant="outline"
                  onClick={handleSimulateShunting}
                  loading={isSimulating}
                  icon={<FaExchangeAlt />}
                >
                  Simulate Shunting
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLayers(!showLayers)}
                  icon={<FaLayerGroup />}
                >
                  Layers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className={styles.content}>
        {/* Main Map */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MapCard
            title={viewMode === 'depot' ? 'Depot Schematic' : 'City Network'}
            height="600px"
            showHelp={true}
            onHelpClick={() => toast(viewMode === 'depot' ? 'Drag trains to move them between bays' : 'View metro network and train positions')}
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
              </div>
            }
          >
            <div className={styles.mapWrapper}>
              {viewMode === 'depot' ? (
                depot.data && (
                  <div style={{ height: '600px' }}>
                    <DepotSchematicOverlay
                      depot={depot.data}
                      trains={trains.data || []}
                      onTrainMove={handleTrainMove}
                      onTrainClick={handleTrainClick}
                      selectedTrain={selectedTrain}
                    />
                  </div>
                )
              ) : (
                <MapContainer
                  center={mapState.center}
                  zoom={mapState.zoom}
                  height="100%"
                >
                  // City View
                  <>
                    <MetroLayers
                      lines={lines.data || []}
                      stations={stations.data || []}
                      showLines={mapState.layers.find(l => l.id === 'lines')?.visible}
                      showStations={mapState.layers.find(l => l.id === 'stations')?.visible}
                      onStationClick={handleStationClick}
                    />
                    
                    {/* Train Markers */}
                    {trains.data?.map((train) => {
                      if (!train.position?.lat || !train.position?.lng) return null;
                      
                      return (
                        <RakeMarker
                          key={train.id}
                          train={train}
                          isSelected={selectedTrain === train.id}
                          onClick={handleTrainClick}
                          showPopup={selectedTrain === train.id}
                        />
                      );
                    })}
                  </>
                </MapContainer>
              )}

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
          </MapCard>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={styles.sidebar}
        >
          {/* Train Status Summary */}
          <Card variant="elevated" className={styles.summaryCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaTrain className={styles.cardIcon} />
                Train Status
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <div className={styles.statusIcon} style={{ color: '#059669' }}>
                    <FaCheckCircle />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Revenue</span>
                    <span className={styles.statusCount}>{statusCounts.revenue}</span>
                  </div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIcon} style={{ color: '#f59e0b' }}>
                    <FaTrain />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Standby</span>
                    <span className={styles.statusCount}>{statusCounts.standby}</span>
                  </div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIcon} style={{ color: '#3b82f6' }}>
                    <FaCog />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>IBL</span>
                    <span className={styles.statusCount}>{statusCounts.IBL}</span>
                  </div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIcon} style={{ color: '#dc2626' }}>
                    <FaWrench />
                  </div>
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Maintenance</span>
                    <span className={styles.statusCount}>{statusCounts.maintenance}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shunting Moves */}
          <Card variant="elevated" className={styles.movesCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaExchangeAlt className={styles.cardIcon} />
                Shunting Moves
              </h2>
            </CardHeader>
            <CardContent>
              {shuntingMoves.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaExchangeAlt className={styles.emptyIcon} />
                  <p>No shunting moves scheduled</p>
                </div>
              ) : (
                <div className={styles.movesList}>
                  {shuntingMoves.map((move, index) => (
                    <motion.div
                      key={move.trainId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={styles.moveItem}
                    >
                      <div className={styles.moveHeader}>
                        <span className={styles.trainId}>{move.trainId}</span>
                        <span className={`${styles.priority} ${styles[move.priority]}`}>
                          {move.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.moveRoute}>
                        <span className={styles.moveFrom}>{move.from}</span>
                        <FaRoute className={styles.moveArrow} />
                        <span className={styles.moveTo}>{move.to}</span>
                      </div>
                      <div className={styles.moveTime}>
                        <FaClock className={styles.timeIcon} />
                        <span>{move.estimatedTime} min</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Train Details */}
          {selectedTrain && (
            <Card variant="elevated" className={styles.detailsCard}>
              <CardHeader>
                <h2 className={styles.cardTitle}>
                  <FaTrain className={styles.cardIcon} />
                  Train Details
                </h2>
              </CardHeader>
              <CardContent>
                {(() => {
                  const train = trainsData?.find(t => t.id === selectedTrain);
                  if (!train) return null;
                  
                  return (
                    <div className={styles.trainDetails}>
                      <div className={styles.trainInfo}>
                        <span className={styles.trainNumber}>{train.trainNumber}</span>
                        <span className={`${styles.trainStatus} ${styles[train.status]}`}>
                          {train.status.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.trainStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Mileage:</span>
                          <span className={styles.statValue}>{train.mileage.toLocaleString()} km</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Job Cards:</span>
                          <span className={styles.statValue}>{train.jobCards}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Conflicts:</span>
                          <span className={styles.statValue}>{train.conflicts}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTrain(undefined)}
                        className={styles.closeButton}
                      >
                        Close Details
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
