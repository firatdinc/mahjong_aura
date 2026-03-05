import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ViewStyle, StyleProp} from 'react-native';

interface StaggeredEntryProps {
  index: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const StaggeredEntry: React.FC<StaggeredEntryProps> = ({
  index,
  delay = 60,
  duration = 350,
  style,
  children,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const staggerDelay = index * delay;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, staggerDelay);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{translateY}, {scale}],
        },
      ]}>
      {children}
    </Animated.View>
  );
};
