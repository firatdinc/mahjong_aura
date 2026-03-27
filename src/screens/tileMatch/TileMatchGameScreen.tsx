import React, {useEffect, useRef, useCallback, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView, Alert} from 'react-native';
import {useTileMatchStore} from '../../store/useTileMatchStore';
import {useLanguage} from '../../i18n/useLanguage';
import {TileBoard} from '../../components/tileMatch/TileBoard';
import {MatchBar} from '../../components/tileMatch/MatchBar';
import {PowerUpBar} from '../../components/tileMatch/PowerUpBar';
import {LevelHeader} from '../../components/tileMatch/LevelHeader';
import {calculateStars} from '../../engine/tileMatch/matchLogic';
import {ms, modalWidth} from '../../utils/scaling';
import {loadRewarded, isRewardedReady, showRewarded, showInterstitialIfReady} from '../../utils/adHelpers';
import {computeFreeTiles} from '../../engine/tileMatch/matchLogic';
import {getFreeHints, useFreeHint} from '../../utils/storage';

interface TileMatchGameScreenProps {
  onExit: () => void;
}

export const TileMatchGameScreen: React.FC<TileMatchGameScreenProps> = ({onExit}) => {
  const {
    level,
    board,
    bar,
    timeRemaining,
    powerUps,
    powerUpsUsed,
    status,
    matchCount,
    bestCombo,
    tapTile,
    usePowerUp,
    tick,
    pauseGame,
    resumeGame,
    resetLevel,
    nextLevel,
    continueGame,
  } = useTileMatchStore();
  const {t} = useLanguage();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload interstitial + rewarded + show on game end
  useEffect(() => { loadRewarded(); }, []);

  // Continue ad state
  const [hasUsedContinue, setHasUsedContinue] = useState(false);
  const [continueDeclined, setContinueDeclined] = useState(false);

  // Score 2x state
  const [scoreDoubled, setScoreDoubled] = useState(false);

  // Hint state
  const [freeHintCount, setFreeHintCount] = useState(getFreeHints());
  const [hintTileId, setHintTileId] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHint = useCallback((tileId: string) => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintTileId(tileId);
    hintTimerRef.current = setTimeout(() => setHintTileId(null), 5000);
  }, []);
  const findHintTile = useCallback(() => {
    const state = useTileMatchStore.getState();
    const freeTiles = computeFreeTiles(state.board);
    const freeList = state.board.filter(t => freeTiles.has(t.id) && !t.isInBar && !t.isMatched);
    for (const tile of freeList) {
      const match = freeList.find(other => other.id !== tile.id && other.type === tile.type);
      if (match) return tile.id;
    }
    return null;
  }, []);
  const handleHint = useCallback(() => {
    if (freeHintCount > 0 && useFreeHint()) {
      setFreeHintCount(getFreeHints());
      const id = findHintTile();
      if (id) showHint(id);
      return;
    }
    if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; }
    if (!showRewarded(() => {
      const id = findHintTile();
      if (id) showHint(id);
    })) Alert.alert('', t.adNotLoaded);
  }, [findHintTile, showHint, freeHintCount, t]);

  const handleContinueAd = useCallback(() => {
    if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; }
    if (!showRewarded(() => {
      setHasUsedContinue(true);
      continueGame();
    })) Alert.alert('', t.adNotLoaded);
  }, [continueGame, t]);

  const handleContinueDecline = useCallback(() => {
    setContinueDeclined(true);
  }, []);

  // Score 2x handler
  const handleDoubleScore = useCallback(() => {
    if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; }
    if (!showRewarded(() => {
      setScoreDoubled(true);
    })) Alert.alert('', t.adNotLoaded);
  }, [t]);

  // Reset continue/score state when a new game starts
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'playing' && status === 'playing') {
      setHasUsedContinue(false);
      setContinueDeclined(false);
      setScoreDoubled(false);
    }
    prevStatus.current = status;
  }, [status]);

  // Timer
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => tick(), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, tick]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleResume = useCallback(() => {
    resumeGame();
  }, [resumeGame]);

  const stars = status === 'won'
    ? calculateStars(timeRemaining, level.timerSeconds, powerUpsUsed)
    : 0;

  // Score calculation
  const baseScore = matchCount * 10 + bestCombo * 50 + stars * 100 + timeRemaining * 2;
  const displayScore = scoreDoubled ? baseScore * 2 : baseScore;

  const shouldShowContinue = status === 'lost' && !hasUsedContinue && !continueDeclined;
  const showModal = status === 'won' || (status === 'lost' && !shouldShowContinue) || status === 'paused';

  return (
    <SafeAreaView style={styles.container}>
      <LevelHeader
        levelNumber={level.levelNumber}
        timeRemaining={timeRemaining}
        stars={stars}
        onPause={handlePause}
      />

      <ScrollView
        style={styles.boardScroll}
        contentContainerStyle={styles.boardContainer}
        showsVerticalScrollIndicator={false}>
        <TileBoard board={board} onTapTile={tapTile} hintTileId={hintTileId} />
      </ScrollView>

      <View style={styles.bottomSection}>
        <MatchBar bar={bar} />
        <View style={styles.powerUpSection}>
          <PowerUpBar powerUps={powerUps} onUsePowerUp={usePowerUp} />
          {status === 'playing' && (
            <TouchableOpacity
              style={[styles.hintBtn, !isRewardedReady() && freeHintCount <= 0 && styles.hintBtnDisabled]}
              onPress={handleHint}
              activeOpacity={0.7}>
              <Text style={styles.hintBtnText}>
                {freeHintCount > 0 ? `${t.freeHints} (${freeHintCount})` : t.watchAdHint}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Continue Modal */}
      <Modal visible={shouldShowContinue} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.continueIcon}>🎬</Text>
            <Text style={styles.modalTitle}>{t.continueTitle}</Text>
            <Text style={styles.continueDesc}>{t.continueDesc}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, !isRewardedReady() && styles.modalBtnDisabled]}
              onPress={handleContinueAd}
              activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.continueWatchAd}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleContinueDecline} activeOpacity={0.8}>
              <Text style={styles.modalBtnSecondaryText}>{t.continueNoThanks}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result / Pause Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {status === 'paused' && (
              <>
                <Text style={styles.modalTitle}>{t.paused}</Text>
                <TouchableOpacity style={styles.modalBtn} onPress={handleResume} activeOpacity={0.8}>
                  <Text style={styles.modalBtnText}>{t.resume}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setTimeout(onExit, 100)} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSecondaryText}>{t.quitGame}</Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'won' && (
              <>
                <Text style={styles.modalTitle}>{t.tmLevelComplete}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3].map(i => (
                    <Text key={i} style={[styles.modalStar, i <= stars && styles.modalStarActive]}>
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={styles.modalStat}>
                  {t.tmTotalMatches}: {matchCount}
                </Text>
                <Text style={styles.modalStat}>
                  {t.tmBestCombo}: {bestCombo}
                </Text>
                <Text style={[styles.scoreText, scoreDoubled && styles.scoreDoubledText]}>
                  {t.scoreLabel}: {displayScore}{scoreDoubled ? ' 🎉' : ''}
                </Text>
                {!scoreDoubled && (
                  <TouchableOpacity
                    style={[styles.doubleBtn, !isRewardedReady() && styles.modalBtnDisabled]}
                    onPress={handleDoubleScore}
                    activeOpacity={0.8}>
                    <Text style={styles.doubleBtnText}>{t.doubleScoreAd}</Text>
                  </TouchableOpacity>
                )}
                {scoreDoubled && (
                  <Text style={styles.scoreDoubledLabel}>{t.scoreDoubled}</Text>
                )}
                <TouchableOpacity style={styles.modalBtn} onPress={() => showInterstitialIfReady(() => setTimeout(nextLevel, 100))} activeOpacity={0.8}>
                  <Text style={styles.modalBtnText}>{t.tmNextLevel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setTimeout(onExit, 100)} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSecondaryText}>{t.quitGame}</Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'lost' && (
              <>
                <Text style={styles.modalTitle}>
                  {timeRemaining <= 0 ? t.tmTimeUp : t.tmBarFull}
                </Text>
                <Text style={styles.modalStat}>
                  {t.scoreLabel}: {baseScore}
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => showInterstitialIfReady(() => setTimeout(resetLevel, 100))} activeOpacity={0.8}>
                  <Text style={styles.modalBtnText}>{t.tmRetry}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setTimeout(onExit, 100)} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSecondaryText}>{t.quitGame}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334443',
  },
  boardScroll: {
    flex: 1,
  },
  boardContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  powerUpSection: {
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#34656D',
    borderRadius: 20,
    padding: ms(28),
    width: modalWidth(280),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  modalTitle: {
    fontSize: ms(22),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 16,
    textAlign: 'center',
  },
  continueIcon: {
    fontSize: ms(40),
    marginBottom: 8,
  },
  continueDesc: {
    fontSize: 14,
    color: '#B0CBC5',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalStar: {
    fontSize: ms(36),
    color: '#3D7A74',
  },
  modalStarActive: {
    color: '#FAEAB1',
  },
  modalStat: {
    fontSize: 14,
    color: '#8AABA5',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
    marginTop: 8,
    marginBottom: 4,
  },
  scoreDoubledText: {
    fontSize: 22,
    color: '#27AE60',
  },
  scoreDoubledLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#27AE60',
    marginBottom: 8,
  },
  doubleBtn: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.5)',
  },
  doubleBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#27AE60',
  },
  modalBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
    textAlign: 'center',
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },
  modalBtnSecondary: {
    paddingVertical: 12,
    marginTop: 8,
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8AABA5',
  },
  hintBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(250,234,177,0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(250,234,177,0.4)',
  },
  hintBtnDisabled: {opacity: 0.4},
  hintBtnText: {fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#FAEAB1'},
});
