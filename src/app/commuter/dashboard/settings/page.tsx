'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/lib/theme';
import { 
  FaCog, 
  FaUser, 
  FaBell, 
  FaPalette,
  FaMapMarkerAlt,
  FaWheelchair,
  FaLanguage,
  FaSave
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import styles from './settings.module.scss';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    name: 'Commuter User',
    email: 'user@demo.com',
    homeStation: 'Aluva',
    workStation: 'Thykoodam',
    notifications: {
      tripUpdates: true,
      serviceAlerts: true,
      promotions: false,
      maintenance: true
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: false
    },
    language: 'en',
    timezone: 'Asia/Kolkata'
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleNotificationChange = (key: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key as keyof typeof prev.notifications]
      }
    }));
  };

  const handleAccessibilityChange = (key: string) => {
    setSettings(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key as keyof typeof prev.accessibility]
      }
    }));
  };

  const stations = [
    'Aluva', 'Edapally', 'Palarivattom', 'JLN Stadium', 'Kaloor',
    'Town Hall', 'MG Road', 'Maharaja\'s College', 'Ernakulam South',
    'Thykoodam', 'Vytilla', 'SN Junction'
  ];

  return (
    <div className={styles.settings}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Customize your metro experience
        </p>
      </motion.div>

      <div className={styles.content}>
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="elevated" className={styles.settingsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaUser className={styles.cardIcon} />
                Profile Information
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.form}>
                <Input
                  label="Full Name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="elevated" className={styles.settingsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaMapMarkerAlt className={styles.cardIcon} />
                Location Preferences
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Home Station</label>
                  <select
                    value={settings.homeStation}
                    onChange={(e) => setSettings(prev => ({ ...prev, homeStation: e.target.value }))}
                    className={styles.select}
                  >
                    {stations.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Work Station</label>
                  <select
                    value={settings.workStation}
                    onChange={(e) => setSettings(prev => ({ ...prev, workStation: e.target.value }))}
                    className={styles.select}
                  >
                    {stations.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="elevated" className={styles.settingsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaBell className={styles.cardIcon} />
                Notifications
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.toggleGroup}>
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className={styles.toggleItem}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={styles.toggleDescription}>
                        {key === 'tripUpdates' && 'Get updates about your planned trips'}
                        {key === 'serviceAlerts' && 'Receive service disruption notifications'}
                        {key === 'promotions' && 'Get notified about special offers and promotions'}
                        {key === 'maintenance' && 'Receive maintenance schedule updates'}
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${value ? styles.active : ''}`}
                      onClick={() => handleNotificationChange(key)}
                    >
                      <div className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accessibility Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card variant="elevated" className={styles.settingsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaWheelchair className={styles.cardIcon} />
                Accessibility
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.toggleGroup}>
                {Object.entries(settings.accessibility).map(([key, value]) => (
                  <div key={key} className={styles.toggleItem}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className={styles.toggleDescription}>
                        {key === 'highContrast' && 'Use high contrast colors for better visibility'}
                        {key === 'largeText' && 'Increase text size for better readability'}
                        {key === 'screenReader' && 'Optimize interface for screen readers'}
                      </span>
                    </div>
                    <button
                      className={`${styles.toggle} ${value ? styles.active : ''}`}
                      onClick={() => handleAccessibilityChange(key)}
                    >
                      <div className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card variant="elevated" className={styles.settingsCard}>
            <CardHeader>
              <h2 className={styles.cardTitle}>
                <FaPalette className={styles.cardIcon} />
                Appearance
              </h2>
            </CardHeader>
            <CardContent>
              <div className={styles.themeGroup}>
                <div className={styles.themeInfo}>
                  <span className={styles.themeLabel}>Theme</span>
                  <span className={styles.themeDescription}>
                    Choose between light and dark themes
                  </span>
                </div>
                <button
                  className={styles.themeButton}
                  onClick={toggleTheme}
                >
                  <FaPalette className={styles.themeIcon} />
                  <span className={styles.themeText}>
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={styles.saveSection}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            icon={<FaSave />}
            className={styles.saveButton}
          >
            Save Settings
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
