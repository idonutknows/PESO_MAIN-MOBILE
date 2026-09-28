import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { CHART_COLORS } from '@/constants/dashboard';
import type { ActivityBucket } from '@/utils/dashboardAnalytics';

export type ActivityMode = 'bar' | 'line';

export interface ActivityChartProps {
  data: ActivityBucket[];
  mode: ActivityMode;
  height?: number;
}

const PADDING_LEFT = 22;
const PADDING_RIGHT = 8;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 26;

/** Rounds the axis maximum up to a friendly step so ticks stay readable. */
function niceMax(value: number): number {
  if (value <= 1) return 1;
  if (value <= 2) return 2;
  if (value <= 4) return 4;
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  return Math.ceil(value / 5) * 5;
}

/** Catmull-Rom → cubic Bézier, so the line reads smooth without a spline library. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function ActivityChart({ data, mode, height = 186 }: ActivityChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // Measured so the axis labels can be thinned against real pixels, and so the
  // tap columns can be positioned in the same space as the SVG is scaled into.
  const [canvasWidth, setCanvasWidth] = useState(0);

  const geometry = useMemo(() => {
    const width = 320; // the Svg scales to the parent; this keeps maths stable
    const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
    const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
    const max = niceMax(Math.max(...data.map((d) => d.count), 0));
    const step = data.length ? plotWidth / data.length : plotWidth;
    const barWidth = Math.min(26, Math.max(10, step * 0.52));

    const points = data.map((bucket, index) => {
      const x = PADDING_LEFT + step * index + step / 2;
      const y = PADDING_TOP + plotHeight - (bucket.count / max) * plotHeight;
      return { x, y, bucket };
    });

    return { width, plotWidth, plotHeight, max, step, barWidth, points };
  }, [data, height]);

  const { plotHeight, max, step, barWidth, points } = geometry;
  // The Svg scales its 320-unit viewBox to the measured width; overlays drawn
  // in plain Views have to apply the same factor to stay aligned.
  const scale = canvasWidth > 0 ? canvasWidth / geometry.width : 0;
  const active = activeIndex != null ? points[activeIndex] : null;
  const total = data.reduce((sum, bucket) => sum + bucket.count, 0);
  const linePath = smoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight} L ${points[0].x} ${
        PADDING_TOP + plotHeight
      } Z`
    : '';

  const ticks = [0, 0.5, 1].map((ratio) => ({
    y: PADDING_TOP + plotHeight - plotHeight * ratio,
    value: Math.round(max * ratio),
  }));

  return (
    <View>
      <View
        style={styles.canvasWrap}
        onLayout={(event) => setCanvasWidth(event.nativeEvent.layout.width)}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${geometry.width} ${height}`}>
          <Defs>
            <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CHART_COLORS.primaryLighter} />
              <Stop offset="1" stopColor={CHART_COLORS.primary} />
            </LinearGradient>
            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CHART_COLORS.primaryLighter} stopOpacity={0.28} />
              <Stop offset="1" stopColor={CHART_COLORS.primaryLighter} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* Horizontal gridlines + y-axis ticks */}
          {ticks.map((tick) => (
            <Line
              key={`grid-${tick.value}`}
              x1={PADDING_LEFT}
              y1={tick.y}
              x2={geometry.width - PADDING_RIGHT}
              y2={tick.y}
              stroke={CHART_COLORS.grid}
              strokeWidth={1}
            />
          ))}

          {mode === 'bar' ? (
            points.map(({ x, y, bucket }, index) => {
              const barHeight = Math.max(PADDING_TOP + plotHeight - y, bucket.count ? 3 : 0);
              return (
                <Rect
                  key={`bar-${bucket.start}`}
                  x={x - barWidth / 2}
                  y={PADDING_TOP + plotHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={barWidth / 2.6}
                  fill="url(#barFill)"
                  opacity={activeIndex == null || activeIndex === index ? 1 : 0.4}
                />
              );
            })
          ) : (
            <>
              {areaPath ? <Path d={areaPath} fill="url(#areaFill)" /> : null}
              {linePath ? (
                <Path
                  d={linePath}
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {points.map(({ x, y, bucket }, index) => (
                <Circle
                  key={`pt-${bucket.start}`}
                  cx={x}
                  cy={y}
                  r={activeIndex === index ? 5.5 : 3.5}
                  fill="#FFFFFF"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                />
              ))}
            </>
          )}

          {/* Baseline */}
          <Line
            x1={PADDING_LEFT}
            y1={PADDING_TOP + plotHeight}
            x2={geometry.width - PADDING_RIGHT}
            y2={PADDING_TOP + plotHeight}
            stroke={CHART_COLORS.axis}
            strokeWidth={1}
          />
        </Svg>

        {/* y-axis labels */}
        {ticks.map((tick) => (
          <Text key={`yl-${tick.value}`} style={[styles.yLabel, { top: tick.y - 7 }]}>
            {tick.value}
          </Text>
        ))}

        {/* Tap targets: full-height columns so a thumb easily hits a week.
            `x` is in viewBox units, so it has to be scaled to the measured
            width to stay under the bar it belongs to. */}
        {scale > 0
          ? points.map(({ bucket, x }, index) => (
              <TouchableOpacity
                key={`hit-${bucket.start}`}
                activeOpacity={1}
                onPress={() => setActiveIndex(activeIndex === index ? null : index)}
                style={[
                  styles.hit,
                  { left: (x - step / 2) * scale, width: Math.max(step * scale, 8), top: 0, height },
                ]}
              />
            ))
          : null}
      </View>

      {/* x-axis labels — absolutely positioned on each column centre, thinned
          out so they never overlap on a narrow phone. */}
      <View style={styles.xAxis}>
        {scale > 0
          ? data.map((bucket, index) => {
              const centre = points[index].x * scale;
              const every = step * scale < 34 ? 2 : 1;
              if (index % every !== 0) return null;
              return (
                <Text
                  key={`xl-${bucket.start}`}
                  style={[
                    styles.xLabel,
                    { left: centre },
                    activeIndex === index ? styles.xLabelActive : null,
                  ]}
                >
                  {bucket.label}
                </Text>
              );
            })
          : null}
      </View>

      {active ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipValue}>
            {active.bucket.count} application{active.bucket.count === 1 ? '' : 's'}
          </Text>
          <Text style={styles.tooltipLabel}>week of {active.bucket.label}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>
          {total > 0
            ? `${total} application${total === 1 ? '' : 's'} in the last ${data.length} weeks · tap a column for detail`
            : 'Tap a column for detail'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvasWrap: {
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 18,
    textAlign: 'right',
    fontSize: 9,
    color: CHART_COLORS.axis,
    fontWeight: '600',
  },
  hit: {
    position: 'absolute',
  },
  xAxis: {
    height: 14,
    marginTop: 2,
  },
  xLabel: {
    position: 'absolute',
    width: 44,
    marginLeft: -22,
    textAlign: 'center',
    fontSize: 9,
    color: CHART_COLORS.axis,
    fontWeight: '600',
  },
  xLabelActive: {
    color: CHART_COLORS.primary,
    fontWeight: '800',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: CHART_COLORS.body,
  },
  hint: {
    fontSize: 10,
    color: CHART_COLORS.axis,
    marginTop: 10,
    textAlign: 'center',
  },
});
