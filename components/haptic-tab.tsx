import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';

type HapticTabProps = Omit<PressableProps, 'style'> & {
  style?: PressableProps['style'] | any[];
  accessibilityState?: PressableProps['accessibilityState'] & { disabled?: boolean };
  onPress?: (event: any) => void;
  testID?: string;
};

export function HapticTab(props: HapticTabProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
