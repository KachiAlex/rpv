import { Dimensions, ScaledSize } from 'react-native';

export interface ScreenDimensions {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmallPhone: boolean;
  isMediumPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;
}

export const getScreenDimensions = (): ScreenDimensions => {
  const { width, height } = Dimensions.get('window');
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Screen size categories
  const isSmallPhone = width < 375; // iPhone SE, etc.
  const isMediumPhone = width >= 375 && width < 414; // iPhone 12, 13
  const isLargePhone = width >= 414 && width < 600; // iPhone 14 Pro Max, etc.
  const isTablet = width >= 600; // iPad, large tablets

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isSmallPhone,
    isMediumPhone,
    isLargePhone,
    isTablet,
  };
};

export const responsiveSize = (
  smallPhone: number,
  mediumPhone: number,
  largePhone: number,
  tablet: number
): number => {
  const screen = getScreenDimensions();

  if (screen.isSmallPhone) return smallPhone;
  if (screen.isMediumPhone) return mediumPhone;
  if (screen.isLargePhone) return largePhone;
  return tablet;
};

export const responsiveFontSize = (
  smallPhone: number,
  mediumPhone: number,
  largePhone: number,
  tablet: number
): number => {
  return responsiveSize(smallPhone, mediumPhone, largePhone, tablet);
};

export const responsivePadding = (
  smallPhone: number,
  mediumPhone: number,
  largePhone: number,
  tablet: number
): number => {
  return responsiveSize(smallPhone, mediumPhone, largePhone, tablet);
};

export const responsiveMargin = (
  smallPhone: number,
  mediumPhone: number,
  largePhone: number,
  tablet: number
): number => {
  return responsiveSize(smallPhone, mediumPhone, largePhone, tablet);
};

// Common responsive values
export const RESPONSIVE_PADDING = {
  xs: responsivePadding(4, 6, 8, 12),
  sm: responsivePadding(8, 10, 12, 16),
  md: responsivePadding(12, 14, 16, 20),
  lg: responsivePadding(16, 18, 20, 24),
  xl: responsivePadding(20, 22, 24, 32),
};

export const RESPONSIVE_FONT_SIZE = {
  xs: responsiveFontSize(10, 11, 12, 13),
  sm: responsiveFontSize(12, 13, 14, 15),
  md: responsiveFontSize(14, 15, 16, 17),
  lg: responsiveFontSize(16, 17, 18, 20),
  xl: responsiveFontSize(18, 20, 22, 24),
  xxl: responsiveFontSize(24, 26, 28, 32),
};

export const RESPONSIVE_SPACING = {
  xs: responsiveMargin(2, 3, 4, 6),
  sm: responsiveMargin(4, 6, 8, 12),
  md: responsiveMargin(8, 10, 12, 16),
  lg: responsiveMargin(12, 14, 16, 20),
  xl: responsiveMargin(16, 18, 20, 24),
};

// Safe area and orientation utilities
export const getSafeAreaPadding = (
  top: number = 0,
  bottom: number = 0,
  left: number = 0,
  right: number = 0
) => ({
  paddingTop: top,
  paddingBottom: bottom,
  paddingLeft: left,
  paddingRight: right,
});

export const getOrientationStyles = (isPortrait: boolean) => ({
  isPortrait,
  isLandscape: !isPortrait,
  maxWidth: isPortrait ? '100%' : '50%',
});
