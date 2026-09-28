import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  contactParts,
  formatHeading,
  fontFamilyFor,
  headingFor,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  resolveDesign,
  resolvePhotoSrc,
  visibleSections,
} from '@/utils/resumeModel';
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

export const RESUME_PAGE_WIDTH = PAGE_WIDTH;
export const RESUME_PAGE_HEIGHT = PAGE_HEIGHT;

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((v) => v.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean);
}

function splitParagraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Photo({
  src,
  size,
  radius,
  borderColor,
  borderWidth,
}: {
  src: string | null;
  size: number;
  radius: number;
  borderColor: string;
  borderWidth: number;
}) {
  if (!src) return null;
  return (
    <Image
      source={{ uri: src }}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth,
        borderColor,
      }}
    />
  );
}

function ContactLine({
  parts,
  color,
  separator,
  fontSize,
  fontFamily,
  align,
}: {
  parts: string[];
  color: string;
  separator: string;
  fontSize: number;
  fontFamily: string;
  align?: ViewStyleAlign;
}) {
  if (!parts.length) return null;
  return (
    <View style={[styles.contact, align ? { justifyContent: align } : null]}>
      {parts.map((part, i) => (
        <View key={`${part}-${i}`} style={styles.contactRow}>
          {i > 0 ? (
            <Text style={{ color, fontSize, fontFamily, opacity: 0.45 }}>{separator}</Text>
          ) : null}
          <Text style={[styles.contactText, { color, fontSize, fontFamily }]}>{part}</Text>
        </View>
      ))}
    </View>
  );
}

type ViewStyleAlign = 'center' | 'flex-start' | 'flex-end';

function NameBlock({
  content,
  resolved,
  color,
  titleColor,
  weight,
  extraStyle,
  titleStyle,
  align,
}: {
  content: ResumeContent;
  resolved: ResolvedDesign;
  color: string;
  titleColor: string;
  weight: '300' | '400' | '600' | '700' | '800';
  extraStyle?: object;
  titleStyle?: object;
  align?: ViewStyleAlign;
}) {
  const { metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  const title = resolved.showTitle && content.title.trim() ? content.title : '';
  return (
    <View style={align ? { alignItems: textAlignFor(align) } : undefined}>
      <Text
        numberOfLines={2}
        style={[
          {
            color,
            fontFamily,
            fontWeight: weight,
            fontSize: metrics.nameSize,
            lineHeight: metrics.nameSize * 1.14,
          },
          extraStyle,
        ]}
      >
        {content.fullName || 'Your Name'}
      </Text>
      {title ? (
        <Text
          numberOfLines={2}
          style={[
            {
              color: titleColor,
              fontFamily,
              fontSize: metrics.titleSize,
              lineHeight: metrics.titleSize * 1.3,
              marginTop: 4,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function textAlignFor(align: ViewStyleAlign): 'center' | 'flex-start' | 'flex-end' {
  return align === 'center' ? 'center' : align === 'flex-end' ? 'flex-end' : 'flex-start';
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ content, design, resolved }: { content: ResumeContent; design: ResumeDesign; resolved: ResolvedDesign }) {
  const { palette, metrics, template } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  const m = metrics.margin;
  const pad = Math.round(m * 0.62);
  const photo = resolvePhotoSrc(content.photoUrl);
  const contact = contactParts(content);
  const radius =
    resolved.photoShape === 'circle' ? metrics.photoSize / 2 : resolved.photoShape === 'rounded' ? 8 : 3;
  const contactProps = { parts: contact, fontSize: metrics.fontSize * 0.95, fontFamily };

  switch (template.header) {
    case 'gradient':
      return (
        <View>
          <LinearGradient
            colors={[palette.primary, palette.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: m * 0.85, paddingHorizontal: m, flexDirection: 'row', alignItems: 'center', gap: 26 }}
          >
            <View style={{ flex: 1 }}>
              <NameBlock
                content={content}
                resolved={resolved}
                color={palette.onPrimary}
                titleColor={palette.onPrimary}
                weight="800"
                extraStyle={design.headingCase === 'upper' ? { textTransform: 'uppercase', letterSpacing: 1.5 } : undefined}
                titleStyle={{ opacity: 0.92, fontWeight: '600' }}
              />
            </View>
            <Photo src={photo} size={metrics.photoSize} radius={radius} borderColor={palette.onPrimary} borderWidth={3} />
          </LinearGradient>
          <View
            style={{
              paddingVertical: m * 0.5,
              paddingHorizontal: m,
              backgroundColor: palette.panel,
              borderBottomWidth: 1,
              borderBottomColor: palette.primarySoft,
            }}
          >
            <ContactLine {...contactProps} color={palette.body} separator="  •  " />
          </View>
        </View>
      );

    case 'duotone-band':
      return (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: palette.primary, paddingVertical: m * 0.8, paddingHorizontal: m }}>
            <NameBlock content={content} resolved={resolved} color={palette.onPrimary} titleColor={palette.onPrimary} weight="800" titleStyle={{ opacity: 0.9 }} />
          </View>
          <View style={{ width: 12, backgroundColor: palette.primaryDark }} />
          {photo && resolved.showPhoto ? (
            <View style={{ paddingVertical: m * 0.8, paddingLeft: m * 0.55, paddingRight: m, backgroundColor: palette.panel, justifyContent: 'center' }}>
              <Photo src={photo} size={metrics.photoSize} radius={radius} borderColor={palette.primarySoft} borderWidth={1} />
            </View>
          ) : (
            <View style={{ width: m, backgroundColor: palette.primaryDark }} />
          )}
        </View>
      );

    case 'solid-bar':
      return (
        <View style={{ backgroundColor: palette.ink, paddingVertical: m * 0.7, paddingHorizontal: m, flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <View style={{ flex: 1 }}>
            <NameBlock
              content={content}
              resolved={resolved}
              color="#FFFFFF"
              titleColor={palette.primary}
              weight="700"
              extraStyle={{ textTransform: 'uppercase', letterSpacing: 2 }}
              titleStyle={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}
            />
          </View>
          <Photo src={photo} size={metrics.photoSize} radius={4} borderColor={palette.ink} borderWidth={1} />
        </View>
      );

    case 'centered-plain':
      return (
        <View style={{ paddingHorizontal: m, paddingBottom: m * 0.7, borderTopWidth: 6, borderTopColor: palette.primary, alignItems: 'center' }}>
          {photo && resolved.showPhoto ? (
            <View style={{ marginBottom: m * 0.4 }}>
              <Photo src={photo} size={metrics.photoSize} radius={3} borderColor={palette.rule} borderWidth={1} />
            </View>
          ) : null}
          <NameBlock
            content={content}
            resolved={resolved}
            color={palette.ink}
            titleColor={palette.muted}
            weight="700"
            extraStyle={{ textTransform: 'uppercase', letterSpacing: 2.4 }}
            titleStyle={{ textTransform: 'uppercase', letterSpacing: 1.6, fontWeight: '400' }}
          />
          <View style={{ width: 64, height: 2, backgroundColor: palette.primary, marginTop: m * 0.36, marginBottom: m * 0.28 }} />
          <ContactLine {...contactProps} color={palette.body} separator="  ·  " align="center" />
        </View>
      );

    case 'minimal-rule':
      return (
        <View style={{ paddingHorizontal: m, paddingBottom: m * 0.6 }}>
          <NameBlock
            content={content}
            resolved={resolved}
            color={palette.ink}
            titleColor={palette.muted}
            weight="300"
            extraStyle={{ letterSpacing: 1 }}
            titleStyle={{ fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1.8 }}
          />
          <View style={{ height: 1, backgroundColor: palette.rule, marginTop: m * 0.45 }} />
          <View style={{ height: 2, width: 88, backgroundColor: palette.primary }} />
          <View style={{ marginTop: m * 0.4 }}>
            <ContactLine {...contactProps} color={palette.muted} separator="  ·  " />
          </View>
        </View>
      );

    case 'photo-left':
      return (
        <View style={{ paddingHorizontal: m, flexDirection: 'row', alignItems: 'center', gap: m * 0.6 }}>
          <Photo src={photo} size={metrics.photoSize} radius={radius} borderColor={palette.rule} borderWidth={1} />
          <View style={{ flex: 1, borderLeftWidth: 5, borderLeftColor: palette.primary, paddingLeft: pad + 4 }}>
            <NameBlock content={content} resolved={resolved} color={palette.ink} titleColor={palette.muted} weight="800" titleStyle={{ fontWeight: '600' }} />
            <View style={{ marginTop: m * 0.34 }}>
              <ContactLine {...contactProps} color={palette.body} separator="  •  " />
            </View>
          </View>
        </View>
      );

    case 'serif-elegant':
      return (
        <View style={{ paddingHorizontal: m, paddingBottom: m * 0.65, backgroundColor: palette.panel, alignItems: 'center' }}>
          {photo && resolved.showPhoto ? (
            <View style={{ marginBottom: m * 0.42 }}>
              <Photo src={photo} size={metrics.photoSize} radius={6} borderColor={palette.primary} borderWidth={2} />
            </View>
          ) : null}
          <NameBlock
            content={content}
            resolved={resolved}
            color={palette.ink}
            titleColor={palette.primaryDark}
            weight="400"
            extraStyle={{ letterSpacing: 3 }}
            titleStyle={{ fontStyle: 'italic', marginTop: 3 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: m * 0.34, marginBottom: m * 0.28 }}>
            <View style={{ width: 54, height: 1, backgroundColor: palette.primary }} />
            <Text style={{ color: palette.primary, fontSize: 11 }}>◆</Text>
            <View style={{ width: 54, height: 1, backgroundColor: palette.primary }} />
          </View>
          <ContactLine {...contactProps} color={palette.muted} separator="  ·  " align="center" />
        </View>
      );

    case 'boxed':
      return (
        <View style={{ paddingHorizontal: m, paddingBottom: m * 0.4 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: palette.primarySoft,
              borderTopWidth: 7,
              borderTopColor: palette.primary,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              paddingVertical: pad + 4,
              paddingHorizontal: pad + 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: m * 0.5,
            }}
          >
            <View style={{ flex: 1 }}>
              <NameBlock
                content={content}
                resolved={resolved}
                color={palette.ink}
                titleColor={palette.muted}
                weight="700"
                extraStyle={{ textTransform: 'uppercase', letterSpacing: 1.6 }}
                titleStyle={{ textTransform: 'uppercase', letterSpacing: 1.3, fontWeight: '600' }}
              />
            </View>
            <Photo src={photo} size={metrics.photoSize} radius={3} borderColor={palette.rule} borderWidth={1} />
          </View>
        </View>
      );

    case 'stacked-rules':
      return (
        <View style={{ paddingHorizontal: m, paddingVertical: m, backgroundColor: palette.panel, borderBottomWidth: 3, borderBottomColor: palette.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Photo src={photo} size={metrics.photoSize} radius={radius} borderColor={palette.rule} borderWidth={1} />
            <View style={{ flex: 1 }}>
              <NameBlock
                content={content}
                resolved={resolved}
                color={palette.ink}
                titleColor={palette.muted}
                weight="700"
                extraStyle={{}}
                titleStyle={{ fontWeight: '600' }}
              />
              <View style={{ width: 70, height: 3, backgroundColor: palette.primary, marginTop: 7, marginBottom: 7 }} />
            </View>
          </View>
          <View style={{ marginTop: pad }}>
            <ContactLine {...contactProps} color={palette.body} separator="   |   " />
          </View>
        </View>
      );

    case 'at-rule':
    default: {
      const rows: [string, string][] = [
        ['Address', content.address],
        ['Phone', content.phone],
        ['Email', content.email],
        ['Website', content.website],
      ].filter(([, v]) => (v || '').trim()) as [string, string][];

      return (
        <View style={{ paddingHorizontal: m, paddingBottom: m * 0.45 }}>
          <NameBlock
            content={content}
            resolved={resolved}
            color="#000000"
            titleColor="#000000"
            weight="700"
            extraStyle={{ textTransform: 'uppercase', letterSpacing: 2 }}
            titleStyle={{ fontWeight: '400', marginTop: 3 }}
          />
          <View style={{ height: 2, backgroundColor: '#000000', marginVertical: m * 0.34 }} />
          {rows.map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', paddingVertical: 1 }}>
              <Text style={{ width: 88, fontSize: metrics.fontSize * 0.96, fontFamily, fontWeight: '700', color: '#000000' }}>{label}</Text>
              <Text style={{ flex: 1, fontSize: metrics.fontSize * 0.96, fontFamily, color: '#000000' }}>{value}</Text>
            </View>
          ))}
        </View>
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function SectionHeading({ kind, design, resolved, index }: { kind: SectionKind; design: ResumeDesign; resolved: ResolvedDesign; index: number }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  const text = formatHeading(headingFor(design, kind), design.headingCase);
  const numbered = design.templateKey === 'formal-traditional';
  const size = metrics.sectionSize;

  const label = (
    <Text style={{ fontSize: size, fontFamily, fontWeight: '700', color: palette.ink }}>
      {numbered ? `${String(index).padStart(2, '0')}  ` : ''}
      {text}
    </Text>
  );

  switch (resolved.sectionStyle) {
    case 'band':
      return (
        <View style={{ alignSelf: 'flex-start', backgroundColor: palette.primary, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 3, marginBottom: metrics.gap * 0.5 }}>
          <Text style={{ fontSize: size, fontFamily, fontWeight: '700', color: palette.onPrimary, letterSpacing: design.headingCase === 'upper' ? 1.4 : 0 }}>
            {numbered ? `${String(index).padStart(2, '0')}  ` : ''}
            {design.headingCase === 'upper' ? text.toUpperCase() : text}
          </Text>
        </View>
      );
    case 'accent-left':
      return (
        <View style={{ borderLeftWidth: 4, borderLeftColor: palette.primary, paddingVertical: 2, paddingLeft: 10, marginBottom: metrics.gap * 0.5 }}>
          {label}
        </View>
      );
    case 'boxed':
      return (
        <View style={{ borderWidth: 1, borderColor: palette.rule, borderTopWidth: 2.4, borderTopColor: palette.primary, paddingVertical: 5, paddingHorizontal: 9, marginBottom: metrics.gap * 0.5 }}>
          {label}
        </View>
      );
    case 'plain':
      return (
        <Text
          style={{
            fontSize: size,
            fontFamily,
            fontWeight: '700',
            color: palette.muted,
            letterSpacing: design.headingCase === 'upper' ? 1.4 : 0.2,
            marginBottom: metrics.gap * 0.5,
          }}
        >
          {numbered ? `${String(index).padStart(2, '0')}  ` : ''}
          {design.headingCase === 'upper' ? text.toUpperCase() : text}
        </Text>
      );
    case 'underline':
    default:
      return (
        <View style={{ borderBottomWidth: 1.4, borderBottomColor: palette.primary, paddingBottom: 4, marginBottom: metrics.gap * 0.5 }}>
          {label}
        </View>
      );
  }
}

function Bullets({ text, resolved, color }: { text: string; resolved: ResolvedDesign; color: string }) {
  const items = splitLines(text);
  if (!items.length) return null;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  return (
    <View style={{ marginTop: 3, gap: 2 }}>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={{ flexDirection: 'row', gap: 7 }}>
          <Text style={{ color, fontSize: resolved.metrics.fontSize * 0.95, fontFamily, lineHeight: resolved.metrics.lineHeight }}>•</Text>
          <Text style={{ flex: 1, color, fontSize: resolved.metrics.fontSize * 0.95, fontFamily, lineHeight: resolved.metrics.lineHeight }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function EntryHead({
  role,
  org,
  meta,
  resolved,
  orgColor,
}: {
  role: string;
  org: string;
  meta: string;
  resolved: ResolvedDesign;
  orgColor: string;
}) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <Text style={{ flex: 1, fontFamily, fontSize: metrics.fontSize, lineHeight: metrics.lineHeight }}>
        <Text style={{ fontWeight: '700', color: palette.ink }}>{role}</Text>
        {org ? <Text style={{ color: palette.muted }}>{'  —  '}</Text> : null}
        {org ? <Text style={{ fontWeight: '600', color: orgColor }}>{org}</Text> : null}
      </Text>
      {meta ? (
        <Text style={{ fontSize: metrics.fontSize * 0.92, fontFamily, color: palette.muted }}>{meta}</Text>
      ) : null}
    </View>
  );
}

function ExperienceBlock({ entries, resolved, orgColor }: { entries: ExperienceEntry[]; resolved: ResolvedDesign; orgColor: string }) {
  return (
    <>
      {entries
        .filter((e) => e.position || e.company || e.details.trim())
        .map((e, i) => (
          <View key={e.id} style={{ marginTop: i === 0 ? 0 : resolved.metrics.gap * 0.75 }}>
            <EntryHead role={e.position || 'Position'} org={e.company} meta={e.period || e.location} resolved={resolved} orgColor={orgColor} />
            <Bullets text={e.details} resolved={resolved} color={resolved.palette.body} />
          </View>
        ))}
    </>
  );
}

function EducationBlock({ entries, resolved, orgColor }: { entries: EducationEntry[]; resolved: ResolvedDesign; orgColor: string }) {
  return (
    <>
      {entries
        .filter((e) => e.degree || e.school || e.details.trim())
        .map((e, i) => (
          <View key={e.id} style={{ marginTop: i === 0 ? 0 : resolved.metrics.gap * 0.75 }}>
            <EntryHead role={e.degree || 'Qualification'} org={e.school} meta={e.period || e.location} resolved={resolved} orgColor={orgColor} />
            <Bullets text={e.details} resolved={resolved} color={resolved.palette.body} />
          </View>
        ))}
    </>
  );
}

function ProjectBlock({ entries, resolved, orgColor }: { entries: ProjectEntry[]; resolved: ResolvedDesign; orgColor: string }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  return (
    <>
      {entries
        .filter((p) => p.name || p.details.trim())
        .map((p, i) => (
          <View key={p.id} style={{ marginTop: i === 0 ? 0 : metrics.gap * 0.75 }}>
            <EntryHead role={p.name || 'Project'} org={p.role} meta={p.period} resolved={resolved} orgColor={orgColor} />
            {p.link ? (
              <Text style={{ marginTop: 2, fontSize: metrics.fontSize * 0.9, fontFamily, color: palette.muted }}>{p.link}</Text>
            ) : null}
            <Bullets text={p.details} resolved={resolved} color={palette.body} />
          </View>
        ))}
    </>
  );
}

function ReferenceBlock({ entries, resolved }: { entries: ReferenceEntry[]; resolved: ResolvedDesign }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  return (
    <>
      {entries
        .filter((r) => r.name || r.company)
        .map((r, i) => (
          <View key={r.id} style={{ marginTop: i === 0 ? 0 : metrics.gap * 0.75 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <Text style={{ fontFamily, fontSize: metrics.fontSize, fontWeight: '700', color: palette.ink }}>{r.name || 'Reference'}</Text>
              {r.position ? <Text style={{ fontSize: metrics.fontSize * 0.92, fontFamily, color: palette.muted }}>{r.position}</Text> : null}
            </View>
            <Text style={{ marginTop: 2, fontSize: metrics.fontSize * 0.92, fontFamily, color: palette.muted }}>
              {[r.company, r.contact].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))}
    </>
  );
}

function SkillsBlock({ skills, resolved }: { skills: string[]; resolved: ResolvedDesign }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);

  if (resolved.skillStyle === 'list') {
    return (
      <View style={{ gap: 2, marginTop: 2 }}>
        {skills.map((skill, i) => (
          <View key={`${skill}-${i}`} style={{ flexDirection: 'row', gap: 7 }}>
            <Text style={{ color: palette.primary, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight }}>▪</Text>
            <Text style={{ color: palette.body, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight }}>{skill}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (resolved.skillStyle === 'inline') {
    return (
      <Text style={{ color: palette.body, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight }}>
        {skills.join('  •  ')}
      </Text>
    );
  }

  if (resolved.skillStyle === 'bars') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {skills.map((skill, i) => (
          <View
            key={`${skill}-${i}`}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.panel, borderLeftWidth: 3, borderLeftColor: palette.primary, borderRadius: 2, paddingVertical: 3, paddingHorizontal: 7 }}
          >
            <Text style={{ color: palette.body, fontSize: metrics.fontSize * 0.92, fontFamily }}>{skill}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {skills.map((skill, i) => (
        <View
          key={`${skill}-${i}`}
          style={{
            backgroundColor: palette.primarySoft,
            borderWidth: 1,
            borderColor: palette.primarySoft,
            borderRadius: 999,
            paddingVertical: 3,
            paddingHorizontal: 10,
          }}
        >
          <Text style={{ color: palette.primaryDark, fontSize: metrics.fontSize * 0.94, fontFamily, fontWeight: '600' }}>{skill}</Text>
        </View>
      ))}
    </View>
  );
}

function SimpleList({ items, resolved }: { items: string[]; resolved: ResolvedDesign }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  return (
    <View style={{ marginTop: 2, gap: 2 }}>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={{ flexDirection: 'row', gap: 7 }}>
          <Text style={{ color: palette.primary, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight }}>▪</Text>
          <Text style={{ flex: 1, color: palette.body, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionBody({ kind, content, resolved }: { kind: SectionKind; content: ResumeContent; resolved: ResolvedDesign }) {
  const { palette, metrics } = resolved;
  const fontFamily = fontFamilyFor(resolved.fontFamily);
  const orgColor = palette.isDarkHeader ? palette.primarySoft : palette.primaryDark;

  switch (kind) {
    case 'summary':
      return (
        <>
          {splitParagraphs(content.summary).map((paragraph, i) => (
            <Text key={i} style={{ color: palette.body, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight, marginBottom: metrics.gap * 0.4 }}>
              {paragraph}
            </Text>
          ))}
        </>
      );
    case 'experience':
      return <ExperienceBlock entries={content.experience} resolved={resolved} orgColor={orgColor} />;
    case 'education':
      return <EducationBlock entries={content.education} resolved={resolved} orgColor={orgColor} />;
    case 'projects':
      return <ProjectBlock entries={content.projects} resolved={resolved} orgColor={orgColor} />;
    case 'references':
      return <ReferenceBlock entries={content.references} resolved={resolved} />;
    case 'skills':
      return <SkillsBlock skills={content.skills} resolved={resolved} />;
    case 'certifications':
      return <SimpleList items={content.certifications} resolved={resolved} />;
    case 'training':
      return <SimpleList items={content.trainings} resolved={resolved} />;
    case 'additional':
      return (
        <>
          {splitLines(content.additional).map((line, i) => (
            <Text key={i} style={{ color: palette.body, fontSize: metrics.fontSize, fontFamily, lineHeight: metrics.lineHeight, marginBottom: metrics.gap * 0.4 }}>
              {line}
            </Text>
          ))}
        </>
      );
    default:
      return null;
  }
}

function Section({
  kind,
  content,
  design,
  resolved,
  index,
}: {
  kind: SectionKind;
  content: ResumeContent;
  design: ResumeDesign;
  resolved: ResolvedDesign;
  index: number;
}) {
  return (
    <View style={{ marginBottom: resolved.metrics.gap }}>
      <SectionHeading kind={kind} design={design} resolved={resolved} index={index} />
      <SectionBody kind={kind} content={content} resolved={resolved} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

export interface ResumeDocumentProps {
  content: ResumeContent;
  design: ResumeDesign;
}

export default function ResumeDocument({ content, design }: ResumeDocumentProps) {
  const resolved = useMemo(() => resolveDesign(design), [design]);
  const { palette, metrics, template } = resolved;
  const { rail, main } = useMemo(() => visibleSections(content, design), [content, design]);
  const pad = Math.round(metrics.margin * 0.62);

  const railBody = rail.map((kind, i) => (
    <Section key={`rail-${kind}`} kind={kind} content={content} design={design} resolved={resolved} index={i + 1} />
  ));

  const mainBody = main.map((kind, i) => (
    <Section key={`main-${kind}`} kind={kind} content={content} design={design} resolved={resolved} index={i + 1} />
  ));

  return (
    <View style={{ width: PAGE_WIDTH, minHeight: PAGE_HEIGHT, backgroundColor: '#FFFFFF' }}>
      <Header content={content} design={design} resolved={resolved} />
      {rail.length ? (
        <View style={{ flexDirection: 'row' }}>
          {template.layout !== 'rail-right' ? (
            <View
              style={{
                width: metrics.railWidth,
                backgroundColor: palette.isDarkHeader ? palette.primary : palette.panel,
                paddingTop: metrics.margin * 0.82,
                paddingBottom: metrics.margin,
                paddingHorizontal: pad,
              }}
            >
              {railBody}
            </View>
          ) : null}
          <View
            style={{
              flex: 1,
              paddingTop: metrics.margin,
              paddingBottom: metrics.margin * 1.4,
              paddingRight: metrics.margin,
              paddingLeft: pad,
            }}
          >
            {mainBody}
          </View>
          {template.layout === 'rail-right' ? (
            <View
              style={{
                width: metrics.railWidth,
                backgroundColor: palette.isDarkHeader ? palette.primary : palette.panel,
                paddingTop: metrics.margin * 0.82,
                paddingBottom: metrics.margin,
                paddingHorizontal: pad,
              }}
            >
              {railBody}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ paddingHorizontal: metrics.margin, paddingTop: metrics.margin, paddingBottom: metrics.margin * 1.4 }}>
          {mainBody}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    flexShrink: 1,
  },
});
