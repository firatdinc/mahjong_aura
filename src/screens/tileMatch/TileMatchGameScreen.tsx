import React, {useEffect, useRef, useCallback, useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal, SafeAreaView, ScrollView} from 'react-native';
import {useTileMatchStore} from '../../store/useTileMatchStore';
import {useLanguage} from '../../i18n/useLanguage';
import {TileBoard} from '../../components/tileMatch/TileBoard';
import {MatchBar} from '../../components/tileMatch/MatchBar';
import {PowerUpBar} from '../../components/tileMatch/PowerUpBar';
import {LevelHeader} from '../../components/tileMatch/LevelHeader';
import {calculateStars} from '../../engine/tileMatch/matchLogic';
import {ms, modalWidth} from '../../utils/scaling';
import {loadRewarded, isRewardedReady, showRewarded} from '../../utils/adHelpers';
import {computeFreeTiles} from '../../engine/tileMatch/matchLogic';

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
  } = useTileMatchStore();
  const {t} = useLanguage();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload interstitial + rewarded + show on game end
  useEffect(() => { loadRewarded(); }, []);

  // Hint state
  const [hintTileId, setHintTileId] = useState<string | null>(null);
  const handleHint = useCallback(() => {
    if (!isRewardedReady()) return;
    showRewarded(() => {
      const state = useTileMatchStore.getState();
      const freeTiles = computeFreeTiles(state.board);
      const freeList = state.board.filter(t => freeTiles.has(t.id) && !t.isInBar && !t.isMatched);
      // Find a free tile that has at least one other free tile of same type
      for (const tile of freeList) {
        const match = freeList.find(other => other.id !== tile.id && other.type === tile.type);
        if (match) {
          setHintTileId(tile.id);
          setTimeout(() => setHintTileId(null), 5000);
          return;
        }
      }
    });
  }, []);
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

  const showModal = status === 'won' || status === 'lost' || status === 'paused';

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
              style={[styles.hintBtn, !isRewardedReady() && styles.hintBtnDisabled]}
              onPress={handleHint}
              activeOpacity={0.7}>
              <Text style={styles.hintBtnText}>{t.watchAdHint}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={onExit} activeOpacity={0.8}>
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
                <TouchableOpacity style={styles.modalBtn} onPress={nextLevel} activeOpacity={0.8}>
                  <Text style={styles.modalBtnText}>{t.tmNextLevel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={onExit} activeOpacity={0.8}>
                  <Text style={styles.modalBtnSecondaryText}>{t.quitGame}</Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'lost' && (
              <>
                <Text style={styles.modalTitle}>
                  {timeRemaining <= 0 ? t.tmTimeUp : t.tmBarFull}
                </Text>
                <TouchableOpacity style={styles.modalBtn} onPress={resetLevel} activeOpacity={0.8}>
                  <Text style={styles.modalBtnText}>{t.tmRetry}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={onExit} activeOpacity={0.8}>
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
  modalBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
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
