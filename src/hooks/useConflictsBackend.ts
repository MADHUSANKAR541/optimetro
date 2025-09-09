'use client';

import { useState, useCallback, useEffect } from 'react';
import { Conflict } from '@/lib/types';

type BackendConflictItem = {
  train_id: string;
  conflicts: { rule: string; status: string; reason: string }[];
};

function mapRuleToType(rule: string): Conflict['type'] {
  const r = (rule || '').toLowerCase();
  if (r.includes('job')) return 'jobcard';
  if (r.includes('brand')) return 'branding';
  return 'fitness';
}

export function useConflictsBackend() {
  const [data, setData] = useState<Conflict[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/conflicts', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch conflicts (${res.status})`);
      const items: BackendConflictItem[] = await res.json();

      const mapped: Conflict[] = [];
      for (const item of items || []) {
        const trainId = item?.train_id || 'UNKNOWN';
        for (const c of item?.conflicts || []) {
          if ((c?.status || '').toLowerCase() === 'failed') {
            const type = mapRuleToType(c.rule || '');
            mapped.push({
              id: `${trainId}-${c.rule || 'rule'}`,
              type,
              severity: 'medium',
              description: `${c.reason || 'Conflict'} (Train ${trainId})`,
              affectedTrains: [trainId],
              status: 'open',
            });
          }
        }
      }

      setData(mapped);
      return { data: mapped, success: true } as const;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData().catch(() => undefined);
  }, [fetchData]);

  const updateData = useCallback((newData: Conflict[]) => setData(newData), []);
  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, fetchData, updateData, reset };
}


