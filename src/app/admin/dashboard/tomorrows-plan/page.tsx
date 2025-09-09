'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FiPlay, FiDownload, FiSettings, FiClock, FiTrendingUp, FiDollarSign, FiTarget, FiAlertTriangle, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import styles from './tomorrows-plan.module.scss';
import { trainsApi, depotApi, conflictsApi } from '@/lib/supabaseApi';

interface TrainStatus {
  train_id: string;
  status: 'run' | 'standby' | 'maintenance';
  bay: string;
  conflicts: string[];
  branding_sla: boolean;
  mileage: number;
  score: number;
  reasons: string[];
}

interface Conflict {
  train_id: string;
  type: 'fitness' | 'job_card' | 'cleaning' | 'branding';
  message: string;
  priority: 'high' | 'medium' | 'low';
  action_required: boolean;
}

interface KPIData {
  planning_time_saved: string;
  accuracy: number;
  cost_savings: string;
  sla_compliance: number;
}

export default function TomorrowsPlanPage() {
  const [trains, setTrains] = useState<TrainStatus[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [kpis, setKpis] = useState<KPIData>({
    planning_time_saved: '120→15 min',
    accuracy: 98.5,
    cost_savings: '₹2.3L/day',
    sla_compliance: 100
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [trainsRes, baysRes, conflictsRes] = await Promise.all([
          trainsApi.getAll(),
          depotApi.getBays(),
          conflictsApi.getAll()
        ]);

        const bays = (baysRes.data as any[]) || [];

        // Merge optimizer scores from localStorage if available
        let scoreByTrainId: Record<string, number> = {};
        try {
          if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem('induction_optimizer_results');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                for (const r of parsed) {
                  const trainKey = r?.trainId || r?.train_id;
                  if (trainKey && typeof r?.score === 'number') {
                    scoreByTrainId[trainKey] = r.score;
                  }
                }
              }
            }
          }
        } catch {}

        const trainsMapped: TrainStatus[] = ((trainsRes.data as any[]) || []).map((t) => {
          // Find bay by membership
          const bay = bays.find((b) => Array.isArray(b.train_ids) && b.train_ids.includes(t.id));
          const status = ((): 'run' | 'standby' | 'maintenance' => {
            switch (t.status) {
              case 'revenue':
                return 'run';
              case 'standby':
                return 'standby';
              case 'maintenance':
                return 'maintenance';
              default:
                return 'standby';
            }
          })();

        return {
            train_id: t.id || t.train_number,
            status,
            bay: bay ? bay.bay_number : '-',
            conflicts: typeof t.conflicts === 'number' && t.conflicts > 0 ? [`${t.conflicts} issues`] : [],
            branding_sla: true,
            mileage: t.mileage ?? 0,
            score: scoreByTrainId[t.id] ?? scoreByTrainId[t.train_number] ?? 0,
            reasons: []
          } as TrainStatus;
        });

        const conflictsMapped: Conflict[] = ((conflictsRes.data as any[]) || []).flatMap((c) => {
          const priority: 'high' | 'medium' | 'low' = c.severity === 'high' ? 'high' : c.severity === 'medium' ? 'medium' : 'low';
          const type: Conflict['type'] = c.type === 'jobcard' ? 'job_card' : c.type === 'branding' ? 'branding' : 'fitness';
          const trainsAffected: string[] = Array.isArray(c.affected_trains) ? c.affected_trains : [];
          return trainsAffected.map((trainId) => ({
            train_id: trainId,
            type,
            message: c.description,
            priority,
            action_required: priority !== 'low'
          }));
        });

        setTrains(trainsMapped);
        setConflicts(conflictsMapped);
        setLastUpdated(new Date());
      } catch (e) {
        // Keep UI usable even if DB not configured
        console.error('Failed to load data', e);
      }
    };
    load();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    
    // Simulate API call to FastAPI backend
    try {
      const response = await fetch('/api/induction/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update trains with new optimization results
        // For now, we'll use mock data
        setTimeout(() => {
          setLastUpdated(new Date());
          setIsGenerating(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'run': return <FiCheckCircle className={styles.statusIcon} data-status="run" />;
      case 'standby': return <FiClock className={styles.statusIcon} data-status="standby" />;
      case 'maintenance': return <FiXCircle className={styles.statusIcon} data-status="maintenance" />;
      default: return null;
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'fitness': return '🔧';
      case 'job_card': return '📋';
      case 'cleaning': return '🧹';
      case 'branding': return '📢';
      default: return '⚠️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      case 'low': return styles.priorityLow;
      default: return '';
    }
  };

  const runCount = trains.filter(t => t.status === 'run').length;
  const standbyCount = trains.filter(t => t.status === 'standby').length;
  const maintenanceCount = trains.filter(t => t.status === 'maintenance').length;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>🌟 Tomorrow's Plan</h1>
          <span className={styles.date}>Date: {new Date().toLocaleDateString()}</span>
        </div>
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={generatePlan}
            disabled={isGenerating}
            icon={isGenerating ? <FiRefreshCw className={styles.spinning} /> : <FiPlay />}
          >
            {isGenerating ? 'Generating...' : 'Generate Plan'}
          </Button>
          <Button variant="outline" icon={<FiDownload />}>
            Export
          </Button>
          <Button variant="ghost" icon={<FiSettings />}>
            Settings
          </Button>
        </div>
        <div className={styles.lastUpdated}>
          Last Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiRow}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiClock />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Planning Time Saved</div>
            <div className={styles.kpiValue}>{kpis.planning_time_saved}</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiTrendingUp />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Accuracy</div>
            <div className={styles.kpiValue}>{kpis.accuracy}%</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiDollarSign />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Cost Savings</div>
            <div className={styles.kpiValue}>{kpis.cost_savings}</div>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FiTarget />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>SLA Compliance</div>
            <div className={styles.kpiValue}>{kpis.sla_compliance}%</div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Train List */}
        <div className={styles.trainList}>
          <Card className={styles.trainCard}>
            <div className={styles.cardHeader}>
              <h2>🚂 Train Status Overview</h2>
              <div className={styles.summary}>
                <span className={styles.summaryItem}>🟢 {runCount} Run</span>
                <span className={styles.summaryItem}>🟡 {standbyCount} Standby</span>
                <span className={styles.summaryItem}>🔴 {maintenanceCount} Maintenance</span>
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.trainTable}>
                <thead>
                  <tr>
                    <th>Train ID</th>
                    <th>Status</th>
                    <th>Bay</th>
                    <th>Conflicts</th>
                    <th>Branding</th>
                    <th>Mileage</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {trains.map((train) => (
                    <tr key={train.train_id} className={styles.trainRow}>
                      <td className={styles.trainId}>{train.train_id}</td>
                      <td className={styles.statusCell}>
                        {getStatusIcon(train.status)}
                        <span className={styles.statusText}>{train.status}</span>
                      </td>
                      <td className={styles.bayCell}>{train.bay}</td>
                      <td className={styles.conflictsCell}>
                        {train.conflicts.length > 0 ? (
                          <span className={styles.conflictBadge}>
                            <FiAlertTriangle /> {train.conflicts.length}
                          </span>
                        ) : (
                          <span className={styles.noConflict}>✅ None</span>
                        )}
                      </td>
                      <td className={styles.brandingCell}>
                        {train.branding_sla ? (
                          <span className={styles.slaGood}>✅ SLA</span>
                        ) : (
                          <span className={styles.slaBad}>❌ SLA</span>
                        )}
                      </td>
                      <td className={styles.mileageCell}>{train.mileage} km</td>
                      <td className={styles.scoreCell}>
                        <span className={train.score > 0 ? styles.scoreGood : styles.scoreBad}>
                          {train.score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Depot View */}
        <div className={styles.depotView}>
          <Card className={styles.depotCard}>
            <div className={styles.cardHeader}>
              <h2>🏭 Depot Schematic</h2>
              <div className={styles.legend}>
                <span className={styles.legendItem}>🟢 Run</span>
                <span className={styles.legendItem}>🟡 Standby</span>
                <span className={styles.legendItem}>🔴 Maintenance</span>
              </div>
            </div>
            <div className={styles.depotGrid}>
              {Array.from({ length: 25 }, (_, i) => {
                const bayId = `B${String(i + 1).padStart(2, '0')}`;
                const train = trains.find(t => t.bay === bayId);
                return (
                  <div key={bayId} className={styles.bay}>
                    <div className={styles.bayId}>{bayId}</div>
                    {train && (
                      <div className={`${styles.train} ${styles[`train${train.status}`]}`}>
                        {train.train_id.split('-')[1]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Conflicts Panel */}
      <div className={styles.conflictsPanel}>
        <Card className={styles.conflictsCard}>
          <div className={styles.cardHeader}>
            <h2>⚠️ Conflicts & Issues ({conflicts.length} Active)</h2>
            <div className={styles.conflictActions}>
              <Button variant="outline" size="sm">Resolve All</Button>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </div>
          <div className={styles.conflictsList}>
            {conflicts.map((conflict, index) => (
              <div key={index} className={`${styles.conflictItem} ${getPriorityColor(conflict.priority)}`}>
                <div className={styles.conflictIcon}>
                  {getConflictIcon(conflict.type)}
                </div>
                <div className={styles.conflictContent}>
                  <div className={styles.conflictTrain}>{conflict.train_id}</div>
                  <div className={styles.conflictMessage}>{conflict.message}</div>
                </div>
                <div className={styles.conflictActions}>
                  {conflict.action_required && (
                    <Button variant="primary" size="sm">
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
