import {Animated, Easing} from 'react-native';

/**
 * Slide a tile from (startX, startY) to (0, 0) with spring-like feel.
 */
export function slideIn(
  translateX: Animated.Value,
  translateY: Animated.Value,
  fromX: number,
  fromY: number,
  duration = 300,
  callback?: () => void,
): void {
  translateX.setValue(fromX);
  translateY.setValue(fromY);
  Animated.parallel([
    Animated.timing(translateX, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start(callback ? () => callback() : undefined);
}

/**
 * Slide out: animate from (0,0) to (toX, toY), then call callback.
 */
export function slideOut(
  translateX: Animated.Value,
  translateY: Animated.Value,
  toX: number,
  toY: number,
  duration = 250,
  callback?: () => void,
): void {
  translateX.setValue(0);
  translateY.setValue(0);
  Animated.parallel([
    Animated.timing(translateX, {
      toValue: toX,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: toY,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start(callback ? () => callback() : undefined);
}

/**
 * Pop-in scale animation (tile appears with a bounce).
 */
export function popIn(
  scale: Animated.Value,
  duration = 250,
  callback?: () => void,
): void {
  scale.setValue(0);
  Animated.spring(scale, {
    toValue: 1,
    friction: 5,
    tension: 100,
    useNativeDriver: true,
  }).start(callback ? () => callback() : undefined);
}

/**
 * Shift animation: animate translateY from startY to 0.
 */
export function shiftDown(
  translateY: Animated.Value,
  fromY: number,
  duration = 250,
  callback?: () => void,
): void {
  translateY.setValue(fromY);
  Animated.timing(translateY, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true,
  }).start(callback ? () => callback() : undefined);
}

/**
 * Fade + slide combo for reveals.
 */
export function revealTile(
  opacity: Animated.Value,
  scale: Animated.Value,
  duration = 300,
  callback?: () => void,
): void {
  opacity.setValue(0);
  scale.setValue(0.5);
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }),
  ]).start(callback ? () => callback() : undefined);
}
