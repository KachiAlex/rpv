import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

// Mirrors the web splash screen (components/splash-screen.tsx):
// white bg, pulsing logo, "RPV Bible" + "STUDY & PROJECTION",
// red progress bar filling over 2.7s, then a 0.3s fade-out.
const SHOW_MS = 2700;
const FADE_MS = 300;

export function SplashScreen({ children }: { children: React.ReactNode }): React.ReactElement {
  const [visible, setVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: SHOW_MS,
      useNativeDriver: true,
    }).start();

    const fadeTimer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() =>
        setVisible(false)
      );
    }, SHOW_MS);

    return () => clearTimeout(fadeTimer);
  }, [fade, pulse, progress]);

  const barTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 0],
  });

  return (
    <View style={styles.root}>
      {children}
      {visible && (
        <Animated.View style={[styles.splash, { opacity: fade }]}>
          <StatusBar style="dark" />
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>RPV Bible</Text>
            <Text style={styles.subtitle}>STUDY &amp; PROJECTION</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, { transform: [{ translateX: barTranslate }] }]} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: { width: 112, height: 112 },
  textWrap: { alignItems: 'center', marginTop: 24, gap: 8 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#12193a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  track: {
    marginTop: 16,
    height: 4,
    width: 160,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    width: '100%',
    backgroundColor: '#d93a4e',
    borderRadius: 999,
  },
});
