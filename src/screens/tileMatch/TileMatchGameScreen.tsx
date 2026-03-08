import React, {useEffect, useRef, useCallback} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTileMatchStore} from '../../store/useTileMatchStore';
import {useLanguage} from '../../i18n/useLanguage';
import {TileBoard} from '../../components/tileMatch/TileBoard';
import {MatchBar} from '../../components/tileMatch/MatchBar';
import {PowerUpBar} from '../../components/tileMatch/PowerUpBar';
import {LevelHeader} from '../../components/tileMatch/LevelHeader';
import {calculateStars} from '../../engine/tileMatch/matchLogic';

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
    <View style={styles.container}>
      <LevelHeader
        levelNumber={level.levelNumber}
        timeRemaining={timeRemaining}
        stars={stars}
        onPause={handlePause}
      />

      <View style={styles.boardContainer}>
        <TileBoard board={board} onTapTile={tapTile} />
      </View>

      <View style={styles.bottomSection}>
        <MatchBar bar={bar} />
        <View style={styles.powerUpSection}>
          <PowerUpBar powerUps={powerUps} onUsePowerUp={usePowerUp} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334443',
  },
  boardContainer: {
    flex: 1,
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
    padding: 28,
    width: 280,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  modalTitle: {
    fontSize: 22,
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
    fontSize: 36,
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
});
