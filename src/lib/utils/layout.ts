/**
 * Layout utilities and responsive configuration for the Bible study application
 */

// Responsive breakpoint configuration
export const BREAKPOINTS = {
  mobile: 0,      // 0-767px
  tablet: 768,    // 768-1023px
  desktop: 1024,  // 1024-1439px
  ultrawide: 1440 // 1440px+
} as const;

// Layout configuration
export interface LayoutConfig {
  containerMaxWidth: string;
  featureGridColumns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  spacing: {
    section: string;
    card: string;
    container: string;
  };
}

export const LAYOUT_CONFIG: LayoutConfig = {
  containerMaxWidth: '1600px', // Maximum width for ultra-wide screens
  featureGridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  spacing: {
    section: '2.5rem',   // 40px
    card: '1rem',        // 16px
    container: '2rem'    // 32px
  }
};

// Layout metrics interface
export interface LayoutMetrics {
  screenWidth: number;
  containerWidth: number;
  availableSpace: number;
  optimalCardWidth: number;
  gridColumns: number;
}

/**
 * Calculate optimal container width based on screen size
 * @param screenWidth - Current screen width in pixels
 * @returns Container width as a percentage or fixed value
 */
export function calculateContainerWidth(screenWidth: number): string {
  if (screenWidth < BREAKPOINTS.tablet) {
    // Mobile: full width with padding
    return '100%';
  } else if (screenWidth < BREAKPOINTS.desktop) {
    // Tablet: 95% width
    return '95%';
  } else if (screenWidth < BREAKPOINTS.ultrawide) {
    // Desktop: 90% width (meets requirement 1.1)
    return '90%';
  } else {
    // Ultra-wide: constrained max width (meets requirement 1.4)
    return LAYOUT_CONFIG.containerMaxWidth;
  }
}

/**
 * Determine the number of grid columns based on screen width
 * @param screenWidth - Current screen width in pixels
 * @returns Number of columns for the feature grid
 */
export function calculateGridColumns(screenWidth: number): number {
  if (screenWidth < BREAKPOINTS.tablet) {
    return LAYOUT_CONFIG.featureGridColumns.mobile;
  } else if (screenWidth < BREAKPOINTS.desktop) {
    return LAYOUT_CONFIG.featureGridColumns.tablet;
  } else {
    return LAYOUT_CONFIG.featureGridColumns.desktop;
  }
}

/**
 * Calculate responsive spacing values
 * @param screenWidth - Current screen width in pixels
 * @param baseSpacing - Base spacing value
 * @returns Scaled spacing value
 */
export function calculateResponsiveSpacing(screenWidth: number, baseSpacing: number): number {
  if (screenWidth < BREAKPOINTS.tablet) {
    return baseSpacing * 0.75; // Smaller spacing on mobile
  } else if (screenWidth < BREAKPOINTS.desktop) {
    return baseSpacing; // Base spacing on tablet
  } else {
    return baseSpacing * 1.25; // Larger spacing on desktop
  }
}

/**
 * Get layout metrics for current screen size
 * @param screenWidth - Current screen width in pixels
 * @returns Complete layout metrics object
 */
export function getLayoutMetrics(screenWidth: number): LayoutMetrics {
  const containerWidthStr = calculateContainerWidth(screenWidth);
  const containerWidth = containerWidthStr.includes('%') 
    ? screenWidth * (parseFloat(containerWidthStr) / 100)
    : parseFloat(containerWidthStr);
  
  const gridColumns = calculateGridColumns(screenWidth);
  const cardSpacing = parseFloat(LAYOUT_CONFIG.spacing.card) * 16; // Convert rem to px
  const availableSpace = containerWidth - (cardSpacing * (gridColumns - 1));
  const optimalCardWidth = availableSpace / gridColumns;

  return {
    screenWidth,
    containerWidth,
    availableSpace,
    optimalCardWidth,
    gridColumns
  };
}

/**
 * Validate that container width meets requirements
 * @param screenWidth - Current screen width in pixels
 * @param containerWidth - Calculated container width in pixels
 * @returns True if requirements are met
 */
export function validateContainerWidth(screenWidth: number, containerWidth: number): boolean {
  if (screenWidth > BREAKPOINTS.desktop) {
    // Requirement 1.1: At least 90% width on screens wider than 1024px
    const minWidth = screenWidth * 0.9;
    if (screenWidth < BREAKPOINTS.ultrawide) {
      return containerWidth >= minWidth;
    } else {
      // Requirement 1.4: Max width constraint on ultra-wide screens
      const maxWidth = parseFloat(LAYOUT_CONFIG.containerMaxWidth);
      return containerWidth <= maxWidth;
    }
  }
  return true;
}

/**
 * CSS custom properties for dynamic spacing
 */
export const CSS_CUSTOM_PROPERTIES = {
  '--layout-container-width': 'var(--layout-container-width)',
  '--layout-section-spacing': 'var(--layout-section-spacing)',
  '--layout-card-spacing': 'var(--layout-card-spacing)',
  '--layout-container-padding': 'var(--layout-container-padding)',
  '--layout-grid-columns': 'var(--layout-grid-columns)'
} as const;

/**
 * Generate CSS custom properties values for current screen size
 * @param screenWidth - Current screen width in pixels
 * @returns Object with CSS custom property values
 */
export function generateCSSProperties(screenWidth: number): Record<string, string> {
  const metrics = getLayoutMetrics(screenWidth);
  const sectionSpacing = calculateResponsiveSpacing(screenWidth, parseFloat(LAYOUT_CONFIG.spacing.section) * 16);
  const cardSpacing = calculateResponsiveSpacing(screenWidth, parseFloat(LAYOUT_CONFIG.spacing.card) * 16);
  const containerPadding = calculateResponsiveSpacing(screenWidth, parseFloat(LAYOUT_CONFIG.spacing.container) * 16);

  return {
    '--layout-container-width': `${metrics.containerWidth}px`,
    '--layout-section-spacing': `${sectionSpacing}px`,
    '--layout-card-spacing': `${cardSpacing}px`,
    '--layout-container-padding': `${containerPadding}px`,
    '--layout-grid-columns': `${metrics.gridColumns}`
  };
}