/**
 * Mobile Layout Consistency Utilities
 * Ensures consistent spacing, patterns, and orientation handling
 */

export interface LayoutSpacingConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface OrientationConfig {
  portrait: {
    width: number;
    height: number;
  };
  landscape: {
    width: number;
    height: number;
  };
}

const MOBILE_SPACING: LayoutSpacingConfig = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

/**
 * Get standardized mobile spacing value
 * @param size - Spacing size key
 * @returns Spacing value in pixels
 */
export function getMobileSpacing(size: keyof LayoutSpacingConfig): number {
  return MOBILE_SPACING[size];
}

/**
 * Get all mobile spacing values
 * @returns Spacing configuration object
 */
export function getAllMobileSpacing(): LayoutSpacingConfig {
  return { ...MOBILE_SPACING };
}

/**
 * Validate element uses consistent spacing
 * @param element - HTML element to validate
 * @returns Validation result
 */
export function validateSpacingConsistency(element: HTMLElement): {
  valid: boolean;
  issues: string[];
  spacingValues: number[];
} {
  const issues: string[] = [];
  const spacingValues: number[] = [];

  const computedStyle = window.getComputedStyle(element);
  const margin = parseFloat(computedStyle.margin);
  const padding = parseFloat(computedStyle.padding);

  spacingValues.push(margin, padding);

  // Check if spacing values are in the standard scale
  const standardValues = Object.values(MOBILE_SPACING);
  const isMarginStandard = standardValues.includes(margin) || margin === 0;
  const isPaddingStandard = standardValues.includes(padding) || padding === 0;

  if (!isMarginStandard) {
    issues.push(`Margin ${margin}px is not in standard spacing scale`);
  }

  if (!isPaddingStandard) {
    issues.push(`Padding ${padding}px is not in standard spacing scale`);
  }

  return {
    valid: issues.length === 0,
    issues,
    spacingValues,
  };
}

/**
 * Get current device orientation
 * @returns 'portrait' or 'landscape'
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';

  if (window.matchMedia('(orientation: portrait)').matches) {
    return 'portrait';
  }
  return 'landscape';
}

/**
 * Check if device is in portrait orientation
 * @returns true if portrait
 */
export function isPortrait(): boolean {
  return getDeviceOrientation() === 'portrait';
}

/**
 * Check if device is in landscape orientation
 * @returns true if landscape
 */
export function isLandscape(): boolean {
  return getDeviceOrientation() === 'landscape';
}

/**
 * Listen for orientation changes
 * @param callback - Function to call when orientation changes
 * @returns Function to remove listener
 */
export function onOrientationChange(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOrientationChange = () => {
    callback(getDeviceOrientation());
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}

/**
 * Get layout configuration for current orientation
 * @returns Layout configuration object
 */
export function getOrientationLayout(): OrientationConfig {
  if (typeof window === 'undefined') {
    return {
      portrait: { width: 320, height: 640 },
      landscape: { width: 640, height: 320 },
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    portrait: { width: Math.min(width, height), height: Math.max(width, height) },
    landscape: { width: Math.max(width, height), height: Math.min(width, height) },
  };
}

/**
 * Validate layout consistency across orientations
 * @param element - HTML element to validate
 * @returns Validation result
 */
export function validateOrientationConsistency(element: HTMLElement): {
  valid: boolean;
  issues: string[];
  currentOrientation: 'portrait' | 'landscape';
} {
  const issues: string[] = [];
  const currentOrientation = getDeviceOrientation();

  const computedStyle = window.getComputedStyle(element);
  const width = parseFloat(computedStyle.width);
  const height = parseFloat(computedStyle.height);

  // Check if element respects viewport constraints
  if (width > window.innerWidth) {
    issues.push(`Element width ${width}px exceeds viewport width ${window.innerWidth}px`);
  }

  if (height > window.innerHeight) {
    issues.push(`Element height ${height}px exceeds viewport height ${window.innerHeight}px`);
  }

  return {
    valid: issues.length === 0,
    issues,
    currentOrientation,
  };
}

/**
 * Get safe area insets (for notched devices)
 * @returns Safe area insets in pixels
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    top: parseFloat(style.getPropertyValue('--safe-area-inset-top')) || 0,
    right: parseFloat(style.getPropertyValue('--safe-area-inset-right')) || 0,
    bottom: parseFloat(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
    left: parseFloat(style.getPropertyValue('--safe-area-inset-left')) || 0,
  };
}

/**
 * Validate mobile container pattern
 * @param element - HTML element to validate
 * @returns Validation result
 */
export function validateMobileContainerPattern(element: HTMLElement): {
  valid: boolean;
  issues: string[];
  hasProperPadding: boolean;
  hasProperMargin: boolean;
} {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  const paddingLeft = parseFloat(computedStyle.paddingLeft);
  const paddingRight = parseFloat(computedStyle.paddingRight);
  const marginLeft = parseFloat(computedStyle.marginLeft);
  const marginRight = parseFloat(computedStyle.marginRight);

  // Mobile containers should have symmetric padding/margin
  const hasProperPadding = paddingLeft === paddingRight && paddingLeft >= 16;
  const hasProperMargin = marginLeft === marginRight;

  if (!hasProperPadding) {
    issues.push('Container padding is not symmetric or below 16px minimum');
  }

  if (!hasProperMargin) {
    issues.push('Container margin is not symmetric');
  }

  return {
    valid: issues.length === 0,
    issues,
    hasProperPadding,
    hasProperMargin,
  };
}

/**
 * Validate mobile card pattern
 * @param element - HTML element to validate
 * @returns Validation result
 */
export function validateMobileCardPattern(element: HTMLElement): {
  valid: boolean;
  issues: string[];
  hasProperSpacing: boolean;
  hasProperBorder: boolean;
} {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  const padding = parseFloat(computedStyle.padding);
  const borderRadius = computedStyle.borderRadius;

  // Mobile cards should have proper padding
  const hasProperSpacing = padding >= 12;

  // Mobile cards should have rounded corners
  const hasProperBorder = borderRadius !== '0px' && borderRadius !== 'none';

  if (!hasProperSpacing) {
    issues.push(`Card padding ${padding}px is below 12px minimum`);
  }

  if (!hasProperBorder) {
    issues.push('Card does not have rounded corners');
  }

  return {
    valid: issues.length === 0,
    issues,
    hasProperSpacing,
    hasProperBorder,
  };
}
