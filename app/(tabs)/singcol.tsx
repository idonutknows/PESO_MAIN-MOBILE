import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, hasJobSeekerProfile } = useAuth();
  const router = useRouter();


  const PersonalInfo = [
    { title: 'John Wesley Singcol', company: '21 Years Old', location: 'Blk 39 Lot 14 Barra' },
  
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Job Seeker'}!</ThemedText>
        <ThemedText style={styles.subGreeting}></ThemedText>
      </ThemedView>

      
      {/* Recent Jobs */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Personal Info</ThemedText>
        {PersonalInfo.map((name, index) => (
          <TouchableOpacity key={index} style={styles.jobCard}>
            <ThemedView style={styles.jobCardInner}>
              <ThemedText type="defaultSemiBold" style={styles.jobTitle}>{name.title}</ThemedText>
              <ThemedText style={styles.jobCompany}>{name.company} · {name.location}</ThemedText>
            </ThemedView>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: '#ff0000',
    fontSize: 28,
    fontWeight: '700',
  },
  subGreeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 4,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  jobCard: {
    marginBottom: 10,
  },
  jobCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobTitle: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  jobCompany: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  jobSalary: {
    fontSize: 13,
    color: '#0a7ea4',
    marginTop: 6,
    fontWeight: '600',
  },
});
