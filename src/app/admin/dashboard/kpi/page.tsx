'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Chart } from '@/components/ui/Chart';
import { api } from '@/lib/api';
import { KPI } from '@/lib/types';
import { 
  FaChartLine, 
  FaClock, 
  FaBolt, 
  FaExclamationTriangle,
  FaArrowUp,
  FaCalendarAlt
} from 'react-icons/fa';
import styles from './kpi.module.scss';

export default function KPIPage() {
  const [kpiData, setKpiData] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [demand, setDemand] = useState<{ hour: string; demand: number }[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [stations, setStations] = useState<string[]>([]);

  useEffect(() => {
    loadKPIData();
  }, [timeRange]);

  const loadStations = React.useCallback(async () => {
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      const list: string[] = Array.isArray(data?.stations) ? data.stations : [];
      if (list.length > 0) {
        setStations(list);
        // If current selection is not available, default to first backend-provided station
        if (!selectedStation || !list.includes(selectedStation)) {
          setSelectedStation(list[0]);
        }
        return;
      }
      // Fallback: derive station names from GTFS stops when backend has none
      try {
        const stopsRes = await fetch('/api/gtfs/stops');
        const stopsJson = await stopsRes.json();
        const stops: any[] = Array.isArray(stopsJson?.stops) ? stopsJson.stops : [];
        const names = Array.from(new Set(stops.map((s: any) => String(s.stop_name || '').trim()).filter(Boolean)));
        setStations(names);
        if (!selectedStation && names.length > 0) setSelectedStation(names[0]);
      } catch {
        setStations([]);
      }
    } catch {
      // ignore
    }
  }, [selectedStation]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    (async () => {
      try {
        if (!selectedStation) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const date = tomorrow.toISOString().slice(0,10);
        const res = await fetch('/api/demand/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ station: selectedStation, date })
        });
        if (!res.ok) {
          try {
            const err = await res.json();
            const detail: string = String(err?.detail || '');
            if (detail.includes('No model available')) {
              // Refresh stations from backend and pick a valid one
              await loadStations();
            }
          } catch {}
          setDemand([]);
          return;
        }
        const data = await res.json();
        const preds: any[] = Array.isArray(data?.predictions) ? data.predictions : [];
        setDemand(preds.map(p => ({ hour: p.hour, demand: Number(p.demand) || 0 })));
      } catch {
        setDemand([]);
      }
    })();
  }, [selectedStation]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const response = await api<KPI[]>('/kpi');
      setKpiData(response.data);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageValue = (key: keyof KPI) => {
    if (kpiData.length === 0) return 0;
    const sum = kpiData.reduce((acc, item) => {
      const value = typeof item[key] === 'number' ? item[key] : 0;
      return acc + value;
    }, 0);
    return (sum / kpiData.length).toFixed(1);
  };

  const getTrend = (key: keyof KPI) => {
    if (kpiData.length < 2) return 0;
    const recent = kpiData.slice(-7);
    const previous = kpiData.slice(-14, -7);
    
    const recentAvg = recent.reduce((acc, item) => {
      const value = typeof item[key] === 'number' ? item[key] : 0;
      return acc + value;
    }, 0) / recent.length;
    
    const previousAvg = previous.reduce((acc, item) => {
      const value = typeof item[key] === 'number' ? item[key] : 0;
      return acc + value;
    }, 0) / previous.length;
    
    return ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const chartData = kpiData.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  return (
    <div className={styles.kpi}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Key Performance Indicators</h1>
        <div className={styles.controls}>
          <select 
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className={styles.timeRangeSelect}
          >
            <option value="">Station</option>
            {stations.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.timeRangeSelect}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className={styles.kpiCards}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="elevated" className={styles.kpiCard}>
            <CardContent>
              <div className={styles.kpiHeader}>
                <FaChartLine className={styles.kpiIcon} />
                <div className={styles.kpiInfo}>
                  <h3 className={styles.kpiTitle}>Punctuality</h3>
                  <div className={styles.kpiValue}>{getAverageValue('punctuality')}%</div>
                </div>
              </div>
              <div className={styles.kpiTrend}>
                <FaArrowUp className={styles.trendIcon} />
                <span className={styles.trendValue}>{getTrend('punctuality')}%</span>
                <span className={styles.trendLabel}>vs last week</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="elevated" className={styles.kpiCard}>
            <CardContent>
              <div className={styles.kpiHeader}>
                <FaBolt className={styles.kpiIcon} />
                <div className={styles.kpiInfo}>
                  <h3 className={styles.kpiTitle}>Energy Usage</h3>
                  <div className={styles.kpiValue}>{getAverageValue('energyUsage')} kWh</div>
                </div>
              </div>
              <div className={styles.kpiTrend}>
                <FaArrowUp className={styles.trendIcon} />
                <span className={styles.trendValue}>{getTrend('energyUsage')}%</span>
                <span className={styles.trendLabel}>vs last week</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.kpiCard}>
            <CardContent>
              <div className={styles.kpiHeader}>
                <FaExclamationTriangle className={styles.kpiIcon} />
                <div className={styles.kpiInfo}>
                  <h3 className={styles.kpiTitle}>SLA Breaches</h3>
                  <div className={styles.kpiValue}>{getAverageValue('slaBreaches')}</div>
                </div>
              </div>
              <div className={styles.kpiTrend}>
                <FaArrowUp className={styles.trendIcon} />
                <span className={styles.trendValue}>{getTrend('slaBreaches')}%</span>
                <span className={styles.trendLabel}>vs last week</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card variant="elevated" className={styles.kpiCard}>
            <CardContent>
              <div className={styles.kpiHeader}>
                <FaClock className={styles.kpiIcon} />
                <div className={styles.kpiInfo}>
                  <h3 className={styles.kpiTitle}>Wait Time Reduction</h3>
                  <div className={styles.kpiValue}>{getAverageValue('waitTimeReduction')}%</div>
                </div>
              </div>
              <div className={styles.kpiTrend}>
                <FaArrowUp className={styles.trendIcon} />
                <span className={styles.trendValue}>{getTrend('waitTimeReduction')}%</span>
                <span className={styles.trendLabel}>vs last week</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className={styles.charts}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Card variant="elevated" className={styles.chartCard}>
            <CardHeader>
              <h2 className={styles.chartTitle}>Forecast Demand ({selectedStation || 'Station'})</h2>
            </CardHeader>
            <CardContent>
              <Chart
                data={demand.map(d => ({ name: d.hour, demand: d.demand }))}
                type="line"
                dataKey="demand"
                xAxisKey="name"
                yDomain={[0, 'auto']}
                color="#8b5cf6"
                height={300}
                className={`forecast-${selectedStation}`}
              />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card variant="elevated" className={styles.chartCard}>
            <CardHeader>
              <h2 className={styles.chartTitle}>Punctuality Trend</h2>
            </CardHeader>
            <CardContent>
              <Chart
                data={chartData}
                type="line"
                dataKey="punctuality"
                color="#059669"
                height={300}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card variant="elevated" className={styles.chartCard}>
            <CardHeader>
              <h2 className={styles.chartTitle}>Energy Usage</h2>
            </CardHeader>
            <CardContent>
              <Chart
                data={chartData}
                type="area"
                dataKey="energyUsage"
                color="#2563eb"
                height={300}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card variant="elevated" className={styles.chartCard}>
            <CardHeader>
              <h2 className={styles.chartTitle}>SLA Breaches</h2>
            </CardHeader>
            <CardContent>
              <Chart
                data={chartData}
                type="bar"
                dataKey="slaBreaches"
                color="#dc2626"
                height={300}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card variant="elevated" className={styles.chartCard}>
            <CardHeader>
              <h2 className={styles.chartTitle}>MTBF Distribution</h2>
            </CardHeader>
            <CardContent>
              <Chart
                data={[
                  { name: 'Excellent', value: 45 },
                  { name: 'Good', value: 30 },
                  { name: 'Average', value: 20 },
                  { name: 'Poor', value: 5 }
                ]}
                type="pie"
                dataKey="value"
                height={300}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
