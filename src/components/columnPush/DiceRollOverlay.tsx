import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import {CPDiceResult} from '../../types/columnPush';
import {useLanguage} from '../../i18n/useLanguage';

interface DiceRollOverlayProps {
  visible: boolean;
  diceResult: CPDiceResult | null;
  onContinue: () => void;
  onRollDice: () => void;
}

const DICE_FACES: Record<number, string> = {
  1: '⚀',
  2: '⚁',
  3: '⚂',
  4: '⚃',
  5: '⚄',
  6: '⚅',
};

export const DiceRollOverlay: React.FC<DiceRollOverlayProps> = ({
  visible,
  diceResult,
  onContinue,
  onRollDice,
}) => {
  const {t} = useLanguage();
  const [phase, setPhase] = useState<'waiting' | 'rolling' | 'result'>('waiting');
  const [displayPlayer, setDisplayPlayer] = useState(1);
  const [displayBot, setDisplayBot] = useState(1);

  const playerShake = useRef(new Animated.Value(0)).current;
  const botShake = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when overlay becomes visible
  useEffect(() => {
    if (visible) {
      setPhase('waiting');
      setDisplayPlayer(1);
      setDisplayBot(1);
      resultScale.setValue(0);
      resultOpacity.setValue(0);
    } else {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }
    }
  }, [visible, resultScale, resultOpacity]);

  // Animate dice faces when rolling
  useEffect(() => {
    if (phase === 'rolling') {
      rollIntervalRef.current = setInterval(() => {
        setDisplayPlayer(Math.ceil(Math.random() * 6));
        setDisplayBot(Math.ceil(Math.random() * 6));
      }, 80);

      // Shake animation
      const shakeAnim = (anim: Animated.Value) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {toValue: 8, duration: 50, useNativeDriver: true, easing: Easing.linear}),
            Animated.timing(anim, {toValue: -8, duration: 50, useNativeDriver: true, easing: Easing.linear}),
            Animated.timing(anim, {toValue: 6, duration: 50, useNativeDriver: true, easing: Easing.linear}),
            Animated.timing(anim, {toValue: -6, duration: 50, useNativeDriver: true, easing: Easing.linear}),
            Animated.timing(anim, {toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.linear}),
          ]),
        );

      const playerAnim = shakeAnim(playerShake);
      const botAnim = shakeAnim(botShake);
      playerAnim.start();
      botAnim.start();

      return () => {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        playerAnim.stop();
        botAnim.stop();
        playerShake.setValue(0);
        botShake.setValue(0);
      };
    }
  }, [phase, playerShake, botShake]);

  // When dice result arrives during rolling, show result
  useEffect(() => {
    if (phase === 'rolling' && diceResult) {
      // Keep rolling for a bit then reveal
      const timer = setTimeout(() => {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        setDisplayPlayer(diceResult.playerRoll);
        setDisplayBot(diceResult.botRoll);
        playerShake.setValue(0);
        botShake.setValue(0);
        setPhase('result');

        // Bounce-in result text
        Animated.parallel([
          Animated.spring(resultScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(resultOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, diceResult, playerShake, botShake, resultScale, resultOpacity]);

  const handleRoll = useCallback(() => {
    setPhase('rolling');
    onRollDice();
  }, [onRollDice]);

  if (!visible) return null;

  const playerWon = diceResult ? diceResult.playerRoll > diceResult.botRoll : false;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{t.cpDiceRoll}</Text>

          <View style={styles.diceRow}>
            <View style={styles.diceBox}>
              <Text style={styles.diceLabel}>{t.cpYou}</Text>
              <Animated.View style={{transform: [{translateX: playerShake}]}}>
                <Text style={[styles.dice, phase === 'rolling' && styles.diceRolling]}>
                  {DICE_FACES[displayPlayer] ?? displayPlayer}
                </Text>
              </Animated.View>
              {phase === 'result' && (
                <Text style={styles.diceValue}>{diceResult?.playerRoll}</Text>
              )}
            </View>

            <Text style={styles.vs}>{t.vs}</Text>

            <View style={styles.diceBox}>
              <Text style={styles.diceLabel}>{t.bot}</Text>
              <Animated.View style={{transform: [{translateX: botShake}]}}>
                <Text style={[styles.dice, phase === 'rolling' && styles.diceRolling]}>
                  {DICE_FACES[displayBot] ?? displayBot}
                </Text>
              </Animated.View>
              {phase === 'result' && (
                <Text style={styles.diceValue}>{diceResult?.botRoll}</Text>
              )}
            </View>
          </View>

          {phase === 'waiting' && (
            <TouchableOpacity
              style={styles.rollBtn}
              onPress={handleRoll}
              activeOpacity={0.8}>
              <Text style={styles.rollBtnText}>🎲  {t.cpRollDice}</Text>
            </TouchableOpacity>
          )}

          {phase === 'rolling' && (
            <Text style={styles.rollingText}>🎲</Text>
          )}

          {phase === 'result' && (
            <>
              <Animated.Text
                style={[
                  styles.result,
                  {
                    transform: [{scale: resultScale}],
                    opacity: resultOpacity,
                  },
                ]}>
                {playerWon ? t.cpYouGoFirst : t.cpBotGoesFirst}
              </Animated.Text>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onContinue}
                activeOpacity={0.8}>
                <Text style={styles.continueText}>{t.cpTapToContinue}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#34656D',
    borderRadius: 20,
    padding: 28,
    width: 280,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 20,
    letterSpacing: 2,
  },
  diceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  diceBox: {
    alignItems: 'center',
    gap: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  diceLabel: {
    fontSize: 12,
    color: '#8AABA5',
    fontFamily: 'Nunito_600SemiBold',
  },
  dice: {
    fontSize: 56,
    color: '#FAF8F1',
  },
  diceRolling: {
    color: '#FAEAB1',
  },
  diceValue: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
  },
  vs: {
    fontSize: 16,
    color: '#6B9C93',
    fontFamily: 'Nunito_600SemiBold',
  },
  rollBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  rollBtnText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
    letterSpacing: 1,
  },
  rollingText: {
    fontSize: 32,
  },
  result: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
    marginBottom: 20,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  continueText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
});
