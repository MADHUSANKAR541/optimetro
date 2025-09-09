'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  FaBrain, 
  FaChartLine, 
  FaMobileAlt, 
  FaShieldAlt, 
  FaClock, 
  FaLeaf 
} from 'react-icons/fa';
import styles from './Features.module.scss';

const features = [
  {
    icon: <FaBrain />,
    title: 'AI-Powered Optimization',
    description: 'Advanced algorithms optimize train scheduling, reduce wait times, and maximize efficiency across the metro network.'
  },
  {
    icon: <FaChartLine />,
    title: 'Real-Time Analytics',
    description: 'Comprehensive dashboards provide live insights into system performance, passenger flow, and operational metrics.'
  },
  {
    icon: <FaMobileAlt />,
    title: 'Mobile-First Design',
    description: 'Seamless experience across all devices with responsive design and progressive web app capabilities.'
  },
  {
    icon: <FaShieldAlt />,
    title: 'Enterprise Security',
    description: 'Bank-grade security with role-based access control, encrypted communications, and audit trails.'
  },
  {
    icon: <FaClock />,
    title: '24/7 Monitoring',
    description: 'Continuous system monitoring with automated alerts and predictive maintenance capabilities.'
  },
  {
    icon: <FaLeaf />,
    title: 'Eco-Friendly',
    description: 'Sustainable operations with energy optimization and reduced carbon footprint tracking.'
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
          <h2 className={styles.title}>Why Choose Kochi Metro?</h2>
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
