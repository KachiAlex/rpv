/**
 * Mobile Typography Optimization Utilities
 * Ensures optimal readability on mobile devices
 */

export interface TypographyConfig {
  minFontSize?: number;
  maxFontSize?: number;
  minLineHeight?: number;
  maxLineHeight?: number;
  optimalLineLength?: number;
}

const DEFAULT_CONFIG: TypographyConfig = {
  minFontSize: 16, // iOS minimum to prevent zoom
  maxFontSize: 18,
  minLineHeight: 1.5,
  maxLineHeight: 1.8,
  optimalLineLength: 65, // characters per line
};

/**
 * Calculate responsive font size based on viewport width
 * @param baseSize - Base font size in pixels
 * @param minViewport - Minimum viewport width
 * @param maxViewport - Maximum viewport width
 * @param minSize - Minimum font size
 * @param maxSize - Maximum font size
 * @returns Calculated font size
 */
export function calculateResponsiveFontSize(
  baseSize: number,
  minViewport: number = 320,
  maxViewport: number = 1440,
  minSize: number = 14,
  maxSize: number = 24
): number {
  if (typeof window === 'undefined') return baseSize;

  const viewportWidth = window.innerWidth;
  const scale = (viewportWidth - minViewport) / (maxViewport - minViewport);
  const clampedScale = Math.max(0, Math.min(1, scale));
  return minSize + (maxSize - minSize) * clampedScale;
}

/**
 * Validate typography meets mobile readability standards
 * @param element - HTML element to validate
 * @param config - Typography configuration
 * @returns Validation result with issues
 */
export function validateMobileTypography(
  element: HTMLElement,
  config: TypographyConfig = DEFAULT_CONFIG
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  // Check font size
  const fontSize = parseFloat(computedStyle.fontSize);
  if (fontSize < (config.minFontSize || 16)) {
    issues.push(`Font size ${fontSize}px is below minimum ${config.minFontSize}px`);
  }

  // Check line height
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const lineHeightRatio = lineHeight / fontSize;
  if (lineHeightRatio < (config.minLineHeight || 1.5)) {
    issues.push(`Line height ratio ${lineHeightRatio} is below minimum ${config.minLineHeight}`);
  }

  // Check line length (character count)
  const textContent = element.textContent || '';
  const charCount = textContent.split('\n')[0]?.length || 0;
  if (charCount > (config.optimalLineLength || 65) * 1.5) {
    issues.push(`Line length ${charCount} characters exceeds optimal range`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get optimal line length in pixels based on font size
 * @param fontSize - Font size in pixels
 * @param avgCharWidth - Average character width (default: 0.5 * fontSize)
 * @returns Optimal line length in pixels
 */
export function getOptimalLineLength(
  fontSize: number,
  avgCharWidth: number = fontSize * 0.5
): number {
  const optimalCharCount = 65; // 45-75 is optimal range
  return optimalCharCount * avgCharWidth;
}

/**
 * Calculate letter spacing for improved readability
 * @param fontSize - Font size in pixels
 * @returns Recommended letter spacing in em units
 */
export function calculateLetterSpacing(fontSize: number): number {
  // Tighter spacing for smaller fonts, looser for larger
  if (fontSize < 14) return 0.05;
  if (fontSize < 16) return 0.03;
  if (fontSize < 20) return 0.02;
  return 0.01;
}

/**
 * Check color contrast ratio (WCAG AA compliance)
 * @param foreground - Foreground color (hex or rgb)
 * @param background - Background color (hex or rgb)
 * @returns Contrast ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgLum = getRelativeLuminance(foreground);
  const bgLum = getRelativeLuminance(background);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance for color
 * @param color - Color in hex or rgb format
 * @returns Relative luminance value
 */
function getRelativeLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB array
 * @param color - Color in hex or rgb format
 * @returns RGB array or null
 */
function parseColor(color: string): number[] | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  // Handle rgb colors
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }

  return null;
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param contrastRatio - Contrast ratio value
 * @param largeText - Whether text is large (18px+ or 14px+ bold)
 * @returns true if meets WCAG AA standard
 */
export function meetsWCAGAA(contrastRatio: number, largeText: boolean = false): boolean {
  return largeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

/**
 * Validate mobile content readability
 * @param element - HTML element to validate
 * @returns Validation result
 */
export function validateMobileReadability(element: HTMLElement): {
  valid: boolean;
  issues: string[];
  metrics: {
    fontSize: number;
    lineHeight: number;
    lineLength: number;
    contrastRatio: number;
  };
} {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  const fontSize = parseFloat(computedStyle.fontSize);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;

  // Check font size
  if (fontSize < 16) {
    issues.push(`Font size ${fontSize}px is below 16px minimum for mobile`);
  }

  // Check line height
  const lineHeightRatio = lineHeight / fontSize;
  if (lineHeightRatio < 1.5) {
    issues.push(`Line height ratio ${lineHeightRatio.toFixed(2)} is below 1.5 minimum`);
  }

  // Check contrast
  const contrastRatio = getContrastRatio(color, backgroundColor);
  if (!meetsWCAGAA(contrastRatio)) {
    issues.push(`Contrast ratio ${contrastRatio.toFixed(2)} does not meet WCAG AA standard`);
  }

  const textContent = element.textContent || '';
  const lineLength = textContent.split('\n')[0]?.length || 0;

  return {
    valid: issues.length === 0,
    issues,
    metrics: {
      fontSize,
      lineHeight: lineHeightRatio,
      lineLength,
      contrastRatio,
    },
  };
}
