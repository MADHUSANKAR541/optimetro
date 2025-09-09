'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FaTrain, FaShieldAlt } from 'react-icons/fa';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import styles from './setup.module.scss';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin account created successfully! You can now sign in.');
        router.push('/login');
      } else {
        toast.error(data.error || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.setupPage}>
      <div className={styles.background}>
        <div className={styles.gradientBlob1} />
        <div className={styles.gradientBlob2} />
        <div className={styles.metroTrack} />
      </div>

      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.setupCard}
        >
          <Card variant="glass" className={styles.card}>
            <div className={styles.header}>
              <div className={styles.logo}>
                <FaTrain className={styles.logoIcon} />
                <span className={styles.logoText}>Kochi Metro</span>
              </div>
              <div className={styles.setupIcon}>
                <FaShieldAlt className={styles.shieldIcon} />
              </div>
              <h1 className={styles.title}>System Setup</h1>
              <p className={styles.subtitle}>
                Create the initial administrator account
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                type="text"
                name="name"
                label="Administrator Name"
                placeholder="Enter administrator name"
                value={formData.name}
                onChange={handleInputChange}
                icon={<FiUser />}
                required
              />

              <Input
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter administrator email"
                value={formData.email}
                onChange={handleInputChange}
                icon={<FiMail />}
                required
              />

              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Enter administrator password"
                value={formData.password}
                onChange={handleInputChange}
                icon={<FiLock />}
                required
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm administrator password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                icon={<FiLock />}
                required
              />

              <div className={styles.warning}>
                <p>⚠️ This will create the system administrator account. Only one admin account is allowed.</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className={styles.submitButton}
              >
                Create Admin Account
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
