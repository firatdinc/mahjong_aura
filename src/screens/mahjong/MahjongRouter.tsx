import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Animated, Easing} from 'react-native';
import {Difficulty} from '../../types';
import {useGameStore} from '../../store/useGameStore';
import {MahjongStartScreen} from './MahjongStartScreen';
import {MahjongGameScreen} from './MahjongGameScreen';
import {MahjongTutorialScreen} from './MahjongTutorialScreen';
import {loadInterstitial, showInterstitialIfReady} from '../../utils/adHelpers';

type MahjongSub = 'start' | 'game' | 'tutorial';

interface MahjongRouterProps {
  onBack: () => void;
}

export const MahjongRouter: React.FC<MahjongRouterProps> = ({onBack}) => {
  const [sub, setSub] = useState<MahjongSub>('start');
  const {startGame, resumeGame, resetGame} = useGameStore();

  useEffect(() => { loadInterstitial(); }, []);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (next: MahjongSub, action?: () => void) => {
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
    (difficulty: Difficulty) => {
      animateTo('game', () => startGame(difficulty));
    },
    [startGame, animateTo],
  );

  const handleResume = useCallback(() => {
    const restored = resumeGame();
    if (restored) {
      animateTo('game');
    }
  }, [resumeGame, animateTo]);

  const handleExit = useCallback(() => {
    showInterstitialIfReady(() => {
      animateTo('start', () => resetGame());
    });
  }, [resetGame, animateTo]);

  const handleTutorialComplete = useCallback(() => {
    animateTo('start');
  }, [animateTo]);

  const handleOpenTutorial = useCallback(() => {
    animateTo('tutorial');
  }, [animateTo]);

  const renderSub = () => {
    if (sub === 'tutorial') {
      return <MahjongTutorialScreen onComplete={handleTutorialComplete} />;
    }
    if (sub === 'game') {
      return <MahjongGameScreen onExit={handleExit} />;
    }
    return (
      <MahjongStartScreen
        onStart={handleStart}
        onResume={handleResume}
        onTutorial={handleOpenTutorial}
        onBack={onBack}
      />
    );
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}],
      }}>
      {renderSub()}
    </Animated.View>
  );
};
