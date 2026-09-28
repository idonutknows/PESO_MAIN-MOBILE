import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { CHART_COLORS } from '@/constants/dashboard';
import type { StatusSlice } from '@/utils/dashboardAnalytics';

export interface DoughnutChartProps {
  data: StatusSlice[];
  total: number;
  /** Upper bound only — shrinks automatically when the card is narrow. */
  size?: number;
  thickness?: number;
}

interface Arc {
  key: string;
  color: string;
  count: number;
  label: string;
  percent: number;
  start: number;
  length: number;
}

/**
 * Donut segments are drawn as a dashed circle: each slice contributes one dash
 * whose length is its share of the circumference, offset to the right start
 * angle. That keeps the arcs perfectly joined, animatable and crisp at any size.
 */
export default function DoughnutChart({
  data,
  total,
  size = 176,
  thickness = 26,
}: DoughnutChartProps) {
  const [active, setActive] = useState<string | null>(null);
  // Measured so the donut can stack above its legend instead of squeezing it
  // into nothing inside a half-width card.
  const [available, setAvailable] = useState(0);

  const stacked = available > 0 && available < 300;
  const chartSize = stacked ? Math.min(size, Math.max(available, 120)) : size;
  const cx = chartSize / 2;
  const cy = chartSize / 2;
  const rOuter = chartSize / 2 - 2;
  const radius = (rOuter + rOuter - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo<Arc[]>(() => {
    if (!total) return [];
    let cursor = 0;
    return data
      .filter((slice) => slice.count > 0)
      .map((slice) => {
        const length = (slice.count / total) * circumference;
        const arc: Arc = {
          key: slice.status,
          color: slice.color,
          count: slice.count,
          label: slice.label,
          percent: slice.percent,
          start: cursor,
          length,
        };
        cursor += length;
        return arc;
      });
  }, [data, total, circumference]);

  const activeArc = arcs.find((arc) => arc.key === active) ?? null;

  return (
    <View
      style={stacked ? [styles.wrap, styles.wrapStacked] : styles.wrap}
      onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}
    >
      <View style={[styles.chartArea, { width: chartSize, height: chartSize }]}>
        <Svg width={chartSize} height={chartSize}>
          <G rotation={-90} origin={`${cx}, ${cy}`}>
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={CHART_COLORS.track}
              strokeWidth={thickness}
              fill="none"
            />
            {arcs.map((arc) => (
              <Circle
                key={arc.key}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={arc.color}
                strokeWidth={active === arc.key ? thickness + 6 : thickness}
                // The gap equals the full circumference, so the dash never repeats.
                strokeDasharray={`${Math.max(arc.length - 1.5, 0.5)} ${circumference}`}
                strokeDashoffset={-arc.start}
                fill="none"
                strokeLinecap="butt"
                opacity={active && active !== arc.key ? 0.32 : 1}
              />
            ))}
          </G>
        </Svg>

        <View style={styles.centre} pointerEvents="none">
          <Text style={styles.centreValue}>{activeArc ? activeArc.count : total}</Text>
          <Text style={styles.centreLabel} numberOfLines={1}>
            {activeArc ? activeArc.label : total === 1 ? 'Application' : 'Applications'}
          </Text>
          {activeArc ? <Text style={styles.centrePercent}>{activeArc.percent}% of total</Text> : null}
        </View>
      </View>

      <View style={[styles.legend, stacked ? styles.legendStacked : null]}>
        {data.map((slice) => {
          const dim = slice.count === 0;
          const isActive = active === slice.status;
          return (
            <TouchableOpacity
              key={slice.status}
              activeOpacity={0.7}
              disabled={dim}
              onPress={() => setActive(isActive ? null : slice.status)}
              style={[styles.legendRow, isActive ? styles.legendRowActive : null]}
            >
              <View
                style={[styles.dot, { backgroundColor: slice.color }, dim ? styles.dotDim : null]}
              />
              <Text
                style={[styles.legendLabel, dim ? styles.legendLabelDim : null]}
                numberOfLines={1}
              >
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, dim ? styles.legendLabelDim : null]}>
                {slice.count}
              </Text>
              <Text style={[styles.legendPercent, dim ? styles.legendLabelDim : null]}>
                {slice.percent}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  wrapStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  centreValue: {
    fontSize: 30,
    fontWeight: '800',
    color: CHART_COLORS.ink,
    letterSpacing: -1,
  },  centreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: CHART_COLORS.body,
    marginTop: 1,
    textAlign: 'center',
  },
  centrePercent: {
    fontSize: 9,
    fontWeight: '700',
    color: CHART_COLORS.primary,
    marginTop: 3,
  },
  legend: {
    flex: 1,
    gap: 2,
  },
  legendStacked: {
    width: '100%',
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  legendRowActive: {
    backgroundColor: '#F1F5F9',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotDim: {
    opacity: 0.3,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  legendLabelDim: {
    color: '#CBD5E1',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '800',
    color: CHART_COLORS.ink,
    minWidth: 22,
    textAlign: 'right',
  },
  legendPercent: {
    fontSize: 9,
    fontWeight: '600',
    color: CHART_COLORS.axis,
    minWidth: 34,
    textAlign: 'right',
  },
});
