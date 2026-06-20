import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, hasJobSeekerProfile } = useAuth();
  const router = useRouter();

  const stats = [
    { label: 'Applied', value: '12', color: '#0a7ea4', bg: '#E6F4FE' },
    { label: 'Interviews', value: '3', color: '#34C759', bg: '#E8F5E9' },
    { label: 'Saved', value: '8', color: '#FF9500', bg: '#FFF3E0' },
  ];

  const recentJobs = [
    { title: 'Software Developer', company: 'Tech Corp', location: 'Manila', salary: '₱35,000 - ₱50,000' },
    { title: 'Graphic Designer', company: 'Creative Studio', location: 'Cebu', salary: '₱25,000 - ₱35,000' },
    { title: 'Data Analyst', company: 'Data Solutions', location: 'Davao', salary: '₱30,000 - ₱45,000' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] || 'Job Seeker'}!
            </ThemedText>
            <ThemedText style={styles.subGreeting}>Find your dream job today</ThemedText>
          </View>
          <View style={styles.headerLogo}>
            <ThemedText style={styles.headerLogoText}>PESO</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <ThemedView key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <ThemedText style={[styles.statValue, { color: stat.color }]}>{stat.value}</ThemedText>
            </View>
            <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
          </ThemedView>
        ))}
      </View>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsRow}>
          {!hasJobSeekerProfile && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/peso-registration')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E6F4FE' }]}>
                <ThemedText style={{ color: '#0a7ea4', fontSize: 22 }}>📋</ThemedText>
              </View>
              <ThemedText style={styles.actionLabel}>PESO Register</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <ThemedText style={{ color: '#34C759', fontSize: 22 }}>📄</ThemedText>
            </View>
            <ThemedText style={styles.actionLabel}>My Resume</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <ThemedText style={{ color: '#FF9500', fontSize: 22 }}>⭐</ThemedText>
            </View>
            <ThemedText style={styles.actionLabel}>Saved Jobs</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Recent Jobs */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Job Postings</ThemedText>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        {recentJobs.map((job, index) => (
          <TouchableOpacity key={index} style={styles.jobCard}>
            <View style={styles.jobCardInner}>
              <View style={styles.jobHeader}>
                <View style={styles.jobDot} />
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={styles.jobTitle}>{job.title}</ThemedText>
                  <ThemedText style={styles.jobCompany}>{job.company}</ThemedText>
                </View>
              </View>
              <View style={styles.jobMeta}>
                <ThemedText style={styles.jobLocation}>📍 {job.location}</ThemedText>
                <ThemedText style={styles.jobSalary}>{job.salary}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#0a7ea4',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
  },
  subGreeting: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    marginTop: 4,
  },
  headerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAll: {
    color: '#0a7ea4',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3A3A3C',
    textAlign: 'center',
  },
  jobCard: {
    marginBottom: 10,
  },
  jobCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  jobTitle: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  jobCompany: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  jobLocation: {
    fontSize: 12,
    color: '#8E8E93',
  },
  jobSalary: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '700',
  },
});
