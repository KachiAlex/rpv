import React from 'react';
import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to concatenate class names with clsx
 */
function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface ScreenWrapProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'full' | 'narrow' | 'wide';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

/**
 * ScreenWrap component provides consistent layout container with responsive behavior
 * Implements the layout optimization specifications for proper screen utilization
 */
export function ScreenWrap({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  center = true
}: ScreenWrapProps) {
  const baseClasses = 'w-full box-border';
  
  const variantClasses = {
    default: 'container-responsive', // Uses our custom responsive container
    full: 'w-full max-w-full',
    narrow: 'max-w-4xl mx-auto',
    wide: 'max-w-7xl mx-auto'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-2 lg:px-4 lg:py-2',
    md: 'px-4 py-3 lg:px-6 lg:py-4 xl:px-8 xl:py-6',
    lg: 'px-6 py-4 lg:px-8 lg:py-6 xl:px-12 xl:py-8',
    xl: 'px-8 py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-12'
  };
  
  const centerClasses = center ? 'mx-auto' : '';
  
  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        centerClasses,
        'responsive-transition',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PageWrap - Specialized wrapper for full page layouts
 */
export function PageWrap({ 
  children, 
  className = '',
  withSidebar = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  withSidebar?: boolean;
}) {
  if (withSidebar) {
    return (
      <div className={cn('min-h-screen bg-[#f5f0ec] text-[#2a1b16] w-full overflow-x-hidden', className)}>
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[200px,1fr] xl:grid-cols-[220px,1fr] w-full">
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('min-h-screen bg-[#f5f0ec] text-[#2a1b16] w-full overflow-x-hidden', className)}>
      <ScreenWrap variant="default" padding="lg">
        {children}
      </ScreenWrap>
    </div>
  );
}

/**
 * ContentWrap - For main content areas with consistent spacing
 */
export function ContentWrap({ 
  children, 
  className = '',
  spacing = 'default'
}: { 
  children: React.ReactNode; 
  className?: string;
  spacing?: 'tight' | 'default' | 'loose';
}) {
  const spacingClasses = {
    tight: 'space-y-3',
    default: 'space-y-4 lg:space-y-6',
    loose: 'space-y-6 lg:space-y-8'
  };
  
  return (
    <div className={cn(
      'flex flex-col w-full',
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * CardWrap - Consistent card container with the app's design system
 */
export function CardWrap({ 
  children, 
  className = '',
  variant = 'default',
  interactive = false
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'highlighted' | 'minimal';
  interactive?: boolean;
}) {
  const baseClasses = 'rounded-xl bg-white shadow-lg w-full overflow-hidden';
  
  const variantClasses = {
    default: 'border border-[#d9c4b5] p-3 lg:p-4',
    highlighted: 'border border-[#c9472c] p-3 lg:p-4',
    minimal: 'border border-[#f2e5df] p-2 lg:p-3'
  };
  
  const interactiveClasses = interactive 
    ? 'interactive-card cursor-pointer' 
    : '';
  
  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      interactiveClasses,
      'layout-stable',
      className
    )}>
      {children}
    </div>
  );
}

/**
 * GridWrap - Responsive grid container with consistent spacing
 */
export function GridWrap({ 
  children, 
  className = '',
  columns = 'auto',
  gap = 'md'
}: { 
  children: React.ReactNode; 
  className?: string;
  columns?: 'auto' | '1' | '2' | '3' | '4';
  gap?: 'sm' | 'md' | 'lg';
}) {
  const columnClasses = {
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };
  
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 lg:gap-6',
    lg: 'gap-6 lg:gap-8'
  };
  
  return (
    <div className={cn(
      'grid w-full overflow-x-hidden',
      columnClasses[columns],
      gapClasses[gap],
      'align-stretch', // Ensures equal heights
      className
    )}>
      {children}
    </div>
  );
}