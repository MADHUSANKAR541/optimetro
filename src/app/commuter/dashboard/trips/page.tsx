'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Trip } from '@/lib/types';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaRupeeSign,
  FaDownload,
  FaFilter,
  FaSearch,
  FaArrowRight
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './trips.module.scss';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, statusFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await api<Trip[]>('/trips');
      setTrips(response.data);
    } catch (error) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = trips;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trip => 
        trip.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    setFilteredTrips(filtered);
  };

  const handleExport = () => {
    toast.success('Export started!');
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

  const getStatusColor = (status: string) => {
    return status === 'completed' ? styles.completed : styles.cancelled;
  };

  return (
    <div className={styles.trips}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Trip History</h1>
        <p className={styles.subtitle}>
          View and manage your past metro journeys
        </p>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card variant="elevated" className={styles.filtersCard}>
          <CardContent>
            <div className={styles.filters}>
              <div className={styles.searchGroup}>
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<FaSearch />}
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.filterGroup}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="all">All Trips</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Button
                variant="outline"
                onClick={handleExport}
                icon={<FaDownload />}
              >
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trips List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card variant="elevated" className={styles.tripsCard}>
          <CardHeader>
            <h2 className={styles.cardTitle}>
              <FaMapMarkerAlt className={styles.cardIcon} />
              Your Trips ({filteredTrips.length})
            </h2>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className={styles.skeleton}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className={styles.skeletonItem} />
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className={styles.emptyState}>
                <FaMapMarkerAlt className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No trips found</h3>
                <p className={styles.emptyDescription}>
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You haven\'t taken any trips yet. Start planning your first journey!'
                  }
                </p>
              </div>
            ) : (
              <div className={styles.tripsList}>
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={styles.tripItem}
                  >
                    <div className={styles.tripRoute}>
                      <div className={styles.station}>
                        <span className={styles.stationName}>{trip.from}</span>
                        <span className={styles.stationLabel}>From</span>
                      </div>
                      <FaArrowRight className={styles.routeArrow} />
                      <div className={styles.station}>
                        <span className={styles.stationName}>{trip.to}</span>
                        <span className={styles.stationLabel}>To</span>
                      </div>
                    </div>

                    <div className={styles.tripDetails}>
                      <div className={styles.detailItem}>
                        <FaClock className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Date & Time</span>
                          <span className={styles.detailValue}>{formatDate(trip.date)}</span>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <FaClock className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Duration</span>
                          <span className={styles.detailValue}>{trip.duration} min</span>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <FaRupeeSign className={styles.detailIcon} />
                        <div className={styles.detailContent}>
                          <span className={styles.detailLabel}>Fare</span>
                          <span className={styles.detailValue}>₹{trip.fare}</span>
                        </div>
                      </div>

                      <div className={styles.detailItem}>
                        <span className={`${styles.statusBadge} ${getStatusColor(trip.status)}`}>
                          {trip.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.tripActions}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        Repeat Trip
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
