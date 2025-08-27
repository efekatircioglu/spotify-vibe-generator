'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

export default function Sidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto-close sidebar on mobile by default
      if (window.innerWidth <= 768) {
        setIsOpen(false);
        if (onToggle) onToggle(false); // Notify parent that sidebar is closed
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent component about initial closed state
  useEffect(() => {
    if (onToggle) {
      onToggle(false); // Notify parent that sidebar starts closed
    }
  }, [onToggle]);

  // Navigation items
  const navItems = [
    { label: 'Dashboard', path: '/', icon: '🏠' },
    { label: 'Last 4 Weeks', path: '/last-4-weeks', icon: '🎵' },
    { label: 'Last 6 Months', path: '/last-6-months', icon: '🎵' },
    { label: 'Last 12 Months', path: '/last-12-months', icon: '🎵' },
    { label: 'Concerts', path: '/concerts', icon: '🎭' },
  ];

  // Check if current path is active
  const isActivePath = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Handle search (placeholder for now)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Search for:', searchQuery);
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    router.push(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsOpen(false);
      if (onToggle) onToggle(false); // Notify parent that sidebar is closed
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    // Notify parent component about sidebar state
    if (onToggle) {
      onToggle(newState); // true when open, false when closed
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${isMobile ? styles.mobile : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎵</span>
            <span className={styles.logoText}>Vibe Gen</span>
          </div>
          <button 
            className={styles.toggleButton}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </form>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`${styles.navItem} ${isActivePath(item.path) ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.footerButton}>
            <span className={styles.footerIcon}>⚙️</span>
            <span className={styles.footerLabel}>Settings</span>
          </button>
          <button className={styles.footerButton}>
            <span className={styles.footerIcon}>❓</span>
            <span className={styles.footerLabel}>Help</span>
          </button>
        </div>
      </div>

      {/* Toggle button (when sidebar is closed) - shown on both mobile and desktop */}
      {!isOpen && (
        <button 
          className={styles.mobileToggle}
          onClick={() => setIsOpen(true)}
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}
    </>
  );
}
