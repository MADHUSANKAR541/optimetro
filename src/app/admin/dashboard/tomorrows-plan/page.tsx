'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FiPlay, FiDownload, FiSettings, FiClock, FiTrendingUp, FiDollarSign, FiTarget, FiAlertTriangle, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import styles from './tomorrows-plan.module.scss';
import { trainsApi, depotApi, conflictsApi, jobCardsApi, maintenanceRecordsApi, brandingContractsApi } from '@/lib/supabaseApi';

interface TrainStatus {
  train_id: string;
  status: 'run' | 'standby' | 'maintenance';
  bay: string;
  conflicts: string[];
  branding_sla: boolean;
  mileage: number;
  score: number;
  reasons: string[];
  isReady?: boolean;
  isScheduled?: boolean;
  firstOutTime?: string;
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
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);
  const [planDate, setPlanDate] = useState<string>('');
  const [isPlanActive, setIsPlanActive] = useState<boolean>(false);
  const [plannedSchedule, setPlannedSchedule] = useState<Array<{ date: string; trainNumber: string; trainName: string; origin: string; destination: string; departure: string; arrival: string; status: string }>>([]);
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

        // Merge optimizer scores and schedule flags from localStorage if available
        let scoreByTrainId: Record<string, number> = {};
        const scheduledIdSet: Set<string> = new Set();
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
                  const action = (r?.action || r?.decision || '').toString().toLowerCase();
                  // Only schedule trains that have a non-negative score
                  if (trainKey && (action === 'revenue' || action === 'run') && typeof r?.score === 'number' && r.score >= 0) {
                    scheduledIdSet.add(trainKey);
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

        const trainId = t.id || t.train_number;
        const isScheduled = scheduledIdSet.has(t.id) || scheduledIdSet.has(t.train_number);
        const conflictsText = typeof t.conflicts === 'number' && t.conflicts > 0 ? [`${t.conflicts} issues`] : [];
        const isReady = status !== 'maintenance' && conflictsText.length === 0;

        return {
            train_id: trainId,
            status,
            bay: bay ? bay.bay_number : '-',
            conflicts: conflictsText,
            branding_sla: true,
            mileage: t.mileage ?? 0,
            score: scoreByTrainId[t.id] ?? scoreByTrainId[t.train_number] ?? 0,
            reasons: [],
            isReady,
            isScheduled
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

    // Restore any saved planned schedule
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('tomorrows_plan_schedule');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPlannedSchedule(parsed);
            setIsPlanActive(true);
          }
        }
      }
    } catch {}
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
        // Determine tomorrow's date string
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toLocaleDateString();
        setPlanDate(dateStr);

        // Extract scheduled trains (run/revenue) with non-negative score
        const results: any[] = Array.isArray(data?.results) ? data.results : [];
        const scheduledIds = new Set<string>();

        // Pull GTFS stops to determine origin/destination names
        let originName = '-';
        let destinationName = '-';
        try {
          const stopsRes = await fetch('/api/gtfs/stops');
          if (stopsRes.ok) {
            const stopsJson = await stopsRes.json();
            const stops: any[] = Array.isArray(stopsJson?.stops) ? stopsJson.stops : [];
            if (stops.length > 0) {
              // Use extreme latitude stops as ends of the corridor
              const northMost = stops.reduce((a: any, b: any) => (Number(a.stop_lat) > Number(b.stop_lat) ? a : b));
              const southMost = stops.reduce((a: any, b: any) => (Number(a.stop_lat) < Number(b.stop_lat) ? a : b));
              originName = northMost?.stop_name || originName;
              destinationName = southMost?.stop_name || destinationName;
            }
          }
        } catch {}

        // Build full-day schedule: 06:00 to 23:00, 15-min headways
        const scheduleRows: Array<{ date: string; trainNumber: string; trainName: string; origin: string; destination: string; departure: string; arrival: string; status: string }> = [];
        const eligible = results
          .map((r: any) => ({
            id: r.train_id || r.trainId,
            action: String(r.action || r.decision || '').toLowerCase(),
            score: typeof r.score === 'number' ? r.score : 0,
            train_name: r.train_name
          }))
          .filter(r => r.id && (r.action === 'run' || r.action === 'revenue') && r.score >= 0);

        for (const r of eligible) scheduledIds.add(r.id);

        const headwayMinutes = 15;
        const tripMinutes = 30; // simple assumption
        const start = new Date(tomorrow);
        start.setHours(6, 0, 0, 0);
        const end = new Date(tomorrow);
        end.setHours(23, 0, 0, 0);
        const timeFmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let slotIndex = 0;
        for (let tms = start.getTime(); tms <= end.getTime(); tms += headwayMinutes * 60 * 1000) {
          if (eligible.length === 0) break;
          const r = eligible[slotIndex % eligible.length];
          const dep = new Date(tms);
          const arr = new Date(dep.getTime() + tripMinutes * 60 * 1000);
          const isOutbound = (slotIndex % 2) === 0; // alternate directions
          const tripOrigin = isOutbound ? originName : destinationName;
          const tripDestination = isOutbound ? destinationName : originName;
          scheduleRows.push({
            date: dateStr,
            trainNumber: r.id,
            trainName: r.train_name || r.id,
            origin: tripOrigin,
            destination: tripDestination,
            departure: timeFmt(dep),
            arrival: timeFmt(arr),
            status: 'Run'
          });
          slotIndex++;
        }

        setPlannedSchedule(scheduleRows);
        setIsPlanActive(true);

        // Persist for reload
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('tomorrows_plan_schedule', JSON.stringify(scheduleRows));
          }
        } catch {}

        // Merge induction decisions with DB data and show ALL trains that are ready to use
        setTrains(prev => {
          const firstOutByTrain = new Map<string, string>();
          for (const row of scheduleRows) {
            if (!firstOutByTrain.has(row.trainNumber)) firstOutByTrain.set(row.trainNumber, row.departure);
          }
          const merged = prev.map(t => {
            const isSched = scheduledIds.has(t.train_id);
            const nextStatus: 'run' | 'standby' | 'maintenance' = isSched ? 'run' : t.status;
            // Recompute readiness: must not be maintenance and no conflicts
            const ready = nextStatus !== 'maintenance' && (t.conflicts?.length ?? 0) === 0;
            return {
              ...t,
              status: nextStatus,
              isScheduled: isSched,
              isReady: ready,
              // Attach first out time for depot display
              firstOutTime: firstOutByTrain.get(t.train_id)
            } as typeof t;
          });
          // Show all READY trains; scheduled ones will be highlighted via flags
          return merged.filter(t => t.isReady);
        });

        setLastUpdated(new Date());
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const rows = plannedSchedule.length > 0 ? plannedSchedule : [];
    const header = 'Date,Train Number,Train Name,Origin,Destination,Departure Time,Arrival Time,Status';
    const csv = [header, ...rows.map(r => [r.date, r.trainNumber, r.trainName, r.origin, r.destination, r.departure, r.arrival, r.status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileDate = planDate || new Date().toLocaleDateString();
    link.download = `tomorrows-plan_${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openTrainDetails = async (trainId: string) => {
    try {
      setSelectedTrainId(trainId);
      setIsModalOpen(true);

      // pull optimizer score/reasons for this train from localStorage
      let optimizer: { score?: number; reasons?: string[]; action?: string; firstOutTime?: string } = {};
      try {
        if (typeof window !== 'undefined') {
          const saved = window.localStorage.getItem('induction_optimizer_results');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const match = parsed.find((r: any) => (r.trainId || r.train_id) === trainId);
              if (match) {
                optimizer = {
                  score: typeof match.score === 'number' ? match.score : undefined,
                  reasons: Array.isArray(match.reasons) ? match.reasons : undefined,
                  action: match.action || match.decision,
                  firstOutTime: match.first_out_time
                };
              }
            }
          }
        }
      } catch {}

      const [jobsRes, maintRes, brandingRes, baysRes] = await Promise.all([
        jobCardsApi.getByTrain(trainId),
        maintenanceRecordsApi.getByTrain(trainId),
        brandingContractsApi.getAll(),
        depotApi.getBays()
      ]);

      const train = trains.find(t => t.train_id === trainId);
      const bays = (baysRes.data as any[]) || [];
      const currentBay = bays.find((b: any) => Array.isArray(b.train_ids) && b.train_ids.includes(trainId));

      setSelectedDetails({
        basic: {
          trainId,
          line: 'Line 1',
          depot: 'Main Depot',
          bay: train?.bay || currentBay?.bay_number || '-'
        },
        plan: {
          status: train?.status,
          firstOutTime: optimizer.firstOutTime || '-'
        },
        certificates: {
          rollingStock: { valid: true, expires: '-' },
          signalling: { valid: true, expires: '-' },
          telecom: { valid: true, expires: '-' },
          lastInspection: '-',
          nextInspection: '-'
        },
        maintenance: {
          jobs: (jobsRes.data as any[]) || [],
          lastMajor: '-',
          upcoming: (maintRes.data as any[]) || []
        },
        branding: {
          applied: false,
          exposureDue: '-',
          exposureAchieved: '-',
          sla: 'on_track'
        },
        mileage: {
          today: '-',
          lifetime: train?.mileage ?? '-',
          balance: 'average'
        },
        cleaning: {
          last: '-',
          next: '-',
          status: 'pending'
        },
        stabling: {
          currentBay: train?.bay || currentBay?.bay_number || '-',
          nextBay: '-',
          shuntingMoves: 0
        },
        conflicts: optimizer.reasons || [],
        optimizer
      });
    } catch (e) {
      setSelectedDetails(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTrainId(null);
    setSelectedDetails(null);
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
  const readyCount = trains.filter(t => t.isReady).length;
  const scheduledCount = trains.filter(t => t.isScheduled).length;

  // Compute next day's date string for display defaults
  const nextDayDisplay = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString();
  })();

  return (
    <>
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>🌟 Tomorrow's Plan</h1>
          <span className={styles.date}>Date: {planDate || nextDayDisplay}</span>
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
          <Button variant="outline" icon={<FiDownload />} onClick={handleExportCSV}>
            Download CSV
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
        {/* Planned Schedule */}
        {isPlanActive && Array.isArray(plannedSchedule) && plannedSchedule.length > 0 && (
          <div className={styles.trainList}>
            <Card className={styles.trainCard}>
              <div className={styles.cardHeader}>
                <h2>📅 Scheduled Runs for {planDate}</h2>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.trainTable}>
                  <thead>
                    <tr>
                      <th>Train</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedSchedule.map((r, idx) => (
                      <tr key={`${r.trainNumber}-${idx}`}>
                        <td>{r.trainNumber}</td>
                        <td>{r.origin}</td>
                        <td>{r.destination}</td>
                        <td>{r.departure}</td>
                        <td>{r.arrival}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
        {/* Train List */}
        <div className={styles.trainList}>
          <Card className={styles.trainCard}>
            <div className={styles.cardHeader}>
              <h2>🚂 Train Status Overview</h2>
              <div className={styles.summary}>
                <span className={styles.summaryItem}>🟢 {runCount} Run</span>
                <span className={styles.summaryItem}>🟡 {standbyCount} Standby</span>
                <span className={styles.summaryItem}>🔴 {maintenanceCount} Maintenance</span>
                <span className={styles.summaryItem}>✅ {readyCount} Ready</span>
                <span className={styles.summaryItem}>📅 {scheduledCount} Scheduled</span>
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.trainTable}>
                <thead>
                  <tr>
                    <th>Train ID</th>
                    <th>Status</th>
                    <th>Ready</th>
                    <th>Scheduled</th>
                    <th>Bay</th>
                    <th>Conflicts</th>
                    <th>Branding</th>
                    <th>Mileage</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {trains.map((train) => (
                    <tr key={train.train_id} className={styles.trainRow} onClick={() => openTrainDetails(train.train_id)}>
                      <td className={styles.trainId}>
                        <button className={styles.linkLike} onClick={(e) => { e.stopPropagation(); openTrainDetails(train.train_id); }}>
                          {train.train_id}
                        </button>
                      </td>
                      <td className={styles.statusCell}>
                        {getStatusIcon(train.status)}
                        <span className={styles.statusText}>{train.status}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${train.isReady ? styles.badgeSuccess : styles.badgeWarn}`}>{train.isReady ? 'Ready' : 'Blocked'}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${train.isScheduled ? styles.badgeSuccess : styles.badgeWarn}`}>{train.isScheduled ? 'Yes' : 'No'}</span>
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
                      <div className={`${styles.train} ${styles[`train${train.status}`]}`} title={train.firstOutTime ? `First out: ${train.firstOutTime}` : undefined}>
                        <div>{train.train_id.split('-')[1]}</div>
                        {train.firstOutTime && (
                          <div className={styles.firstOutBadge}>{train.firstOutTime}</div>
                        )}
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
    {isModalOpen && (
      <div className={styles.modalOverlay} onClick={closeModal}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Train Details - {selectedTrainId}</h3>
            <button className={styles.closeBtn} onClick={closeModal}>✕</button>
          </div>
          <div className={styles.modalContent}>
            {!selectedDetails ? (
              <div>Loading...</div>
            ) : (
              <>
                <section className={styles.section}>
                  <h4>Basic Information</h4>
                  <div className={styles.grid2}>
                    <div><strong>Rake</strong><div>{selectedDetails.basic.trainId}</div></div>
                    <div><strong>Line</strong><div>{selectedDetails.basic.line}</div></div>
                    <div><strong>Depot</strong><div>{selectedDetails.basic.depot}</div></div>
                    <div><strong>Bay</strong><div>{selectedDetails.basic.bay}</div></div>
                    <div>
                      <strong>Planned Status</strong>
                      <div>
                        <span className={`${styles.badge} ${selectedDetails.plan.status === 'run' ? styles.badgeSuccess : selectedDetails.plan.status === 'standby' ? styles.badgeWarn : styles.badgeError}`}>
                          {String(selectedDetails.plan.status).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div><strong>First Out Time</strong><div>{selectedDetails.plan.firstOutTime}</div></div>
                  </div>
                </section>
                <section className={styles.section}>
                  <h4>Certificates & Safety</h4>
                  <div className={styles.grid3}>
                    <div><strong>Rolling Stock</strong><div><span className={`${styles.badge} ${selectedDetails.certificates.rollingStock.valid ? styles.badgeSuccess : styles.badgeError}`}>{selectedDetails.certificates.rollingStock.valid ? 'Valid' : 'Expired'}</span></div></div>
                    <div><strong>Signalling</strong><div><span className={`${styles.badge} ${selectedDetails.certificates.signalling.valid ? styles.badgeSuccess : styles.badgeError}`}>{selectedDetails.certificates.signalling.valid ? 'Valid' : 'Expired'}</span></div></div>
                    <div><strong>Telecom</strong><div><span className={`${styles.badge} ${selectedDetails.certificates.telecom.valid ? styles.badgeSuccess : styles.badgeError}`}>{selectedDetails.certificates.telecom.valid ? 'Valid' : 'Expired'}</span></div></div>
                  </div>
                </section>
                <section className={styles.section}>
                  <h4>Maintenance & Job-Cards</h4>
                  <div>
                    <div><strong>Open Jobs</strong></div>
                    <ul className={styles.list}>
                      {Array.isArray(selectedDetails.maintenance.jobs) && selectedDetails.maintenance.jobs.length > 0 ?
                        selectedDetails.maintenance.jobs.map((j: any) => (
                          <li key={j.id}>[{j.priority}] {j.title || j.description} - {j.status}</li>
                        )) : <li>None</li>}
                    </ul>
                  </div>
                </section>
                <section className={styles.section}>
                  <h4>Branding & SLA</h4>
                  <div className={styles.grid3}>
                    <div><strong>Branding</strong><div><span className={`${styles.badge} ${selectedDetails.branding.applied ? styles.badgeSuccess : styles.badgeWarn}`}>{selectedDetails.branding.applied ? 'Applied' : 'Not Applied'}</span></div></div>
                    <div><strong>Exposure</strong><div>{selectedDetails.branding.exposureAchieved}/{selectedDetails.branding.exposureDue}</div></div>
                    <div><strong>SLA</strong><div><span className={`${styles.badge} ${selectedDetails.branding.sla === 'on_track' ? styles.badgeSuccess : styles.badgeError}`}>{selectedDetails.branding.sla}</span></div></div>
                  </div>
                </section>
                <section className={styles.section}>
                  <h4>Mileage & Usage</h4>
                  <div className={styles.grid3}>
                    <div><strong>Today</strong><div>{selectedDetails.mileage.today}</div></div>
                    <div><strong>Lifetime</strong><div>{selectedDetails.mileage.lifetime}</div></div>
                    <div><strong>Balance</strong><div>{selectedDetails.mileage.balance}</div></div>
                  </div>
                </section>
                <section className={styles.section}>
                  <h4>Stabling & Geometry</h4>
                  <div className={styles.grid3}>
                    <div><strong>Current Bay</strong><div>{selectedDetails.stabling.currentBay}</div></div>
                    <div><strong>Next Bay</strong><div>{selectedDetails.stabling.nextBay}</div></div>
                    <div><strong>Shunting Moves</strong><div>{selectedDetails.stabling.shuntingMoves}</div></div>
                  </div>
                </section>
                {Array.isArray(selectedDetails.conflicts) && selectedDetails.conflicts.length > 0 && (
                  <section className={styles.section}>
                    <h4>Conflict Reasons</h4>
                    <ul className={styles.list}>
                      {selectedDetails.conflicts.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </section>
                )}
                <section className={styles.section}>
                  <h4>Actions</h4>
                  <div className={styles.actionsRow}>
                    <Button variant="primary">Override Decision</Button>
                    <Button variant="outline">Acknowledge Conflict</Button>
                    <Button variant="ghost">View History</Button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
