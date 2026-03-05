import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Dimensions} from 'react-native';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

interface ScreenTransitionProps {
  children: React.ReactNode;
  direction?: 'up' | 'right' | 'left';
  duration?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  direction = 'up',
  duration = 350,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(
    direction === 'up' ? 40 : direction === 'right' ? 60 : -60,
  )).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const transform =
    direction === 'up'
      ? [{translateY: translate}]
      : [{translateX: translate}];

  return (
    <Animated.View style={[styles.container, {opacity, transform}]}>
      {children}
    </Animated.View>
  );
};

/**
 * Hook for animated screen exit. Returns {animStyle, triggerExit}.
 * Call triggerExit(callback) to animate out before navigating.
 */
export function useScreenExit(direction: 'down' | 'left' | 'right' = 'down', duration = 250) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;

  const triggerExit = (callback: () => void) => {
    const toValue = direction === 'down' ? 60 : direction === 'right' ? 80 : -80;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const transform =
    direction === 'down'
      ? [{translateY: translate}]
      : [{translateX: translate}];

  const animStyle = {opacity, transform};

  return {animStyle, triggerExit};
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
