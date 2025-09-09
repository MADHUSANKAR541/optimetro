'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLoading } from '@/contexts/LoadingContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import styles from './signup.module.scss';

export default function SignupPage() {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'commuter'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      } else {
        toast.error(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.container}>
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.formSection}
        >
          <div className={styles.formContainer}>
            <h1 className={styles.title}>Sign up</h1>
            
            <div className={styles.loginPrompt}>
              <span>Already have account? </span>
              <Link href="/login" className={styles.loginLink}>
                Login here
              </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Name</label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name here"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email id</label>
                <div className={styles.inputWrapper}>
                  <FiMail className={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email id here"
                    value={formData.email}
                    onChange={handleInputChange}
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
                    name="password"
                    placeholder="Enter your password here"
                    value={formData.password}
                    onChange={handleInputChange}
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

              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password here"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="terms" className={styles.checkboxLabel}>
                  By Signing up you agree to receive updates and special Offers
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className={styles.submitButton}
              >
                Submit
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
