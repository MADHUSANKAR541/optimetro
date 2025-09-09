'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import styles from './Chart.module.scss';

interface ChartProps {
  data: any[];
  type: 'line' | 'area' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  className?: string;
}

const COLORS = ['#2563eb', '#059669', '#dc2626', '#ea580c', '#7c3aed'];

export function Chart({
  data,
  type,
  dataKey,
  xAxisKey = 'date',
  color = '#2563eb',
  height = 300,
  className = ''
}: ChartProps) {
  const chartClasses = [styles.chart, className].filter(Boolean).join(' ');

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.1}
              strokeWidth={3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text)'
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text)'
              }}
            />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={chartClasses} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart() || <div>No data available</div>}
      </ResponsiveContainer>
    </div>
  );
}
