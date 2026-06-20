import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

const jobListings = [
  { id: 1, title: 'Software Developer', company: 'Tech Corp', location: 'Manila', type: 'Full-time', salary: '₱35,000 - ₱50,000', posted: '2 days ago' },
  { id: 2, title: 'Customer Service Rep', company: 'BPO Solutions', location: 'Cebu', type: 'Full-time', salary: '₱18,000 - ₱25,000', posted: '1 day ago' },
  { id: 3, title: 'Marketing Specialist', company: 'Brand Agency', location: 'Davao', type: 'Part-time', salary: '₱20,000 - ₱30,000', posted: '3 days ago' },
  { id: 4, title: 'Accounting Staff', company: 'Finance Corp', location: 'Manila', type: 'Full-time', salary: '₱22,000 - ₱28,000', posted: '5 days ago' },
  { id: 5, title: 'Web Designer', company: 'Creative Studio', location: 'Remote', type: 'Contract', salary: '₱30,000 - ₱40,000', posted: '1 week ago' },
  { id: 6, title: 'HR Assistant', company: 'PeopleFirst', location: 'Quezon City', type: 'Full-time', salary: '₱20,000 - ₱26,000', posted: '4 days ago' },
];

export default function JobsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

  const filtered = jobListings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
                         job.company.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || job.type === filter || (filter === 'Remote' && job.location === 'Remote');
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Find Jobs</ThemedText>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search job title or company..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}>
              <ThemedText style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Job List */}
        <View style={styles.listContainer}>
          <ThemedText style={styles.resultCount}>{filtered.length} jobs found</ThemedText>
          {filtered.map(job => (
            <TouchableOpacity key={job.id} style={styles.jobCard}>
              <ThemedView style={styles.jobCardInner}>
                <View style={styles.jobHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.jobTitle}>{job.title}</ThemedText>
                  <ThemedView style={styles.typeBadge}>
                    <ThemedText style={styles.typeText}>{job.type}</ThemedText>
                  </ThemedView>
                </View>
                <ThemedText style={styles.jobCompany}>{job.company}</ThemedText>
                <View style={styles.jobMeta}>
                  <ThemedText style={styles.jobMetaText}>📍 {job.location}</ThemedText>
                  <ThemedText style={styles.jobMetaText}>🕐 {job.posted}</ThemedText>
                </View>
                <ThemedText style={styles.jobSalary}>{job.salary}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3A3A3C',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  resultCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    fontWeight: '500',
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 11,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  jobCompany: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  jobMetaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  jobSalary: {
    fontSize: 14,
    color: '#0a7ea4',
    marginTop: 8,
    fontWeight: '700',
  },
});
