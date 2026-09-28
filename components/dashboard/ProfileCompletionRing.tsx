import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { CHART_COLORS } from '@/constants/dashboard';
import type { CompletionResult } from '@/utils/dashboardAnalytics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProfileCompletionRingProps {
  completion: CompletionResult;
  size?: number;
  thickness?: number;
  onPress?: () => void;
}

/**
 * Circular progress for profile completion. The sweep animates from empty on
 * mount so the value reads as measured rather than pasted in, and the gradient
 * shifts from amber through teal to green as the profile fills out.
 */
export default function ProfileCompletionRing({
  completion,
  size = 128,
  thickness = 12,
  onPress,
}: ProfileCompletionRingProps) {
  // A lazy `useState` keeps the Animated.Value stable without reading a ref
  // during render, which the react-hooks/refs rule rejects.
  const [progress] = useState(() => new Animated.Value(0));
  const [showMissing, setShowMissing] = useState(false);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, completion.percent));

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: percent / 100,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      // The dash offset is a prop on an SVG node, so it cannot use the native driver.
      useNativeDriver: false,
    }).start();
  }, [percent, progress]);

  // A full-length dash slid out of view leaves the empty part of the ring showing.
  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const tone = percent >= 85 ? '#10B981' : percent >= 50 ? '#0A7EA4' : '#F59E0B';
  const toneEnd = percent >= 85 ? '#34D399' : percent >= 50 ? '#22D3EE' : '#FBBF24';
  const missingCount = completion.total - completion.filled;

  const body = (
    <View style={styles.wrap}>
      <View style={[styles.ring, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="completionGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tone} />
              <Stop offset="1" stopColor={toneEnd} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={CHART_COLORS.track}
            strokeWidth={thickness}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#completionGrad)"
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            // Start the sweep at 12 o'clock.
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.centre} pointerEvents="none">
          <Text style={[styles.percent, { color: tone }]}>{percent}%</Text>
          <Text style={styles.complete}>
            {completion.filled}/{completion.total} fields
          </Text>
        </View>
      </View>

      <View style={styles.side}>
        <Text style={styles.headline}>
          {percent >= 100
            ? 'Profile complete'
            : percent >= 70
              ? 'Almost there'
              : percent >= 40
                ? 'Good progress'
                : 'Just getting started'}
        </Text>
        <Text style={styles.body}>
          {percent >= 100
            ? 'Everything is filled in — employers see the full picture when you apply.'
            : `Fill in ${missingCount} more detail${missingCount === 1 ? '' : 's'} to appear higher in employer searches.`}
        </Text>

        {completion.missing.length > 0 ? (
          showMissing ? (
            <View style={styles.missing}>
              <Text style={styles.missingTitle}>Still missing</Text>
              {completion.missing.map((field) => (
                <View key={field.key} style={styles.missingRow}>
                  <Text style={styles.missingBullet}>•</Text>
                  <Text style={styles.missingText}>{field.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowMissing(true)}
              style={styles.missingToggle}
            >
              <Text style={styles.missingToggleText}>
                See what’s missing ({completion.missing.length})
              </Text>
            </TouchableOpacity>
          )
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
  },
  complete: {
    fontSize: 9,
    fontWeight: '700',
    color: CHART_COLORS.body,
    marginTop: 2,
  },
  side: {
    flex: 1,
  },
  headline: {
    fontSize: 14,
    fontWeight: '800',
    color: CHART_COLORS.ink,
  },
  body: {
    fontSize: 11,
    color: CHART_COLORS.body,
    lineHeight: 16,
    marginTop: 4,
  },
  missingToggle: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  missingToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: CHART_COLORS.primary,
  },
  missing: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  missingTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  missingRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  missingBullet: {
    fontSize: 10,
    color: CHART_COLORS.axis,
  },
  missingText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
});
