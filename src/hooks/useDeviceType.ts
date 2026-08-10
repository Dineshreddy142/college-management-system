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
    
    // Check Mobile / Tablet User Agents
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Silk/i;
    const isMobileUA = mobileRegex.test(ua);

    // Touch screen detection
    const hasTouch = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches
    );

    // Screen width check
    const screenWidth = window.innerWidth;
    const isSmallScreen = screenWidth <= 768;

    // A device is considered mobile if user-agent is mobile, or if it has coarse touch & small screen
    const isMobile = isMobileUA || (hasTouch && isSmallScreen);
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
