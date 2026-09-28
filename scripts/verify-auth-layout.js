/**
 * Asserts that the Login and Create Account screens fit inside the mobile
 * viewport with no vertical scrollbar and no horizontal overflow.
 *
 * The check reuses `utils/authLayout.ts` — the same module the screens render
 * from — so it fails if the layout ever grows back.
 *
 * Run with:
 *   npx tsc utils/authLayout.ts --ignoreConfig --outDir .auth-layout-check --module commonjs --target es2019
 *   node scripts/verify-auth-layout.js
 */

const path = require('path');

let layout;
try {
  layout = require(path.join(__dirname, '..', '.auth-layout-check', 'authLayout.js'));
} catch (err) {
  console.error(
    'Could not load the compiled metrics module. Run the tsc step from the header first.\n' +
      String(err && err.message)
  );
  process.exit(2);
}

const { buildAuthLayout, TARGET_VIEWPORTS, CONSERVATIVE_INSETS } = layout;

/** Minimum comfortable tap target. */
const MIN_TAP_TARGET = 44;

/** Narrowest field the layout may rely on before it could overflow sideways. */
const MIN_FIELD_WIDTH = 180;

const SCREENS = [
  { name: 'Login', fields: 2, extraRows: 1 },
  { name: 'Register', fields: 4, extraRows: 0 },
];

/** The pre-redesign stack, for a before/after comparison in the output. */
function legacyHeight({ fields, extraRows }) {
  const header = 140 + 24 + 30 * 2 + 8 + 17 + 32; // logo, gaps, 2-line title, tagline
  const cardHeader = Math.round(26 * 1.2) + 4 + Math.round(14 * 1.35) + 28;
  const field = 21 + 54 + 18; // label + 54px input + group margin
  const divider = 24 * 2 + 14;
  const chrome = 40 * 2 + 20 + 60 + 8; // scroll padding, card margin, bottom decor
  return header + chrome + 32 + 28 + cardHeader + field * fields + extraRows * 42 + 54 + divider + 54;
}

let failures = 0;
const pad = (label) => String(label).padEnd(9);
const fixed = (n, w) => String(n).padStart(w);

function check(label, ok) {
  if (!ok) {
    failures += 1;
    console.log(`    FAIL  ${label}`);
  }
  return ok;
}

console.log('Auth layout fit check — worst-case safe areas 47 top / 34 bottom\n');

for (const viewport of TARGET_VIEWPORTS) {
  console.log(`${pad(viewport.name)} ${viewport.width}x${viewport.height}`);
  for (const screen of SCREENS) {
    const result = buildAuthLayout({
      width: viewport.width,
      height: viewport.height,
      insets: CONSERVATIVE_INSETS,
      fields: screen.fields,
      extraRows: screen.extraRows,
    });
    const m = result.metrics;
    const slack = result.usable - result.contentHeight;

    const ok = check('fits vertically', result.fits);
    const tapsOk = check(
      'tap targets >= 44px',
      m.inputHeight >= MIN_TAP_TARGET && m.buttonHeight >= MIN_TAP_TARGET
    );
    const widthOk = check('no horizontal overflow', m.gutter * 2 + MIN_FIELD_WIDTH <= viewport.width);

    const status = ok && tapsOk && widthOk ? 'fits' : 'OVERFLOW';
    const was = legacyHeight(screen);
    console.log(
      `  ${pad(screen.name)} ${fixed(result.contentHeight, 3)}px / ${fixed(
        result.usable,
        3
      )}px  ${status}  slack ${fixed(slack, 4)}  density ${m.density.toFixed(
        2
      )}  level ${result.level}  (was ${was}px, -${Math.round(
        (1 - result.contentHeight / was) * 100
      )}%)`
    );
  }
  console.log('');
}

// Keyboard-open is the case that regresses most easily: the form must still be
// fully usable, not clipped, while the user is typing.
console.log('Keyboard open (190px soft keyboard)');
for (const viewport of TARGET_VIEWPORTS) {
  for (const screen of SCREENS) {
    const result = buildAuthLayout({
      width: viewport.width,
      height: viewport.height,
      insets: CONSERVATIVE_INSETS,
      fields: screen.fields,
      extraRows: screen.extraRows,
      keyboardOpen: true,
    });
    const m = result.metrics;
    const ok = check(`${screen.name} fits with keyboard`, result.fits);
    const tapsOk = check(`${screen.name} tap targets >= 44px`, m.inputHeight >= MIN_TAP_TARGET);
    console.log(
      `  ${pad(viewport.name)} ${pad(screen.name)} ${fixed(
        result.contentHeight,
        3
      )}px / ${fixed(result.usable, 3)}px  ${ok && tapsOk ? 'fits' : 'OVERFLOW'}  ` +
        `level ${result.level}  header ${m.showHeader ? 'shown' : 'hidden'}  ` +
        `labels ${m.showFieldLabels ? 'shown' : 'as placeholders'}`
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll target viewports fit with no vertical or horizontal overflow.');
