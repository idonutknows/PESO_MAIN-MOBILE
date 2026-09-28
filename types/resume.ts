/**
 * Resume Builder — type definitions.
 *
 * The document is split in two:
 *  - `ResumeContent`  = WHAT is written (text, lists, entries)
 *  - `ResumeDesign`   = HOW it looks (template, colour, type, layout, order)
 *
 * Both are edited live and persisted locally, so the builder keeps working
 * even when the API is unreachable.
 */

export type TemplateKey =
  | 'modern-professional'
  | 'formal-executive'
  | 'minimalist'
  | 'formal-corporate'
  | 'creative'
  | 'ats-friendly'
  | 'formal-elegant'
  | 'formal-professional'
  | 'simple-classic'
  | 'formal-traditional';

export type SectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'training'
  | 'references'
  | 'additional';

export type FontKey = 'sans' | 'serif' | 'humanist' | 'slab' | 'mono';
export type DensityKey = 'compact' | 'normal' | 'relaxed';
export type ColumnKey = 'auto' | 'single' | 'double';
export type PhotoShape = 'circle' | 'rounded' | 'square' | 'none';
export type SkillStyle = 'pills' | 'list' | 'inline' | 'bars';
export type SectionStyleKey = 'underline' | 'band' | 'accent-left' | 'boxed' | 'plain';
export type HeadingCase = 'none' | 'upper' | 'title';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

export interface ExperienceEntry {
  id: string;
  position: string;
  company: string;
  location: string;
  period: string;
  details: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  location: string;
  period: string;
  details: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  link: string;
  period: string;
  details: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  position: string;
  company: string;
  contact: string;
}

export interface ResumeContent {
  fullName: string;
  title: string;
  photoUrl: string | null;
  email: string;
  phone: string;
  address: string;
  website: string;
  social: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  certifications: string[];
  projects: ProjectEntry[];
  trainings: string[];
  references: ReferenceEntry[];
  additional: string;
}

/* ------------------------------------------------------------------ */
/* Design                                                              */
/* ------------------------------------------------------------------ */

export interface ResumeDesign {
  templateKey: TemplateKey;
  accentColor: string;
  textColor: string;
  fontFamily: FontKey;
  /** Base body size in points, 8 – 12.5 */
  fontSize: number;
  density: DensityKey;
  lineHeight: number;
  columns: ColumnKey;
  photoShape: PhotoShape;
  skillStyle: SkillStyle;
  sectionStyle: SectionStyleKey;
  headingCase: HeadingCase;
  showPhoto: boolean;
  showTitle: boolean;
  showContact: boolean;
  hiddenSections: SectionKind[];
  sectionOrder: SectionKind[];
  /** Overrides for the built-in section labels. */
  headings: Partial<Record<SectionKind, string>>;
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export type TemplateHeaderStyle =
  | 'gradient'
  | 'solid-bar'
  | 'centered-plain'
  | 'minimal-rule'
  | 'photo-left'
  | 'serif-elegant'
  | 'boxed'
  | 'stacked-rules'
  | 'at-rule'
  | 'duotone-band';

export type TemplateLayout = 'single' | 'rail-left' | 'rail-right' | 'band-top';

export interface ResumeTemplateSpec {
  key: TemplateKey;
  name: string;
  description: string;
  layout: TemplateLayout;
  header: TemplateHeaderStyle;
  sectionStyle: SectionStyleKey;
  skillStyle: SkillStyle;
  photoShape: PhotoShape;
  headingCase: HeadingCase;
  /** Width of the coloured rail as a percentage, when the layout has one. */
  railRatio: number;
  /** Sections that live in the rail for two-column layouts. */
  railSections: SectionKind[];
  accentColor: string;
  textColor: string;
  supportsPhoto: boolean;
}

/* ------------------------------------------------------------------ */
/* Derived design tokens — shared by the native preview and the PDF     */
/* ------------------------------------------------------------------ */

export interface ResolvedPalette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  ink: string;
  body: string;
  muted: string;
  rule: string;
  panel: string;
  onPrimary: string;
  isDarkHeader: boolean;
}

export interface ResolvedMetrics {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  fontSize: number;
  nameSize: number;
  titleSize: number;
  sectionSize: number;
  lineHeight: number;
  gap: number;
  railWidth: number;
  photoSize: number;
}

export interface ResolvedDesign {
  template: ResumeTemplateSpec;
  palette: ResolvedPalette;
  metrics: ResolvedMetrics;
  columns: 'single' | 'double';
  railSide: 'left' | 'right' | 'none';
  fontFamily: FontKey;
  sectionStyle: SectionStyleKey;
  skillStyle: SkillStyle;
  headingCase: HeadingCase;
  photoShape: PhotoShape;
  showPhoto: boolean;
  showTitle: boolean;
  showContact: boolean;
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export interface SavedResume {
  content: ResumeContent;
  design: ResumeDesign;
  savedAt: string;
  /** Where the draft was seeded from, for the "last synced" hint. */
  source: 'profile' | 'restored';
}
