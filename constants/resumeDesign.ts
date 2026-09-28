import type {
  DensityKey,
  FontKey,
  PhotoShape,
  ResumeDesign,
  ResumeTemplateSpec,
  SectionKind,
  SectionStyleKey,
  SkillStyle,
  TemplateKey,
} from '@/types/resume';

/* ------------------------------------------------------------------ */
/* Section registry                                                    */
/* ------------------------------------------------------------------ */

export interface SectionMeta {
  kind: SectionKind;
  label: string;
  defaultHeading: string;
  icon: string;
  /** Sections that render as free text only — no repeatable entries. */
  plain?: boolean;
}

export const SECTIONS: SectionMeta[] = [
  { kind: 'summary', label: 'Professional Summary', defaultHeading: 'Professional Summary', icon: '👤' },
  { kind: 'experience', label: 'Work Experience', defaultHeading: 'Work Experience', icon: '💼' },
  { kind: 'education', label: 'Education', defaultHeading: 'Education', icon: '🎓' },
  { kind: 'skills', label: 'Skills', defaultHeading: 'Skills', icon: '🛠️' },
  { kind: 'certifications', label: 'Certifications', defaultHeading: 'Certifications', icon: '📜' },
  { kind: 'projects', label: 'Projects', defaultHeading: 'Projects', icon: '💡' },
  { kind: 'training', label: 'Training', defaultHeading: 'Training & Seminars', icon: '🎓' },
  { kind: 'references', label: 'References', defaultHeading: 'References', icon: '📋' },
  { kind: 'additional', label: 'Other Information', defaultHeading: 'Additional Information', icon: '➕' },
];

export const SECTION_MAP: Record<SectionKind, SectionMeta> = SECTIONS.reduce(
  (acc, meta) => {
    acc[meta.kind] = meta;
    return acc;
  },
  {} as Record<SectionKind, SectionMeta>
);

export const DEFAULT_SECTION_ORDER: SectionKind[] = SECTIONS.map((s) => s.kind);

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

const RAIL_SKILLS: SectionKind[] = ['skills', 'certifications', 'training', 'references'];
const RAIL_CONTACT: SectionKind[] = ['skills', 'training', 'certifications', 'references'];

export const RESUME_TEMPLATES: ResumeTemplateSpec[] = [
  {
    key: 'modern-professional',
    name: 'Modern Professional',
    description: 'Full-width gradient banner with a bold name and clean single column body.',
    layout: 'single',
    header: 'gradient',
    sectionStyle: 'underline',
    skillStyle: 'pills',
    photoShape: 'circle',
    headingCase: 'upper',
    railRatio: 0,
    railSections: [],
    accentColor: '#2563EB',
    textColor: '#1F2937',
    supportsPhoto: true,
  },
  {
    key: 'formal-executive',
    name: 'Executive',
    description: 'Dark navy side rail with gold rules — a senior, boardroom-ready layout.',
    layout: 'rail-left',
    header: 'solid-bar',
    sectionStyle: 'accent-left',
    skillStyle: 'list',
    photoShape: 'square',
    headingCase: 'upper',
    railRatio: 34,
    railSections: ['skills', 'certifications', 'training', 'references'],
    accentColor: '#B8860B',
    textColor: '#1A1A2E',
    supportsPhoto: true,
  },
  {
    key: 'minimalist',
    name: 'Minimalist',
    description: 'Generous whitespace, hairline rules and letter-spaced small caps.',
    layout: 'single',
    header: 'minimal-rule',
    sectionStyle: 'plain',
    skillStyle: 'inline',
    photoShape: 'circle',
    headingCase: 'upper',
    railRatio: 0,
    railSections: [],
    accentColor: '#334155',
    textColor: '#111827',
    supportsPhoto: true,
  },
  {
    key: 'formal-corporate',
    name: 'Corporate',
    description: 'Structured corporate report style with section bands and a boxed header.',
    layout: 'single',
    header: 'boxed',
    sectionStyle: 'band',
    skillStyle: 'list',
    photoShape: 'square',
    headingCase: 'upper',
    railRatio: 0,
    railSections: [],
    accentColor: '#0F172A',
    textColor: '#1E293B',
    supportsPhoto: true,
  },
  {
    key: 'creative',
    name: 'Creative',
    description: 'Two-column layout with a coloured rail for skills and a free-form body.',
    layout: 'rail-left',
    header: 'photo-left',
    sectionStyle: 'underline',
    skillStyle: 'pills',
    photoShape: 'circle',
    headingCase: 'title',
    railRatio: 32,
    railSections: ['skills', 'certifications', 'training'],
    accentColor: '#7C3AED',
    textColor: '#1F2937',
    supportsPhoto: true,
  },
  {
    key: 'ats-friendly',
    name: 'ATS-Friendly',
    description: 'Single column, plain black and white, no graphics — built for screeners.',
    layout: 'single',
    header: 'at-rule',
    sectionStyle: 'plain',
    skillStyle: 'inline',
    photoShape: 'none',
    headingCase: 'upper',
    railRatio: 0,
    railSections: [],
    accentColor: '#000000',
    textColor: '#000000',
    supportsPhoto: false,
  },
  {
    key: 'formal-elegant',
    name: 'Elegant',
    description: 'Serif typography on warm tones with centred, understated headings.',
    layout: 'single',
    header: 'serif-elegant',
    sectionStyle: 'plain',
    skillStyle: 'list',
    photoShape: 'rounded',
    headingCase: 'title',
    railRatio: 0,
    railSections: [],
    accentColor: '#8B5E3C',
    textColor: '#2D2D2D',
    supportsPhoto: true,
  },
  {
    key: 'formal-professional',
    name: 'Two-Column Professional',
    description: 'Right-hand rail keeps contact and credentials in view while the story runs left.',
    layout: 'rail-right',
    header: 'duotone-band',
    sectionStyle: 'boxed',
    skillStyle: 'bars',
    photoShape: 'circle',
    headingCase: 'upper',
    railRatio: 30,
    railSections: RAIL_CONTACT,
    accentColor: '#0F3B5E',
    textColor: '#1E293B',
    supportsPhoto: true,
  },
  {
    key: 'simple-classic',
    name: 'Clean Modern',
    description: 'Left rail paired with a wide main column for a balanced, airy page.',
    layout: 'rail-left',
    header: 'stacked-rules',
    sectionStyle: 'underline',
    skillStyle: 'list',
    photoShape: 'circle',
    headingCase: 'none',
    railRatio: 36,
    railSections: RAIL_SKILLS,
    accentColor: '#0F766E',
    textColor: '#1F2937',
    supportsPhoto: true,
  },
  {
    key: 'formal-traditional',
    name: 'Academic / Professional',
    description: 'Centre-aligned academic layout with ruled separators and numbered sections.',
    layout: 'single',
    header: 'centered-plain',
    sectionStyle: 'boxed',
    skillStyle: 'list',
    photoShape: 'square',
    headingCase: 'upper',
    railRatio: 0,
    railSections: [],
    accentColor: '#1D4ED8',
    textColor: '#1F2937',
    supportsPhoto: true,
  },
];

export const TEMPLATE_MAP: Record<TemplateKey, ResumeTemplateSpec> = RESUME_TEMPLATES.reduce(
  (acc, spec) => {
    acc[spec.key] = spec;
    return acc;
  },
  {} as Record<TemplateKey, ResumeTemplateSpec>
);

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

export interface FontOption {
  key: FontKey;
  label: string;
  /** Web / print stack — every family here is guaranteed to resolve. */
  css: string;
  /** React Native family per platform. */
  native: { ios: string; android: string; default: string };
}

export const FONT_OPTIONS: FontOption[] = [
  {
    key: 'sans',
    label: 'Sans Serif',
    css: "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', sans-serif",
    native: { ios: 'System', android: 'sans-serif', default: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  },
  {
    key: 'humanist',
    label: 'Humanist',
    css: "'Trebuchet MS', 'Segoe UI', Tahoma, Verdana, sans-serif",
    native: { ios: 'Avenir Next', android: 'sans-serif', default: "'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif" },
  },
  {
    key: 'serif',
    label: 'Serif',
    css: "Georgia, 'Times New Roman', Times, 'Liberation Serif', serif",
    native: { ios: 'Georgia', android: 'serif', default: "Georgia, 'Times New Roman', Times, serif" },
  },
  {
    key: 'slab',
    label: 'Slab Serif',
    css: "Rockwell, 'Roboto Slab', 'Bookman Old Style', Georgia, serif",
    native: { ios: 'Rockwell', android: 'serif', default: "Rockwell, 'Bookman Old Style', Georgia, serif" },
  },
  {
    key: 'mono',
    label: 'Monospace',
    css: "'Courier New', Courier, 'Liberation Mono', monospace",
    native: { ios: 'Menlo', android: 'monospace', default: "'Courier New', Courier, monospace" },
  },
];

export const FONT_MAP: Record<FontKey, FontOption> = FONT_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.key] = opt;
    return acc;
  },
  {} as Record<FontKey, FontOption>
);

/* ------------------------------------------------------------------ */
/* Colour presets                                                      */
/* ------------------------------------------------------------------ */

export interface AccentPreset {
  name: string;
  value: string;
  onPrimary: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Ocean', value: '#0F766E', onPrimary: '#FFFFFF' },
  { name: 'PESO Teal', value: '#0A7EA4', onPrimary: '#FFFFFF' },
  { name: 'Royal', value: '#2563EB', onPrimary: '#FFFFFF' },
  { name: 'Navy', value: '#0F3B5E', onPrimary: '#FFFFFF' },
  { name: 'Violet', value: '#7C3AED', onPrimary: '#FFFFFF' },
  { name: 'Crimson', value: '#B91C1C', onPrimary: '#FFFFFF' },
  { name: 'Amber', value: '#B45309', onPrimary: '#FFFFFF' },
  { name: 'Gold', value: '#8B5E3C', onPrimary: '#FFFFFF' },
  { name: 'Slate', value: '#334155', onPrimary: '#FFFFFF' },
  { name: 'Ink', value: '#111827', onPrimary: '#FFFFFF' },
];

export const TEXT_COLOR_PRESETS: { name: string; value: string }[] = [
  { name: 'Ink', value: '#111827' },
  { name: 'Slate', value: '#334155' },
  { name: 'Charcoal', value: '#1F2937' },
  { name: 'Black', value: '#000000' },
];

export const PHOTO_SHAPES: { key: PhotoShape; label: string }[] = [
  { key: 'circle', label: 'Circle' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'square', label: 'Square' },
  { key: 'none', label: 'No Photo' },
];

export const SKILL_STYLES: { key: SkillStyle; label: string; hint: string }[] = [
  { key: 'pills', label: 'Pills', hint: 'Rounded tags' },
  { key: 'list', label: 'Bullets', hint: 'Simple list' },
  { key: 'inline', label: 'Inline', hint: 'Comma separated' },
  { key: 'bars', label: 'Tag Grid', hint: 'Dense blocks' },
];

export const SECTION_STYLES: { key: SectionStyleKey; label: string }[] = [
  { key: 'underline', label: 'Underline' },
  { key: 'band', label: 'Filled Band' },
  { key: 'accent-left', label: 'Accent Bar' },
  { key: 'boxed', label: 'Boxed' },
  { key: 'plain', label: 'Plain Caps' },
];

export const DENSITY_OPTIONS: { key: DensityKey; label: string }[] = [
  { key: 'compact', label: 'Compact' },
  { key: 'normal', label: 'Normal' },
  { key: 'relaxed', label: 'Relaxed' },
];

export const COLUMN_OPTIONS: { key: 'auto' | 'single' | 'double'; label: string }[] = [
  { key: 'auto', label: 'Template Default' },
  { key: 'single', label: 'Single Column' },
  { key: 'double', label: 'Two Column' },
];

export const FONT_SIZE_RANGE = { min: 8, max: 12.5, step: 0.5 };
export const LINE_HEIGHT_RANGE = { min: 1.2, max: 1.8, step: 0.05 };

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_DESIGN: ResumeDesign = {
  templateKey: 'modern-professional',
  accentColor: '#0A7EA4',
  textColor: '#1F2937',
  fontFamily: 'sans',
  fontSize: 10,
  density: 'normal',
  lineHeight: 1.45,
  columns: 'auto',
  photoShape: 'circle',
  skillStyle: 'pills',
  sectionStyle: 'underline',
  headingCase: 'upper',
  showPhoto: true,
  showTitle: true,
  showContact: true,
  hiddenSections: [],
  sectionOrder: DEFAULT_SECTION_ORDER,
  headings: {},
};
