import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function Card({
  title,
  icon,
  right,
  children,
  accent,
}: {
  title: string;
  icon?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.head}>
        <View style={cardStyles.headLeft}>
          {icon ? <ThemedText style={cardStyles.icon}>{icon}</ThemedText> : null}
          <ThemedText style={cardStyles.title}>{title}</ThemedText>
          {accent ? <View style={[cardStyles.dot, { backgroundColor: accent }]} /> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  hint,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={cardStyles.field}>
      <ThemedText style={cardStyles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[cardStyles.input, multiline ? cardStyles.inputMultiline : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {hint ? <ThemedText style={cardStyles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  hint,
  swatch,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  hint?: string;
  swatch?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        chipStyles.chip,
        active ? chipStyles.chipActive : null,
        disabled ? chipStyles.chipDisabled : null,
      ]}
    >
      {swatch ? (
        <View
          style={[
            chipStyles.swatch,
            { backgroundColor: swatch },
            active ? { borderColor: '#0A7EA4' } : null,
          ]}
        />
      ) : null}
      <View>
        <ThemedText style={[chipStyles.chipText, active ? chipStyles.chipTextActive : null]}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText style={[chipStyles.chipHint, active ? chipStyles.chipHintActive : null]}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function Stepper({
  label,
  value,
  display,
  onDecrement,
  onIncrement,
  disabledDecrement,
  disabledIncrement,
}: {
  label: string;
  value: number;
  display: string;
  onDecrement: () => void;
  onIncrement: () => void;
  disabledDecrement?: boolean;
  disabledIncrement?: boolean;
}) {
  return (
    <View style={stepperStyles.row}>
      <ThemedText style={stepperStyles.label}>{label}</ThemedText>
      <View style={stepperStyles.controls}>
        <TouchableOpacity
          onPress={onDecrement}
          disabled={disabledDecrement}
          style={[stepperStyles.button, disabledDecrement ? stepperStyles.buttonDisabled : null]}
        >
          <Text style={stepperStyles.symbol}>−</Text>
        </TouchableOpacity>
        <View style={stepperStyles.valueBox}>
          <ThemedText style={stepperStyles.value}>{display}</ThemedText>
        </View>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={disabledIncrement}
          style={[stepperStyles.button, disabledIncrement ? stepperStyles.buttonDisabled : null]}
        >
          <Text style={stepperStyles.symbol}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={stepperStyles.barTrack}>
        <View style={[stepperStyles.barFill, { width: `${Math.round(value * 100)}%` }]} />
      </View>
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={toggleStyles.row} onPress={() => onValueChange(!value)} activeOpacity={0.7}>
      <View style={toggleStyles.text}>
        <ThemedText style={toggleStyles.label}>{label}</ThemedText>
        {hint ? <ThemedText style={toggleStyles.hint}>{hint}</ThemedText> : null}
      </View>
      <View style={[toggleStyles.track, value ? toggleStyles.trackOn : null]}>
        <View style={[toggleStyles.knob, value ? toggleStyles.knobOn : null]} />
      </View>
    </TouchableOpacity>
  );
}

export function MoveButtons({
  onUp,
  onDown,
  onRemove,
  canRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  return (
    <View style={moveStyles.row}>
      <TouchableOpacity onPress={onUp} style={moveStyles.btn} hitSlop={6}>
        <Text style={moveStyles.glyph}>▲</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDown} style={moveStyles.btn} hitSlop={6}>
        <Text style={moveStyles.glyph}>▼</Text>
      </TouchableOpacity>
      {onRemove ? (
        <TouchableOpacity
          onPress={onRemove}
          disabled={canRemove === false}
          style={[moveStyles.btn, canRemove === false ? moveStyles.btnDisabled : null]}
          hitSlop={6}
        >
          <Text style={[moveStyles.glyph, moveStyles.glyphDanger]}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: object;
}) {
  const palette = {
    primary: { bg: '#0A7EA4', border: '#0A7EA4', fg: '#FFFFFF' },
    secondary: { bg: '#FFFFFF', border: '#E5E7EB', fg: '#1C1C1E' },
    ghost: { bg: 'transparent', border: 'transparent', fg: '#0A7EA4' },
    danger: { bg: '#FEF2F2', border: '#FECACA', fg: '#DC2626' },
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        buttonStyles.btn,
        { backgroundColor: palette.bg, borderColor: palette.border },
        disabled ? buttonStyles.btnDisabled : null,
        style,
      ]}
    >
      {icon ? <Text style={[buttonStyles.icon, { color: palette.fg }]}>{icon}</Text> : null}
      <ThemedText style={[buttonStyles.label, { color: palette.fg }]}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

const cardStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  headLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  icon: { fontSize: 17 },
  title: { fontSize: 15, fontWeight: '700' as const, color: '#1C1C1E' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#6B7280', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1C1C1E',
  },
  inputMultiline: { minHeight: 92, paddingTop: 11 },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 5 },
};

const chipStyles = {
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#0A7EA4', backgroundColor: '#E6F4FE' },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: '#3A3A3C' },
  chipTextActive: { color: '#0A7EA4' },
  chipHint: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  chipHintActive: { color: '#0A7EA4' },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF' },
};

const stepperStyles = {
  row: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#6B7280', marginBottom: 8 },
  controls: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  button: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonDisabled: { opacity: 0.35 },
  symbol: { fontSize: 19, fontWeight: '700' as const, color: '#1C1C1E' },
  valueBox: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  value: { fontSize: 14, fontWeight: '700' as const, color: '#1C1C1E' },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 9,
    overflow: 'hidden' as const,
  },
  barFill: { height: 4, borderRadius: 2, backgroundColor: '#0A7EA4' },
};

const toggleStyles = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 9,
  },
  text: { flex: 1, paddingRight: 12 },
  label: { fontSize: 14, fontWeight: '600' as const, color: '#1C1C1E' },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  track: {
    width: 48,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    padding: 3,
    justifyContent: 'center' as const,
  },
  trackOn: { backgroundColor: '#0A7EA4' },
  knob: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  knobOn: { alignSelf: 'flex-end' as const },
};

const moveStyles = {
  row: { flexDirection: 'row' as const, gap: 6 },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnDisabled: { opacity: 0.3 },
  glyph: { fontSize: 11, color: '#6B7280' },
  glyphDanger: { color: '#DC2626', fontSize: 13 },
};

const buttonStyles = {
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnDisabled: { opacity: 0.5 },
  icon: { fontSize: 15 },
  label: { fontSize: 14, fontWeight: '700' as const },
};
