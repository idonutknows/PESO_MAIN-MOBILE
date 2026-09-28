import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PesoLogo } from '@/components/PesoLogo';
import ActivityChart, { type ActivityMode } from '@/components/dashboard/ActivityChart';
import { ChartCard, ChartEmptyState } from '@/components/dashboard/ChartCard';
import DoughnutChart from '@/components/dashboard/DoughnutChart';
import ProfileCompletionRing from '@/components/dashboard/ProfileCompletionRing';
import RecommendedJobs from '@/components/dashboard/RecommendedJobs';
import SkillsChart from '@/components/dashboard/SkillsChart';
import StatCards from '@/components/dashboard/StatCards';
import { API_ENDPOINTS } from '@/constants/api';
import { CHART_COLORS } from '@/constants/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/notifications';
import {
  profileCompletion,
  recommendJobs,
  responseRate,
  skillsOverview,
  statusBreakdown,
  weeklyActivity,
  type EstablishmentWithJobs,
  type JobSeekerApplication,
  type JobSeekerProfile,
  type RecommendedJob,
  type Vacancy,
} from '@/utils/dashboardAnalytics';

type ArrayPayload<T> = T[] | null;

function pickArray<T>(json: unknown, keys: string[]): ArrayPayload<T> {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === 'object') {
    const record = json as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
    if (record.success && Array.isArray(record.data)) return record.data as T[];
  }
  return null;
}

export default function HomeScreen() {
  const { user, token, verificationStatus, hasJobSeekerProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications(token);
  const { width: screenWidth } = useWindowDimensions();

  const [applications, setApplications] = useState<JobSeekerApplication[]>([]);
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [establishments, setEstablishments] = useState<EstablishmentWithJobs[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activityMode, setActivityMode] = useState<ActivityMode>('bar');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  /** Auth signature that has already been fetched, so the spinner can be derived. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Lazy `useState` keeps the Animated.Values stable without reading refs during
  // render, which the react-hooks/refs rule rejects.
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(24));
  const isFetching = useRef(false);

  const authKey = `${authLoading ? 'loading' : 'ready'}|${token ? 'auth' : 'anon'}|${
    hasJobSeekerProfile ? 'profiled' : 'unprofiled'
  }`;
  const canShowDashboard = !authLoading && Boolean(token) && hasJobSeekerProfile;
  // Derived rather than stored, so no effect has to flip a `loading` flag.
  const showSpinner = canShowDashboard && loadedKey !== authKey;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /**
   * Loads the three collections the dashboard charts. They are independent, so
   * a failure in one (e.g. establishments being down) still leaves the
   * application and profile charts populated; only a total failure surfaces an
   * error banner.
   */
  const loadDashboard = useCallback(async () => {
    if (!token) return;
    if (isFetching.current) return;
    isFetching.current = true;

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const [appsResult, profileResult, estResult] = await Promise.allSettled([
      fetch(API_ENDPOINTS.myApplications, { headers: authHeaders }),
      fetch(API_ENDPOINTS.jobSeekerProfile, { headers: authHeaders }),
      fetch(API_ENDPOINTS.establishments, { headers: authHeaders }),
    ]);

    const errors: string[] = [];

    if (appsResult.status === 'fulfilled' && appsResult.value.ok) {
      try {
        const json = await appsResult.value.json();
        setApplications(pickArray<JobSeekerApplication>(json, ['data', 'applications']) ?? []);
      } catch {
        errors.push('applications');
      }
    } else {
      errors.push('applications');
    }

    if (profileResult.status === 'fulfilled' && profileResult.value.ok) {
      try {
        const json = await profileResult.value.json();
        const record = json as Record<string, unknown> | null;
        const seeker = record?.job_seeker;
        setProfile(
          seeker && typeof seeker === 'object'
            ? (seeker as JobSeekerProfile)
            : Array.isArray(record?.data)
              ? null
              : (record as JobSeekerProfile)
        );
      } catch {
        errors.push('profile');
      }
    } else {
      errors.push('profile');
    }

    if (estResult.status === 'fulfilled' && estResult.value.ok) {
      try {
        const json = await estResult.value.json();
        setEstablishments(
          pickArray<EstablishmentWithJobs>(json, ['data', 'establishments', 'locations']) ?? []
        );
      } catch {
        errors.push('vacancies');
      }
    } else {
      errors.push('vacancies');
    }

    if (errors.length === 3) {
      setFetchError('Cannot load your dashboard. Check your connection and try again.');
    } else {
      setFetchError(null);
      setLastUpdated(new Date());
    }

    setLoadedKey(authKey);
    isFetching.current = false;
  }, [token, authKey]);

  /**
   * Single entry point for loading. `useFocusEffect` re-runs when its deps
   * change, so this covers the initial load, the auth/profile transition, and
   * every time Home regains focus — a status change made in Applications shows
   * up here without a manual reload.
   */
  useFocusEffect(
    useCallback(() => {
      if (canShowDashboard) loadDashboard();
    }, [canShowDashboard, loadDashboard])
  );

  // …and when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && token && hasJobSeekerProfile) loadDashboard();
    });
    return () => sub.remove();
  }, [token, hasJobSeekerProfile, loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  /* ---------------------------------------------------------------- */
  /* Derived analytics                                                 */
  /* ---------------------------------------------------------------- */

  const vacancies = useMemo<Vacancy[]>(
    () => establishments.flatMap((est) => (Array.isArray(est.jobs) ? est.jobs : [])),
    [establishments]
  );

  const slices = useMemo(() => statusBreakdown(applications), [applications]);
  const activity = useMemo(() => weeklyActivity(applications, 8), [applications]);
  const completion = useMemo(() => profileCompletion(profile), [profile]);
  const skills = useMemo(
    () => skillsOverview(profile, vacancies, 6),
    [profile, vacancies]
  );
  const recommendations = useMemo(
    () =>
      recommendJobs(profile, establishments, {
        appliedJobIds: applications
          .map((app) => app.job_id)
          .filter((id): id is number => typeof id === 'number'),
        limit: 4,
      }),
    [profile, establishments, applications]
  );

  const response = useMemo(() => responseRate(applications), [applications]);
  const appliedThisWeek = activity.length ? activity[activity.length - 1].count : 0;
  const openVacancies = vacancies.length;

  const isVerified = verificationStatus === 'approved';
  const firstName = user?.name?.split(' ')[0] || 'Job Seeker';
  const twoColumns = screenWidth >= 600;

  const onOpenJob = useCallback(
    (item: RecommendedJob) => {
      router.push({ pathname: '/establishment/[id]', params: { id: String(item.establishmentId) } });
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0a7ea4']}
            tintColor="#0a7ea4"
          />
        }
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#0a7ea4', '#0891b2', '#06b6d4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextSection}>
                <ThemedText style={styles.greeting}>Hello, {firstName}!</ThemedText>
                <ThemedText style={styles.subGreeting}>
                  Here is how your job search is going.
                </ThemedText>
              </View>
              <View style={styles.heroRightSection}>
                <TouchableOpacity
                  style={styles.notifBellBtn}
                  onPress={() => router.push('/notifications')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="notifications" size={22} color="#ffffff" />
                  {unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <ThemedText style={styles.notifBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                <PesoLogo size={60} variant="hero" showText />
              </View>
            </View>

            <View style={styles.heroDecorCircle1} />
            <View style={styles.heroDecorCircle2} />
          </View>
        </LinearGradient>

        <Animated.View
          style={[
            styles.body,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {showSpinner ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0a7ea4" />
              <ThemedText style={styles.loadingText}>Loading your dashboard…</ThemedText>
            </View>
          ) : (
            <>
              {fetchError ? (
                <View style={styles.errorCard}>
                  <View style={styles.errorIconContainer}>
                    <MaterialIcons name="error-outline" size={26} color="#DC2626" />
                  </View>
                  <ThemedText style={styles.errorText}>{fetchError}</ThemedText>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRefresh}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="refresh" size={17} color="#DC2626" />
                    <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Profiling / verification gates — unchanged behaviour, only the
                  dashboard is new, so these states still come first. */}
              {!hasJobSeekerProfile ? (
                <View style={styles.statusCard}>
                  <View style={[styles.statusIconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialIcons name="person-add" size={30} color="#0a7ea4" />
                  </View>
                  <ThemedText style={styles.statusTitle}>Complete Your Profiling</ThemedText>
                  <ThemedText style={styles.statusText}>
                    Register as a PESO job seeker to access employment opportunities and unlock your
                    progress dashboard.
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/peso-registration')}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#0a7ea4', '#0891b2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButtonGradient}
                    >
                      <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                      <ThemedText style={styles.primaryButtonText}>Start Profiling</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : null}

              {hasJobSeekerProfile && !isVerified ? (
                <View style={[styles.statusCard, styles.pendingCard]}>
                  <View style={[styles.statusIconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialIcons name="hourglass-top" size={30} color="#D97706" />
                  </View>
                  <View style={styles.badgeContainer}>
                    <View style={styles.pendingBadge}>
                      <ThemedText style={styles.pendingBadgeText}>Pending Review</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.statusTitle}>Verification in Progress</ThemedText>
                  <ThemedText style={styles.statusText}>
                    Your profile has been submitted and is awaiting approval from PESO Admin. You
                    will be notified once verified.
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.outlineButton}
                    onPress={() => router.push('/(tabs)/profile')}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="person" size={18} color="#0a7ea4" />
                    <ThemedText style={styles.outlineButtonText}>View Profile</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {canShowDashboard ? (
                <>
                  {/* Summary counters */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderText}>
                        <ThemedText style={styles.sectionTitle}>At a glance</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>
                          {applications.length === 0
                            ? 'Live from your applications'
                            : `${appliedThisWeek} applied this week · ${
                                lastUpdated
                                  ? `updated ${lastUpdated.toLocaleTimeString(undefined, {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}`
                                  : 'just now'
                              }`}
                        </ThemedText>
                      </View>
                    </View>
                    <StatCards
                      applications={applications}
                      onPressStatus={() => router.push('/(tabs)/applications')}
                    />
                  </View>

                  {/* Two-column layout on tablets / wide phones */}
                  <View style={styles.chartGrid}>
                    <View style={[styles.gridCell, twoColumns && styles.gridCellHalf]}>
                      <ChartCard
                        title="Application status"
                        subtitle={`${applications.length} total · ${response}% response rate`}
                        icon="donut-large"
                      >
                        {applications.length === 0 ? (
                          <ChartEmptyState
                            icon="inbox"
                            message="No applications yet"
                            hint="Apply to a vacancy and your status breakdown will appear here."
                            actionLabel="Browse jobs"
                            onAction={() => router.push('/(tabs)/jobs')}
                          />
                        ) : (
                          <DoughnutChart data={slices} total={applications.length} />
                        )}
                      </ChartCard>
                    </View>

                    <View style={[styles.gridCell, twoColumns && styles.gridCellHalf]}>
                      <ChartCard
                        title="Application activity"
                        subtitle="Applications per week, last 8 weeks"
                        icon="show-chart"
                        accessory={
                          <View style={styles.toggle}>
                            {(['bar', 'line'] as ActivityMode[]).map((mode) => (
                              <TouchableOpacity
                                key={mode}
                                activeOpacity={0.7}
                                onPress={() => setActivityMode(mode)}
                                style={[
                                  styles.toggleItem,
                                  activityMode === mode && styles.toggleItemActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.toggleText,
                                    activityMode === mode && styles.toggleTextActive,
                                  ]}
                                >
                                  {mode === 'bar' ? 'Bars' : 'Line'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        }
                      >
                        {applications.length === 0 ? (
                          <ChartEmptyState
                            icon="timeline"
                            message="Nothing to chart yet"
                            hint="Your weekly application rhythm shows up here once you start applying."
                            actionLabel="Browse jobs"
                            onAction={() => router.push('/(tabs)/jobs')}
                          />
                        ) : (
                          <ActivityChart data={activity} mode={activityMode} />
                        )}
                      </ChartCard>
                    </View>
                  </View>

                  <View style={styles.chartGrid}>
                    <View style={[styles.gridCell, twoColumns && styles.gridCellHalf]}>
                      <ChartCard
                        title="Profile completion"
                        subtitle="Complete profiles get more employer views"
                        icon="verified-user"
                      >
                        <ProfileCompletionRing
                          completion={completion}
                          onPress={() =>
                            completion.missing.length
                              ? router.push('/peso-registration')
                              : router.push('/(tabs)/profile')
                          }
                        />
                      </ChartCard>
                    </View>

                    <View style={[styles.gridCell, twoColumns && styles.gridCellHalf]}>
                      <ChartCard
                        title="Skills overview"
                        subtitle="Readiness from your profile and live demand"
                        icon="psychology"
                      >
                        {skills.length === 0 ? (
                          <ChartEmptyState
                            icon="psychology-alt"
                            message="No skills listed"
                            hint="Add your skills during profiling to see how ready you are for the market."
                            actionLabel="Complete profiling"
                            onAction={() => router.push('/peso-registration')}
                          />
                        ) : (
                          <SkillsChart data={skills} />
                        )}
                      </ChartCard>
                    </View>
                  </View>

                  {/* Recommended vacancies */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderText}>
                        <ThemedText style={styles.sectionTitle}>Recommended for you</ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>
                          {openVacancies > 0
                            ? `Ranked from ${openVacancies} live vacanc${openVacancies === 1 ? 'y' : 'ies'}`
                            : 'Based on your profile'}
                        </ThemedText>
                      </View>
                    </View>
                    <RecommendedJobs
                      jobs={recommendations}
                      onPressJob={onOpenJob}
                      onViewAll={() => router.push('/(tabs)/jobs')}
                    />
                  </View>
                </>
              ) : null}

              <View style={styles.bottomSpacer} />
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Quick jump row replacing the old Quick Actions grid */}
      {canShowDashboard ? (
        <View style={styles.quickRow}>
          {[
            { label: 'Jobs', icon: 'search', onPress: () => router.push('/(tabs)/jobs') },
            {
              label: 'Resume',
              icon: 'description',
              onPress: () => router.push('/(tabs)/resume'),
            },
            {
              label: 'Applications',
              icon: 'assignment',
              onPress: () => router.push('/(tabs)/applications'),
            },
            { label: 'Profile', icon: 'person', onPress: () => router.push('/(tabs)/profile') },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickItem}
              activeOpacity={0.7}
              onPress={action.onPress}
            >
              <View style={styles.quickIcon}>
                <MaterialIcons name={action.icon as never} size={17} color="#0a7ea4" />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 110 },

  heroBanner: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroContent: { position: 'relative' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTextSection: { flex: 1, marginRight: 16 },
  heroRightSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifBellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  notifBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  greeting: { color: '#ffffff', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6, fontWeight: '500' },
  heroDecorCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDecorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  body: { paddingHorizontal: 16, paddingTop: 18 },

  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#8E8E93', fontWeight: '500' },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  retryButtonText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },

  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    shadowColor: '#D97706',
    shadowOpacity: 0.08,
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  statusIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeContainer: { marginBottom: 12 },
  pendingBadge: {
    backgroundColor: '#D97706',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pendingBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  statusTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 26,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  outlineButtonText: { color: '#0a7ea4', fontSize: 15, fontWeight: '700' },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  sectionSubtitle: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridCell: { width: '100%', paddingHorizontal: 6, paddingBottom: 12 },
  gridCellHalf: { width: '50%' },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  toggleItem: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  toggleItemActive: { backgroundColor: '#ffffff' },
  toggleText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  toggleTextActive: { color: CHART_COLORS.primary },

  quickRow: {
    position: 'absolute',
    bottom: 92,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 4 },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 9, fontWeight: '700', color: '#475569' },

  bottomSpacer: { height: 20 },
});
