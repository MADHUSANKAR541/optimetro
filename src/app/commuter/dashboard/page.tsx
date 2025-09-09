'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MiniMap } from '@/components/maps/MiniMap';
import { api } from '@/lib/api';
import { Trip, Ticket, Alert, Station, MapAlert } from '@/lib/types';
import { 
  FaTrain, 
  FaMapMarkerAlt, 
  FaClock, 
  FaExclamationTriangle,
  FaQrcode,
  FaArrowRight
} from 'react-icons/fa';
import { FiNavigation, FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from './dashboard.module.scss';

export default function CommuterDashboard() {
  const [nextDeparture, setNextDeparture] = useState({
    from: 'Aluva',
    to: 'Thykoodam',
    time: '14:25',
    platform: 'Platform 1'
  });
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tripsResponse, ticketsResponse, alertsResponse] = await Promise.all([
        api<Trip[]>('/trips'),
        api<Ticket[]>('/tickets'),
        api<Alert[]>('/alerts')
      ]);

      setRecentTrips(tripsResponse.data.slice(0, 3));
      setActiveTickets(ticketsResponse.data.filter(t => t.status === 'active'));
      setAlerts(alertsResponse.data.filter(a => a.status === 'active').slice(0, 3));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = (ticketId: string) => {
    toast.success('QR Code displayed!');
  };

  const handlePlanTrip = () => {
    toast.success('Redirecting to trip planner...');
  };

  const handleStationClick = (station: Station) => {
    toast(`Selected station: ${station.name}`);
    // Could navigate to plan page with pre-filled station
  };

  const handleAlertClick = (alert: MapAlert) => {
    toast(`Alert: ${alert.title}`);
  };

  return (
    <div className={styles.dashboard}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Welcome Back!</h1>
        <p className={styles.subtitle}>Here's what's happening with your metro journey</p>
      </motion.div>

      <div className={styles.grid}>
        {/* Next Departure */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="elevated" className={styles.nextDepartureCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaTrain className={styles.cardIcon} />
                Next Departure
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.departureInfo}>
                <div className={styles.route}>
                  <span className={styles.station}>{nextDeparture.from}</span>
                  <FaArrowRight className={styles.arrow} />
                  <span className={styles.station}>{nextDeparture.to}</span>
                </div>
                <div className={styles.timeInfo}>
                  <div className={styles.time}>{nextDeparture.time}</div>
                  <div className={styles.platform}>{nextDeparture.platform}</div>
                </div>
              </div>
              <Button variant="primary" size="sm" className={styles.actionButton}>
                Track Train
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Trip */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="elevated" className={styles.planTripCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FiNavigation className={styles.cardIcon} />
                Plan Your Trip
              </h2>
            </CardHeader>
            <CardContent>
              <p className={styles.cardDescription}>
                Find the best route and get real-time updates for your journey.
              </p>
              <Button 
                variant="primary" 
                size="lg" 
                className={styles.actionButton}
                onClick={handlePlanTrip}
              >
                Start Planning
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.recentTripsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaMapMarkerAlt className={styles.cardIcon} />
                Recent Trips
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonItem} />
                </div>
              ) : (
                <div className={styles.tripsList}>
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className={styles.tripItem}>
                      <div className={styles.tripRoute}>
                        <span className={styles.tripFrom}>{trip.from}</span>
                        <FaArrowRight className={styles.tripArrow} />
                        <span className={styles.tripTo}>{trip.to}</span>
                      </div>
                      <div className={styles.tripDetails}>
                        <span className={styles.tripDate}>
                          {new Date(trip.date).toLocaleDateString()}
                        </span>
                        <span className={styles.tripFare}>₹{trip.fare}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card variant="elevated" className={styles.ticketsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaQrcode className={styles.cardIcon} />
                Active Tickets
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonItem} />
                </div>
              ) : (
                <div className={styles.ticketsList}>
                  {activeTickets.map((ticket) => (
                    <div key={ticket.id} className={styles.ticketItem}>
                      <div className={styles.ticketInfo}>
                        <div className={styles.ticketType}>{ticket.type.toUpperCase()}</div>
                        <div className={styles.ticketValidity}>
                          Valid until {new Date(ticket.validTo).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowQR(ticket.id)}
                      >
                        Show QR
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Mini Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={styles.miniMapCard}
        >
          <MiniMap
            onStationClick={handleStationClick}
            onAlertClick={handleAlertClick}
            showUserLocation={true}
          />
        </motion.div>

        {/* Service Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={styles.alertsCard}
        >
          <Card variant="elevated">
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FiBell className={styles.cardIcon} />
                Service Alerts
              </h2>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className={styles.skeleton}>
                  <div className={styles.skeletonItem} />
                  <div className={styles.skeletonItem} />
                </div>
              ) : (
                <div className={styles.alertsList}>
                  {alerts.map((alert) => (
                    <div key={alert.id} className={styles.alertItem}>
                      <div className={styles.alertHeader}>
                        <FaExclamationTriangle 
                          className={`${styles.alertIcon} ${styles[alert.severity]}`} 
                        />
                        <span className={styles.alertTitle}>{alert.title}</span>
                      </div>
                      <p className={styles.alertDescription}>{alert.description}</p>
                    </div>
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
