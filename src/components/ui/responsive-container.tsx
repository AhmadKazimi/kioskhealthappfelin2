"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsive, getResponsiveSpacing, getResponsiveGap } from '@/hooks/useResponsive';

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'page' | 'section' | 'card' | 'modal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  allowOverflow?: boolean;
  centerContent?: boolean;
  rtlSupport?: boolean;
}

const ResponsiveContainer = React.forwardRef<HTMLDivElement, ResponsiveContainerProps>(({
  children,
  className,
  variant = 'section',
  size = 'md',
  maxWidth = '7xl',
  allowOverflow = false,
  centerContent = true,
  rtlSupport = true,
  ...props
}, ref) => {
  const { i18n } = useTranslation();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const isArabic = i18n.language === 'ar';

  // Base container classes
  const getBaseClasses = () => {
    const base = ['w-full'];
    
    // Add max width constraint
    if (maxWidth !== 'full') {
      base.push(`max-w-${maxWidth}`);
    }
    
    // Add centering if enabled
    if (centerContent) {
      base.push('mx-auto');
    }
    
    // Add RTL support if enabled
    if (rtlSupport && isArabic) {
      base.push('rtl');
    }
    
    return base.join(' ');
  };

  // Variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'page':
        return cn(
          'min-h-screen flex flex-col',
          getResponsiveSpacing(size),
          !allowOverflow && 'overflow-hidden'
        );
      
      case 'section':
        return cn(
          'flex flex-col',
          getResponsiveSpacing(size),
          !allowOverflow && 'overflow-hidden'
        );
      
      case 'card':
        return cn(
          'bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg',
          getResponsiveSpacing(size),
          !allowOverflow && 'overflow-hidden'
        );
      
      case 'modal':
        return cn(
          'bg-white rounded-xl sm:rounded-2xl shadow-2xl',
          'max-h-[90vh]',
          getResponsiveSpacing(size),
          'overflow-y-auto overflow-x-hidden'
        );
      
      default:
        return getResponsiveSpacing(size);
    }
  };

  // Responsive behavior classes
  const getResponsiveClasses = () => {
    const classes: string[] = [];
    
    if (isMobile) {
      classes.push('mobile-container');
    } else if (isTablet) {
      classes.push('tablet-container');
    } else if (isDesktop) {
      classes.push('desktop-container');
    } else {
      classes.push('large-container');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={ref}
      className={cn(
        getBaseClasses(),
        getVariantClasses(),
        getResponsiveClasses(),
        className
      )}
      dir={rtlSupport && isArabic ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = "ResponsiveContainer";

// Responsive Grid Component
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rtlSupport?: boolean;
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = 'md',
  rtlSupport = true,
  ...props
}, ref) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getGridClasses = () => {
    const classes: string[] = ['grid'];
    
    if (cols.mobile) classes.push(`grid-cols-${cols.mobile}`);
    if (cols.tablet) classes.push(`md:grid-cols-${cols.tablet}`);
    if (cols.desktop) classes.push(`lg:grid-cols-${cols.desktop}`);
    if (cols.large) classes.push(`xl:grid-cols-${cols.large}`);
    
    classes.push(getResponsiveGap(gap));
    
    if (rtlSupport && isArabic) {
      classes.push('rtl');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={ref}
      className={cn(getGridClasses(), className)}
      dir={rtlSupport && isArabic ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveGrid.displayName = "ResponsiveGrid";

// Responsive Flex Component
interface ResponsiveFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  responsive?: boolean;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  rtlSupport?: boolean;
}

const ResponsiveFlex = React.forwardRef<HTMLDivElement, ResponsiveFlexProps>(({
  children,
  className,
  direction = 'col',
  responsive = true,
  gap = 'md',
  align = 'start',
  justify = 'start',
  rtlSupport = true,
  ...props
}, ref) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const getFlexClasses = () => {
    const classes: string[] = ['flex'];
    
    // Direction classes
    if (responsive && direction === 'col') {
      classes.push('flex-col lg:flex-row');
    } else if (responsive && direction === 'row') {
      classes.push('flex-col sm:flex-row');
    } else {
      classes.push(`flex-${direction}`);
    }
    
    // Gap classes
    classes.push(getResponsiveGap(gap));
    
    // Alignment classes
    if (align !== 'start') {
      classes.push(`items-${align}`);
    }
    
    if (justify !== 'start') {
      classes.push(`justify-${justify}`);
    }
    
    // RTL support
    if (rtlSupport && isArabic) {
      classes.push('rtl');
      if (direction === 'row' || (responsive && direction === 'col')) {
        classes.push('flex-row-reverse');
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={ref}
      className={cn(getFlexClasses(), className)}
      dir={rtlSupport && isArabic ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveFlex.displayName = "ResponsiveFlex";

export { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex };
export default ResponsiveContainer;