import { FONT_MAP } from '@/constants/resumeDesign';
import {
  contactParts,
  formatHeading,
  headingFor,
  resolveDesign,
  resolvePhotoSrc,
  visibleSections,
} from '@/utils/resumeModel';
import { withAlpha } from '@/utils/color';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ReferenceEntry,
  ResumeContent,
  ResumeDesign,
  ResolvedDesign,
  SectionKind,
} from '@/types/resume';

/* ------------------------------------------------------------------ */
/* Escaping                                                            */
/* ------------------------------------------------------------------ */

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((v) => v.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean);
}

function bullets(value: string, className = ''): string {
  const items = lines(value);
  if (!items.length) return '';
  const cls = className ? ` class="${className}"` : '';
  return `<ul${cls}>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

/* ------------------------------------------------------------------ */
/* Shared stylesheet                                                   */
/* ------------------------------------------------------------------ */

function stylesheet(resolved: ResolvedDesign, design: ResumeDesign): string {
  const { palette, metrics, template } = resolved;
  const font = FONT_MAP[resolved.fontFamily] ?? FONT_MAP.sans;
  const pad = Math.round(metrics.margin * 0.62);
  const railPad = pad;
  const serif = resolved.fontFamily === 'serif' || resolved.fontFamily === 'slab';
  const caseStyle =
    resolved.headingCase === 'upper'
      ? `text-transform: uppercase; letter-spacing: 1.4px;`
      : '';

  const headingBase = `
    margin: 0 0 ${Math.round(metrics.gap * 0.5)}px 0;
    font-size: ${metrics.sectionSize}px;
    line-height: 1.3;
    font-weight: 700;
    color: ${palette.ink};
  `;

  const headingVariants: Record<string, string> = {
    underline: `
      .sec-title { ${headingBase} padding-bottom: 5px; border-bottom: 1.4px solid ${palette.primary}; ${caseStyle} }
      .sec-title .idx { color: ${palette.primary}; margin-right: 7px; }
    `,
    band: `
      .sec-title { ${headingBase} background: ${palette.primary}; color: ${palette.onPrimary};
        padding: 6px 10px; border-radius: 3px; display: inline-block; ${caseStyle} }
      .sec-title .idx { color: ${palette.onPrimary}; opacity: .75; margin-right: 7px; }
    `,
    'accent-left': `
      .sec-title { ${headingBase} border-left: 4px solid ${palette.primary}; padding: 3px 0 3px 10px; ${caseStyle} }
      .sec-title .idx { color: ${palette.primary}; margin-right: 7px; }
    `,
    boxed: `
      .sec-title { ${headingBase} border: 1px solid ${palette.rule}; border-top: 2.4px solid ${palette.primary};
        padding: 6px 10px; text-align: ${serif ? 'left' : 'left'}; ${caseStyle} }
      .sec-title .idx { color: ${palette.primary}; margin-right: 7px; }
    `,
    plain: `
      .sec-title { ${headingBase} ${caseStyle} color: ${palette.muted}; }
      .sec-title .idx { color: ${palette.primary}; margin-right: 7px; }
    `,
  };

  const skillVariants: Record<string, string> = {
    pills: `
      .skills { display: flex; flex-wrap: wrap; gap: 5px; }
      .skills span { display: inline-block; background: ${palette.primarySoft}; color: ${
        palette.isDarkHeader ? palette.primary : palette.primaryDark
      }; border: 1px solid ${withAlpha(palette.primary, 0.28)}; border-radius: 999px;
        padding: 3px 10px; font-size: ${(metrics.fontSize * 0.94).toFixed(1)}px; font-weight: 600; }
    `,
    list: `
      .skills { margin: 0; padding-left: 17px; }
      .skills li { margin-bottom: 3px; }
      .skills li::marker { color: ${palette.primary}; }
    `,
    inline: `
      .skills { margin: 0; line-height: ${metrics.lineHeight}px; color: ${palette.body}; }
    `,
    bars: `
      .skills { display: flex; flex-wrap: wrap; gap: 4px; }
      .skills span { display: inline-block; border-left: 3px solid ${palette.primary};
        background: ${palette.panel}; color: ${palette.body}; padding: 3px 8px; border-radius: 2px;
        font-size: ${(metrics.fontSize * 0.92).toFixed(1)}px; }
    `,
  };

  return `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: ${font.css}; color: ${palette.body};
    font-size: ${metrics.fontSize}px; line-height: ${metrics.lineHeight}px; }
  .page { width: ${metrics.pageWidth}px; min-height: ${metrics.pageHeight}px; background: #ffffff; }

  /* ---------- header ---------- */
  .hdr { position: relative; }
  .hdr-photo { object-fit: cover; display: block; }
  .hdr-name { margin: 0; line-height: 1.12; }
  .hdr-title { margin: 5px 0 0 0; font-weight: 600; }
  .contact { display: flex; flex-wrap: wrap; }
  .contact span { white-space: nowrap; }

  /* ---------- body ---------- */
  .body { display: flex; flex: 1; align-items: stretch; }
  .col { min-width: 0; }
  .rail { flex: 0 0 ${metrics.railWidth}px; width: ${metrics.railWidth}px; }
  .main { flex: 1; min-width: 0; }
  .sec { margin-bottom: ${metrics.gap}px; }
  .sec:last-child { margin-bottom: 0; }
  .p { margin: 0 0 ${Math.round(metrics.gap * 0.4)}px 0; }
  .p:last-child { margin-bottom: 0; }
  ul { margin: 4px 0 0 0; padding-left: 17px; }
  li { margin-bottom: 3px; }
  .entry + .entry { margin-top: ${Math.round(metrics.gap * 0.75)}px; }
  .entry-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-role { font-weight: 700; color: ${palette.ink}; }
  .entry-org { font-weight: 600; color: ${
    palette.isDarkHeader ? palette.primary : palette.primaryDark
  }; }
  .entry-meta { color: ${palette.muted}; white-space: nowrap; font-size: ${(metrics.fontSize * 0.92).toFixed(
    1
  )}px; }
  .plain-list { margin: 3px 0 0 0; padding-left: 17px; }
  .plain-list li { margin-bottom: 2px; }
  .plain-list li::marker { color: ${palette.primary}; }
  .ref-name { font-weight: 700; color: ${palette.ink}; }
  .muted { color: ${palette.muted}; }
  .rule { height: 1px; background: ${palette.rule}; border: 0; }
  ${headingVariants[resolved.sectionStyle] ?? headingVariants.underline}
  ${skillVariants[resolved.skillStyle] ?? skillVariants.pills}
  ${template.header === 'at-rule' ? `.sec-title { letter-spacing: 1.6px; }` : ''}
  .rail .sec-title { font-size: ${(metrics.sectionSize * 0.96).toFixed(1)}px; }
  `;
}

/* ------------------------------------------------------------------ */
/* Header renderers                                                    */
/* ------------------------------------------------------------------ */

interface HeaderContext {
  content: ResumeContent;
  design: ResumeDesign;
  resolved: ResolvedDesign;
  photo: string | null;
  contact: string[];
}

function photoMarkup(ctx: HeaderContext, size: number, radius: number, ring: boolean): string {
  if (!ctx.photo || !ctx.resolved.showPhoto) return '';
  const border = ring
    ? `border: 3px solid ${ctx.resolved.palette.onPrimary};`
    : `border: 1px solid ${ctx.resolved.palette.rule};`;
  return `<img class="hdr-photo" src="${esc(ctx.photo)}" style="width:${size}px;height:${size}px;border-radius:${radius}px;${border}" />`;
}

function contactRow(ctx: HeaderContext, options: { color: string; separator: string }): string {
  if (!ctx.resolved.showContact || !ctx.contact.length) return '';
  const sep = options.separator
    ? `<span style="opacity:.45;margin:0 9px;">${options.separator}</span>`
    : '';
  return `<div class="contact" style="color:${options.color};">${ctx.contact
    .map((part, i) => `<span>${i > 0 ? sep : ''}${esc(part)}</span>`)
    .join('')}</div>`;
}

function renderHeader(ctx: HeaderContext): string {
  const { resolved, content, design } = ctx;
  const { palette, metrics, template } = resolved;
  const serif = resolved.fontFamily === 'serif' || resolved.fontFamily === 'slab';
  const m = metrics.margin;
  const pad = Math.round(m * 0.62);
  const name = esc(content.fullName || 'Your Name');
  const title = ctx.resolved.showTitle && content.title.trim() ? esc(content.title) : '';
  const heading = formatHeading('Name', design.headingCase);

  switch (template.header) {
    case 'gradient':
      return `
      <div class="hdr" style="background: linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%); padding: ${Math.round(
        m * 0.85
      )}px ${m}px; display:flex; align-items:center; gap:26px;">
        <div style="flex:1; min-width:0;">
          <h1 class="hdr-name" style="font-size:${(metrics.nameSize * 1.05).toFixed(
            1
          )}px; color:${palette.onPrimary}; font-weight:800; ${design.headingCase === 'upper'
            ? 'text-transform:uppercase; letter-spacing:1.5px;'
            : ''}">${name}</h1>
          ${title ? `<div class="hdr-title" style="color:${withAlpha(
            palette.onPrimary,
            0.92
          )}; font-size:${(metrics.titleSize * 1.05).toFixed(1)}px;">${title}</div>` : ''}
        </div>
        ${photoMarkup(ctx, metrics.photoSize, Math.round(metrics.photoSize / 2), true)}
      </div>
      <div style="padding: ${Math.round(m * 0.5)}px ${m}px; background:${palette.panel};
        border-bottom: 1px solid ${withAlpha(palette.primary, 0.18)};">
        ${contactRow(ctx, { color: palette.body, separator: '•' })}
      </div>`;

    case 'duotone-band':
      return `
      <div class="hdr" style="display:flex; align-items:stretch;">
        <div style="flex:1; background:${palette.primary}; padding: ${Math.round(
          m * 0.8
        )}px ${m}px ${Math.round(m * 0.8)}px ${m}px;">
          <h1 class="hdr-name" style="font-size:${metrics.nameSize.toFixed(
            1
          )}px; color:${palette.onPrimary}; font-weight:800;">${name}</h1>
          ${title ? `<div class="hdr-title" style="color:${withAlpha(
            palette.onPrimary,
            0.9
          )}; font-size:${metrics.titleSize.toFixed(1)}px;">${title}</div>` : ''}
        </div>
        <div style="width: 12px; background:${palette.primaryDark};"></div>
        ${
          ctx.photo && resolved.showPhoto
            ? `<div style="padding:${Math.round(m * 0.8)}px ${m}px ${Math.round(m * 0.8)}px ${Math.round(
                m * 0.55
              )}px; background:${palette.panel}; display:flex; align-items:center;">
                 <img class="hdr-photo" src="${esc(ctx.photo)}" style="width:${metrics.photoSize}px;height:${
              metrics.photoSize
            }px;border-radius:${Math.round(metrics.photoSize / 2)}px;border:1px solid ${withAlpha(
              palette.primary,
              0.3
            )};" /></div>`
            : `<div style="width:${m}px; background:${palette.primaryDark};"></div>`
        }
      </div>`;

    case 'solid-bar':
      return `
      <div class="hdr" style="background:${palette.ink}; padding: ${Math.round(
        m * 0.7
      )}px ${m}px; display:flex; align-items:center; gap:24px;">
        <div style="flex:1; min-width:0;">
          <h1 class="hdr-name" style="font-size:${metrics.nameSize.toFixed(
            1
          )}px; color:#ffffff; font-weight:700; text-transform:uppercase; letter-spacing:2px;">${name}</h1>
          ${title ? `<div class="hdr-title" style="color:${withAlpha(
            palette.primary,
            1
          )}; font-size:${metrics.titleSize.toFixed(1)}px; text-transform:uppercase; letter-spacing:1.2px;">${title}</div>` : ''}
        </div>
        ${photoMarkup(ctx, metrics.photoSize, 4, false)}
      </div>`;

    case 'centered-plain':
      return `
      <div class="hdr" style="padding: ${m}px ${m}px ${Math.round(m * 0.7)}px; text-align:center;
        border-top: 6px solid ${palette.primary};">
        ${
          ctx.photo && resolved.showPhoto
            ? `<div style="display:flex; justify-content:center; margin-bottom:${Math.round(
                m * 0.4
              )}px;"><img class="hdr-photo" src="${esc(
                ctx.photo
              )}" style="width:${metrics.photoSize}px;height:${metrics.photoSize}px;border-radius:3px;border:1px solid ${palette.rule};" /></div>`
            : ''
        }
        <h1 class="hdr-name" style="font-size:${(metrics.nameSize * 1.02).toFixed(
          1
        )}px; color:${palette.ink}; font-weight:700; text-transform:uppercase; letter-spacing:2.4px;">${name}</h1>
        ${title ? `<div class="hdr-title" style="color:${palette.muted}; font-size:${metrics.titleSize.toFixed(
          1
        )}px; text-transform:uppercase; letter-spacing:1.6px;">${title}</div>` : ''}
        <div style="width:64px; height:2px; background:${palette.primary}; margin:${Math.round(
          m * 0.36
        )}px auto ${Math.round(m * 0.28)}px auto;"></div>
        <div style="display:flex; justify-content:center;">${contactRow(ctx, {
          color: palette.body,
          separator: '·',
        })}</div>
      </div>`;

    case 'minimal-rule':
      return `
      <div class="hdr" style="padding: ${m}px ${m}px ${Math.round(m * 0.6)}px;">
        <h1 class="hdr-name" style="font-size:${(metrics.nameSize * 1.08).toFixed(
          1
        )}px; color:${palette.ink}; font-weight:300; letter-spacing:1px;">${name}</h1>
        ${
          title
            ? `<div class="hdr-title" style="color:${palette.muted}; font-size:${metrics.titleSize.toFixed(
                1
              )}px; font-weight:400; text-transform:uppercase; letter-spacing:1.8px;">${title}</div>`
            : ''
        }
        <div style="height:1px; background:${palette.rule}; margin-top:${Math.round(
          m * 0.45
        )}px;"></div>
        <div style="height:2px; width:88px; background:${palette.primary}; margin-top:-1px;"></div>
        <div style="margin-top:${Math.round(m * 0.4)}px;">${contactRow(ctx, {
          color: palette.muted,
          separator: '·',
        })}</div>
      </div>`;

    case 'photo-left':
      return `
      <div class="hdr" style="padding: ${m}px ${m}px; display:flex; align-items:center; gap:${Math.round(
        m * 0.6
      )}px;">
        ${photoMarkup(ctx, metrics.photoSize, Math.round(metrics.photoSize / 2), false)}
        <div style="flex:1; min-width:0; border-left:5px solid ${palette.primary}; padding-left:${
          pad + 4
        }px;">
          <h1 class="hdr-name" style="font-size:${(metrics.nameSize * 1.02).toFixed(
            1
          )}px; color:${palette.ink}; font-weight:800;">${name}</h1>
          ${title ? `<div class="hdr-title" style="color:${palette.muted}; font-size:${metrics.titleSize.toFixed(
            1
          )}px; font-weight:600;">${title}</div>` : ''}
          <div style="margin-top:${Math.round(m * 0.34)}px;">${contactRow(ctx, {
            color: palette.body,
            separator: '•',
          })}</div>
        </div>
      </div>`;

    case 'serif-elegant':
      return `
      <div class="hdr" style="padding: ${m}px ${m}px ${Math.round(m * 0.65)}px; text-align:center;
        background:${palette.panel};">
        ${
          ctx.photo && resolved.showPhoto
            ? `<div style="display:flex; justify-content:center; margin-bottom:${Math.round(
                m * 0.42
              )}px;"><img class="hdr-photo" src="${esc(
                ctx.photo
              )}" style="width:${metrics.photoSize}px;height:${metrics.photoSize}px;border-radius:6px;border:2px solid ${palette.primary};" /></div>`
            : ''
        }
        <h1 class="hdr-name" style="font-family:${fontCss(design)}; font-size:${(metrics.nameSize * 1.06).toFixed(
          1
        )}px; color:${palette.ink}; font-weight:400; letter-spacing:3px;">${name}</h1>
        ${
          title
            ? `<div class="hdr-title" style="font-size:${metrics.titleSize.toFixed(
                1
              )}px; color:${palette.primaryDark}; font-style:italic; margin-top:3px;">${title}</div>`
            : ''
        }
        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin:${Math.round(
          m * 0.34
        )}px 0 ${Math.round(m * 0.28)}px 0;">
          <span style="width:54px; height:1px; background:${palette.primary};"></span>
          <span style="color:${palette.primary}; font-size:11px;">&#9670;</span>
          <span style="width:54px; height:1px; background:${palette.primary};"></span>
        </div>
        <div style="display:flex; justify-content:center;">${contactRow(ctx, {
          color: palette.muted,
          separator: '&#183;',
        })}</div>
      </div>`;

    case 'boxed':
      return `
      <div class="hdr" style="padding: 0 ${m}px ${Math.round(m * 0.4)}px;">
        <div style="border: 1px solid ${withAlpha(
          palette.primary,
          0.35
        )}; border-top: 7px solid ${palette.primary}; padding: ${pad + 4}px ${pad + 6}px; display:flex; align-items:center; gap:${Math.round(
        m * 0.5
      )}px;">
          <div style="flex:1; min-width:0;">
            <h1 class="hdr-name" style="font-size:${metrics.nameSize.toFixed(
              1
            )}px; color:${palette.ink}; font-weight:700; text-transform:uppercase; letter-spacing:1.6px;">${name}</h1>
            ${title ? `<div class="hdr-title" style="color:${palette.muted}; font-size:${metrics.titleSize.toFixed(
              1
            )}px; text-transform:uppercase; letter-spacing:1.3px; font-weight:600;">${title}</div>` : ''}
          </div>
          ${photoMarkup(ctx, metrics.photoSize, 3, false)}
        </div>
      </div>`;

    case 'stacked-rules':
      return `
      <div class="hdr" style="padding: ${m}px ${m}px ${Math.round(m * 0.5)}px;
        background:${palette.panel}; border-bottom: 3px solid ${palette.primary};">
        <div style="display:flex; align-items:center; gap:20px;">
          ${photoMarkup(ctx, metrics.photoSize, Math.round(metrics.photoSize / 2), false)}
          <div style="flex:1; min-width:0;">
            <h1 class="hdr-name" style="font-size:${(metrics.nameSize * 1.04).toFixed(
              1
            )}px; color:${palette.ink}; font-weight:700;">${name}</h1>
            <div style="width:70px; height:3px; background:${palette.primary}; margin:7px 0;"></div>
            ${title ? `<div class="hdr-title" style="color:${palette.muted}; font-size:${metrics.titleSize.toFixed(
              1
            )}px; font-weight:600;">${title}</div>` : ''}
          </div>
        </div>
        <div style="margin-top:${pad}px;">${contactRow(ctx, {
          color: palette.body,
          separator: '|',
        })}</div>
      </div>`;

    case 'at-rule':
    default:
      return `
      <div class="hdr" style="padding: ${m}px ${m}px ${Math.round(m * 0.45)}px;">
        <h1 class="hdr-name" style="font-size:${metrics.nameSize.toFixed(
          1
        )}px; color:#000000; font-weight:700; text-transform:uppercase; letter-spacing:2px; text-align:center;">${name}</h1>
        ${
          title
            ? `<div class="hdr-title" style="font-size:${metrics.titleSize.toFixed(
                1
              )}px; color:#000000; font-weight:400; text-align:center; margin-top:3px;">${title}</div>`
            : ''
        }
        <div style="height:2px; background:#000000; margin:${Math.round(
          m * 0.34
        )}px 0 ${Math.round(m * 0.34)}px 0;"></div>
        <table style="width:100%; border-collapse:collapse; font-size:${(metrics.fontSize * 0.96).toFixed(
          1
        )}px; color:#000000;">
          ${[
            ['Address', content.address],
            ['Phone', content.phone],
            ['Email', content.email],
            ['Website', content.website],
          ]
            .filter(([, v]) => (v || '').trim())
            .map(
              ([label, value]) =>
                `<tr><td style="width:88px; vertical-align:top; padding:1px 8px 1px 0; font-weight:700;">${label}</td><td style="padding:1px 0;">${esc(
                  value
                )}</td></tr>`
            )
            .join('')}
        </table>
      </div>`;
  }
}

function fontCss(design: ResumeDesign): string {
  return (FONT_MAP[design.fontFamily] ?? FONT_MAP.sans).css;
}

/* ------------------------------------------------------------------ */
/* Section renderers                                                   */
/* ------------------------------------------------------------------ */

function heading(kind: SectionKind, design: ResumeDesign, index: number, numbered: boolean): string {
  const text = formatHeading(headingFor(design, kind), design.headingCase);
  const idx = numbered ? `<span class="idx">${String(index).padStart(2, '0')}</span>` : '';
  return `<h2 class="sec-title">${idx}${esc(text)}</h2>`;
}

function renderExperience(entries: ExperienceEntry[]): string {
  return entries
    .filter((e) => e.position || e.company || e.details.trim())
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <span class="entry-role">${esc(e.position || 'Position')}</span>
            ${e.company ? ` <span class="muted">—</span> <span class="entry-org">${esc(e.company)}</span>` : ''}
          </div>
          <span class="entry-meta">${esc(e.period || e.location || '')}</span>
        </div>
        ${bullets(e.details, '')}
      </div>`
    )
    .join('');
}

function renderEducation(entries: EducationEntry[]): string {
  return entries
    .filter((e) => e.degree || e.school || e.details.trim())
    .map(
      (e) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <span class="entry-role">${esc(e.degree || 'Qualification')}</span>
            ${e.school ? ` <span class="muted">—</span> <span class="entry-org">${esc(e.school)}</span>` : ''}
          </div>
          <span class="entry-meta">${esc(e.period || e.location || '')}</span>
        </div>
        ${bullets(e.details, '')}
      </div>`
    )
    .join('');
}

function renderProjects(entries: ProjectEntry[], fontSize: number): string {
  return entries
    .filter((p) => p.name || p.details.trim())
    .map(
      (p) => `
      <div class="entry">
        <div class="entry-head">
          <div>
            <span class="entry-role">${esc(p.name || 'Project')}</span>
            ${p.role ? ` <span class="muted">—</span> <span class="entry-org">${esc(p.role)}</span>` : ''}
          </div>
          <span class="entry-meta">${esc(p.period || '')}</span>
        </div>
        ${p.link ? `<div class="p muted" style="font-size:${(fontSize * 0.9).toFixed(1)}px;">${esc(p.link)}</div>` : ''}
        ${bullets(p.details, '')}
      </div>`
    )
    .join('');
}

function renderReferences(entries: ReferenceEntry[]): string {
  return entries
    .filter((r) => r.name || r.company)
    .map(
      (r) => `
      <div class="entry">
        <div class="entry-head">
          <span class="ref-name">${esc(r.name || 'Reference')}</span>
          <span class="entry-meta">${esc(r.position || '')}</span>
        </div>
        <div class="p muted" style="margin:2px 0 0 0;">${esc(
          [r.company, r.contact].filter(Boolean).join(' · ')
        )}</div>
      </div>`
    )
    .join('');
}

function renderSectionBody(
  kind: SectionKind,
  content: ResumeContent,
  design: ResumeDesign,
  fontSize: number
): string {
  switch (kind) {
    case 'summary':
      return content.summary
        .trim()
        .split(/\n{2,}/)
        .map((p) => `<p class="p">${esc(p.trim())}</p>`)
        .join('');
    case 'experience':
      return renderExperience(content.experience);
    case 'education':
      return renderEducation(content.education);
    case 'projects':
      return renderProjects(content.projects, fontSize);
    case 'references':
      return renderReferences(content.references);
    case 'skills':
      if (design.skillStyle === 'list') {
        return `<ul class="skills">${content.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
      }
      if (design.skillStyle === 'inline') {
        return `<p class="p skills">${esc(content.skills.join('  •  '))}</p>`;
      }
      return `<div class="skills">${content.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div>`;
    case 'certifications':
      return `<ul class="plain-list">${content.certifications
        .map((item) => `<li>${esc(item)}</li>`)
        .join('')}</ul>`;
    case 'training':
      return `<ul class="plain-list">${content.trainings
        .map((item) => `<li>${esc(item)}</li>`)
        .join('')}</ul>`;
    case 'additional':
      return lines(content.additional)
        .map((line) => `<p class="p">${esc(line)}</p>`)
        .join('');
    default:
      return '';
  }
}

function renderSection(
  kind: SectionKind,
  content: ResumeContent,
  design: ResumeDesign,
  index: number,
  fontSize: number
): string {
  const numbered = design.templateKey === 'formal-traditional';
  return `<div class="sec">${heading(kind, design, index, numbered)}${renderSectionBody(
    kind,
    content,
    design,
    fontSize
  )}</div>`;
}

/* ------------------------------------------------------------------ */
/* Page assembly                                                       */
/* ------------------------------------------------------------------ */

export interface BuildHtmlOptions {
  /** Absolute or local URI for the profile photo. */
  photoUrl?: string | null;
  /** Optional note printed in the footer, e.g. the export timestamp. */
  footerNote?: string;
}

export function buildResumeHTML(
  content: ResumeContent,
  design: ResumeDesign,
  options: BuildHtmlOptions = {}
): string {
  const resolved = resolveDesign(design);
  const { palette, metrics, template } = resolved;
  const pad = Math.round(metrics.margin * 0.62);
  const railPad = pad;
  const { rail, main } = visibleSections(content, design);

  const ctx: HeaderContext = {
    content,
    design,
    resolved,
    photo: options.photoUrl ?? resolvePhotoSrc(content.photoUrl),
    contact: contactParts(content),
  };

  const mainOffset = template.layout === 'rail-left' && rail.length ? railPad : metrics.margin;
  const railOffset = template.layout === 'rail-left' ? 0 : metrics.margin;
  const trailing = metrics.margin;

  const railHtml = rail.length
    ? `<div class="col rail" style="background:${palette.isDarkHeader ? palette.primary : palette.panel};
        padding: ${Math.round(metrics.margin * 0.82)}px ${railPad}px;">
        ${rail.map((kind, i) => renderSection(kind, content, design, i + 1, metrics.fontSize)).join('')}
      </div>`
    : '';

  const mainHtml = `<div class="col main" style="padding: ${
    template.layout === 'band-top' ? metrics.margin : mainOffset
  }px ${trailing}px ${Math.round(metrics.margin * 1.4)}px ${
    template.layout === 'rail-right' ? railPad : template.layout === 'rail-left' ? railPad : mainOffset
  }px;">
    ${main.map((kind, i) => renderSection(kind, content, design, i + 1, metrics.fontSize)).join('')}
  </div>`;

  const body = rail.length
    ? `<div class="body">${
        template.layout === 'rail-right' ? mainHtml + railHtml : railHtml + mainHtml
      }</div>`
    : `<div class="body"><div class="col main" style="padding: ${metrics.margin}px ${trailing}px ${Math.round(
        metrics.margin * 1.4
      )}px;">${main.map((kind, i) => renderSection(kind, content, design, i + 1, metrics.fontSize)).join('')}</div></div>`;

  const footer = options.footerNote
    ? `<div style="padding:0 ${metrics.margin}px ${Math.round(metrics.margin * 0.7)}px; color:${palette.muted};
        font-size:${(metrics.fontSize * 0.84).toFixed(1)}px; border-top:1px solid ${palette.rule}; padding-top:8px;">
        ${esc(options.footerNote)}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${metrics.pageWidth}, initial-scale=1" />
<title>${esc(content.fullName || 'Resume')}</title>
<style>${stylesheet(resolved, design)}</style>
</head>
<body>
  <div class="page">
    ${renderHeader(ctx)}
    ${body}
    ${footer}
  </div>
</body>
</html>`;
}
