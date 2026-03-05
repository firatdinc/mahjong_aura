import React, {useRef, useCallback} from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface AnimatedPressableProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  activeScale?: number;
  children: React.ReactNode;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  onPress,
  style,
  disabled,
  activeScale = 0.95,
  children,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: activeScale,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [scale, activeScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}>
      <Animated.View style={[style, {transform: [{scale}]}]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
