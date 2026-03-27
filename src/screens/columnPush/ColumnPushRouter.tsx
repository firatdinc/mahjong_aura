import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Animated, Easing} from 'react-native';
import {useColumnPushStore} from '../../store/useColumnPushStore';
import {CPDifficulty} from '../../types/columnPush';
import {ColumnPushStartScreen} from './ColumnPushStartScreen';
import {ColumnPushGameScreen} from './ColumnPushGameScreen';
import {ColumnPushTutorialScreen} from './ColumnPushTutorialScreen';
import {loadInterstitial, showInterstitialIfReady} from '../../utils/adHelpers';

type ColumnPushSub = 'start' | 'game' | 'tutorial';

interface ColumnPushRouterProps {
  onBack: () => void;
}

export const ColumnPushRouter: React.FC<ColumnPushRouterProps> = ({onBack}) => {
  const [sub, setSub] = useState<ColumnPushSub>('start');
  const {startGame} = useColumnPushStore();

  useEffect(() => { loadInterstitial(); }, []);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (next: ColumnPushSub, action?: () => void) => {
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

  const handleStart = useCallback(
    (difficulty: CPDifficulty) => {
      animateTo('game', () => startGame(difficulty));
    },
    [startGame, animateTo],
  );

  const handleExit = useCallback(() => {
    showInterstitialIfReady(() => {
      animateTo('start');
    });
  }, [animateTo]);

  const handleOpenTutorial = useCallback(() => {
    animateTo('tutorial');
  }, [animateTo]);

  const handleTutorialComplete = useCallback(() => {
    animateTo('start');
  }, [animateTo]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}],
      }}>
      {sub === 'game' ? (
        <ColumnPushGameScreen onExit={handleExit} />
      ) : sub === 'tutorial' ? (
        <ColumnPushTutorialScreen onComplete={handleTutorialComplete} />
      ) : (
        <ColumnPushStartScreen onStart={handleStart} onBack={onBack} onTutorial={handleOpenTutorial} />
      )}
    </Animated.View>
  );
};
