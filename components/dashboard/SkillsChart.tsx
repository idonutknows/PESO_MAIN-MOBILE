import { Fragment, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { CHART_COLORS, SKILL_BAR_COLORS } from '@/constants/dashboard';
import type { SkillDatum } from '@/utils/dashboardAnalytics';

export interface SkillsChartProps {
  data: SkillDatum[];
  labelWidth?: number;
  barHeight?: number;
  rowGap?: number;
}

const CHART_WIDTH = 300;
const VALUE_GUTTER = 30;

/**
 * Horizontal bars drawn in SVG so the track, fill and rounded caps stay
 * pixel-crisp. Tapping a row reveals how the score was derived.
 */
export default function SkillsChart({
  data,
  labelWidth = 96,
  barHeight = 14,
  rowGap = 12,
}: SkillsChartProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Measured so the text overlay can be scaled to match the Svg viewBox.
  const [canvasWidth, setCanvasWidth] = useState(0);

  const plotWidth = CHART_WIDTH - labelWidth - VALUE_GUTTER;
  const height = data.length * (barHeight + rowGap) - rowGap + 4;
  const scale = canvasWidth > 0 ? canvasWidth / CHART_WIDTH : 0;
  const scaledLabelWidth = labelWidth * scale;
  const scaledPlotWidth = plotWidth * scale;

  return (
    <View onLayout={(event) => setCanvasWidth(event.nativeEvent.layout.width)}>
      <Svg width="100%" height={height} viewBox={`0 0 ${CHART_WIDTH} ${height}`}>
        <Defs>
          {SKILL_BAR_COLORS.map((color, index) => (
            <LinearGradient key={color} id={`skillGrad${index}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor={CHART_COLORS.primaryLighter} />
            </LinearGradient>
          ))}
        </Defs>

        {data.map((skill, index) => {
          const y = index * (barHeight + rowGap);
          const width = Math.max((skill.score / 100) * plotWidth, 3);
          const open = openKey === skill.label;
          return (
            <Fragment key={skill.label}>
              <Rect
                x={labelWidth}
                y={y + 1}
                width={plotWidth}
                height={barHeight}
                rx={barHeight / 2}
                fill={CHART_COLORS.track}
              />
              <Rect
                x={labelWidth}
                y={y + 1}
                width={width}
                height={barHeight}
                rx={barHeight / 2}
                fill={`url(#skillGrad${index % SKILL_BAR_COLORS.length})`}
                opacity={open ? 1 : 0.92}
              />
            </Fragment>
          );
        })}
      </Svg>

      {/* Labels and values are plain text so they inherit platform font
          rendering; the widths mirror the Svg's scaled geometry. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {scale > 0
          ? data.map((skill, index) => {
              const open = openKey === skill.label;
              return (
                <TouchableOpacity
                  key={skill.label}
                  activeOpacity={0.7}
                  onPress={() => setOpenKey(open ? null : skill.label)}
                  style={[styles.row, { height: barHeight, marginBottom: rowGap }]}
                >
                  <Text
                    style={[styles.label, { width: Math.max(scaledLabelWidth - 8, 24) }]}
                    numberOfLines={1}
                  >
                    {skill.short}
                  </Text>
                  <View style={{ width: scaledPlotWidth }} />
                  <Text style={styles.value}>{skill.score}</Text>
                </TouchableOpacity>
              );
            })
          : null}
      </View>

      {(() => {
        const open = data.find((skill) => skill.label === openKey);
        if (!open) {
          return (
            <Text style={styles.hint}>
              Readiness from your profile, training and live vacancies · tap a bar for the breakdown
            </Text>
          );
        }
        return (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{open.label}</Text>
            <Text style={styles.tooltipText}>{open.reason}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setOpenKey(null)}
              style={styles.tooltipLink}
            >
              <Text style={styles.tooltipLinkText}>Got it</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  value: {
    width: VALUE_GUTTER - 6,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  hint: {
    fontSize: 10,
    color: CHART_COLORS.axis,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
  tooltip: {
    marginTop: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 11,
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  tooltipText: {
    fontSize: 10,
    color: CHART_COLORS.body,
    marginTop: 3,
    lineHeight: 15,
  },
  tooltipLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  tooltipLinkText: {
    fontSize: 10,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
});
