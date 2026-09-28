import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';
import { STATUS_META, normaliseStatus, type ApplicationStatus } from '@/constants/dashboard';
import { useFocusEffect, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useState, useEffect, useCallback, useContext, useRef } from 'react';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const BRAND = '#0A7EA4';
const BRAND_DARK = '#066B8C';
const BRAND_LIGHT = '#0891B2';
const INK = '#1C1C1E';
const BODY = '#6B7280';
const MUTED = '#9CA3AF';
const CANVAS = '#F0F4F8';
const HAIRLINE = '#E5E7EB';

/**
 * The tab bar is absolutely positioned, so content has to clear it by hand.
 * Mirrors the heights in `app/(tabs)/_layout.tsx`.
 */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 72;
const TAB_BAR_SAFE_PADDING = Platform.OS === 'ios' ? 24 : 12;

/**
 * Used only if no SafeAreaProvider is mounted above this screen.
 * `useSafeAreaInsets()` throws in that case, so the context is read directly
 * and sensible status-bar values are substituted.
 */
const FALLBACK_INSETS = {
  top: Platform.OS === 'ios' ? 44 : 24,
  bottom: Platform.OS === 'ios' ? 34 : 24,
  left: 0,
  right: 0,
};

/**
 * Status labels are spelled out here rather than reusing `STATUS_META.label`
 * so this page reads Pending / Reviewed / Interview / Hired / Rejected while
 * still borrowing the shared palette and icons.
 */
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  Pending: 'Pending',
  Reviewed: 'Reviewed',
  Interview: 'Interview',
  Hired: 'Hired',
  Rejected: 'Rejected',
  Other: 'Other',
};

const SUMMARY_ORDER: ApplicationStatus[] = [
  'Pending',
  'Reviewed',
  'Interview',
  'Hired',
  'Rejected',
];

/* ------------------------------------------------------------------ */
/* API shapes                                                          */
/* ------------------------------------------------------------------ */

/** Flattened shape this screen renders. */
interface Application {
  id: number;
  job_id: number;
  establishment_id: number | null;
  job_title: string;
  company_name: string;
  location: string | null;
  expected_salary: string | null;
  status: ApplicationStatus;
  applied_at: string;
}

interface RawApplication {
  id?: number;
  job_id?: number;
  status?: string | null;
  applied_at?: string | null;
  expected_salary?: string | null;
  job?: {
    id?: number;
    job_title?: string | null;
    job_location?: string | null;
    establishment_id?: number | null;
    establishment?: {
      id?: number | null;
      company_name?: string | null;
      address?: string | null;
      barangay?: { barangay_name?: string | null } | null;
    } | null;
    barangay?: { barangay_name?: string | null } | null;
  } | null;
}

/**
 * `/api/applications/my` answers 404 with this message when the signed-in user
 * has no `job_seekers` row yet. That is a different situation from "no
 * applications", so it gets its own state instead of an error.
 */
const PROFILE_MISSING_MESSAGE = 'job seeker profile not found';

/** Pulls the array out of a bare array, a Laravel paginator, or a wrapper key. */
function pickArray(json: unknown): RawApplication[] {
  if (Array.isArray(json)) return json as RawApplication[];
  if (json && typeof json === 'object') {
    const record = json as Record<string, unknown>;
    for (const key of ['data', 'applications']) {
      if (Array.isArray(record[key])) return record[key] as RawApplication[];
    }
  }
  return [];
}

/** Flattens the nested API payload into what this screen renders. */
function normaliseApplication(raw: RawApplication): Application {
  const job = raw.job ?? null;
  const establishment = job?.establishment ?? null;
  const location =
    job?.job_location?.trim() ||
    establishment?.address?.trim() ||
    establishment?.barangay?.barangay_name?.trim() ||
    job?.barangay?.barangay_name?.trim() ||
    null;

  return {
    id: raw.id ?? 0,
    job_id: job?.id ?? raw.job_id ?? 0,
    establishment_id: establishment?.id ?? job?.establishment_id ?? null,
    job_title: job?.job_title?.trim() || 'Untitled position',
    company_name: establishment?.company_name?.trim() || 'Unknown employer',
    location: location || null,
    expected_salary: raw.expected_salary?.trim() || null,
    status: normaliseStatus(raw.status),
    applied_at: raw.applied_at ?? '',
  };
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function ApplicationsScreen() {
  const { token, hasJobSeekerProfile } = useAuth();
  const router = useRouter();
  const insets = useContext(SafeAreaInsetsContext) ?? FALLBACK_INSETS;
  const { width } = useWindowDimensions();

  const [applications, setApplications] = useState<Application[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMissingOnServer, setProfileMissingOnServer] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isFetching = useRef(false);

  // Applications are keyed to the job seeker profile, so there is nothing to
  // request until that profile exists. This mirrors the gate the Home dashboard
  // uses, and the 404 below catches a profile deleted after that check.
  const needsProfile = !hasJobSeekerProfile || profileMissingOnServer;

  // `loading` is derived rather than stored, so the effect below never has to
  // setState synchronously to settle the no-profile case.
  const authKey = `${token ?? ''}:${hasJobSeekerProfile}`;
  const loading = Boolean(token) && hasJobSeekerProfile && loadedKey !== authKey;

  const fetchApplications = useCallback(async () => {
    if (isFetching.current) return;
    if (!token) return;
    isFetching.current = true;
    try {
      const res = await fetch(API_ENDPOINTS.myApplications, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 404) {
        const body = await res.text();
        if (body.toLowerCase().includes(PROFILE_MISSING_MESSAGE)) {
          setApplications([]);
          setProfileMissingOnServer(true);
          setLoadError(null);
          return;
        }
        setLoadError('Applications are unavailable right now.');
        return;
      }

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = pickArray(await res.json()).map(normaliseApplication);
      setApplications(data);
      setProfileMissingOnServer(false);
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your applications.');
    } finally {
      setLoadedKey(authKey);
      isFetching.current = false;
    }
  }, [token, authKey]);

  // Re-runs on mount, on the auth/profile transition, and every time the tab
  // regains focus, so a status changed elsewhere shows up without a remount.
  useFocusEffect(
    useCallback(() => {
      if (token && hasJobSeekerProfile) fetchApplications();
    }, [token, hasJobSeekerProfile, fetchApplications])
  );

  // …and when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') fetchApplications();
    });
    return () => sub.remove();
  }, [fetchApplications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  }, [fetchApplications]);

  /* ---------------------------------------------------------------- */
  /* Derived view data                                                 */
  /* ---------------------------------------------------------------- */

  /** Counts come straight from the loaded applications, never hardcoded. */
  const counts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  // A fixed 3-up grid on phones keeps every status visible at once and gives the
  // labels enough room to stay on one line; wide screens get all five across.
  const columns = width >= 700 ? 5 : width < 340 ? 2 : 3;
  const cellWidth = `${100 / columns}%` as const;

  const clearTabBar = TAB_BAR_HEIGHT + Math.max(insets.bottom - TAB_BAR_SAFE_PADDING, 0);

  const goToJobs = useCallback(() => router.push('/(tabs)/jobs'), [router]);

  const onViewDetails = useCallback(
    (app: Application) => {
      if (app.establishment_id) {
        router.push({
          pathname: '/establishment/[id]',
          params: { id: String(app.establishment_id) },
        });
      } else {
        goToJobs();
      }
    },
    [router, goToJobs]
  );

  const onHeaderMenu = useCallback(() => {
    Alert.alert('Applications', 'What would you like to do?', [
      { text: 'Refresh applications', onPress: () => void onRefresh() },
      { text: 'Browse jobs', onPress: goToJobs },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [onRefresh, goToJobs]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: clearTabBar + 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />
        }
      >
        {/* ---------------- Header ---------------- */}
        <LinearGradient
          colors={[BRAND, BRAND_LIGHT, BRAND_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>My Applications</Text>
              <Text style={styles.headerSubtitle} numberOfLines={2}>
                Track and manage your job applications
              </Text>
            </View>
            <Pressable
              onPress={onHeaderMenu}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Application options"
              style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
            >
              <MaterialIcons name="tune" size={19} color="#ffffff" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ---------------- Summary ---------------- */}
        <View style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Application Summary</Text>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillText}>
                {applications.length} total
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {SUMMARY_ORDER.map((status) => {
              const meta = STATUS_META[status];
              const count = counts[status] ?? 0;
              return (
                <View key={status} style={{ width: cellWidth, paddingHorizontal: 5, paddingBottom: 10 }}>
                  <View
                    style={[
                      styles.statTile,
                      { backgroundColor: count > 0 ? meta.soft : '#F8FAFC' },
                    ]}
                  >
                    <View style={[styles.statIconWrap, { backgroundColor: '#ffffff' }]}>
                      <MaterialIcons
                        name={meta.icon as never}
                        size={16}
                        color={count > 0 ? meta.color : MUTED}
                      />
                    </View>
                    <Text style={[styles.statCount, { color: count > 0 ? meta.color : MUTED }]}>
                      {count}
                    </Text>
                    <Text
                      style={styles.statLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {STATUS_LABEL[status]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ---------------- Body ---------------- */}
        {needsProfile ? (
          <View style={styles.stateCard}>
            <View style={[styles.stateIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="badge" size={26} color="#F59E0B" />
            </View>
            <Text style={styles.stateTitle}>Complete Your Profile First</Text>
            <Text style={styles.stateBody}>
              Applications are tied to your job seeker profile. Finish profiling so PESO can
              process your applications, then pull down to refresh.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Complete Profile</Text>
            </Pressable>
          </View>
        ) : loadError ? (
          <View style={styles.stateCard}>
            <View style={[styles.stateIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="error-outline" size={26} color="#EF4444" />
            </View>
            <Text style={styles.stateTitle}>Couldn’t Load Applications</Text>
            <Text style={styles.stateBody}>{loadError}</Text>
            <Pressable
              onPress={() => void onRefresh()}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : applications.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={[styles.stateIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <MaterialIcons name="assignment" size={26} color={BRAND} />
            </View>
            <Text style={styles.stateTitle}>No Applications Yet</Text>
            <Text style={styles.stateBody}>
              Browse available jobs and submit your first application to get started.
            </Text>
            <Pressable
              onPress={goToJobs}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              accessibilityRole="button"
            >
              <MaterialIcons name="search" size={18} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Browse Jobs</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Applications</Text>
              <Text style={styles.sectionMeta}>
                {applications.length} {applications.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>

            {applications.map((app) => {
              const meta = STATUS_META[app.status];
              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appTopRow}>
                    <View style={styles.appIconTile}>
                      <MaterialIcons name="work-outline" size={19} color={BRAND} />
                    </View>

                    <View style={styles.appInfo}>
                      <Text style={styles.appTitle} numberOfLines={2}>
                        {app.job_title}
                      </Text>
                      <Text style={styles.appCompany} numberOfLines={1}>
                        {app.company_name}
                      </Text>
                    </View>

                    <View style={[styles.badge, { backgroundColor: meta.soft }]}>
                      <View style={[styles.badgeDot, { backgroundColor: meta.color }]} />
                      <Text style={[styles.badgeText, { color: meta.color }]} numberOfLines={1}>
                        {STATUS_LABEL[app.status]}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <MaterialIcons name="calendar-today" size={12} color={MUTED} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {formatDate(app.applied_at)}
                    </Text>
                    {app.location ? (
                      <>
                        <View style={styles.metaDivider} />
                        <MaterialIcons name="place" size={12} color={MUTED} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {app.location}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => onViewDetails(app)}
                    style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${app.job_title}`}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                    <MaterialIcons name="arrow-forward" size={15} color={BRAND} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CANVAS,
  },

  /* Header --------------------------------------------------------- */
  header: {
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginRight: 12 },
  headerTitle: { color: '#ffffff', fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '500',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  headerIconPressed: { backgroundColor: 'rgba(255,255,255,0.3)' },

  /* Summary -------------------------------------------------------- */
  summaryCard: {
    backgroundColor: '#ffffff',
    marginTop: -14,
    marginHorizontal: 14,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#04324D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  statTile: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 78,
    justifyContent: 'center',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: { fontSize: 21, fontWeight: '800', marginTop: 4, lineHeight: 25 },
  // Single line, centred and slightly condensed so "Reviewed" / "Interview" /
  // "Rejected" can never break across two rows.
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: BODY,
    letterSpacing: 0.2,
    marginTop: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },

  /* Section headers ------------------------------------------------ */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: INK, letterSpacing: -0.2 },
  sectionMeta: { fontSize: 12, color: MUTED, fontWeight: '600' },
  totalPill: {
    backgroundColor: '#EEF6F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  totalPillText: { fontSize: 11.5, fontWeight: '700', color: BRAND },

  /* Application list ----------------------------------------------- */
  listSection: { paddingHorizontal: 14, paddingTop: 18 },
  appCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: HAIRLINE,
    shadowColor: '#04324D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  appIconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF6F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appInfo: { flex: 1, marginRight: 8, paddingTop: 1 },
  appTitle: { fontSize: 14.5, fontWeight: '700', color: INK, lineHeight: 19 },
  appCompany: { fontSize: 12.5, color: BODY, marginTop: 2 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 108,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.1, flexShrink: 1 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  metaText: { fontSize: 11.5, color: MUTED, flexShrink: 1 },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 3,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F2F9FB',
    borderWidth: 1,
    borderColor: '#D6EDF4',
  },
  detailsButtonPressed: { backgroundColor: '#E2F1F6' },
  detailsButtonText: { fontSize: 12.5, fontWeight: '700', color: BRAND },

  /* Shared states --------------------------------------------------- */
  stateCard: {
    backgroundColor: '#ffffff',
    margin: 14,
    marginTop: 18,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: { fontSize: 16.5, fontWeight: '800', color: INK, textAlign: 'center' },
  stateBody: {
    fontSize: 13,
    color: BODY,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 300,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 13,
    backgroundColor: BRAND,
  },
  primaryButtonPressed: { backgroundColor: BRAND_DARK },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
