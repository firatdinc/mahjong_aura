import React, {useState, useCallback, useRef} from 'react';
import {Animated, Easing} from 'react-native';
import {useTrashOkeyStore} from '../../store/useTrashOkeyStore';
import {TrashOkeyDifficulty} from '../../types/trashOkey';
import {TrashOkeyStartScreen} from './TrashOkeyStartScreen';
import {TrashOkeyGameScreen} from './TrashOkeyGameScreen';
import {TrashOkeyTutorialScreen} from './TrashOkeyTutorialScreen';

type TrashOkeySub = 'start' | 'game' | 'tutorial';

interface TrashOkeyRouterProps {
  onBack: () => void;
}

export const TrashOkeyRouter: React.FC<TrashOkeyRouterProps> = ({onBack}) => {
  const [sub, setSub] = useState<TrashOkeySub>('start');
  const {startGame} = useTrashOkeyStore();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (next: TrashOkeySub, action?: () => void) => {
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
    (difficulty: TrashOkeyDifficulty) => {
      animateTo('game', () => startGame(difficulty));
    },
    [startGame, animateTo],
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
        <TrashOkeyGameScreen onExit={handleExit} />
      ) : sub === 'tutorial' ? (
        <TrashOkeyTutorialScreen onComplete={handleExit} />
      ) : (
        <TrashOkeyStartScreen onStart={handleStart} onBack={onBack} onTutorial={handleOpenTutorial} />
      )}
    </Animated.View>
  );
};
