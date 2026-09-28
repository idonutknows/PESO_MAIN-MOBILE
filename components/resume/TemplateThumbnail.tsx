import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { TEMPLATE_MAP } from '@/constants/resumeDesign';
import { darken, isDark, lighten } from '@/utils/color';
import type { ResumeTemplateSpec } from '@/types/resume';

export interface TemplateThumbnailProps {
  spec: ResumeTemplateSpec;
  width: number;
  selected?: boolean;
}

const HEIGHT_RATIO = 1.28;

/** A single mock line of text. Declared outside the component so React does not remount it. */
function Bar({
  w,
  h,
  color,
  style,
}: {
  w: number;
  h: number;
  color: string;
  style?: object;
}) {
  return (
    <View
      style={[
        { width: Math.max(h * 2, w), height: h, borderRadius: h / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * A miniature of the real page: it reuses the template's own header variant,
 * column ratio and section treatment, so what the job seeker sees in the
 * gallery matches what the document renderer will produce.
 */
export default function TemplateThumbnail({ spec, width, selected }: TemplateThumbnailProps) {
  const height = Math.round(width * HEIGHT_RATIO);
  const accent = spec.accentColor;
  const ink = spec.textColor;
  const dark = isDark(accent);
  const soft = lighten(accent, dark ? 0.84 : 0.9);
  const rule = lighten(ink, 0.8);
  const hair = Math.max(1, Math.round(width * 0.014));
  const pad = Math.round(width * 0.075);
  const hasRail = spec.layout === 'rail-left' || spec.layout === 'rail-right';
  const railWidth = hasRail ? Math.round(width * (spec.railRatio / 100)) : 0;
  const photoSize = Math.round(width * 0.2);

  const line = (w: number, key: number) => (
    <Bar key={`l-${key}`} w={Math.round(width * w)} h={hair} color={rule} style={{ opacity: 0.9 }} />
  );

  const sectionBlock = (key: number, compact = false) => {
    const titleStyle: object =
      spec.sectionStyle === 'band'
        ? { backgroundColor: accent, height: hair * 3, width: Math.round(width * 0.34), borderRadius: 2 }
        : spec.sectionStyle === 'accent-left'
          ? { borderLeftWidth: hair * 2, borderLeftColor: accent, height: hair * 3, width: Math.round(width * 0.36), paddingLeft: hair * 1.5 }
          : spec.sectionStyle === 'boxed'
            ? { borderWidth: hair, borderColor: rule, borderTopWidth: hair * 2, borderTopColor: accent, height: hair * 4, width: Math.round(width * 0.38), borderRadius: 1 }
            : spec.sectionStyle === 'plain'
              ? { height: hair * 2, width: Math.round(width * 0.3) }
              : {
                  height: hair * 3,
                  width: Math.round(width * 0.34),
                  borderBottomWidth: hair,
                  borderBottomColor: accent,
                };

    return (
      <View key={`s-${key}`} style={{ gap: hair * 1.6, marginBottom: compact ? hair * 3 : hair * 4.5 }}>
        <View style={titleStyle}>
          {spec.sectionStyle === 'accent-left' || spec.sectionStyle === 'boxed' ? (
            <View style={{ height: hair, width: '70%', backgroundColor: spec.sectionStyle === 'boxed' ? ink : accent, marginTop: hair }} />
          ) : null}
        </View>
        {line(0.78, key * 10 + 1)}
        {line(0.86, key * 10 + 2)}
        {line(0.6, key * 10 + 3)}
      </View>
    );
  };

  const pillsBlock = (key: number) => (
    <View key={`p-${key}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: hair, marginBottom: hair * 4 }}>
      {[0.2, 0.26, 0.16, 0.22].map((w, i) => (
        <View
          key={i}
          style={{
            width: Math.round(width * w),
            height: hair * 4,
            borderRadius: spec.skillStyle === 'pills' ? hair * 3 : 1,
            backgroundColor: soft,
            borderLeftWidth: spec.skillStyle === 'bars' ? hair : 0,
            borderLeftColor: accent,
          }}
        />
      ))}
    </View>
  );

  const header = (() => {
    const nameW = Math.round(width * 0.44);
    switch (spec.header) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[accent, darken(accent, 0.28)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: pad, flexDirection: 'row', alignItems: 'center', gap: pad * 0.8 }}
          >
            <View style={{ flex: 1, gap: hair * 1.6 }}>
              <Bar w={nameW} h={hair * 4} color="#FFFFFF" />
              <Bar w={nameW * 0.6} h={hair * 2} color="#FFFFFF" style={{ opacity: 0.8 }} />
            </View>
            <View style={{ width: photoSize, height: photoSize, borderRadius: photoSize / 2, backgroundColor: 'rgba(255,255,255,0.4)' }} />
          </LinearGradient>
        );
      case 'duotone-band':
        return (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: accent, padding: pad, gap: hair * 1.4 }}>
              <Bar w={nameW} h={hair * 4} color={dark ? '#FFFFFF' : '#111827'} />
              <Bar w={nameW * 0.55} h={hair * 2} color={dark ? '#FFFFFF' : '#111827'} style={{ opacity: 0.75 }} />
            </View>
            <View style={{ width: hair * 4, backgroundColor: darken(accent, 0.3) }} />
            <View style={{ width: photoSize + pad, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: photoSize, height: photoSize, borderRadius: photoSize / 2, backgroundColor: accent, opacity: 0.35 }} />
            </View>
          </View>
        );
      case 'solid-bar':
        return (
          <View style={{ backgroundColor: ink, padding: pad, flexDirection: 'row', alignItems: 'center', gap: pad }}>
            <View style={{ flex: 1, gap: hair * 1.4 }}>
              <Bar w={nameW} h={hair * 3.5} color="#FFFFFF" />
              <Bar w={nameW * 0.5} h={hair * 1.8} color={accent} />
            </View>
            <View style={{ width: photoSize * 0.9, height: photoSize * 0.9, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          </View>
        );
      case 'centered-plain':
        return (
          <View style={{ padding: pad, alignItems: 'center', gap: hair * 1.5, borderTopWidth: hair * 3, borderTopColor: accent }}>
            <View style={{ width: photoSize * 0.8, height: photoSize * 0.8, backgroundColor: rule }} />
            <Bar w={nameW} h={hair * 3.5} color={ink} />
            <Bar w={nameW * 0.4} h={hair * 2} color={rule} />
            <Bar w={photoSize * 0.9} h={hair * 2} color={accent} />
          </View>
        );
      case 'minimal-rule':
        return (
          <View style={{ padding: pad, gap: hair * 1.6 }}>
            <Bar w={nameW} h={hair * 3} color={ink} />
            <Bar w={nameW * 0.45} h={hair * 1.6} color={rule} />
            <View style={{ height: hair, backgroundColor: rule, marginTop: hair }} />
            <View style={{ height: hair * 1.6, width: width * 0.24, backgroundColor: accent }} />
            <View style={{ marginTop: hair, gap: hair }}>
              <Bar w={photoSize * 1.2} h={hair * 1.4} color={rule} />
              <Bar w={photoSize} h={hair * 1.4} color={rule} />
            </View>
          </View>
        );
      case 'photo-left':
        return (
          <View style={{ padding: pad, flexDirection: 'row', alignItems: 'center', gap: pad * 0.8 }}>
            <View style={{ width: photoSize, height: photoSize, borderRadius: photoSize / 2, backgroundColor: rule }} />
            <View style={{ flex: 1, borderLeftWidth: hair * 2, borderLeftColor: accent, paddingLeft: pad * 0.6, gap: hair * 1.5 }}>
              <Bar w={nameW * 0.85} h={hair * 3.5} color={ink} />
              <Bar w={nameW * 0.55} h={hair * 1.8} color={rule} />
              <Bar w={photoSize * 1.1} h={hair * 1.4} color={rule} />
            </View>
          </View>
        );
      case 'serif-elegant':
        return (
          <View style={{ padding: pad, alignItems: 'center', gap: hair * 1.4, backgroundColor: soft }}>
            <View style={{ width: photoSize * 0.85, height: photoSize * 0.85, borderRadius: 2, backgroundColor: accent, opacity: 0.4 }} />
            <Bar w={nameW} h={hair * 3} color={ink} />
            <Bar w={nameW * 0.4} h={hair * 1.6} color={accent} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hair * 2 }}>
              <Bar w={photoSize * 0.6} h={hair} color={accent} />
              <View style={{ width: hair * 2.4, height: hair * 2.4, backgroundColor: accent, transform: [{ rotate: '45deg' }] }} />
              <Bar w={photoSize * 0.6} h={hair} color={accent} />
            </View>
          </View>
        );
      case 'boxed':
        return (
          <View style={{ paddingHorizontal: pad, paddingBottom: pad * 0.6 }}>
            <View
              style={{
                borderWidth: hair,
                borderColor: soft,
                borderTopWidth: hair * 3,
                borderTopColor: accent,
                padding: pad * 0.8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: pad * 0.6,
              }}
            >
              <View style={{ flex: 1, gap: hair * 1.4 }}>
                <Bar w={nameW * 0.8} h={hair * 3} color={ink} />
                <Bar w={nameW * 0.5} h={hair * 1.6} color={rule} />
              </View>
              <View style={{ width: photoSize * 0.8, height: photoSize * 0.8, backgroundColor: rule }} />
            </View>
          </View>
        );
      case 'stacked-rules':
        return (
          <View style={{ padding: pad, backgroundColor: soft, gap: pad * 0.7, borderBottomWidth: hair * 2, borderBottomColor: accent }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: pad * 0.6 }}>
              <View style={{ width: photoSize, height: photoSize, borderRadius: photoSize / 2, backgroundColor: rule }} />
              <View style={{ flex: 1, gap: hair }}>
                <Bar w={nameW * 0.8} h={hair * 3} color={ink} />
                <Bar w={photoSize * 0.8} h={hair * 2} color={accent} />
              </View>
            </View>
            <Bar w={width * 0.62} h={hair * 1.4} color={rule} />
          </View>
        );
      case 'at-rule':
      default:
        return (
          <View style={{ padding: pad, alignItems: 'center', gap: hair }}>
            <Bar w={nameW} h={hair * 3.5} color="#000000" />
            <View style={{ height: hair * 1.6, alignSelf: 'stretch', backgroundColor: '#000000', marginVertical: hair }} />
            {[0.8, 0.66, 0.54].map((w, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: pad * 0.5, alignItems: 'center' }}>
                <Bar w={width * 0.16} h={hair * 1.4} color="#000000" />
                <Bar w={width * w * 0.5} h={hair * 1.4} color={rule} />
              </View>
            ))}
          </View>
        );
    }
  })();

  const railContent = (
    <View style={{ padding: pad * 0.8, gap: hair * 3 }}>
      {spec.skillStyle === 'pills' || spec.skillStyle === 'bars' ? pillsBlock(0) : null}
      {sectionBlock(1, true)}
      {line(0.8, 91)}
      {line(0.66, 92)}
    </View>
  );

  return (
    <View
      style={[
        styles.frame,
        {
          width,
          height,
          backgroundColor: '#FFFFFF',
          borderColor: selected ? '#0A7EA4' : '#E5E7EB',
          borderWidth: selected ? 2.5 : 1,
        },
      ]}
    >
      {header}
      {hasRail ? (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {spec.layout === 'rail-left' ? (
            <View
              style={{
                width: railWidth,
                backgroundColor: dark ? accent : soft,
                borderTopWidth: hair,
                borderTopColor: dark ? darken(accent, 0.3) : soft,
                borderRightWidth: hair,
                borderRightColor: dark ? darken(accent, 0.3) : soft,
              }}
            >
              {railContent}
            </View>
          ) : null}
          <View style={{ flex: 1, padding: pad * 0.85 }}>{sectionBlock(2)}{sectionBlock(3)}</View>
          {spec.layout === 'rail-right' ? (
            <View
              style={{
                width: railWidth,
                backgroundColor: dark ? accent : soft,
                borderTopWidth: hair,
                borderTopColor: dark ? darken(accent, 0.3) : soft,
                borderLeftWidth: hair,
                borderLeftColor: dark ? darken(accent, 0.3) : soft,
              }}
            >
              {railContent}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, padding: pad * 0.85 }}>
          {sectionBlock(0)}
          {sectionBlock(1)}
          {sectionBlock(2)}
        </View>
      )}
      <View style={styles.tag}>
        <Text style={styles.tagText} numberOfLines={1}>
          {TEMPLATE_MAP[spec.key] ? spec.name : 'Template'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tag: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,24,39,0.82)',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
