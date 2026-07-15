import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { getScreenDimensions, ScreenDimensions } from '../utils/responsive';

export const useResponsive = (): ScreenDimensions => {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(getScreenDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(getScreenDimensions());
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

export const useOrientation = (): 'portrait' | 'landscape' => {
  const { isPortrait } = useResponsive();
  return isPortrait ? 'portrait' : 'landscape';
};

export const useScreenSize = (): 'small' | 'medium' | 'large' | 'tablet' => {
  const { isSmallPhone, isMediumPhone, isLargePhone, isTablet } = useResponsive();

  if (isSmallPhone) return 'small';
  if (isMediumPhone) return 'medium';
  if (isLargePhone) return 'large';
  return 'tablet';
};
