import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { CHART_COLORS } from '@/constants/dashboard';
import type { RecommendedJob } from '@/utils/dashboardAnalytics';

export interface RecommendedJobsProps {
  jobs: RecommendedJob[];
  onPressJob: (job: RecommendedJob) => void;
  onViewAll?: () => void;
}

function matchTone(match: number): { color: string; soft: string; label: string } {
  if (match >= 70) return { color: '#10B981', soft: '#D1FAE5', label: 'Strong match' };
  if (match >= 40) return { color: '#0A7EA4', soft: '#E0F2FE', label: 'Good match' };
  return { color: '#F59E0B', soft: '#FEF3C7', label: 'Possible match' };
}

export default function RecommendedJobs({ jobs, onPressJob, onViewAll }: RecommendedJobsProps) {
  if (!jobs.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="work-off" size={20} color={CHART_COLORS.axis} />
        </View>
        <Text style={styles.emptyTitle}>No recommendations yet</Text>
        <Text style={styles.emptyText}>
          Add your skills and preferred job to your profile so we can match you with live vacancies.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        snapToInterval={252}
        decelerationRate="fast"
      >
        {jobs.map((item) => {
          const tone = matchTone(item.match);
          return (
            <TouchableOpacity
              key={item.job.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => onPressJob(item)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.matchPill, { backgroundColor: tone.soft }]}>
                  <MaterialIcons name="auto-awesome" size={11} color={tone.color} />
                  <Text style={[styles.matchText, { color: tone.color }]}>{item.match}%</Text>
                </View>
                <Text style={styles.matchLabel}>{tone.label}</Text>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {item.job.job_title || 'Open position'}
              </Text>
              <Text style={styles.company} numberOfLines={1}>
                {item.company}
              </Text>

              <View style={styles.metaRow}>
                {item.job.employment_type ? (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="schedule" size={10} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.job.employment_type}
                    </Text>
                  </View>
                ) : null}
                {item.job.salary_range ? (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="payments" size={10} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.job.salary_range}
                    </Text>
                  </View>
                ) : null}
                {item.location ? (
                  <View style={styles.metaChip}>
                    <MaterialIcons name="place" size={10} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.reason} numberOfLines={2}>
                {item.reason}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.viewLink}>View details</Text>
                <MaterialIcons name="arrow-forward" size={14} color={CHART_COLORS.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {onViewAll ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll} style={styles.viewAll}>
          <Text style={styles.viewAllText}>Browse all vacancies</Text>
          <MaterialIcons name="chevron-right" size={16} color={CHART_COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 12,
    paddingRight: 4,
    paddingVertical: 2,
  },
  card: {
    width: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '800',
  },
  matchLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: CHART_COLORS.ink,
    lineHeight: 19,
  },
  company: {
    fontSize: 11,
    fontWeight: '600',
    color: CHART_COLORS.body,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 3,
    paddingHorizontal: 6,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  reason: {
    fontSize: 10,
    color: CHART_COLORS.body,
    lineHeight: 15,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  viewLink: {
    fontSize: 11,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 14,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  emptyText: {
    fontSize: 11,
    color: CHART_COLORS.axis,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 16,
  },
});
