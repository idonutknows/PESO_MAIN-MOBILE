/**
 * Responsive layout for the Login and Create Account screens.
 *
 * Both screens must fit inside the mobile viewport with no vertical scrolling,
 * so the vertical rhythm cannot be a pile of magic numbers. This module turns
 * the available space into a set of metrics and, crucially, *chooses a density
 * that fits* by degrading the least important things first:
 *
 *   tagline  ->  card subtitle  ->  brand header  ->  field labels
 *
 * Tap-target sizes (44px) and the error-message line are never sacrificed,
 * because both matter more than decoration.
 *
 * The same arithmetic is exposed through `buildAuthLayout`, so "does it fit?"
 * is answered by `scripts/verify-auth-layout.js` instead of by eyeballing a
 * screenshot. If the layout ever grows back, that script fails.
 */

export interface AuthInsets {
  top: number;
  bottom: number;
}

export type DegradeLevel = 'full' | 'noTagline' | 'noSubtitle' | 'noHeader' | 'noLabels';

export interface AuthMetrics {
  /** Scalar the vertical sizes are multiplied by. */
  density: number;
  /** Horizontal gutter, keeps content clear of the screen edges. */
  gutter: number;
  /** Padding above the header and below the card. */
  verticalPadding: number;

  showHeader: boolean;
  logoSize: number;
  logoGlowSize: number;
  logoGap: number;
  headerTitleSize: number;
  headerTitleLineHeight: number;
  headerTitleLines: 1 | 2;
  showTagline: boolean;
  taglineSize: number;
  headerGap: number;

  showCardSubtitle: boolean;
  cardRadius: number;
  cardPadX: number;
  cardPadTop: number;
  cardPadBottom: number;
  cardTitleSize: number;
  cardSubtitleSize: number;
  cardHeaderGap: number;

  showFieldLabels: boolean;
  labelSize: number;
  labelLineHeight: number;
  labelGap: number;
  inputHeight: number;
  inputFontSize: number;
  iconSize: number;
  iconPadX: number;
  /** Reserved line under every input so an error never shifts the layout. */
  errorHeight: number;
  errorFontSize: number;
  groupGap: number;

  buttonHeight: number;
  buttonFontSize: number;
  buttonRadius: number;
  buttonGap: number;
  /** Forgot-password row on Login. */
  forgotSize: number;
  /** Secondary link row (Create Account / Sign In). */
  linkSize: number;
  linkGap: number;

  brand: readonly [string, string, string];
  brandText: string;
  fieldBorder: string;
  fieldBg: string;
  iconColor: string;
  fieldText: string;
  muted: string;
  label: string;
}

export interface AuthLayoutInput {
  width: number;
  height: number;
  insets: AuthInsets;
  /** Number of input fields on the screen. */
  fields: number;
  /** Extra fixed rows inside the card, e.g. Login's "Forgot Password". */
  extraRows?: number;
  keyboardOpen?: boolean;
}

export interface AuthLayout {
  metrics: AuthMetrics;
  level: DegradeLevel;
  /** Rendered height of the whole screen, in dp. */
  contentHeight: number;
  /** Height actually available between the insets. */
  usable: number;
  fits: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Rounds to whole pixels so borders and shadows land crisply. */
const px = (value: number) => Math.round(value);

/** Height the metrics are authored against. */
const REFERENCE_HEIGHT = 720;

/** How much viewport the soft keyboard is assumed to take. */
const KEYBOARD_INSET = 190;

const DEGRADE_ORDER: DegradeLevel[] = ['full', 'noTagline', 'noSubtitle', 'noHeader', 'noLabels'];

const FLAGS_BY_LEVEL: Record<
  DegradeLevel,
  { tagline: boolean; subtitle: boolean; header: boolean; labels: boolean }
> = {
  full: { tagline: true, subtitle: true, header: true, labels: true },
  noTagline: { tagline: false, subtitle: true, header: true, labels: true },
  noSubtitle: { tagline: false, subtitle: false, header: true, labels: true },
  noHeader: { tagline: false, subtitle: false, header: false, labels: true },
  noLabels: { tagline: false, subtitle: false, header: false, labels: false },
};

function buildMetrics(
  width: number,
  usable: number,
  level: DegradeLevel
): AuthMetrics {
  const flags = FLAGS_BY_LEVEL[level];
  // The floor only bounds spacing and padding — `inputHeight` and
  // `buttonHeight` have their own 44px hard floors, so a cramped screen stays
  // tappable.
  const density = clamp(usable / REFERENCE_HEIGHT, 0.68, 1.18);
  const gutter = px(clamp(width * 0.055, 16, 28));

  // Typography scales more gently than spacing so text stays readable.
  const type = clamp(density, 0.92, 1.12);
  // The reserved error line is allowed to compress a little further because it
  // is a single short line of 10pt text.
  const micro = clamp(density, 0.85, 1.05);

  return {
    density,
    gutter,
    verticalPadding: px(clamp(8 * density, 6, 16)),

    showHeader: flags.header,
    logoSize: px(clamp(58 * density, 44, 76)),
    logoGlowSize: px(clamp(70 * density, 52, 92)),
    logoGap: px(5 * density),
    headerTitleSize: px(16 * type),
    headerTitleLineHeight: px(20 * type),
    headerTitleLines: usable >= 700 ? 2 : 1,
    showTagline: flags.tagline,
    taglineSize: px(11.5 * type),
    headerGap: flags.header ? px(clamp(9 * density, 6, 16)) : 0,

    showCardSubtitle: flags.subtitle,
    cardRadius: px(clamp(22 * density, 18, 28)),
    cardPadX: px(clamp(17 * density, 14, 24)),
    cardPadTop: px(clamp(14 * density, 10, 20)),
    cardPadBottom: px(clamp(12 * density, 9, 18)),
    cardTitleSize: px(17 * type),
    cardSubtitleSize: px(10.5 * type),
    cardHeaderGap: px(clamp(9 * density, 5, 14)),

    showFieldLabels: flags.labels,
    labelSize: px(10 * type),
    labelLineHeight: px(13 * type),
    labelGap: px(3 * density),
    // 44 is the smallest comfortable tap target, so it is a hard floor.
    inputHeight: Math.max(44, px(48 * density)),
    inputFontSize: px(13.5 * type),
    iconSize: px(17 * type),
    iconPadX: px(10 * density),
    errorHeight: px(12.5 * micro),
    errorFontSize: px(10 * type),
    groupGap: px(clamp(7 * density, 4, 11)),

    buttonHeight: Math.max(44, px(50 * density)),
    buttonFontSize: px(14.5 * type),
    buttonRadius: px(clamp(14 * density, 12, 18)),
    buttonGap: px(clamp(9 * density, 5, 14)),
    forgotSize: px(11 * type),
    linkSize: px(11.5 * type),
    linkGap: px(clamp(8 * density, 5, 12)),

    brand: ['#0F6FAF', '#1597C8', '#1BB8A6'],
    brandText: '#0F6FAF',
    fieldBorder: '#E2E8F0',
    fieldBg: '#F8FAFC',
    iconColor: '#94A3B8',
    fieldText: '#11181C',
    muted: '#8E8E93',
    label: '#374151',
  };
}

/** One input block: label + field + always-reserved error line. */
function fieldHeight(m: AuthMetrics): number {
  return (
    (m.showFieldLabels ? m.labelLineHeight + m.labelGap : 0) + m.inputHeight + m.errorHeight
  );
}

/** Branding header: logo + title + optional tagline. */
function headerHeight(m: AuthMetrics): number {
  if (!m.showHeader) return 0;
  return (
    m.logoSize +
    m.logoGap +
    m.headerTitleLineHeight * m.headerTitleLines +
    (m.showTagline ? Math.round(m.taglineSize * 1.3) : 0)
  );
}

/** Card title + optional subtitle. */
function cardHeaderHeight(m: AuthMetrics): number {
  const title = Math.round(m.cardTitleSize * 1.2);
  const subtitle = m.showCardSubtitle ? Math.round(m.cardSubtitleSize * 1.35) : 0;
  return title + (subtitle ? subtitle + 2 : 0) + m.cardHeaderGap;
}

/**
 * Total rendered height for a screen, in the same units the styles use.
 *
 * The trailing gap of the last row is not counted because the card's own
 * bottom padding takes its place.
 */
function contentHeight(m: AuthMetrics, fieldCount: number, extraRows: number): number {
  const fields = fieldCount * fieldHeight(m) + Math.max(fieldCount - 1, 0) * m.groupGap;
  const button = m.buttonHeight + m.buttonGap + m.linkGap + Math.round(m.linkSize * 1.3);
  const extra = extraRows * (Math.round(m.forgotSize * 1.3) + m.linkGap);

  return (
    m.verticalPadding * 2 +
    headerHeight(m) +
    m.headerGap +
    m.cardPadTop +
    cardHeaderHeight(m) +
    fields +
    extra +
    button +
    m.cardPadBottom
  );
}

/**
 * Picks the richest degrade level that still fits, then returns its metrics.
 *
 * The keyboard-open case is what makes this adaptive rather than decorative:
 * on a 360x640 screen the Register form simply cannot show a brand header, a
 * subtitle and four labels at once, so the header and labels are dropped and
 * the labels are carried over to `accessibilityLabel` on each input instead.
 */
export function buildAuthLayout(input: AuthLayoutInput): AuthLayout {
  const { width, height, insets, fields, extraRows = 0, keyboardOpen = false } = input;
  const usable = Math.max(
    240,
    height - insets.top - insets.bottom - (keyboardOpen ? KEYBOARD_INSET : 0)
  );

  let chosen: { level: DegradeLevel; metrics: AuthMetrics; contentHeight: number } | null = null;

  for (const level of DEGRADE_ORDER) {
    const metrics = buildMetrics(width, usable, level);
    const height2 = contentHeight(metrics, fields, extraRows);
    if (height2 <= usable) {
      chosen = { level, metrics, contentHeight: height2 };
      break;
    }
  }

  // Nothing fit — use the most degraded level and let the caller know.
  if (!chosen) {
    const level: DegradeLevel = 'noLabels';
    const metrics = buildMetrics(width, usable, level);
    chosen = { level, metrics, contentHeight: contentHeight(metrics, fields, extraRows) };
  }

  return {
    metrics: chosen.metrics,
    level: chosen.level,
    contentHeight: chosen.contentHeight,
    usable,
    fits: chosen.contentHeight <= usable,
  };
}

/** Viewports the layout must fit, used by the verification script. */
export const TARGET_VIEWPORTS: { name: string; width: number; height: number }[] = [
  { name: 'small (360x640)', width: 360, height: 640 },
  { name: 'iphone-se (375x667)', width: 375, height: 667 },
  { name: 'iphone-14 (390x844)', width: 390, height: 844 },
  { name: 'iphone-14-pro-max (412x915)', width: 412, height: 915 },
];

/** Worst-case safe areas: status bar and gesture bar at once. */
export const CONSERVATIVE_INSETS: AuthInsets = { top: 47, bottom: 34 };
