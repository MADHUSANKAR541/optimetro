'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapCard } from '@/components/maps/MapCard';
import { MapContainer } from '@/components/maps/MapContainer';
import { MetroLayers } from '@/components/maps/MetroLayers';
import { RouteLayer } from '@/components/maps/RouteLayer';
import { AlertsLayer } from '@/components/maps/AlertsLayer';
import { LayerToggles } from '@/components/maps/LayerToggles';
import { useMapState } from '@/hooks/useMapState';
import { useStations, useMetroLines, useAlerts } from '@/hooks/useMockApi';
import { api } from '@/lib/api';
import { Journey, JourneyStep, Station, MetroLine, MapAlert } from '@/lib/types';
import { 
  FaMapMarkerAlt, 
  FaTrain, 
  FaBus, 
  FaWalking,
  FaClock,
  FaRupeeSign,
  FaArrowRight,
  FaSearch,
  FaLayerGroup,
  FaRoute
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './plan.module.scss';

const stations = [
  'Aluva', 'Edapally', 'Palarivattom', 'JLN Stadium', 'Kaloor',
  'Town Hall', 'MG Road', 'Maharaja\'s College', 'Ernakulam South',
  'Thykoodam', 'Vytilla', 'SN Junction'
];

export default function PlanTripPage() {
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);

  // Map state and data
  const { mapState, toggleLayer, selectStation, clearSelection } = useMapState();
  const { data: stationsData = [], loading: stationsLoading } = useStations();
  const { data: linesData = [], loading: linesLoading } = useMetroLines();
  const { data: alertsData = [], loading: alertsLoading } = useAlerts();

  const handlePlanTrip = async () => {
    if (!fromStation || !toStation) {
      toast.error('Please select both departure and arrival stations');
      return;
    }

    if (fromStation === toStation) {
      toast.error('Departure and arrival stations cannot be the same');
      return;
    }

    setLoading(true);
    try {
      const response = await api<Journey>('/journeys/plan');
      setJourney(response.data);
      toast.success('Trip planned successfully!');
    } catch (error) {
      toast.error('Failed to plan trip');
    } finally {
      setLoading(false);
    }
  };

  const handleStationClick = (station: Station) => {
    if (!fromStation) {
      setFromStation(station.name);
    } else if (!toStation) {
      setToStation(station.name);
    }
    selectStation(station.id);
  };

  const handleStationHover = (station: Station) => {
    // Could add hover effects here
  };

  const handleAlertClick = (alert: MapAlert) => {
    toast(`Alert: ${alert.title}`);
  };

  const handleRouteClick = (route: Journey) => {
    toast(`Route: ${route.from} to ${route.to}`);
  };

  const clearRoute = () => {
    setJourney(null);
    setFromStation('');
    setToStation('');
    clearSelection();
  };

  const swapStations = () => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'metro': return <FaTrain />;
      case 'bus': return <FaBus />;
      case 'walk': return <FaWalking />;
      default: return <FaMapMarkerAlt />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'metro': return '#2563eb';
      case 'bus': return '#059669';
      case 'walk': return '#ea580c';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.planTrip}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Plan Your Trip</h1>
        <p className={styles.subtitle}>
          Find the best route and get real-time journey information
        </p>
      </motion.div>

      <div className={styles.content}>
        {/* Trip Planner Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="elevated" className={styles.plannerCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaMapMarkerAlt className={styles.cardIcon} />
                Journey Planner
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.form}>
                <div className={styles.stationInputs}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>From</label>
                    <select
                      value={fromStation}
                      onChange={(e) => setFromStation(e.target.value)}
                      className={styles.stationSelect}
                    >
                      <option value="">Select departure station</option>
                      {stations.map(station => (
                        <option key={station} value={station}>{station}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className={styles.swapButton}
                    onClick={swapStations}
                    title="Swap stations"
                  >
                    <FaArrowRight />
                  </button>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>To</label>
                    <select
                      value={toStation}
                      onChange={(e) => setToStation(e.target.value)}
                      className={styles.stationSelect}
                    >
                      <option value="">Select arrival station</option>
                      {stations.map(station => (
                        <option key={station} value={station}>{station}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    onClick={handlePlanTrip}
                    icon={<FaSearch />}
                    className={styles.planButton}
                  >
                    Plan Trip
                  </Button>
                  
                  {journey && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={clearRoute}
                      icon={<FaRoute />}
                    >
                      Clear Route
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Map */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MapCard
            title="Metro Network Map"
            height="500px"
            showHelp={true}
            onHelpClick={() => toast('Click on stations to select origin/destination')}
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
                    onStationHover={handleStationHover}
                    selectedStation={mapState.selectedStation}
                  />

                  {/* Service Alerts */}
                  <AlertsLayer
                    alerts={alertsData || []}
                    isVisible={mapState.layers.find(l => l.id === 'alerts')?.visible}
                    onAlertClick={handleAlertClick}
                    showPulseEffect={true}
                  />

                  {/* Planned Route */}
                  {journey && (
                    <RouteLayer
                      route={journey as any}
                      isVisible={mapState.layers.find(l => l.id === 'routes')?.visible}
                      onRouteClick={handleRouteClick}
                    />
                  )}
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

        {/* Journey Results */}
        {journey && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card variant="elevated" className={styles.resultsCard}>
              <CardHeader>
                <h2 className={styles.cardTitle}>
                  <FaClock className={styles.cardIcon} />
                  Journey Details
                </h2>
              </CardHeader>
              <CardContent>
                <div className={styles.journeySummary}>
                  <div className={styles.summaryItem}>
                    <FaClock className={styles.summaryIcon} />
                    <div className={styles.summaryContent}>
                      <div className={styles.summaryLabel}>Total Time</div>
                      <div className={styles.summaryValue}>{journey.totalTime} minutes</div>
                    </div>
                  </div>
                  <div className={styles.summaryItem}>
                    <FaRupeeSign className={styles.summaryIcon} />
                    <div className={styles.summaryContent}>
                      <div className={styles.summaryLabel}>Total Fare</div>
                      <div className={styles.summaryValue}>₹{journey.totalFare}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.journeySteps}>
                  <h3 className={styles.stepsTitle}>Journey Steps</h3>
                  {journey.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={styles.step}
                    >
                      <div className={styles.stepIcon} style={{ color: getStepColor(step.type) }}>
                        {getStepIcon(step.type)}
                      </div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepHeader}>
                          <span className={styles.stepType}>{step.type.toUpperCase()}</span>
                          <span className={styles.stepDuration}>{step.duration} min</span>
                        </div>
                        <div className={styles.stepRoute}>
                          <span className={styles.stepFrom}>{step.from}</span>
                          <FaArrowRight className={styles.stepArrow} />
                          <span className={styles.stepTo}>{step.to}</span>
                        </div>
                        {step.line && (
                          <div className={styles.stepLine}>Line: {step.line}</div>
                        )}
                        {step.platform && (
                          <div className={styles.stepPlatform}>Platform: {step.platform}</div>
                        )}
                        {step.fare && (
                          <div className={styles.stepFare}>Fare: ₹{step.fare}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className={styles.journeyActions}>
                  <Button variant="outline" size="md">
                    Save Trip
                  </Button>
                  <Button variant="primary" size="md">
                    Book Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.tipsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>Travel Tips</h2>
            </CardHeader>
            <CardContent>
              <div className={styles.tipsList}>
                <div className={styles.tip}>
                  <div className={styles.tipIcon}>💡</div>
                  <div className={styles.tipContent}>
                    <h4 className={styles.tipTitle}>Peak Hours</h4>
                    <p className={styles.tipDescription}>
                      Avoid traveling during 8-10 AM and 6-8 PM for a more comfortable journey.
                    </p>
                  </div>
                </div>
                <div className={styles.tip}>
                  <div className={styles.tipIcon}>🎫</div>
                  <div className={styles.tipContent}>
                    <h4 className={styles.tipTitle}>Smart Cards</h4>
                    <p className={styles.tipDescription}>
                      Use Kochi Metro smart cards for faster boarding and discounted fares.
                    </p>
                  </div>
                </div>
                <div className={styles.tip}>
                  <div className={styles.tipIcon}>📱</div>
                  <div className={styles.tipContent}>
                    <h4 className={styles.tipTitle}>Real-time Updates</h4>
                    <p className={styles.tipDescription}>
                      Check live train status and platform information before heading to the station.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
