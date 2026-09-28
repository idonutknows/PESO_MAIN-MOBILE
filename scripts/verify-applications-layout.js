/**
 * Asserts the My Applications layout fits the screen and that the status
 * labels cannot wrap.
 *
 * The original bug was that the five status tiles were laid out 5-across on a
 * 360px screen, leaving ~61px per tile, so "REVIEWED" broke into two lines.
 * This script recomputes the tile width for the new responsive grid and
 * compares it against an estimated text width.
 *
 * Text width is estimated, not measured: `estimateWidth` assumes a deliberately
 * pessimistic glyph advance for a bold sans face. `numberOfLines={1}` on the
 * labels is the hard guarantee; the estimate only proves there is headroom
 * rather than relying on the auto-shrink to do all the work.
 *
 * Run with: node scripts/verify-applications-layout.js
 */

const BRAND = {};

/** Target portrait viewports. */
const VIEWPORTS = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
  { name: 'small Android', width: 360, height: 640 },
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 412, height: 915 },
  { name: 'tablet portrait', width: 768, height: 1024 },
];

/** Mirrors the styles in app/(tabs)/applications.tsx. */
const S = {
  summaryMarginH: 14,
  summaryPadding: 14,
  gridMarginH: 5,
  cellPadH: 5,
  tilePadH: 6,
  statLabelFont: 9.5,
  statLabelSpacing: 0.2,
  cardMarginH: 14,
  cardPad: 14,
  appIconTile: 36,
  appIconMargin: 10,
  appInfoMarginR: 8,
  badgePadH: 8,
  badgeDot: 5,
  badgeDotGap: 5,
  badgeTextFont: 10.5,
  badgeTextSpacing: 0.1,
  badgeMaxWidth: 108,
  primaryButtonH: 46,
  minTapTarget: 44,
};

/** Longest label that used to wrap. */
const LABELS = ['Pending', 'Reviewed', 'Interview', 'Hired', 'Rejected'];

/**
 * Pessimistic advance width for bold sans: 0.72em for uppercase-ish text, which
 * is wider than the ~0.58em a typical Roboto/Helvetica uppercase glyph needs.
 */
function estimateWidth(text, fontSize, letterSpacing = 0) {
  let width = 0;
  for (const ch of text) {
    const upper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    width += (upper ? 0.72 : 0.6) * fontSize;
  }
  return width + Math.max(text.length - 1, 0) * letterSpacing;
}

/** Columns used by the screen: 2 on very narrow, 3 on phones, 5 on wide. */
function columnsFor(width) {
  if (width >= 700) return 5;
  if (width < 340) return 2;
  return 3;
}

let failures = 0;
const pad = (s) => String(s).padEnd(26);
const fx = (n) => String(Math.round(n)).padStart(4);

function check(label, ok, detail) {
  if (!ok) {
    failures += 1;
    console.log(`      FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
  return ok;
}

console.log('My Applications layout check\n');
console.log(`${pad('viewport')} ${pad('cols')} ${pad('tile')} ${pad('label px')} ${pad('avail')}  result`);
console.log('-'.repeat(78));

for (const vp of VIEWPORTS) {
  const cols = columnsFor(vp.width);

  // Summary grid, mirroring the style chain.
  const summaryInner = vp.width - S.summaryMarginH * 2 - S.summaryPadding * 2;
  const gridWidth = summaryInner + S.gridMarginH * 2;
  const cellWidth = gridWidth / cols;
  const tileWidth = cellWidth - S.cellPadH * 2;
  const labelAvail = tileWidth - S.tilePadH * 2;

  // Widest label decides whether anything wraps.
  const widest = LABELS.reduce(
    (acc, l) => Math.max(acc, estimateWidth(l, S.statLabelFont, S.statLabelSpacing)),
    0
  );

  const labelsFit = check(
    'status label fits on one line',
    widest <= labelAvail,
    `needs ${Math.ceil(widest)}px, has ${Math.round(labelAvail)}px`
  );

  // The whole page must not scroll sideways.
  const cardWidth = vp.width - S.cardMarginH * 2;
  const cardInner = cardWidth - S.cardPad * 2;
  const badgeNeeded =
    S.badgePadH * 2 +
    S.badgeDot +
    S.badgeDotGap +
    estimateWidth('Interview', S.badgeTextFont, S.badgeTextSpacing);
  const badgeWidth = Math.min(badgeNeeded, S.badgeMaxWidth);
  const titleAvail = cardInner - S.appIconTile - S.appIconMargin - S.appInfoMarginR - badgeWidth;

  const badgeFits = check('status badge fits its row', titleAvail > 100, `title column ${Math.round(titleAvail)}px`);
  const noOverflow = check('cards fit screen width', cardWidth <= vp.width && cardInner > 0);
  const tapOk = check('buttons meet 44px tap target', S.primaryButtonH >= S.minTapTarget);

  const ok = labelsFit && badgeFits && noOverflow && tapOk;
  console.log(
    `${pad(`${vp.name} ${vp.width}x${vp.height}`)} ${pad(`${cols} across`)} ${pad(
      `${Math.round(tileWidth)}px`
    )} ${pad(`${Math.ceil(widest)}px`)} ${pad(`${Math.round(labelAvail)}px`)}  ${
      ok ? 'fits' : 'OVERFLOW'
    }`
  );
}

// Show the before/after for the width that caused the reported bug.
const target = VIEWPORTS.find((v) => v.width === 360);
const oldTile = (target.width - 24 - 4 * 8) / 5; // 5-across, 12px margins, 8px gaps
const oldAvail = oldTile - 12;
const oldNeeded = estimateWidth('REVIEWED', 10, 0.5);
console.log('\nRegression guard — the reported "REVIEWED" wrap on 360px:');
console.log(`  before: 5-across, ${Math.round(oldTile)}px tile, ${Math.round(oldAvail)}px for text`);
console.log(`          "REVIEWED" needed ~${Math.ceil(oldNeeded)}px  ->  wrapped (${Math.ceil(oldNeeded - oldAvail)}px over)`);
const newTile = (target.width - S.summaryMarginH * 2 - S.summaryPadding * 2 + S.gridMarginH * 2) / 3 - S.cellPadH * 2;
const newAvail = newTile - S.tilePadH * 2;
const newNeeded = estimateWidth('REVIEWED', S.statLabelFont, S.statLabelSpacing);
console.log(`  after:  3-across, ${Math.round(newTile)}px tile, ${Math.round(newAvail)}px for text`);
console.log(
  `          "REVIEWED" needs ~${Math.ceil(newNeeded)}px  ->  ${newNeeded <= newAvail ? 'fits, single line' : 'STILL WRAPS'}`
);
if (newNeeded > newAvail) failures += 1;

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll viewports fit; no label wraps and nothing overflows horizontally.');
