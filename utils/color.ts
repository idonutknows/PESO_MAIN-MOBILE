/** Small hex colour helpers used by the resume design resolver. */

export function normalizeHex(input: string): string {
  let hex = (input || '').trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#000000';
  return `#${hex.toLowerCase()}`;
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const clean = normalizeHex(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const part = (n: number) =>
    clamp(Math.round(n), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Lighten toward white. `amount` 0–1. */
export function lighten(hex: string, amount: number): string {
  const { r, g, b } = toRgb(hex);
  const mix = (c: number) => c + (255 - c) * amount;
  return toHex({ r: mix(r), g: mix(g), b: mix(b) });
}

/** Darken toward black. `amount` 0–1. */
export function darken(hex: string, amount: number): string {
  const { r, g, b } = toRgb(hex);
  const mix = (c: number) => c * (1 - amount);
  return toHex({ r: mix(r), g: mix(g), b: mix(b) });
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

/** Perceived luminance, 0–1. */
export function luminance(hex: string): number {
  const { r, g, b } = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.55;
}

/** Readable foreground for a coloured background. */
export function readableOn(hex: string): string {
  return isDark(hex) ? '#FFFFFF' : '#111827';
}
