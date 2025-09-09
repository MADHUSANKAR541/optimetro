'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { FaQuestionCircle, FaExpand, FaCompress } from 'react-icons/fa';
import styles from './MapCard.module.scss';

interface MapCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  height?: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  actions?: React.ReactNode;
}

export function MapCard({
  title,
  children,
  className = '',
  height = '400px',
  showHelp = false,
  onHelpClick,
  isExpanded = false,
  onToggleExpand,
  actions
}: MapCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${styles.mapCard} ${className}`}
      style={{ height }}
    >
      <Card variant="elevated" className={styles.card}>
        <CardHeader className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.headerActions}>
              {showHelp && (
                <button
                  className={styles.helpButton}
                  onClick={onHelpClick}
                  title="Help"
                >
                  <FaQuestionCircle />
                </button>
              )}
              {onToggleExpand && (
                <button
                  className={styles.expandButton}
                  onClick={onToggleExpand}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <FaCompress /> : <FaExpand />}
                </button>
              )}
            </div>
          </div>
          {actions && (
            <div className={styles.actions}>
              {actions}
            </div>
          )}
        </CardHeader>
        
        <CardContent className={styles.content}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
