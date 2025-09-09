'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLoading } from '@/contexts/LoadingContext';
import { Card } from '@/components/ui/Card';
import { FaTrain, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid credentials. Please try again.');
      } else {
        const session = await getSession();
        if (session?.user.role === 'admin') {
          router.push('/admin/dashboard/induction');
        } else {
          router.push('/commuter/dashboard');
        }
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.container}>
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.formSection}
        >
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Sign in</h1>
            
            <div className={styles.signupPrompt}>
              <span>Don't have an account? </span>
              <Link href="/signup" className={styles.signupLink}>
                Sign up here
              </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email id</label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="Enter your email id here"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password here"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.submitButton}
              >
                Sign In
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Right Side - Train Travel Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.illustrationSection}
        >
          <div className={styles.illustrationContainer}>
            {/* Smartphone */}
            <div className={styles.smartphone}>
              <div className={styles.phoneScreen}></div>
            </div>

            {/* High-Speed Train */}
            <div className={styles.highSpeedTrain}>
              <div className={styles.trainBody}>
                <div className={styles.trainFront}>
                  <div className={styles.headlight}></div>
                  <div className={styles.headlight}></div>
                </div>
                <div className={styles.trainCars}>
                  <div className={styles.trainCar}></div>
                  <div className={styles.trainCar}></div>
                  <div className={styles.trainCar}></div>
                </div>
              </div>
              <div className={styles.speedLines}>
                <div className={styles.speedLine}></div>
                <div className={styles.speedLine}></div>
                <div className={styles.speedLine}></div>
                <div className={styles.speedLine}></div>
              </div>
              <div className={styles.speedCircles}>
                <div className={styles.speedCircle}></div>
                <div className={styles.speedCircle}></div>
                <div className={styles.speedCircle}></div>
              </div>
            </div>

            {/* Location Pins */}
            <div className={styles.locationPin1}></div>
            <div className={styles.locationPin2}></div>
            <div className={styles.locationPin3}></div>

            {/* Connection Lines */}
            <div className={styles.connectionLine1}></div>
            <div className={styles.connectionLine2}></div>
            <div className={styles.connectionLine3}></div>

            {/* Background Track */}
            <div className={styles.backgroundTrack}></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
