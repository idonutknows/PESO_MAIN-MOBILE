/**
 * Pure derivations behind the Job Seeker dashboard.
 *
 * Everything here reads the payloads the app already fetches
 * (`/api/applications/my`, `/api/job-seeker/profile`, `/api/establishments/hiring`)
 * and turns them into chart-ready numbers. No sample or placeholder values:
 * a chart only ever renders what the API returned, and the UI shows an empty
 * state when the underlying collection is empty.
 */

import {
  STATUS_META,
  STATUS_ORDER,
  normaliseStatus,
  type ApplicationStatus,
} from '@/constants/dashboard';

// Re-exported so chart components can normalise a status without a second import.
export { normaliseStatus };

/* ------------------------------------------------------------------ */
/* API shapes                                                          */
/* ------------------------------------------------------------------ */

export interface JobSeekerApplication {
  id: number;
  job_id?: number;
  job_title?: string;
  company_name?: string;
  status?: string | null;
  applied_at?: string | null;
}

export interface JobSeekerProfile {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  birthdate?: string | null;
  age?: number | string | null;
  sex?: string | null;
  civil_status?: string | null;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  educational_attainment?: string | null;
  employment_status?: string | null;
  occupation?: string | null;
  employer_company?: string | null;
  work_experience_years?: number | string | null;
  preferred_job?: string | null;
  skills?: string[] | string | null;
  tesda_nc_certificates?: string | null;
  other_trainings?: string | null;
  professional_licenses?: string | null;
  willing_outside_municipality?: boolean | number | null;
  willing_abroad?: boolean | number | null;
  photo_url?: string | null;
  barangay?: { barangay_name?: string | null } | null;
  verification_status?: string | null;
}

export interface Vacancy {
  id: number;
  job_title?: string | null;
  description?: string | null;
  salary_range?: string | null;
  employment_type?: string | null;
  hiring_status?: string | null;
  skills?: string[] | null;
  barangay_name?: string | null;
  days_ago?: number | null;
}

export interface EstablishmentWithJobs {
  id: number;
  company_name?: string | null;
  address?: string | null;
  industry_category?: string | null;
  logo?: string | null;
  barangay?: { barangay_name?: string | null } | null;
  jobs?: Vacancy[] | null;
  available_jobs_count?: number | null;
}

/* ------------------------------------------------------------------ */
/* 1. Application status breakdown                                     */
/* ------------------------------------------------------------------ */

export interface StatusSlice {
  status: ApplicationStatus;
  label: string;
  color: string;
  soft: string;
  count: number;
  /** 0–100, share of all applications. */
  percent: number;
}

export function statusBreakdown(applications: JobSeekerApplication[]): StatusSlice[] {
  const counts = new Map<ApplicationStatus, number>();
  for (const app of applications) {
    const key = normaliseStatus(app.status);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = applications.length;
  const keys: ApplicationStatus[] = [...STATUS_ORDER];
  if (counts.has('Other')) keys.push('Other');

  // Always emit the five tracked buckets so the legend stays stable; the UI
  // greys out the empty ones rather than letting rows appear and vanish.
  return keys.map((status) => {
    const meta = STATUS_META[status];
    const count = counts.get(status) ?? 0;
    return {
      status,
      label: meta.label,
      color: meta.color,
      soft: meta.soft,
      count,
      percent: total ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

/** Applications still awaiting a decision (pending + under review). */
export function activeApplicationCount(applications: JobSeekerApplication[]): number {
  return applications.filter((app) => {
    const key = normaliseStatus(app.status);
    return key === 'Pending' || key === 'Reviewed' || key === 'Interview';
  }).length;
}

/** Response rate: decided applications (interview + accepted + rejected). */
export function responseRate(applications: JobSeekerApplication[]): number {
  if (!applications.length) return 0;
  const decided = applications.filter((app) => {
    const key = normaliseStatus(app.status);
    return key === 'Interview' || key === 'Hired' || key === 'Rejected';
  }).length;
  return Math.round((decided / applications.length) * 100);
}

/* ------------------------------------------------------------------ */
/* 2. Application activity over time                                   */
/* ------------------------------------------------------------------ */

export interface ActivityBucket {
  /** ISO date of the Monday that starts the week. */
  start: string;
  /** Short axis label, e.g. "12 May". */
  label: string;
  count: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - weekday);
  return d;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Counts applications per ISO week for the last `weeks` weeks, oldest first.
 * Weeks with no applications are kept as zeroes so the axis reads as a
 * continuous timeline rather than collapsing the gaps.
 */
export function weeklyActivity(
  applications: JobSeekerApplication[],
  weeks = 8,
  now: Date = new Date()
): ActivityBucket[] {
  const thisWeek = startOfWeek(now);
  const buckets: ActivityBucket[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - i * 7);
    buckets.push({
      start: start.toISOString(),
      label: start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: 0,
    });
  }

  const first = new Date(buckets[0].start);
  for (const app of applications) {
    const applied = parseDate(app.applied_at);
    if (!applied) continue;
    const appliedWeek = startOfWeek(applied);
    const diff = Math.round(
      (appliedWeek.getTime() - first.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (diff >= 0 && diff < buckets.length) buckets[diff].count += 1;
  }

  return buckets;
}

/* ------------------------------------------------------------------ */
/* 3. Profile completion                                               */
/* ------------------------------------------------------------------ */

export interface CompletionField {
  key: string;
  label: string;
  filled: boolean;
}

export interface CompletionResult {
  percent: number;
  filled: number;
  total: number;
  fields: CompletionField[];
  /** The first incomplete fields, used to drive the "Finish your profile" nudge. */
  missing: CompletionField[];
}

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function skillList(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(/[,;\n]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Weights mirror how the profiling form itself is structured: personal details
 * and the two required employment answers carry the most, optional extras the
 * least. The percentage is a straight weighted sum — no invented fields.
 */
const COMPLETION_FIELDS: {
  key: keyof JobSeekerProfile;
  label: string;
  weight: number;
  value?: (profile: JobSeekerProfile) => unknown;
}[] = [
  { key: 'first_name', label: 'First name', weight: 6 },
  { key: 'middle_name', label: 'Middle name', weight: 2 },
  { key: 'last_name', label: 'Last name', weight: 6 },
  { key: 'birthdate', label: 'Date of birth', weight: 6 },
  { key: 'sex', label: 'Sex', weight: 5 },
  { key: 'civil_status', label: 'Civil status', weight: 5 },
  { key: 'address', label: 'Address', weight: 7 },
  {
    key: 'contact_number',
    label: 'Contact number',
    weight: 7,
  },
  { key: 'email', label: 'Email address', weight: 5 },
  { key: 'barangay', label: 'Barangay', weight: 4, value: (p) => p.barangay?.barangay_name },
  { key: 'educational_attainment', label: 'Educational attainment', weight: 7 },
  { key: 'employment_status', label: 'Employment status', weight: 5 },
  { key: 'preferred_job', label: 'Preferred job', weight: 7 },
  { key: 'skills', label: 'Skills', weight: 12, value: (p) => skillList(p.skills) },
  { key: 'occupation', label: 'Current occupation', weight: 4 },
  { key: 'employer_company', label: 'Employer', weight: 3 },
  { key: 'work_experience_years', label: 'Years of experience', weight: 5 },
  {
    key: 'tesda_nc_certificates',
    label: 'TESDA / NC certificates',
    weight: 6,
  },
  { key: 'other_trainings', label: 'Other trainings', weight: 4 },
  { key: 'professional_licenses', label: 'Professional licences', weight: 4 },
  { key: 'photo_url', label: 'Profile photo', weight: 4 },
];

export function profileCompletion(profile: JobSeekerProfile | null): CompletionResult {
  if (!profile) {
    return { percent: 0, filled: 0, total: COMPLETION_FIELDS.length, fields: [], missing: [] };
  }

  const fields: CompletionField[] = COMPLETION_FIELDS.map((meta) => {
    const raw = meta.value ? meta.value(profile) : profile[meta.key];
    return { key: meta.key, label: meta.label, filled: filled(raw) };
  });

  const totalWeight = COMPLETION_FIELDS.reduce((sum, meta) => sum + meta.weight, 0);
  const earned = COMPLETION_FIELDS.reduce((sum, meta, index) => {
    return sum + (fields[index].filled ? meta.weight : 0);
  }, 0);

  return {
    percent: Math.round((earned / totalWeight) * 100),
    filled: fields.filter((f) => f.filled).length,
    total: fields.length,
    fields,
    missing: fields.filter((f) => !f.filled).slice(0, 4),
  };
}

/* ------------------------------------------------------------------ */
/* 4. Skills overview                                                   */
/* ------------------------------------------------------------------ */

export interface SkillDatum {
  label: string;
  /** Short form used when the full name does not fit the axis gutter. */
  short: string;
  /** 0–100 readiness score. */
  score: number;
  /** Human-readable justification shown in the tooltip. */
  reason: string;
  /** Skill keywords found in open vacancies — real market demand. */
  demand: number;
}

/** Word stems used to relate the profiling skill labels to free-text vacancies. */
const SKILL_KEYWORDS: Record<string, string[]> = {
  'agriculture / farming': ['agricultur', 'farm', 'crop', 'planting', 'harvest'],
  'fishing / aquaculture': ['fish', 'aquaculture', 'pisciculture', 'boat'],
  'construction / carpentry / masonry': ['construct', 'carpentry', 'mason', 'cement', 'welding work'],
  'driving / automotive': ['driv', 'driver', 'automotive', 'mechanic', 'truck'],
  'welding / metal works': ['weld', 'metal', 'fabricat'],
  'electrical / electronics': ['electr', 'electronic', 'wiring', 'cable'],
  'computer / it / digital skills': ['computer', 'it ', 'digital', 'software', 'data', 'admin'],
  'food processing / cooking / baking': ['food', 'cook', 'baking', 'kitchen', 'cuisine'],
  'sewing / dressmaking': ['sew', 'dressmak', 'tailor', 'garment', 'textile'],
};

const GENERIC_TRAINING_TERMS = [
  'seminar',
  'training',
  'workshop',
  'course',
  'certification',
  'license',
];

/** Strips the "/ Something" suffixes so labels fit the chart gutter. */
function shortLabel(label: string): string {
  const [head] = label.split('/');
  const trimmed = head.trim();
  return trimmed.length > 14 ? `${trimmed.slice(0, 13)}…` : trimmed;
}

function keywordsFor(skill: string): string[] {
  const key = skill.trim().toLowerCase();
  return SKILL_KEYWORDS[key] ?? key.split(/[^a-z]+/).filter((w) => w.length > 2);
}

function textOf(job: Vacancy): string {
  return `${job.job_title || ''} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
}

/**
 * Builds the skills chart from the profile only.
 *
 * The API stores skills as a list of labels with no proficiency rating, so a
 * "skill level" has to be derived. The score is the sum of four real signals —
 * the skill being listed, a training/licence that mentions it, years of
 * recorded work experience, and how many live vacancies currently ask for it.
 * Every bar carries the breakdown in its tooltip, so the number is auditable
 * rather than decorative.
 */
export function skillsOverview(
  profile: JobSeekerProfile | null,
  jobs: Vacancy[] = [],
  limit = 6
): SkillDatum[] {
  const skills = skillList(profile?.skills);
  if (!skills.length) return [];

  const trainings = `${profile?.tesda_nc_certificates || ''} ${profile?.other_trainings || ''}`.toLowerCase();
  const licenses = (profile?.professional_licenses || '').toLowerCase();
  const credentials = `${trainings} ${licenses}`;
  const hasCredentials = GENERIC_TRAINING_TERMS.some((term) => credentials.includes(term));
  const years = Number(profile?.work_experience_years) || 0;
  // 0 years → 0, 10+ years → full marks; capped so experience cannot dominate.
  const experiencePoints = Math.min(20, years * 2);

  return skills
    .map((skill) => {
      const keywords = keywordsFor(skill);
      const matchesTraining = keywords.filter((k) => credentials.includes(k));
      const demand = jobs.filter((job) => keywords.some((k) => textOf(job).includes(k))).length;

      const base = 40; // listed in the profile
      const trainingPoints = hasCredentials ? (matchesTraining.length ? 18 : 8) : 0;
      const demandPoints = Math.min(22, demand * 4);
      const score = Math.min(100, Math.round(base + trainingPoints + experiencePoints + demandPoints));

      const parts = ['Listed in your profile'];
      if (matchesTraining.length) parts.push('supported by training/licence');
      else if (hasCredentials) parts.push('general training on file');
      if (years > 0) parts.push(`${years} yr experience`);
      if (demand > 0) parts.push(`${demand} matching vacancy${demand > 1 ? '' : 'y'}`);

      return {
        label: skill,
        short: shortLabel(skill),
        score,
        reason: parts.join(' · '),
        demand,
      } satisfies SkillDatum;
    })
    .sort((a, b) => b.score - a.score || b.demand - a.demand)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* 5. Recommended vacancies                                            */
/* ------------------------------------------------------------------ */

export interface RecommendedJob {
  job: Vacancy;
  /** Needed to route to `/establishment/[id]`. */
  establishmentId: number;
  company: string;
  location: string;
  match: number;
  matchedSkills: string[];
  reason: string;
}

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'that', 'this', 'from', 'you', 'your', 'our', 'are', 'will',
  'have', 'has', 'job', 'work', 'worker', 'staff', 'able', 'must', 'who', 'can', 'but', 'not',
  'all', 'any', 'per', 'using', 'use', 'into', 'out', 'she', 'his', 'her', 'their', 'they',
]);

function tokenise(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/** Flattens establishments into a single list of vacancies, newest first. */
export function flattenVacancies(
  establishments: EstablishmentWithJobs[]
): { job: Vacancy; establishmentId: number; company: string; location: string }[] {
  const rows: { job: Vacancy; establishmentId: number; company: string; location: string }[] = [];

  for (const est of establishments) {
    const jobs = Array.isArray(est.jobs) ? est.jobs : [];
    for (const job of jobs) {
      if (!job || typeof job.id !== 'number' || typeof est.id !== 'number') continue;
      rows.push({
        job,
        establishmentId: est.id,
        company: est.company_name?.trim() || 'Hiring establishment',
        location: job.barangay_name?.trim() || est.barangay?.barangay_name?.trim() || '',
      });
    }
  }

  return rows;
}

export interface RecommendationOptions {
  /** Job ids the seeker already applied to — excluded from the list. */
  appliedJobIds?: number[];
  limit?: number;
}

/**
 * Ranks live vacancies by overlap with the seeker's own profile: skill keywords
 * hit hardest, then the preferred job title, then the job description. Jobs
 * already applied to are dropped so the list stays actionable.
 */
export function recommendJobs(
  profile: JobSeekerProfile | null,
  establishments: EstablishmentWithJobs[],
  options: RecommendationOptions = {}
): RecommendedJob[] {
  const { appliedJobIds = [], limit = 4 } = options;
  if (!profile) return [];

  const applied = new Set(appliedJobIds);
  const skills = skillList(profile.skills);
  const skillTokens = skills.flatMap((skill) => skill.split(/[^A-Za-z0-9+#]+/)).filter(Boolean);
  const skillKeywords = skills.flatMap(keywordsFor);
  const preferred = (profile.preferred_job || '').toLowerCase();
  const preferredTokens = tokenise(profile.preferred_job || '');
  const occupation = (profile.occupation || '').toLowerCase();

  const rows = flattenVacancies(establishments).filter((row) => !applied.has(row.job.id));
  if (!rows.length) return [];

  const scored = rows.map(({ job, establishmentId, company, location }) => {
    const haystack = textOf(job);
    const title = (job.job_title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();

    const matchedSkills: string[] = [];
    for (const skill of skills) {
      const hit = keywordsFor(skill).some((keyword) => haystack.includes(keyword));
      if (hit) matchedSkills.push(skill);
    }

    const skillTokensHit = skillTokens.filter((t) => t.length > 2 && haystack.includes(t.toLowerCase())).length;
    const keywordHits = skillKeywords.filter((k) => haystack.includes(k)).length;

    // Title match against the preferred job is the strongest single signal.
    const titleHit = preferred ? preferredTokens.some((t) => title.includes(t)) : false;
    const occupationHit = occupation && title.includes(occupation);
    const preferredHits = preferred
      ? preferredTokens.filter((t) => title.includes(t) || description.includes(t)).length
      : 0;

    const raw =
      matchedSkills.length * 26 +
      keywordHits * 7 +
      skillTokensHit * 2 +
      (titleHit ? 26 : 0) +
      (occupationHit ? 14 : 0) +
      preferredHits * 5 +
      (job.days_ago != null && job.days_ago <= 7 ? 6 : 0);

    const match = Math.max(5, Math.min(99, Math.round(raw)));

    const reasons: string[] = [];
    if (matchedSkills.length) reasons.push(`Matches ${matchedSkills.length} of your skills`);
    if (titleHit) reasons.push('Similar to your preferred job');
    else if (occupationHit) reasons.push('Related to your current occupation');
    if (preferredHits && !titleHit) reasons.push('Preferred-job keywords found');

    return {
      job,
      establishmentId,
      company,
      location,
      match,
      matchedSkills: matchedSkills.slice(0, 3),
      reason: reasons[0] || 'Open vacancy in your area',
    } satisfies RecommendedJob;
  });

  return scored.sort((a, b) => b.match - a.match).slice(0, limit);
}
