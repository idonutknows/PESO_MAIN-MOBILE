import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, Image, RefreshControl, AppState } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Job {
  id: number;
  job_title: string;
  description: string;
  salary_range: string | null;
  employment_type: string;
  hiring_status: string;
  skills?: string[];
  barangay_name?: string | null;
  days_ago?: number | null;
}

interface Establishment {
  id: number;
  company_name: string;
  address: string | null;
  contact_person: string;
  industry_category: string | null;
  logo: string | null;
  barangay: { barangay_name: string } | null;
  jobs: Job[];
  available_jobs_count: number;
}

function getLogoUrl(est: Establishment): string | null {
  if (!est.logo) return null;
  if (est.logo.startsWith('http')) return est.logo;
  return `${API_BASE_URL}/storage/${est.logo}`;
}

export default function JobsScreen() {
  const { token } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetching = useRef(false);

  const filters = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote'];

  const fetchEstablishments = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setFetchError(null);
    try {
      const res = await fetch(API_ENDPOINTS.establishments, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 401) {
        setFetchError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      let data = null;
      if (Array.isArray(json)) {
        data = json;
      } else if (json.data && Array.isArray(json.data)) {
        data = json.data;
      } else if (json.establishments && Array.isArray(json.establishments)) {
        data = json.establishments;
      } else if (json.locations && Array.isArray(json.locations)) {
        data = json.locations;
      } else if (json.success && json.data) {
        data = json.data;
      }
      if (data && Array.isArray(data)) {
        setEstablishments(data);
        setLastUpdated(new Date());
      } else {
        console.warn('Unexpected API response format:', json);
        setFetchError('Unexpected data format from server.');
      }
    } catch (err: any) {
      console.error('Failed to fetch establishments', err.message || err);
      setFetchError(err.message || 'Failed to load data. Check your connection.');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [token]);

  useEffect(() => {
    fetchEstablishments();
    pollRef.current = setInterval(fetchEstablishments, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchEstablishments]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') fetchEstablishments();
    });
    return () => sub.remove();
  }, [fetchEstablishments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEstablishments();
    setRefreshing(false);
  }, [fetchEstablishments]);

  const filtered = establishments.filter(est => {
    if (est.available_jobs_count === 0) return false;
    const jobsList = Array.isArray(est.jobs) ? est.jobs : [];
    if (search) {
      const q = search.toLowerCase();
      const matchesEst = est.company_name.toLowerCase().includes(q) ||
        (est.industry_category || '').toLowerCase().includes(q);
      const matchesJob = jobsList.some(j =>
        j.job_title.toLowerCase().includes(q)
      );
      if (!matchesEst && !matchesJob) return false;
    }
    if (filter !== 'All') {
      const hasMatchingJob = jobsList.some(j =>
        j.employment_type === filter
      );
      if (!hasMatchingJob) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Hiring Establishments</ThemedText>
        <ThemedText style={styles.headerSub}>{filtered.length} actively hiring</ThemedText>
        {lastUpdated && (
          <ThemedText style={styles.lastUpdated}>
            Updated {lastUpdated.toLocaleTimeString()}
          </ThemedText>
        )}
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a7ea4']} />}
      >
        {fetchError && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{fetchError}</ThemedText>
          </View>
        )}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search company or job..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={setSearch}
          />
        </View>

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

        <View style={styles.listContainer}>
          <ThemedText style={styles.resultCount}>{filtered.length} establishments found</ThemedText>
          {filtered.map(est => {
            const jobsList = Array.isArray(est.jobs) ? est.jobs : [];
            const previewJobs = jobsList.slice(0, 3);
            const logoUri = getLogoUrl(est);
            const estLocation = est.barangay?.barangay_name || '';

            return (
              <TouchableOpacity
                key={est.id}
                style={styles.estCard}
                onPress={() => router.push({ pathname: '/establishment/[id]', params: { id: String(est.id) } })}
                activeOpacity={0.7}
              >
                <ThemedView style={styles.estCardInner}>
                  <View style={styles.estHeader}>
                    <View style={styles.estIcon}>
                      {logoUri ? (
                        <Image source={{ uri: logoUri }} style={styles.estLogoImg} />
                      ) : (
                        <ThemedText style={styles.estIconText}>
                          {est.company_name.charAt(0).toUpperCase()}
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.estInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.estName}>{est.company_name}</ThemedText>
                      <ThemedText style={styles.estMeta}>
                        {est.industry_category || 'General'}
                        {estLocation ? ` · ${estLocation}` : ''}
                      </ThemedText>
                    </View>
                    <View style={styles.jobCountBadge}>
                      <ThemedText style={styles.jobCountText}>{est.available_jobs_count}</ThemedText>
                    </View>
                  </View>

                  {previewJobs.length > 0 && (
                    <View style={styles.jobPreviewSection}>
                      {previewJobs.map((job, idx) => (
                        <View key={job.id} style={[styles.jobPreviewRow, idx < previewJobs.length - 1 && styles.jobPreviewBorder]}>
                          <View style={styles.jobPreviewDot} />
                          <View style={styles.jobPreviewInfo}>
                            <ThemedText style={styles.jobPreviewTitle} numberOfLines={1}>{job.job_title}</ThemedText>
                            {job.salary_range && (
                              <ThemedText style={styles.jobPreviewMeta} numberOfLines={1}>
                                {job.salary_range}
                              </ThemedText>
                            )}
                          </View>
                          <View style={styles.jobTypeChip}>
                            <ThemedText style={styles.jobTypeChipText}>{job.employment_type}</ThemedText>
                          </View>
                        </View>
                      ))}
                      {est.available_jobs_count > 3 && (
                        <ThemedText style={styles.moreJobsText}>
                          +{est.available_jobs_count - 3} more job{est.available_jobs_count - 3 > 1 ? 's' : ''}
                        </ThemedText>
                      )}
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.viewApplyBtn}
                    onPress={() => router.push({ pathname: '/establishment/[id]', params: { id: String(est.id) } })}
                  >
                        <ThemedText style={styles.viewApplyText}>View Apply</ThemedText>
                  </TouchableOpacity>

                </ThemedView>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyIcon}>🏢</ThemedText>
              <ThemedText style={styles.emptyTitle}>
                {establishments.length === 0
                  ? 'No establishments yet'
                  : 'No actively hiring found'}
              </ThemedText>
              <ThemedText style={styles.emptyText}>
                {establishments.length === 0
                  ? 'Check back later for new job openings from establishments.'
                  : 'All establishments have no open positions right now. Pull down to refresh.'}
              </ThemedText>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  lastUpdated: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
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
  estCard: {
    marginBottom: 12,
  },
  estCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  estHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  estLogoImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  estIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  estInfo: {
    flex: 1,
  },
  estName: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  estMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  jobCountBadge: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  jobCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  jobPreviewSection: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
  },
  jobPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  jobPreviewBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  jobPreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0a7ea4',
    marginRight: 8,
  },
  jobPreviewInfo: {
    flex: 1,
  },
  jobPreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  jobPreviewMeta: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  jobTypeChip: {
    backgroundColor: '#E6F4FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  jobTypeChipText: {
    fontSize: 10,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  viewApplyBtn: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewApplyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  moreJobsText: {
    fontSize: 11,
    color: '#0a7ea4',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  tapHintText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
