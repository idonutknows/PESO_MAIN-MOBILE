import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Chip, Field, Stepper, ToggleRow } from '@/components/resume/FormControls';
import TemplateThumbnail from '@/components/resume/TemplateThumbnail';
import {
  ACCENT_PRESETS,
  COLUMN_OPTIONS,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  PHOTO_SHAPES,
  RESUME_TEMPLATES,
  SECTION_STYLES,
  SKILL_STYLES,
  SECTIONS,
  TEMPLATE_MAP,
  TEXT_COLOR_PRESETS,
} from '@/constants/resumeDesign';
import { applyTemplateDefaults, normaliseOrder, resolvePhotoSrc } from '@/utils/resumeModel';
import type {
  ResumeContent,
  ResumeDesign,
  SectionKind,
  TemplateKey,
} from '@/types/resume';

export interface DesignEditorProps {
  content: ResumeContent;
  design: ResumeDesign;
  onDesign: (next: ResumeDesign) => void;
}

export default function DesignEditor({ content, design, onDesign }: DesignEditorProps) {
  const template = TEMPLATE_MAP[design.templateKey];
  const photoEnabled = template?.supportsPhoto && design.showPhoto;

  const pickTemplate = (key: TemplateKey) => onDesign(applyTemplateDefaults(design, key));

  const moveSection = (from: number, to: number) => {
    const order = [...design.sectionOrder];
    if (to < 0 || to >= order.length) return;
    const [item] = order.splice(from, 1);
    order.splice(to, 0, item);
    onDesign({ ...design, sectionOrder: order });
  };

  const toggleSection = (kind: SectionKind) => {
    const hidden = new Set(design.hiddenSections);
    if (hidden.has(kind)) hidden.delete(kind);
    else hidden.add(kind);
    onDesign({ ...design, hiddenSections: Array.from(hidden) });
  };
  const sizeIndex = Math.round((design.fontSize - FONT_SIZE_RANGE.min) / FONT_SIZE_RANGE.step);
  const lhIndex = Math.round((design.lineHeight - LINE_HEIGHT_RANGE.min) / LINE_HEIGHT_RANGE.step);
  const sizeMax = (FONT_SIZE_RANGE.max - FONT_SIZE_RANGE.min) / FONT_SIZE_RANGE.step;
  const lhMax = (LINE_HEIGHT_RANGE.max - LINE_HEIGHT_RANGE.min) / LINE_HEIGHT_RANGE.step;

  return (
    <View>
      {/* ---------- Templates ---------- */}
      <Card title="Template & Layout" icon="🎨">
        <ThemedText style={styles.groupLabel}>
          {RESUME_TEMPLATES.length} distinct designs — each has its own header, column structure and section
          treatment.
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateStrip}>
          {RESUME_TEMPLATES.map((spec) => (
            <TouchableOpacity
              key={spec.key}
              onPress={() => pickTemplate(spec.key)}
              activeOpacity={0.85}
              style={styles.templateItem}
            >
              <TemplateThumbnail spec={spec} width={124} selected={design.templateKey === spec.key} />
              <ThemedText
                style={[styles.templateName, design.templateKey === spec.key ? styles.templateNameActive : null]}
                numberOfLines={2}
              >
                {spec.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.templateMeta}>
          <View style={[styles.accentBar, { backgroundColor: template?.accentColor ?? '#0A7EA4' }]} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.templateMetaTitle}>{template?.name}</ThemedText>
            <ThemedText style={styles.templateMetaText}>{template?.description}</ThemedText>
          </View>
        </View>
      </Card>

      {/* ---------- Colour ---------- */}
      <Card title="Colours" icon="🎨">
        <ThemedText style={styles.groupLabel}>Accent colour</ThemedText>
        <View style={styles.swatchGrid}>
          {ACCENT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              onPress={() => onDesign({ ...design, accentColor: preset.value })}
              activeOpacity={0.8}
              style={[
                styles.swatchWrap,
                design.accentColor.toLowerCase() === preset.value.toLowerCase() ? styles.swatchWrapActive : null,
              ]}
            >
              <View style={[styles.swatchBig, { backgroundColor: preset.value }]} />
              <ThemedText style={styles.swatchLabel}>{preset.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          <ThemedText style={styles.groupLabel}>Text colour</ThemedText>
          <View style={styles.inlineSwatches}>
            {TEXT_COLOR_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                onPress={() => onDesign({ ...design, textColor: preset.value })}
                activeOpacity={0.8}
                style={[
                  styles.inlineSwatch,
                  design.textColor.toLowerCase() === preset.value.toLowerCase()
                    ? styles.inlineSwatchActive
                    : null,
                ]}
              >
                <View style={[styles.swatchSmall, { backgroundColor: preset.value }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Field
            label="Custom accent (hex)"
            value={design.accentColor}
            onChangeText={(v) => onDesign({ ...design, accentColor: v })}
            placeholder="#0A7EA4"
            autoCapitalize="characters"
          />
        </View>
      </Card>

      {/* ---------- Typography ---------- */}
      <Card title="Typography" icon="🔤">
        <ThemedText style={styles.groupLabel}>Font style</ThemedText>
        <View style={styles.chipGrid}>
          {FONT_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={design.fontFamily === option.key}
              onPress={() => onDesign({ ...design, fontFamily: option.key })}
            />
          ))}
        </View>

        <View style={{ marginTop: 16 }}>
          <Stepper
            label="Font size"
            value={sizeIndex / sizeMax}
            display={`${design.fontSize.toFixed(1)} pt`}
            onDecrement={() =>
              onDesign({
                ...design,
                fontSize: Math.max(FONT_SIZE_RANGE.min, design.fontSize - FONT_SIZE_RANGE.step),
              })
            }
            onIncrement={() =>
              onDesign({
                ...design,
                fontSize: Math.min(FONT_SIZE_RANGE.max, design.fontSize + FONT_SIZE_RANGE.step),
              })
            }
            disabledDecrement={design.fontSize <= FONT_SIZE_RANGE.min}
            disabledIncrement={design.fontSize >= FONT_SIZE_RANGE.max}
          />
          <Stepper
            label="Line spacing"
            value={lhIndex / lhMax}
            display={design.lineHeight.toFixed(2)}
            onDecrement={() =>
              onDesign({
                ...design,
                lineHeight: Math.max(LINE_HEIGHT_RANGE.min, design.lineHeight - LINE_HEIGHT_RANGE.step),
              })
            }
            onIncrement={() =>
              onDesign({
                ...design,
                lineHeight: Math.min(LINE_HEIGHT_RANGE.max, design.lineHeight + LINE_HEIGHT_RANGE.step),
              })
            }
            disabledDecrement={design.lineHeight <= LINE_HEIGHT_RANGE.min}
            disabledIncrement={design.lineHeight >= LINE_HEIGHT_RANGE.max}
          />
        </View>

        <ThemedText style={styles.groupLabel}>Heading style</ThemedText>
        <View style={styles.chipGrid}>
          {(['upper', 'title', 'none'] as const).map((option) => (
            <Chip
              key={option}
              label={option === 'upper' ? 'ALL CAPS' : option === 'title' ? 'Title Case' : 'As Typed'}
              active={design.headingCase === option}
              onPress={() => onDesign({ ...design, headingCase: option })}
            />
          ))}
        </View>
      </Card>

      {/* ---------- Layout ---------- */}
      <Card title="Layout & Spacing" icon="📐">
        <ThemedText style={styles.groupLabel}>Columns</ThemedText>
        <View style={styles.chipGrid}>
          {COLUMN_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={design.columns === option.key}
              onPress={() => onDesign({ ...design, columns: option.key })}
            />
          ))}
        </View>
        <ThemedText style={styles.hint}>
          Templates that ship with a side rail stay two-column unless you force a single column here.
        </ThemedText>

        <View style={{ marginTop: 16 }}>
          <ThemedText style={styles.groupLabel}>Spacing</ThemedText>
          <View style={styles.chipGrid}>
            {DENSITY_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={design.density === option.key}
                onPress={() => onDesign({ ...design, density: option.key })}
              />
            ))}
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <ThemedText style={styles.groupLabel}>Section heading style</ThemedText>
          <View style={styles.chipGrid}>
            {SECTION_STYLES.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={design.sectionStyle === option.key}
                onPress={() => onDesign({ ...design, sectionStyle: option.key })}
              />
            ))}
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <ThemedText style={styles.groupLabel}>Skills style</ThemedText>
          <View style={styles.chipGrid}>
            {SKILL_STYLES.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                hint={option.hint}
                active={design.skillStyle === option.key}
                onPress={() => onDesign({ ...design, skillStyle: option.key })}
              />
            ))}
          </View>
        </View>
      </Card>

      {/* ---------- Photo ---------- */}
      <Card title="Photo" icon="🖼️">
        {template?.supportsPhoto ? (
          <>
            <ToggleRow
              label="Show profile photo"
              hint={photoEnabled ? 'Photo appears in the header' : 'Photo is hidden'}
              value={design.showPhoto}
              onValueChange={(v) => onDesign({ ...design, showPhoto: v })}
            />
            <ThemedText style={styles.groupLabel}>Photo shape</ThemedText>
            <View style={styles.chipGrid}>
              {PHOTO_SHAPES.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  active={design.photoShape === option.key}
                  disabled={!design.showPhoto}
                  onPress={() => onDesign({ ...design, photoShape: option.key })}
                />
              ))}
            </View>
            {resolvePhotoSrc(content.photoUrl) ? (
              <View style={styles.photoPreview}>
                <View style={styles.photoPreviewBox}>
                  <ThemedText style={styles.photoPreviewEmoji}>
                    {design.photoShape === 'square' ? '🟪' : design.photoShape === 'rounded' ? '🟦' : '⭕'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.hint}>
                  Change the actual picture from the Content tab.
                </ThemedText>
              </View>
            ) : null}
          </>
        ) : (
          <ThemedText style={styles.hint}>
            The {template?.name} layout is designed for keyword scanners, so it never shows a photo or colour
            blocks. Pick another template if you want a photo.
          </ThemedText>
        )}
      </Card>

      {/* ---------- Sections ---------- */}
      <Card title="Sections" icon="🧩">
        <View style={styles.groupRow}>
          <ThemedText style={[styles.groupLabel, { flex: 1, marginBottom: 0 }]}>Order &amp; visibility</ThemedText>
          <TouchableOpacity
            onPress={() => onDesign({ ...design, sectionOrder: normaliseOrder(design.sectionOrder) })}
            activeOpacity={0.75}
          >
            <ThemedText style={styles.link}>Reset order</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.hint}>
          The order below is the order printed on the page, whichever column each section lands in.
        </ThemedText>
        {design.sectionOrder.map((kind, index) => {
          const meta = SECTIONS.find((s) => s.kind === kind);
          const hidden = design.hiddenSections.includes(kind);
          return (
            <View key={kind} style={styles.sectionRow}>
              <View style={[styles.visibilityDot, hidden ? styles.visibilityDotOff : null]} />
              <ThemedText style={styles.sectionIndex}>{String(index + 1).padStart(2, '0')}</ThemedText>
              <ThemedText style={styles.sectionName}>
                {meta?.icon ? `${meta.icon}  ` : ''}
                {meta?.label ?? kind}
              </ThemedText>
              <TouchableOpacity onPress={() => toggleSection(kind)}>
                <ThemedText style={[styles.link, hidden ? styles.linkMuted : null]}>
                  {hidden ? 'Show' : 'Hide'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.orderButtons}>
                <TouchableOpacity onPress={() => moveSection(index, index - 1)} style={styles.orderBtn} hitSlop={6}>
                  <Text style={styles.orderGlyph}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveSection(index, index + 1)} style={styles.orderBtn} hitSlop={6}>
                  <Text style={styles.orderGlyph}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={styles.statsRow}>
          <Stat label="Visible" value={String(design.sectionOrder.length - design.hiddenSections.length)} />
          <Stat label="Hidden" value={String(design.hiddenSections.length)} />
          <Stat label="Font" value={`${design.fontSize.toFixed(1)}pt`} />
        </View>
      </Card>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  group: {
    marginBottom: 4,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 9,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    lineHeight: 16,
  },
  link: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A7EA4',
  },
  linkMuted: {
    color: '#9CA3AF',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateStrip: {
    gap: 12,
    paddingVertical: 6,
    paddingRight: 8,
  },
  templateItem: {
    width: 124,
  },
  templateName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  templateNameActive: {
    color: '#0A7EA4',
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
  },
  templateMetaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  templateMetaText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 16,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchWrap: {
    alignItems: 'center',
    width: 66,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchWrapActive: {
    borderColor: '#0A7EA4',
    backgroundColor: '#E6F4FE',
  },
  swatchBig: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  swatchLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  inlineSwatches: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineSwatch: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inlineSwatchActive: {
    borderColor: '#0A7EA4',
  },
  swatchSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  photoPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewEmoji: {
    fontSize: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  visibilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  visibilityDotOff: {
    backgroundColor: '#D1D5DB',
  },
  sectionIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C7C7CC',
    width: 18,
  },
  sectionName: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  orderBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderGlyph: {
    fontSize: 9,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  stat: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A7EA4',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
