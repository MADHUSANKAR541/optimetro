import React from 'react';
import styles from './Loading.module.scss';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`${styles.loadingContainer} ${styles[size]} ${className}`}>
      <div className={styles.loader}>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className={styles.base}>
          <span></span>
          <div className={styles.face}></div>
        </div>
      </div>
      <div className={styles.longfazers}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default Loading;
