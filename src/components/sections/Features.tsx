'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  FaUsers, 
  FaFileDownload, 
  FaPlug, 
  FaFlask, 
  FaEye, 
  FaRocket 
} from 'react-icons/fa';
import styles from './Features.module.scss';

const features = [
  {
    icon: <FaUsers />,
    title: 'Commuter-Centric Impact',
    description: 'Shorter wait times, higher train availability, and a more reliable metro experience for daily passengers.'
  },
  {
    icon: <FaFileDownload />,
    title: 'Governance-Ready Reports',
    description: 'Download audit-proof PDF and CSV plans with complete traceability for compliance and accountability.'
  },
  {
    icon: <FaPlug />,
    title: 'Seamless Integration',
    description: 'Works smoothly with existing systems (GTFS, Maximo, telemetry) and scales as the metro network expands'
  },
  {
    icon: <FaFlask />,
    title: 'What-If Simulations',
    description: 'Test scenarios like bay closures or delayed trains and instantly see the impact on operations and commuter service.'
  },
  {
    icon: <FaEye />,
    title: 'Explainable AI',
    description: 'Every decision is transparent, with clear reasons shown for each train\'s induction, stabling, or maintenance choice.'
  },
  {
    icon: <FaRocket />,
    title: 'One-Click Planning',
    description: 'Generate the entire next-day schedule in minutes, replacing hours of manual work with instant, optimized outputs.'
  }
];

export function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={styles.header}
        >
          <h2 className={styles.title}>Why Choose OptiMetro?</h2>
          <p className={styles.subtitle}>
            Experience the future of urban transportation with cutting-edge technology 
            and innovative solutions designed for modern cities.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card variant="elevated" hover className={styles.featureCard}>
                <div className={styles.iconContainer}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
