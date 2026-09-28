import {
  DEFAULT_DESIGN,
  DEFAULT_SECTION_ORDER,
  FONT_MAP,
  SECTION_MAP,
  TEMPLATE_MAP,
} from '@/constants/resumeDesign';
import { darken, isDark, lighten, normalizeHex, readableOn } from '@/utils/color';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import type {
  DensityKey,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ReferenceEntry,
  ResumeContent,
  ResumeDesign,
  ResolvedDesign,
  SectionKind,
  TemplateKey,
} from '@/types/resume';

/* ------------------------------------------------------------------ */
/* Page geometry (A4 @ 96dpi)                                          */
/* ------------------------------------------------------------------ */

export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
const PT_TO_PX = 96 / 72;

const MARGINS: Record<DensityKey, number> = {
  compact: 34,
  normal: 46,
  relaxed: 58,
};

const GAPS: Record<DensityKey, number> = {
  compact: 12,
  normal: 19,
  relaxed: 27,
};

const PAD: Record<DensityKey, number> = {
  compact: 11,
  normal: 15,
  relaxed: 20,
};

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

let idCounter = 0;
export function makeId(prefix = 'e'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/* ------------------------------------------------------------------ */
/* API shapes (mirrors ResumeService::buildResumeData)                */
/* ------------------------------------------------------------------ */

export interface ApiResumeEntry {
  position?: string;
  company?: string;
  years?: string;
  level?: string;
  school?: string;
  year?: string;
}

export interface ApiResumeData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  address?: string;
  contact_number?: string;
  email?: string;
  birthdate?: string;
  age?: string;
  civil_status?: string;
  sex?: string;
  profile_photo?: string | null;
  photo_url?: string | null;
  career_objective?: string;
  educational_background?: ApiResumeEntry[] | null;
  work_experience?: ApiResumeEntry[] | null;
  skills?: string[] | string | null;
  certifications?: string[] | string | null;
  trainings?: string[] | string | null;
  licenses?: string[] | string | null;
  references?: ApiResumeEntry[] | null;
  barangay?: string;
  municipality?: string;
}

export interface ApiJobSeekerProfile {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  address?: string;
  contact_number?: string;
  email?: string;
  educational_attainment?: string;
  occupation?: string;
  employer_company?: string;
  work_experience_years?: number | string | null;
  preferred_job?: string;
  skills?: string[] | string | null;
  tesda_nc_certificates?: string;
  other_trainings?: string;
  professional_licenses?: string;
  photo_url?: string | null;
  barangay?: { barangay_name?: string } | null;
}

/* ------------------------------------------------------------------ */
/* List helpers                                                        */
/* ------------------------------------------------------------------ */

function toList(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function joinAddress(...parts: (string | null | undefined)[]): string {
  return parts.map((p) => (p || '').trim()).filter(Boolean).join(', ');
}

/* ------------------------------------------------------------------ */
/* Empty content                                                       */
/* ------------------------------------------------------------------ */

export function emptyContent(): ResumeContent {
  return {
    fullName: '',
    title: '',
    photoUrl: null,
    email: '',
    phone: '',
    address: '',
    website: '',
    social: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    trainings: [],
    references: [],
    additional: '',
  };
}

export function emptyExperience(): ExperienceEntry {
  return { id: makeId('exp'), position: '', company: '', location: '', period: '', details: '' };
}

export function emptyEducation(): EducationEntry {
  return { id: makeId('edu'), degree: '', school: '', location: '', period: '', details: '' };
}

export function emptyProject(): ProjectEntry {
  return { id: makeId('prj'), name: '', role: '', link: '', period: '', details: '' };
}

export function emptyReference(): ReferenceEntry {
  return { id: makeId('ref'), name: '', position: '', company: '', contact: '' };
}

/* ------------------------------------------------------------------ */
/* Seeding from the job seeker profile                                */
/* ------------------------------------------------------------------ */

export function seedFromResumeData(data: ApiResumeData): ResumeContent {
  const experience: ExperienceEntry[] = (data.work_experience || [])
    .filter((w) => w && (w.position || w.company))
    .map((w) => ({
      ...emptyExperience(),
      position: w.position || '',
      company: w.company || '',
      period: w.years || '',
    }));

  const education: EducationEntry[] = (data.educational_background || [])
    .filter((e) => e && (e.level || e.school))
    .map((e) => ({
      ...emptyEducation(),
      degree: e.level || '',
      school: e.school || '',
      period: e.year || '',
    }));

  const fullName =
    data.full_name?.trim() ||
    [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ').trim();

  const objective = data.career_objective || '';

  return {
    ...emptyContent(),
    fullName,
    title: stripObjectiveTitle(objective),
    photoUrl: data.profile_photo || data.photo_url || null,
    email: data.email || '',
    phone: data.contact_number || '',
    address: joinAddress(data.address, data.barangay, data.municipality),
    website: '',
    social: '',
    summary: objective,
    experience,
    education,
    skills: toList(data.skills),
    certifications: toList(data.certifications),
    projects: [],
    trainings: toList(data.trainings),
    references: [],
    additional: toList(data.licenses).join('\n'),
  };
}

/** Fallback seeder when `/resume/preview` is unavailable. */
export function seedFromJobSeekerProfile(profile: ApiJobSeekerProfile): ResumeContent {
  const content = emptyContent();

  content.fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  content.title = profile.preferred_job || profile.occupation || '';
  content.photoUrl = profile.photo_url || null;
  content.email = profile.email || '';
  content.phone = profile.contact_number || '';
  content.address = joinAddress(profile.address, profile.barangay?.barangay_name);
  content.summary = profile.preferred_job
    ? `Seeking a position as ${profile.preferred_job} where I can apply my skills and experience to help the team succeed.`
    : '';
  content.skills = toList(profile.skills);
  content.certifications = toList(profile.tesda_nc_certificates);
  content.trainings = toList(profile.other_trainings);
  content.additional = toList(profile.professional_licenses).join('\n');

  if (profile.occupation || profile.employer_company) {
    content.experience = [
      {
        ...emptyExperience(),
        position: profile.occupation || '',
        company: profile.employer_company || '',
        period: profile.work_experience_years ? `${profile.work_experience_years} year(s)` : '',
      },
    ];
  }

  if (profile.educational_attainment) {
    content.education = [
      { ...emptyEducation(), degree: profile.educational_attainment, school: profile.address || '' },
    ];
  }

  return content;
}

/** The backend writes "Seeking a position as X where …" — reuse X as the headline title. */
function stripObjectiveTitle(objective: string): string {
  const match = objective.match(/seeking a position as\s+(.+?)(?:\s+where\b|[.;,]|$)/i);
  return match && match[1] ? match[1].trim() : '';
}

/* ------------------------------------------------------------------ */
/* Design resolution — shared by the preview and the PDF              */
/* ------------------------------------------------------------------ */

export function applyTemplateDefaults(design: ResumeDesign, key: TemplateKey): ResumeDesign {
  const spec = TEMPLATE_MAP[key];
  return {
    ...design,
    templateKey: key,
    sectionStyle: spec.sectionStyle,
    skillStyle: spec.skillStyle,
    photoShape: spec.photoShape,
    headingCase: spec.headingCase,
    accentColor: spec.accentColor,
    textColor: spec.textColor,
    showPhoto: spec.supportsPhoto ? design.showPhoto : false,
  };
}

const DEFAULT_RAIL: SectionKind[] = ['skills', 'certifications', 'training', 'references'];

export function resolveDesign(design: ResumeDesign): ResolvedDesign {
  const template = TEMPLATE_MAP[design.templateKey] ?? TEMPLATE_MAP['modern-professional'];

  const accent = normalizeHex(design.accentColor || template.accentColor);
  const ink = normalizeHex(design.textColor || template.textColor);
  const dark = isDark(accent);

  const palette = {
    primary: accent,
    primaryDark: darken(accent, 0.24),
    primarySoft: lighten(accent, dark ? 0.82 : 0.88),
    ink,
    body: dark ? lighten(ink, 0.18) : darken(ink, 0.12),
    muted: dark ? lighten(ink, 0.42) : darken(ink, 0.34),
    rule: lighten(ink, 0.78),
    panel: lighten(accent, dark ? 0.9 : 0.94),
    onPrimary: readableOn(accent),
    isDarkHeader: dark,
  };

  const density: DensityKey = design.density in MARGINS ? design.density : 'normal';
  const bodyPx = Math.round(design.fontSize * PT_TO_PX * 10) / 10;
  const lineHeight = Math.min(2.2, Math.max(0.9, design.lineHeight));

  const railPercent = template.railRatio || 34;

  const resolvedColumns: 'single' | 'double' =
    design.columns === 'single'
      ? 'single'
      : design.columns === 'double'
        ? 'double'
        : template.layout === 'rail-left' || template.layout === 'rail-right'
          ? 'double'
          : 'single';

  const railSide: 'left' | 'right' | 'none' =
    resolvedColumns === 'single'
      ? 'none'
      : template.layout === 'rail-right'
        ? 'right'
        : 'left';

  return {
    template,
    palette,
    metrics: {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      margin: MARGINS[density],
      fontSize: bodyPx,
      nameSize: Math.round(bodyPx * 2.45 * 10) / 10,
      titleSize: Math.round(bodyPx * 1.16 * 10) / 10,
      sectionSize: Math.round(bodyPx * 1.02 * 10) / 10,
      lineHeight: Math.round(bodyPx * lineHeight * 10) / 10,
      gap: GAPS[density],
      railWidth: Math.round(PAGE_WIDTH * (railPercent / 100)),
      photoSize: density === 'compact' ? 92 : density === 'relaxed' ? 124 : 106,
    },
    columns: resolvedColumns,
    railSide,
    fontFamily: design.fontFamily,
    sectionStyle: design.sectionStyle,
    skillStyle: design.skillStyle,
    headingCase: design.headingCase,
    photoShape: template.supportsPhoto ? design.photoShape : 'none',
    showPhoto: template.supportsPhoto && design.showPhoto && design.photoShape !== 'none',
    showTitle: design.showTitle,
    showContact: design.showContact,
  };
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

export function headingFor(design: ResumeDesign, kind: SectionKind): string {
  return design.headings[kind]?.trim() || SECTION_MAP[kind].defaultHeading;
}

export function formatHeading(text: string, style: 'none' | 'upper' | 'title'): string {
  if (style === 'upper') return text.toUpperCase();
  return text;
}

export function isSectionEmpty(content: ResumeContent, kind: SectionKind): boolean {
  switch (kind) {
    case 'summary':
      return !content.summary.trim();
    case 'additional':
      return !content.additional.trim();
    case 'skills':
      return content.skills.length === 0;
    case 'certifications':
      return content.certifications.length === 0;
    case 'training':
      return content.trainings.length === 0;
    case 'experience':
      return !content.experience.some((e) => e.position || e.company || e.details.trim());
    case 'education':
      return !content.education.some((e) => e.degree || e.school || e.details.trim());
    case 'projects':
      return !content.projects.some((p) => p.name || p.details.trim());
    case 'references':
      return !content.references.some((r) => r.name || r.company);
    default:
      return true;
  }
}

/** Visible sections, in the user-defined order, skipping hidden and empty ones. */
export function visibleSections(
  content: ResumeContent,
  design: ResumeDesign
): { kind: SectionKind; rail: SectionKind[]; main: SectionKind[] } {
  const order = normaliseOrder(design.sectionOrder);
  const hidden = new Set<SectionKind>(design.hiddenSections);
  const resolved = resolveDesign(design);

  const active = order.filter((kind) => !hidden.has(kind) && !isSectionEmpty(content, kind));

  if (resolved.columns === 'single') {
    return { kind: active[0] ?? 'summary', rail: [], main: active };
  }

  const railCandidates = resolved.template.railSections.length
    ? resolved.template.railSections
    : DEFAULT_RAIL;
  const rail = active.filter((kind) => railCandidates.includes(kind));
  const main = active.filter((kind) => !railCandidates.includes(kind));

  // Never strand the whole document in the rail.
  if (main.length === 0) {
    return { kind: active[0] ?? 'summary', rail: [], main: active };
  }

  return { kind: main[0] ?? active[0] ?? 'summary', rail, main };
}

export function normaliseOrder(order: SectionKind[]): SectionKind[] {
  const seen = new Set<SectionKind>();
  const result: SectionKind[] = [];
  for (const kind of order) {
    if (SECTION_MAP[kind] && !seen.has(kind)) {
      seen.add(kind);
      result.push(kind);
    }
  }
  for (const meta of DEFAULT_SECTION_ORDER) {
    if (!seen.has(meta)) result.push(meta);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Contact line                                                        */
/* ------------------------------------------------------------------ */

export function contactParts(content: ResumeContent): string[] {
  return [content.phone, content.email, content.address, content.website, content.social]
    .map((v) => v.trim())
    .filter(Boolean);
}

export function isDocumentEmpty(content: ResumeContent): boolean {
  const hasIdentity = !!content.fullName.trim();
  const anyBody = DEFAULT_SECTION_ORDER.some((kind) => !isSectionEmpty(content, kind));
  return !hasIdentity && !anyBody;
}

/* ------------------------------------------------------------------ */
/* Photo source                                                        */
/* ------------------------------------------------------------------ */

/**
 * Profile photos come back from the API as a relative storage path
 * (e.g. `photos/abc.jpg`). Locally picked images arrive as `file://` /
 * `data:` URIs and remote ones as absolute URLs — all three are passed
 * through untouched so the preview and the PDF always show the same face.
 */
export function resolvePhotoSrc(photoUrl: string | null | undefined): string | null {
  const raw = (photoUrl || '').trim();
  if (!raw) return null;
  if (/^(https?:|file:|data:|blob:|content:)/i.test(raw)) return raw;
  return `${API_BASE_URL}/storage/${raw.replace(/^\/+/, '')}`;
}

/* ------------------------------------------------------------------ */
/* Design defaults for a brand new draft                              */
/* ------------------------------------------------------------------ */

export function newDesign(templateKey: TemplateKey = 'modern-professional'): ResumeDesign {
  return applyTemplateDefaults(
    { ...DEFAULT_DESIGN, sectionOrder: [...DEFAULT_SECTION_ORDER] },
    templateKey
  );
}

export function fontFamilyFor(key: ResumeDesign['fontFamily']): string {
  const option = FONT_MAP[key] ?? FONT_MAP.sans;
  if (Platform.OS === 'ios') return option.native.ios;
  if (Platform.OS === 'android') return option.native.android;
  return option.native.default;
}
