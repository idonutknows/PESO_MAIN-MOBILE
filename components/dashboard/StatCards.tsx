import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { STATUS_META, STATUS_ORDER, type ApplicationStatus } from '@/constants/dashboard';
import type { JobSeekerApplication } from '@/utils/dashboardAnalytics';
import { activeApplicationCount, normaliseStatus } from '@/utils/dashboardAnalytics';

export interface StatCardsProps {
  applications: JobSeekerApplication[];
  onPressStatus?: (status: ApplicationStatus | 'Total') => void;
}

interface StatItem {
  key: ApplicationStatus | 'Total';
  label: string;
  value: number;
  color: string;
  soft: string;
  icon: string;
}

export default function StatCards({ applications, onPressStatus }: StatCardsProps) {
  const count = (status: ApplicationStatus) =>
    applications.filter((app) => normaliseStatus(app.status) === status).length;

  const items: StatItem[] = [
    {
      key: 'Total',
      label: 'Total',
      value: applications.length,
      color: '#0A7EA4',
      soft: '#E0F2FE',
      icon: 'inbox',
    },
    ...STATUS_ORDER.map((status) => ({
      key: status,
      label: STATUS_META[status].label,
      value: count(status),
      color: STATUS_META[status].color,
      soft: STATUS_META[status].soft,
      icon: STATUS_META[status].icon,
    })),
  ];

  const active = activeApplicationCount(applications);

  return (
    <View>
      <View style={styles.grid}>
        {items.map((item) => {
          const body = (
            <View style={[styles.card, { backgroundColor: item.soft, borderColor: `${item.color}33` }]}>
              <View style={[styles.icon, { backgroundColor: `${item.color}1F` }]}>
                <MaterialIcons name={item.icon as never} size={16} color={item.color} />
              </View>
              <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
          return onPressStatus ? (
            <TouchableOpacity
              key={item.key}
              style={styles.cell}
              activeOpacity={0.75}
              onPress={() => onPressStatus(item.key)}
            >
              {body}
            </TouchableOpacity>
          ) : (
            <View key={item.key} style={styles.cell}>
              {body}
            </View>
          );
        })}
      </View>
      <Text style={styles.footnote}>
        {active > 0
          ? `${active} application${active === 1 ? '' : 's'} still in progress`
          : applications.length > 0
            ? 'No applications are currently in progress'
            : 'Apply to a vacancy to start tracking progress'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cell: {
    width: '33.333%',
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  footnote: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});
