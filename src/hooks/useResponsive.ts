"use client";

import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

// Breakpoints matching Tailwind CSS defaults
const BREAKPOINTS = {
  mobile: 0,      // 0px - 767px
  tablet: 768,    // 768px - 1023px  
  desktop: 1024,  // 1024px - 1279px
  large: 1280,    // 1280px+
} as const;

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    isLargeScreen: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
  });

  useEffect(() => {
    const updateState = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < BREAKPOINTS.tablet,
        isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.large,
        isLargeScreen: width >= BREAKPOINTS.large,
        screenWidth: width,
        screenHeight: height,
        orientation: height > width ? 'portrait' : 'landscape',
      });
    };

    // Initial check
    updateState();

    // Add resize listener
    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, []);

  return state;
}

// Utility function to get responsive classes
export function getResponsiveClasses(config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  large?: string;
}): string {
  const classes: string[] = [];
  
  if (config.mobile) classes.push(config.mobile);
  if (config.tablet) classes.push(`md:${config.tablet}`);
  if (config.desktop) classes.push(`lg:${config.desktop}`);
  if (config.large) classes.push(`xl:${config.large}`);
  
  return classes.join(' ');
}

// Utility function for responsive spacing
export function getResponsiveSpacing(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const spacingMap = {
    xs: 'p-1 sm:p-2 md:p-3 lg:p-4',
    sm: 'p-2 sm:p-3 md:p-4 lg:p-6',
    md: 'p-3 sm:p-4 md:p-6 lg:p-8',
    lg: 'p-4 sm:p-6 md:p-8 lg:p-10',
    xl: 'p-6 sm:p-8 md:p-10 lg:p-12',
  };
  
  return spacingMap[size];
}

// Utility function for responsive text sizes
export function getResponsiveText(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'title' = 'md'): string {
  const textMap = {
    xs: 'text-xs sm:text-sm md:text-base',
    sm: 'text-sm sm:text-base md:text-lg',
    md: 'text-base sm:text-lg md:text-xl',
    lg: 'text-lg sm:text-xl md:text-2xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
    title: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl',
  };
  
  return textMap[size];
}

// Utility function for responsive gaps
export function getResponsiveGap(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  const gapMap = {
    xs: 'gap-1 sm:gap-2 md:gap-3',
    sm: 'gap-2 sm:gap-3 md:gap-4',
    md: 'gap-3 sm:gap-4 md:gap-6',
    lg: 'gap-4 sm:gap-6 md:gap-8',
    xl: 'gap-6 sm:gap-8 md:gap-10',
  };
  
  return gapMap[size];
}

// Utility function for responsive container constraints
export function getResponsiveContainer(): string {
  return 'w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8';
}

// Utility function for responsive flexbox
export function getResponsiveFlex(direction: 'row' | 'col' = 'col'): string {
  if (direction === 'col') {
    return 'flex flex-col lg:flex-row'; // Mobile and tablet use column, desktop+ uses row
  }
  return 'flex flex-row';
}

// Utility function for responsive grid
export function getResponsiveGrid(cols: { mobile?: number; tablet?: number; desktop?: number; large?: number }): string {
  const classes: string[] = ['grid'];
  
  if (cols.mobile) classes.push(`grid-cols-${cols.mobile}`);
  if (cols.tablet) classes.push(`md:grid-cols-${cols.tablet}`);
  if (cols.desktop) classes.push(`lg:grid-cols-${cols.desktop}`);
  if (cols.large) classes.push(`xl:grid-cols-${cols.large}`);
  
  return classes.join(' ');
}

export default useResponsive;