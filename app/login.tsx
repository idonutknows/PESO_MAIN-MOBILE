import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PesoLogo } from '@/components/PesoLogo';
import { useAuth } from '@/contexts/AuthContext';
import { buildAuthLayout, type AuthMetrics } from '@/utils/authLayout';

/**
 * Login is a single-column form sized to the viewport. It deliberately does not
 * scroll: `utils/authLayout` picks a density that fits and degrades the header
 * and labels before it would ever overflow, so the Sign In button is always
 * reachable. See `scripts/verify-auth-layout.js`.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // On Android the window already shrinks when the keyboard opens
  // (adjustResize), so subtracting the keyboard there would double-count it.
  // On iOS the window keeps its size, so the metrics need the correction.
  const layout = buildAuthLayout({
    width,
    height,
    insets,
    fields: 2,
    extraRows: 1,
    keyboardOpen: keyboardOpen && Platform.OS === 'ios',
  });
  const m = layout.metrics;

  // Lazy `useState` keeps the Animated.Values stable without reading refs during
  // render, which the react-hooks/refs rule rejects.
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(16));
  const [cardAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, cardAnim]);

  useEffect(() => {
    const showEvent = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideEvent = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showEvent.remove();
      hideEvent.remove();
    };
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    return newErrors;
  };

  async function handleLogin() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  }

  const clearError = useCallback(
    (field: string) => {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [errors]
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={m.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Two soft washes for depth; both are clipped by the screen edge. */}
      <View style={styles.washTop} pointerEvents="none" />
      <View style={styles.washBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <View
          style={[
            styles.body,
            {
              paddingHorizontal: m.gutter,
              paddingTop: insets.top + m.verticalPadding,
              paddingBottom: insets.bottom + m.verticalPadding,
            },
          ]}
        >
          {m.showHeader ? (
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                  marginBottom: m.headerGap,
                },
              ]}
            >
              <View style={{ marginBottom: m.logoGap }}>
                <PesoLogo size={m.logoSize} variant="badge" />
              </View>
              <ThemedText
                style={[styles.headerTitle, { fontSize: m.headerTitleSize, lineHeight: m.headerTitleLineHeight }]}
                numberOfLines={m.headerTitleLines}
              >
                PESO – Public Employment{'\n'}Service Office
              </ThemedText>
              {m.showTagline ? (
                <ThemedText style={[styles.headerTagline, { fontSize: m.taglineSize }]}>
                  Connecting Job Seekers with Opportunities
                </ThemedText>
              ) : null}
            </Animated.View>
          ) : null}

          <Animated.View
            style={[
              styles.cardWrap,
              {
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.card,
                {
                  borderRadius: m.cardRadius,
                  paddingHorizontal: m.cardPadX,
                  paddingTop: m.cardPadTop,
                  paddingBottom: m.cardPadBottom,
                },
              ]}
            >
              <View style={{ marginBottom: m.cardHeaderGap }}>
                <ThemedText style={[styles.cardTitle, { fontSize: m.cardTitleSize }]}>
                  Welcome Back
                </ThemedText>
                {m.showCardSubtitle ? (
                  <ThemedText style={[styles.cardSubtitle, { fontSize: m.cardSubtitleSize }]}>
                    Sign in to continue to your account
                  </ThemedText>
                ) : null}
              </View>

              <Field
                m={m}
                label="Email Address"
                accessibilityLabel="Email address"
                icon="mail-outline"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError('email');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <Field
                m={m}
                label="Password"
                accessibilityLabel="Password"
                icon="lock-outline"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
                error={errors.password}
                right={
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={m.iconSize}
                      color={m.iconColor}
                    />
                  </TouchableOpacity>
                }
              />

              {/* No forgot-password route exists yet, so this stays a
                  non-navigating affordance exactly as it was. */}
              <TouchableOpacity style={{ marginBottom: m.buttonGap, alignSelf: 'flex-end' }} activeOpacity={0.6}>
                <ThemedText style={[styles.linkText, { fontSize: m.forgotSize, color: m.brandText }]}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { height: m.buttonHeight, borderRadius: m.buttonRadius }]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={isSubmitting ? ['#9CA3AF', '#9CA3AF'] : [...m.brand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.buttonGradient, { borderRadius: m.buttonRadius }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="login" size={m.buttonFontSize + 3} color="#fff" />
                      <ThemedText
                        style={[styles.buttonText, { fontSize: m.buttonFontSize }]}
                      >
                        Sign In
                      </ThemedText>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={[styles.switchRow, { marginTop: m.linkGap }]}>
                <ThemedText style={[styles.switchText, { fontSize: m.linkSize }]}>
                  New to PESO?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/register')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                >
                  <ThemedText
                    style={[styles.linkText, { fontSize: m.linkSize, color: m.brandText }]}
                  >
                    Create Account
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Compact labelled input.
 *
 * The error line is always rendered, even when empty, so a validation message
 * appearing cannot push the rest of the form down or off screen.
 */
function Field({
  m,
  label,
  accessibilityLabel,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  right,
}: {
  m: AuthMetrics;
  label: string;
  accessibilityLabel: string;
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  right?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: m.groupGap }}>
      {m.showFieldLabels ? (
        <ThemedText
          style={[styles.fieldLabel, { fontSize: m.labelSize, lineHeight: m.labelLineHeight, marginBottom: m.labelGap }]}
        >
          {label}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            height: m.inputHeight,
            borderRadius: m.buttonRadius,
            paddingLeft: m.iconPadX,
            borderColor: error ? '#EF4444' : m.fieldBorder,
            backgroundColor: error ? '#FEF2F2' : m.fieldBg,
          },
        ]}
      >
        <MaterialIcons
          name={icon}
          size={m.iconSize}
          color={m.iconColor}
          style={{ marginRight: 6 }}
        />
        <TextInput
          style={[styles.input, { fontSize: m.inputFontSize }]}
          placeholder={placeholder}
          placeholderTextColor={m.iconColor}
          accessibilityLabel={accessibilityLabel}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
        />
        {right}
      </View>
      <ThemedText
        style={[
          styles.errorText,
          { fontSize: m.errorFontSize, lineHeight: m.errorHeight, marginLeft: 2 },
        ]}
        numberOfLines={1}
      >
        {error ?? ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  body: {
    flex: 1,
    justifyContent: 'center',
    // Stops a wide font or long email address from pushing the card sideways.
    overflow: 'hidden',
  },
  washTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  washBottom: {
    position: 'absolute',
    bottom: -70,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  header: { alignItems: 'center' },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerTagline: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },

  cardWrap: { flexShrink: 1 },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    shadowColor: '#04324D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  cardTitle: {
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },

  fieldLabel: { fontWeight: '600', color: '#374151' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    color: '#11181C',
    paddingVertical: 0,
  },
  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  errorText: { color: '#EF4444', fontWeight: '500' },

  button: { overflow: 'hidden', width: '100%' },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  buttonText: { color: '#ffffff', fontWeight: '700' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  switchText: { color: '#8E8E93', fontWeight: '500' },
  linkText: { fontWeight: '700' },
});
