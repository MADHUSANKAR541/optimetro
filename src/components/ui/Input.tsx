'use client';

import React from 'react';
import styles from './Input.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'outlined';
}

export function Input({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  variant = 'default',
  className = '',
  ...props
}: InputProps) {
  const inputClasses = [
    styles.input,
    styles[variant],
    error && styles.error,
    icon && styles[`icon-${iconPosition}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && iconPosition === 'left' && (
          <div className={styles.iconLeft}>
            {icon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className={styles.iconRight}>
            {icon}
          </div>
        )}
      </div>
      {error && (
        <div className={styles.errorText}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div className={styles.helperText}>
          {helperText}
        </div>
      )}
    </div>
  );
}
