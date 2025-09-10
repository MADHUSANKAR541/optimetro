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

  useEffect(() => {
    loadKPIData();
  }, [timeRange]);

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
