import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
 * Create Account fits four fields plus a button into the viewport without
 * scrolling. On a 360x640 screen that means the brand header is dropped
 * outright and the field labels fall back to placeholders (carried over to
 * `accessibilityLabel` so screen readers still announce them). See
 * `scripts/verify-auth-layout.js`.
 */
export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const router = useRouter();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // On Android the window already shrinks when the keyboard opens
  // (adjustResize), so subtracting the keyboard there would double-count it.
  const layout = buildAuthLayout({
    width,
    height,
    insets,
    fields: 4,
    extraRows: 0,
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
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!passwordConfirmation.trim()) newErrors.password_confirmation = 'Please confirm your password';
    else if (password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match';
    return newErrors;
  };

  async function handleRegister() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await register(name, email, password, passwordConfirmation, 'job_seeker');
      Alert.alert('Success', 'Account created successfully! Please login to continue.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Could not create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={m.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
                style={[
                  styles.headerTitle,
                  { fontSize: m.headerTitleSize, lineHeight: m.headerTitleLineHeight },
                ]}
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
                  Create Account
                </ThemedText>
                {m.showCardSubtitle ? (
                  <ThemedText style={[styles.cardSubtitle, { fontSize: m.cardSubtitleSize }]}>
                    Register as a Job Seeker to get started
                  </ThemedText>
                ) : null}
              </View>

              <Field
                m={m}
                label="Full Name"
                accessibilityLabel="Full name"
                icon="person-outline"
                placeholder="Enter your full name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError('name');
                }}
                autoCapitalize="words"
                error={errors.name}
              />

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
                error={errors.email}
              />

              <Field
                m={m}
                label="Password"
                accessibilityLabel="Password"
                icon="lock-outline"
                placeholder="Create a password"
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

              <Field
                m={m}
                label="Confirm Password"
                accessibilityLabel="Confirm password"
                icon="lock-outline"
                placeholder="Re-enter your password"
                value={passwordConfirmation}
                onChangeText={(text) => {
                  setPasswordConfirmation(text);
                  clearError('password_confirmation');
                }}
                secureTextEntry={!showConfirmPassword}
                error={errors.password_confirmation}
                right={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'
                    }
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={m.iconSize}
                      color={m.iconColor}
                    />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  { height: m.buttonHeight, borderRadius: m.buttonRadius, marginTop: m.buttonGap },
                ]}
                onPress={handleRegister}
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
                      <MaterialIcons name="person-add" size={m.buttonFontSize + 3} color="#fff" />
                      <ThemedText style={[styles.buttonText, { fontSize: m.buttonFontSize }]}>
                        Create Account
                      </ThemedText>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={[styles.switchRow, { marginTop: m.linkGap }]}>
                <ThemedText style={[styles.switchText, { fontSize: m.linkSize }]}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.push('/login')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                >
                  <ThemedText
                    style={[styles.linkText, { fontSize: m.linkSize, color: m.brandText }]}
                  >
                    Sign In
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
 * Compact labelled input. The error line is always rendered, even when empty,
 * so a validation message appearing cannot shift the form.
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
          style={[
            styles.fieldLabel,
            {
              fontSize: m.labelSize,
              lineHeight: m.labelLineHeight,
              marginBottom: m.labelGap,
            },
          ]}
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
  cardTitle: { fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  cardSubtitle: { color: '#8E8E93', fontWeight: '500', marginTop: 2 },

  fieldLabel: { fontWeight: '600', color: '#374151' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingRight: 4,
  },
  input: { flex: 1, color: '#11181C', paddingVertical: 0 },
  eyeButton: { paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
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
