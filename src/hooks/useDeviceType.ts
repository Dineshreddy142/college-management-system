import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'desktop';
  hasTouch: boolean;
  screenWidth: number;
}

export function useDeviceType(): DeviceInfo {
  const checkDevice = (): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isDesktop: true,
        deviceType: 'desktop',
        hasTouch: false,
        screenWidth: 1024,
      };
    }

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    
    // Check Phone User Agents (excluding Tablets where screen width >= 768px)
    const phoneRegex = /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|mobile/i;
    const isPhoneUA = phoneRegex.test(ua);

    // Touch screen detection
    const hasTouch = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );

    // Screen width check (< 768px for mobile phone viewports)
    const screenWidth = window.innerWidth;
    const isSmallScreen = screenWidth < 768;

    // Mobile smartphone classification (Strictly excludes Tablets, Laptops & Desktops)
    const isMobile = (isPhoneUA || (hasTouch && isSmallScreen)) && screenWidth < 768;
    const isDesktop = !isMobile;

    return {
      isMobile,
      isDesktop,
      deviceType: isMobile ? 'mobile' : 'desktop',
      hasTouch,
      screenWidth,
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(checkDevice);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(checkDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
