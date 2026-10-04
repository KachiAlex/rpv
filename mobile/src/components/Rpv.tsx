import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function RpvCard({ children, style }: CardProps): React.ReactElement {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

interface PillProps {
  children: React.ReactNode;
  variant?: 'red' | 'navy';
}

export function Pill({ children, variant = 'navy' }: PillProps): React.ReactElement {
  return (
    <View style={[styles.pill, variant === 'red' ? styles.pillRed : styles.pillNavy]}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function RedButton({ title, onPress, icon, disabled, loading, style }: ButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.btnRed, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <MaterialCommunityIcons name={icon} size={16} color={colors.white} /> : null}
          <Text style={styles.btnRedText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress, icon, disabled, style }: ButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.btnOutline, disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={styles.btnInnerSpace}>
        <View style={styles.btnInner}>
          {icon ? <MaterialCommunityIcons name={icon} size={16} color={colors.navy800} /> : null}
          <Text style={styles.btnOutlineText}>{title}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.inkFaint} />
      </View>
    </TouchableOpacity>
  );
}

interface SectionHeadProps {
  title: string;
  subtitle?: string;
}

export function SectionHead({ title, subtitle }: SectionHeadProps): React.ReactElement {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }): React.ReactElement {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={colors.red600} />
      {label ? <Text style={styles.loadingText}>{label}</Text> : null}
    </View>
  );
}

interface EmptyProps {
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  message: string;
}

export function Empty({ icon = 'bookmark-outline', message }: EmptyProps): React.ReactElement {
  return (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name={icon} size={44} color={colors.inkFaint} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.inkFaint,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  pillRed: {
    backgroundColor: colors.red600,
  },
  pillNavy: {
    backgroundColor: colors.navy700,
  },
  pillText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnRed: {
    backgroundColor: colors.red600,
    borderRadius: radius.input,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  btnRedText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  btnOutlineText: {
    color: colors.navy800,
    fontWeight: '600',
    fontSize: 14,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnInnerSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sectionHead: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 13,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.inkSoft,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export const textStyles = StyleSheet.create({
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 34,
  } as TextStyle,
  body: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 21,
  },
});
