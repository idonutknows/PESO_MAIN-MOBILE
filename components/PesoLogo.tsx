import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface PesoLogoProps {
  size?: number;
  variant?: 'hero' | 'compact' | 'icon' | 'badge';
  showText?: boolean;
}

export function PesoLogo({ size = 60, variant = 'hero', showText = false }: PesoLogoProps) {
  if (variant === 'icon') {
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.iconWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient
            colors={['#0891b2', '#0a7ea4', '#0e6b8a']}
            style={[styles.iconGrad, { borderRadius: size / 2 }]}
          >
            <MaterialIcons name="work" size={size * 0.42} color="#ffffff" />
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (variant === 'compact') {
    const r = size * 0.28;
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.compactOuter, { width: size, height: size, borderRadius: r }]}>
          <LinearGradient
            colors={['#0891b2', '#0a7ea4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.compactInner, { borderRadius: r }]}
          >
            <View style={[styles.compactShield, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.1 }]}>
              <MaterialIcons name="work" size={size * 0.22} color="#0a7ea4" />
            </View>
            <Text style={[styles.compactText, { fontSize: size * 0.11 }]}>PESO</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (variant === 'badge') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer white ring */}
        <View style={[styles.badgeOuter, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient
            colors={['#f0fafa', '#E0F7FA', '#B2EBF2']}
            style={[styles.badgeOuterGrad, { borderRadius: size / 2 }]}
          />
        </View>
        {/* Teal ring */}
        <View style={[styles.badgeTealRing, { width: size * 0.88, height: size * 0.88, borderRadius: (size * 0.88) / 2 }]}>
          <LinearGradient
            colors={['#0891b2', '#0a7ea4', '#065f7a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badgeTealGrad, { borderRadius: (size * 0.88) / 2 }]}
          />
        </View>
        {/* White inner ring */}
        <View style={[styles.badgeWhiteInner, { width: size * 0.76, height: size * 0.76, borderRadius: (size * 0.76) / 2 }]}>
          <View style={[styles.badgeWhiteInnerBorder, { borderRadius: (size * 0.76) / 2 }]} />
        </View>
        {/* Center content */}
        <View style={[styles.badgeCenter, { width: size * 0.68, height: size * 0.68, borderRadius: (size * 0.68) / 2 }]}>
          <LinearGradient
            colors={['#0891b2', '#0a7ea4']}
            style={[styles.badgeCenterGrad, { borderRadius: (size * 0.68) / 2 }]}
          >
            <MaterialIcons name="work" size={size * 0.2} color="#ffffff" />
            <Text style={[styles.badgeText, { fontSize: size * 0.08 }]}>PESO</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  // HERO variant - government seal
  const rayCount = 8;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Sun rays - centered */}
      <View style={[styles.sunRaysWrap, { width: size, height: size }]}>
        {Array.from({ length: rayCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sunRay,
              {
                width: 2.5,
                height: size * 0.16,
                borderRadius: 1.25,
                position: 'absolute',
                top: size * 0.07,
                left: size / 2 - 1.25,
                transformOrigin: `1.25px ${size * 0.43}px`,
                transform: [{ rotate: `${(360 / rayCount) * i}deg` }],
              },
            ]}
          />
        ))}
      </View>

      {/* Layer 1: Outer glow ring */}
      <View style={[styles.heroL1, { width: size, height: size, borderRadius: size / 2 }]} />

      {/* Layer 2: White border */}
      <View style={[styles.heroL2, { width: size * 0.95, height: size * 0.95, borderRadius: (size * 0.95) / 2 }]}>
        <View style={[styles.heroL2Inner, { borderRadius: (size * 0.95) / 2 }]} />
      </View>

      {/* Layer 3: Main teal circle */}
      <View style={[styles.heroL3, { width: size * 0.9, height: size * 0.9, borderRadius: (size * 0.9) / 2 }]}>
        <LinearGradient
          colors={['#0891b2', '#0a7ea4', '#065f7a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroL3Grad, { borderRadius: (size * 0.9) / 2 }]}
        />
      </View>

      {/* Layer 4: Dashed ring */}
      <View style={[styles.heroL4, { width: size * 0.78, height: size * 0.78, borderRadius: (size * 0.78) / 2 }]}>
        <View style={[styles.heroL4Border, { borderRadius: (size * 0.78) / 2 }]} />
      </View>

      {/* Layer 5: Inner circle */}
      <View style={[styles.heroL5, { width: size * 0.72, height: size * 0.72, borderRadius: (size * 0.72) / 2 }]}>
        <View style={[styles.heroL5Inner, { borderRadius: (size * 0.72) / 2 }]} />
      </View>

      {/* Layer 6: Center content */}
      <View style={[styles.heroL6, { width: size * 0.66, height: size * 0.66, borderRadius: (size * 0.66) / 2 }]}>
        <View style={styles.heroL6Content}>
          {/* Shield */}
          <View style={[styles.heroShield, { width: size * 0.28, height: size * 0.3, borderRadius: size * 0.04 }]}>
            <MaterialIcons name="work" size={size * 0.14} color="#ffffff" />
          </View>
          {/* PESO */}
          <Text style={[styles.heroPeso, { fontSize: size * 0.12, marginTop: size * 0.008 }]}>PESO</Text>
          {/* Line */}
          <View style={[styles.heroLine, { width: size * 0.28 }]} />
        </View>
      </View>

      {/* Bottom text */}
      {showText && (
        <Text style={[styles.heroLabel, { fontSize: Math.max(7, size * 0.085), top: size + size * 0.06 }]}>
          MUNICIPALITY OF OPOL
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // --- ICON ---
  iconWrap: { overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  iconGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // --- COMPACT ---
  compactOuter: { overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  compactInner: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 2 },
  compactShield: { backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  compactText: { color: '#ffffff', fontWeight: '900', letterSpacing: 2 },

  // --- BADGE ---
  badgeOuter: { position: 'absolute' },
  badgeOuterGrad: { flex: 1, borderWidth: 3, borderColor: '#0a7ea4' },
  badgeTealRing: { position: 'absolute' },
  badgeTealGrad: { flex: 1 },
  badgeWhiteInner: { position: 'absolute' },
  badgeWhiteInnerBorder: { flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  badgeCenter: { position: 'absolute' },
  badgeCenterGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 1 },
  badgeText: { color: '#ffffff', fontWeight: '900', letterSpacing: 3 },

  // --- HERO ---
  sunRaysWrap: { position: 'absolute' },
  sunRay: { backgroundColor: 'rgba(255,255,255,0.1)' },
  heroL1: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  heroL2: { position: 'absolute' },
  heroL2Inner: { flex: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroL3: { position: 'absolute' },
  heroL3Grad: { flex: 1 },
  heroL4: { position: 'absolute' },
  heroL4Border: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  heroL5: { position: 'absolute' },
  heroL5Inner: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroL6: { position: 'absolute' },
  heroL6Content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroShield: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPeso: { color: '#ffffff', fontWeight: '900', letterSpacing: 4 },
  heroLine: { height: 1.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1, marginTop: 2 },
  heroLabel: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    alignSelf: 'center',
  },
});
