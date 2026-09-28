import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { CHART_COLORS } from '@/constants/dashboard';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  /** Rendered at the top-right — filters, legends, totals. */
  accessory?: ReactNode;
  children: ReactNode;
  style?: object;
}

/** Consistent white card used by every panel in the dashboard. */
export function ChartCard({ title, subtitle, icon, accessory, children, style }: ChartCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            {icon ? (
              <View style={styles.iconWrap}>
                <MaterialIcons name={icon as never} size={15} color={CHART_COLORS.primary} />
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      {children}
    </View>
  );
}

export interface EmptyStateProps {
  message: string;
  hint?: string;
  icon?: string;
  compact?: boolean;
  /** Optional call to action, e.g. "Complete profiling". */
  actionLabel?: string;
  onAction?: () => void;
}

/** Shown whenever the underlying API collection is empty — never a fake chart. */
export function ChartEmptyState({
  message,
  hint,
  icon = 'insights',
  compact,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={[styles.empty, compact ? styles.emptyCompact : null]}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon as never} size={compact ? 18 : 22} color={CHART_COLORS.axis} />
      </View>
      <Text style={styles.emptyText}>{message}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.emptyAction} activeOpacity={0.7} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: CHART_COLORS.ink,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    color: CHART_COLORS.body,
    marginTop: 4,
    lineHeight: 16,
  },
  accessory: {
    alignItems: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyCompact: {
    paddingVertical: 14,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 11,
    color: CHART_COLORS.axis,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 16,
  },
  emptyAction: {
    marginTop: 14,
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
});
