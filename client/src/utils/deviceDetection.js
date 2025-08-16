import { useState, useEffect } from 'react';

/**
 * Device Detection Utilities
 * 
 * This module provides functions to detect device capabilities and type
 * throughout the application.
 */

/**
 * Check if the current device is mobile
 * @returns {boolean} True if device is mobile, false if desktop
 */
export const isMobileDevice = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check screen width
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check for touch capabilities
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for pointer capabilities (mouse vs touch)
  const hasMouse = window.matchMedia('(pointer: fine)').matches;
  
  // Consider mobile if small screen OR has touch but no mouse
  return isSmallScreen || (hasTouch && !hasMouse);
};

/**
 * Check if the device has touch capabilities
 * @returns {boolean} True if device supports touch
 */
export const hasTouchCapability = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if the device has mouse capabilities
 * @returns {boolean} True if device has fine pointer (mouse)
 */
export const hasMouseCapability = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(pointer: fine)').matches;
};

/**
 * Get device type as a string
 * @returns {string} 'mobile', 'tablet', or 'desktop'
 */
export const getDeviceType = () => {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const width = window.innerWidth;
  const isTouch = hasTouchCapability();
  const hasMouse = hasMouseCapability();

  if (width <= 480) {
    return 'mobile';
  } else if (width <= 1024 && isTouch && !hasMouse) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Check if the device is in portrait orientation
 * @returns {boolean} True if device is in portrait mode
 */
export const isPortrait = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerHeight > window.innerWidth;
};

/**
 * Get screen dimensions
 * @returns {Object} {width, height}
 */
export const getScreenDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Create a hook for device detection (for React components)
 * @returns {Object} Device detection state and functions
 */
export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsMobile(isMobileDevice());
      setDeviceType(getDeviceType());
      setScreenDimensions(getScreenDimensions());
    };

    // Initial check
    updateDeviceInfo();

    // Add event listeners
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return {
    isMobile,
    deviceType,
    screenDimensions,
    isMobileDevice,
    hasTouchCapability,
    hasMouseCapability,
    getDeviceType,
    isPortrait
  };
};
