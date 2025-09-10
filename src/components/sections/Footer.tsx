'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <h4 className={styles.brand}>Kochi Metro</h4>
            <p className={styles.tagline}>Reliable. Sustainable. Connected.</p>
          </div>

          <nav className={styles.links} aria-label="Footer navigation">
            <Link href="#about" className={styles.link}>About</Link>
            <Link href="/commuter/dashboard" className={styles.link}>Plan Journey</Link>
            <Link href="/commuter/dashboard/tickets" className={styles.link}>Tickets</Link>
            <Link href="/admin/dashboard/induction" className={styles.link}>Operations</Link>
          </nav>

          <div className={styles.cta}>
            <p className={styles.ctaText}>Be the first to know service updates and route changes.</p>
            <form className={styles.subscribe} onSubmit={(e) => e.preventDefault()}>
              <input className={styles.input} type="email" placeholder="Your email" aria-label="Email" />
              <button className={styles.button} type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className={styles.meta}>
          <span>© {new Date().getFullYear()} Kochi Metro Rail Limited</span>
          <span className={styles.dot}>•</span>
          <span>Built for a smoother commute</span>
        </div>
      </div>
    </footer>
  );
}


