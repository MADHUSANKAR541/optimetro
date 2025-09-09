'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  FiHome, 
  FiMap, 
  FiCreditCard, 
  FiNavigation, 
  FiBell, 
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiBarChart2,
  FiAlertTriangle,
  FiTool,
  FiTag,
  FiCircle,
  FiTrendingUp,
  FiCalendar,
  FiUsers
} from 'react-icons/fi';
import styles from './Sidebar.module.scss';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const commuterItems: SidebarItem[] = [
  { href: '/commuter/dashboard', label: 'Home', icon: <FiHome /> },
  { href: '/commuter/dashboard/trips', label: 'Trips', icon: <FiMap /> },
  { href: '/commuter/dashboard/tickets', label: 'Tickets', icon: <FiCreditCard /> },
  { href: '/commuter/dashboard/plan', label: 'Plan Trip', icon: <FiNavigation /> },
  { href: '/commuter/dashboard/alerts', label: 'Alerts', icon: <FiBell /> },
  { href: '/commuter/dashboard/settings', label: 'Settings', icon: <FiSettings /> },
];

const adminItems: SidebarItem[] = [
  { href: '/admin/dashboard/tomorrows-plan', label: "Tomorrow's Plan", icon: <FiCalendar /> },
  { href: '/admin/dashboard/induction', label: 'Induction', icon: <FiBarChart2 /> },
  { href: '/admin/dashboard/conflicts', label: 'Conflicts', icon: <FiAlertTriangle /> },
  { href: '/admin/dashboard/maintenance', label: 'Maintenance', icon: <FiTool /> },
  { href: '/admin/dashboard/branding', label: 'Branding', icon: <FiTag /> },
  { href: '/admin/dashboard/stabling', label: 'Stabling', icon: <FiCircle /> },
  { href: '/admin/dashboard/kpi', label: 'KPIs', icon: <FiTrendingUp /> },
  { href: '/admin/dashboard/users', label: 'Users', icon: <FiUsers /> },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const setSidebarWidthVar = (widthPx: number) => {
    document.documentElement.style.setProperty('--sidebar-width', widthPx + 'px');
  };

  // Initialize responsive flags and sidebar width
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    setSidebarWidthVar(mobile ? (isOpen ? 240 : 70) : (isCollapsed ? 80 : 280));
  }, []);

  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handler as EventListener);
    return () => window.removeEventListener('toggle-sidebar', handler as EventListener);
  }, []);

  // Keep CSS var in sync when open state changes on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isMobile) setSidebarWidthVar(isOpen ? 240 : 70);
  }, [isOpen]);

  // Respond to viewport resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarWidthVar(mobile ? (isOpen ? 240 : 70) : (isCollapsed ? 80 : 280));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
      setSidebarWidthVar(70);
    }
  }, [pathname]);

  const items = session?.user && 'role' in session.user && session.user.role === 'admin' ? adminItems : commuterItems;

  const isCollapsedEffective = isMobile ? !isOpen : isCollapsed;

  return (
    <aside className={`${styles.sidebar} ${isCollapsedEffective ? styles.collapsed : ''} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <button
          className={styles.toggleButton}
          onClick={() => {
            // On mobile, toggle drawer open/close; on desktop, collapse width
            if (isMobile) {
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);
              setSidebarWidthVar(nextOpen ? 240 : 70);
            } else {
              const nextCollapsed = !isCollapsed;
              setIsCollapsed(nextCollapsed);
              // Expose width to layout so content can expand to full width
              const width = nextCollapsed ? 80 : 280;
              setSidebarWidthVar(width);
            }
          }}
        >
          {isCollapsedEffective ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  title={isCollapsedEffective ? item.label : undefined}
                  onClick={() => {
                    if (isMobile) {
                      setIsOpen(false);
                      setSidebarWidthVar(70);
                    }
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!isCollapsedEffective && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          {!isCollapsed && (
            <>
              <div className={styles.userAvatar}>
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{session?.user?.name}</div>
                <div className={styles.userRole}>
                  {session?.user && 'role' in session.user && session.user.role === 'admin' ? 'Administrator' : 'Commuter'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
