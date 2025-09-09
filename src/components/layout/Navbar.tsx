'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { FiSun, FiMoon, FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { FaTrain, FaMapMarkerAlt } from 'react-icons/fa';
import styles from './Navbar.module.scss';

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <FaTrain className={styles.logoIcon} />
          <span className={styles.logoText}>Kochi Metro</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <a href="#about" className={styles.navLink}>
            About
          </a>
          <a href="#contact" className={styles.navLink}>
            Contact
          </a>
          <Link href="/status" className={styles.navLink}>
            Status
          </Link>
          
          {session ? (
            <div className={styles.userSection}>
              <Link 
                href={session.user && 'role' in session.user && session.user.role === 'admin' ? '/admin/dashboard/induction' : '/commuter/dashboard'}
                className={styles.navLink}
              >
                <FiUser className={styles.navIcon} />
                {session.user && 'role' in session.user && session.user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                icon={<FiLogOut />}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            icon={theme === 'light' ? <FiMoon /> : <FiSun />}
            className={styles.themeToggle}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className={styles.mobileNav}>
          <Link href="/" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </Link>
          <a href="#about" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            About
          </a>
          <a href="#contact" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            Contact
          </a>
          <Link href="/status" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
            Status
          </Link>
          
          {session ? (
            <>
              <Link 
                href={session.user && 'role' in session.user && session.user.role === 'admin' ? '/admin/dashboard/induction' : '/commuter/dashboard'}
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiUser className={styles.navIcon} />
                {session.user && 'role' in session.user && session.user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
              </Link>
              <button
                className={styles.mobileSignOut}
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                <FiLogOut className={styles.navIcon} />
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" size="sm" className={styles.mobileSignIn}>
                Sign In
              </Button>
            </Link>
          )}
          
          <button
            className={styles.mobileThemeToggle}
            onClick={toggleTheme}
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      )}
    </nav>
  );
}
