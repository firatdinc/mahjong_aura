import React, {useState, useCallback, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import {useTileMatchStore} from '../../store/useTileMatchStore';
import {TileMatchStartScreen} from './TileMatchStartScreen';
import {TileMatchGameScreen} from './TileMatchGameScreen';
import {TileMatchTutorialScreen} from './TileMatchTutorialScreen';

type TileMatchSub = 'start' | 'game' | 'tutorial';

interface TileMatchRouterProps {
  onBack: () => void;
}

export const TileMatchRouter: React.FC<TileMatchRouterProps> = ({onBack}) => {
  const [sub, setSub] = useState<TileMatchSub>('start');
  const {startLevel} = useTileMatchStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (next: TileMatchSub, action?: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        action?.();
        setSub(next);
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  const handleStartLevel = useCallback(
    (levelNumber: number) => {
      animateTo('game', () => startLevel(levelNumber));
    },
    [startLevel, animateTo],
  );

  const handleExit = useCallback(() => {
    animateTo('start');
  }, [animateTo]);

  const handleOpenTutorial = useCallback(() => {
    animateTo('tutorial');
  }, [animateTo]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}],
      }}>
      {sub === 'game' ? (
        <TileMatchGameScreen onExit={handleExit} />
      ) : sub === 'tutorial' ? (
        <TileMatchTutorialScreen onComplete={handleExit} />
      ) : (
        <TileMatchStartScreen onStartLevel={handleStartLevel} onBack={onBack} onTutorial={handleOpenTutorial} />
      )}
    </Animated.View>
  );
};
