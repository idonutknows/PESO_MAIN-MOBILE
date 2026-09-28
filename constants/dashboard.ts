/**
 * Shared visual + data vocabulary for the Job Seeker analytics dashboard.
 * Colours follow the PESO brand ramp already used across the app
 * (#0A7EA4 primary, #0891B2 / #06B6D4 accents).
 */

export type ApplicationStatus =
  | 'Pending'
  | 'Reviewed'
  | 'Interview'
  | 'Hired'
  | 'Rejected'
  | 'Other';

export interface StatusMeta {
  /** Value the API sends. */
  apiValue: string;
  /** Label shown to the job seeker. */
  label: string;
  color: string;
  /** 12% tint of `color`, used for legend chips and stat cards. */
  soft: string;
  icon: string;
}

/**
 * `Reviewed` is presented as "Under Review" and `Hired` as "Accepted" so the
 * dashboard reads in the language the API already uses internally.
 */
export const STATUS_ORDER: ApplicationStatus[] = [
  'Pending',
  'Reviewed',
  'Interview',
  'Hired',
  'Rejected',
];

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  Pending: {
    apiValue: 'Pending',
    label: 'Pending',
    color: '#F59E0B',
    soft: '#FEF3C7',
    icon: 'hourglass-top',
  },
  Reviewed: {
    apiValue: 'Reviewed',
    label: 'Under Review',
    color: '#3B82F6',
    soft: '#DBEAFE',
    icon: 'visibility',
  },
  Interview: {
    apiValue: 'Interview',
    label: 'Interview',
    color: '#8B5CF6',
    soft: '#EDE9FE',
    icon: 'event',
  },
  Hired: {
    apiValue: 'Hired',
    label: 'Accepted',
    color: '#10B981',
    soft: '#D1FAE5',
    icon: 'check-circle',
  },
  Rejected: {
    apiValue: 'Rejected',
    label: 'Rejected',
    color: '#EF4444',
    soft: '#FEE2E2',
    icon: 'cancel',
  },
  Other: {
    apiValue: '',
    label: 'Other',
    color: '#94A3B8',
    soft: '#E2E8F0',
    icon: 'help-outline',
  },
};

/** Normalises whatever the API sends, case- and space-insensitively. */
export function normaliseStatus(raw: string | null | undefined): ApplicationStatus {
  const value = (raw || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  for (const key of STATUS_ORDER) {
    if (key.toLowerCase() === value) return key;
  }
  // The Laravel `applications.status` column uses these words; the live
  // database currently holds pending | interview_scheduled | hired.
  if (value === 'interviewscheduled' || value === 'forinterview' || value === 'shortlisted') {
    return 'Interview';
  }
  if (value === 'underreview' || value === 'inreview' || value === 'screening') {
    return 'Reviewed';
  }
  if (value === 'accepted' || value === 'offered') return 'Hired';
  if (value === 'declined') return 'Rejected';
  if (value === 'onhold' || value === 'submitted' || value === 'applied') return 'Pending';
  return 'Other';
}

/** Chart accent ramp used for series, gradients and highlights. */
export const CHART_COLORS = {
  primary: '#0A7EA4',
  primaryLight: '#0891B2',
  primaryLighter: '#06B6D4',
  grid: '#E5E7EB',
  axis: '#94A3B8',
  track: '#EEF2F6',
  ink: '#1C1C1E',
  body: '#6B7280',
} as const;

export const SKILL_BAR_COLORS = [
  '#0A7EA4',
  '#0891B2',
  '#06B6D4',
  '#22B8CF',
  '#5CC9D6',
] as const;
