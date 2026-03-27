import React, {useEffect, useCallback, useState, useRef} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Modal, Alert} from 'react-native';
import {useColumnPushStore} from '../../store/useColumnPushStore';
import {useLanguage} from '../../i18n/useLanguage';
import {PlayerGrid} from '../../components/columnPush/PlayerGrid';
import {BotGrid} from '../../components/columnPush/BotGrid';
import {ActiveTile} from '../../components/columnPush/ActiveTile';
import {DiceRollOverlay} from '../../components/columnPush/DiceRollOverlay';
import {ChainBadge} from '../../components/columnPush/ChainBadge';
import {FinalPickOverlay} from '../../components/columnPush/FinalPickOverlay';
import {CP_PLAYER_IMAGES, CP_BOT_IMAGES} from '../../constants/gameAssets';
import {ms, modalWidth} from '../../utils/scaling';
import {loadRewarded, isRewardedReady, showRewarded} from '../../utils/adHelpers';
import {getValidColumnsForPlacement} from '../../engine/columnPush/gridLogic';
import {getFreeHints, useFreeHint} from '../../utils/storage';

interface ColumnPushGameScreenProps {
  onExit: () => void;
}

export const ColumnPushGameScreen: React.FC<ColumnPushGameScreenProps> = ({onExit}) => {
  const {
    playerGrid,
    botGrid,
    activeTile,
    currentTurn,
    status,
    diceResult,
    chainLength,
    longestChain,
    playerLongestChain,
    turnCount,
    playerTheme,
    centerTiles,
    rollDice,
    pushTile,
    playBotTurn,
    pickCenterTile,
    continueGame,
  } = useColumnPushStore();
  const {t} = useLanguage();

  const handleRollDice = useCallback(() => {
    rollDice();
  }, [rollDice]);

  // Auto-trigger bot turn
  const isBotPlaying = useRef(false);
  useEffect(() => {
    if (status === 'playing' && currentTurn === 'bot' && !isBotPlaying.current) {
      isBotPlaying.current = true;
      const timeout = setTimeout(() => {
        playBotTurn().finally(() => { isBotPlaying.current = false; });
      }, 300);
      return () => { clearTimeout(timeout); isBotPlaying.current = false; };
    }
  }, [status, currentTurn, playBotTurn]);

  const handleDiceContinue = useCallback(() => {
    useColumnPushStore.setState({status: 'playing'});
  }, []);

  const handleColumnPress = useCallback(
    (colIndex: number) => {
      pushTile(colIndex);
    },
    [pushTile],
  );

  const handleFinalPick = useCallback(
    (index: number) => {
      pickCenterTile(index);
    },
    [pickCenterTile],
  );

  const [paused, setPaused] = useState(false);
  const [scoreDoubled, setScoreDoubled] = useState(false);
  const [hasUsedContinue, setHasUsedContinue] = useState(false);
  const [continueDeclined, setContinueDeclined] = useState(false);
  const baseScore = playerLongestChain * 100 + Math.max(0, 20 - turnCount) * 30;
  const displayScore = scoreDoubled ? baseScore * 2 : baseScore;
  const shouldShowContinue = status === 'lost' && !hasUsedContinue && !continueDeclined;
  const showResult = (status === 'won' || status === 'draw') || (status === 'lost' && !shouldShowContinue);

  // Reset continue state on new game
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'playing' && status === 'playing') {
      setHasUsedContinue(false);
      setContinueDeclined(false);
      setScoreDoubled(false);
    }
    prevStatus.current = status;
  }, [status]);

  const handleContinueAd = useCallback(() => {
    if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; }
    if (!showRewarded(() => {
      setHasUsedContinue(true);
      continueGame();
    })) Alert.alert('', t.adNotLoaded);
  }, [continueGame, t]);

  // Preload interstitial + rewarded + show on game end
  useEffect(() => { loadRewarded(); }, []);

  // Hint state
  const [freeHintCount, setFreeHintCount] = useState(getFreeHints());
  const [hintCol, setHintCol] = useState<number | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doHint = useCallback(() => {
    const state = useColumnPushStore.getState();
    if (!state.activeTile) return;
    const validCols = getValidColumnsForPlacement(state.playerGrid, state.activeTile);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (validCols.length > 0) {
      setHintCol(validCols[0]);
    }
    hintTimerRef.current = setTimeout(() => setHintCol(null), 5000);
  }, []);
  const handleHint = useCallback(() => {
    if (freeHintCount > 0 && useFreeHint()) {
      setFreeHintCount(getFreeHints());
      doHint();
      return;
    }
    if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; }
    if (!showRewarded(doHint)) Alert.alert('', t.adNotLoaded);
  }, [doHint, freeHintCount, t]);

  // Theme indicator images
  const playerThemeImg = playerTheme
    ? (playerTheme === 'player' ? CP_PLAYER_IMAGES[0] : CP_BOT_IMAGES[0])
    : null;
  const botThemeImg = playerTheme
    ? (playerTheme === 'player' ? CP_BOT_IMAGES[0] : CP_PLAYER_IMAGES[0])
    : null;

  return (
    <View style={styles.container}>
      {/* Header with pause button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setPaused(true)}
          activeOpacity={0.7}>
          <Text style={styles.pauseText}>⏸</Text>
        </TouchableOpacity>
        <View style={styles.turnInfo}>
          <View
            style={[
              styles.turnDot,
              currentTurn === 'player' ? styles.turnDotPlayer : styles.turnDotBot,
            ]}
          />
          <Text style={styles.turnText}>
            {currentTurn === 'player' ? t.cpYourTurn : t.cpBotTurn}
          </Text>
        </View>
        <Text style={styles.headerStat}>{t.cpTurns}: {turnCount}</Text>
      </View>

      {/* Theme indicator */}
      <View style={styles.themeRow}>
        <View style={styles.themeBadge}>
          {botThemeImg ? (
            <Image source={botThemeImg} style={styles.themeIcon} resizeMode="contain" />
          ) : (
            <Text style={styles.themeQmark}>?</Text>
          )}
          <Text style={styles.themeLabel}>{t.bot}</Text>
        </View>
        <Text style={styles.themeVs}>{t.vs}</Text>
        <View style={styles.themeBadge}>
          {playerThemeImg ? (
            <Image source={playerThemeImg} style={styles.themeIcon} resizeMode="contain" />
          ) : (
            <Text style={styles.themeQmark}>?</Text>
          )}
          <Text style={styles.themeLabel}>{t.cpYou}</Text>
        </View>
      </View>

      {/* Bot Grid (top) */}
      <View style={styles.botSection}>
        <BotGrid grid={botGrid} />
      </View>

      {/* Center: Active tile + chain */}
      <View style={styles.centerSection}>
        <ActiveTile tile={activeTile} isPlayerTurn={currentTurn === 'player'} />
        <ChainBadge chainLength={chainLength} isActive={chainLength > 0} />
        {status === 'playing' && currentTurn === 'player' && activeTile && (
          <Text style={styles.hintText}>{t.cpPushColumn}</Text>
        )}
      </View>

      {/* Player Grid (bottom) */}
      <View style={styles.playerSection}>
        <PlayerGrid
          grid={playerGrid}
          isPlayerTurn={status === 'playing' && currentTurn === 'player' && activeTile !== null}
          activeTile={activeTile}
          chainLength={chainLength}
          onColumnPress={handleColumnPress}
          hintCol={hintCol}
        />
      </View>

      {/* Hint button */}
      {status === 'playing' && currentTurn === 'player' && activeTile && (
        <TouchableOpacity
          style={[styles.hintBtn, !isRewardedReady() && freeHintCount <= 0 && styles.hintBtnDisabled]}
          onPress={handleHint}
          activeOpacity={0.7}>
          <Text style={styles.hintBtnText}>
            {freeHintCount > 0 ? `${t.freeHints} (${freeHintCount})` : t.watchAdHint}
          </Text>
        </TouchableOpacity>
      )}

      {/* Dice Roll Overlay */}
      <DiceRollOverlay
        visible={status === 'diceRoll'}
        diceResult={diceResult}
        onContinue={handleDiceContinue}
        onRollDice={handleRollDice}
      />

      {/* Final Pick Overlay */}
      <FinalPickOverlay
        visible={status === 'finalPick' && centerTiles.length > 0}
        centerTiles={centerTiles}
        onPick={handleFinalPick}
      />

      {/* Pause Modal */}
      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⏸</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setPaused(false)}
              activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.resume}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitBtn}
              onPress={() => { setPaused(false); setTimeout(onExit, 100); }}
              activeOpacity={0.8}>
              <Text style={styles.quitBtnText}>{t.quitGame}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Continue Modal */}
      <Modal visible={shouldShowContinue} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{fontSize: ms(40), marginBottom: 8}}>🎬</Text>
            <Text style={styles.modalTitle}>{t.continueTitle}</Text>
            <Text style={{fontSize: 14, color: '#B0CBC5', textAlign: 'center', marginBottom: 16}}>{t.continueDesc}</Text>
            <TouchableOpacity
              style={[styles.modalBtn, !isRewardedReady() && {opacity: 0.4}]}
              onPress={handleContinueAd}
              activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.continueWatchAd}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{paddingVertical: 12, marginTop: 8}} onPress={() => setContinueDeclined(true)} activeOpacity={0.8}>
              <Text style={{fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#8AABA5'}}>{t.continueNoThanks}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {status === 'won' ? t.cpYouWin : status === 'lost' ? t.cpBotWins : t.cpDraw}
            </Text>
            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>
                {t.cpLongestChain}: {playerLongestChain}
              </Text>
              <Text style={styles.modalStat}>
                {t.cpTurns}: {turnCount}
              </Text>
              <Text style={[styles.scoreStat, scoreDoubled && styles.scoreDoubledText]}>
                {t.scoreLabel}: {displayScore}{scoreDoubled ? ' 🎉' : ''}
              </Text>
            </View>
            {status === 'won' && !scoreDoubled && (
              <TouchableOpacity
                style={[styles.doubleBtn, !isRewardedReady() && {opacity: 0.4}]}
                onPress={() => { if (!isRewardedReady()) { Alert.alert('', t.adNotLoaded); return; } if (!showRewarded(() => setScoreDoubled(true))) Alert.alert('', t.adNotLoaded); }}
                activeOpacity={0.8}>
                <Text style={styles.doubleBtnText}>{t.doubleScoreAd}</Text>
              </TouchableOpacity>
            )}
            {scoreDoubled && (
              <Text style={styles.scoreDoubledLabel}>{t.scoreDoubled}</Text>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setTimeout(onExit, 100)}
              activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.back}</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pauseBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: ms(16),
    color: '#FAF8F1',
  },
  turnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  turnDotPlayer: {
    backgroundColor: '#27AE60',
  },
  turnDotBot: {
    backgroundColor: '#E74C3C',
  },
  turnText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAF8F1',
  },
  headerStat: {
    fontSize: 12,
    color: '#8AABA5',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  themeIcon: {
    width: 20,
    height: 20,
  },
  themeQmark: {
    fontSize: 14,
    color: '#8AABA5',
    fontFamily: 'Nunito_700Bold',
  },
  themeLabel: {
    fontSize: 11,
    color: '#8AABA5',
    fontFamily: 'Nunito_600SemiBold',
  },
  themeVs: {
    fontSize: 11,
    color: '#6B9C93',
    fontFamily: 'Nunito_600SemiBold',
  },
  botSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#8AABA5',
    fontFamily: 'Nunito_500Medium',
  },
  playerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
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
    fontSize: ms(24),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 16,
  },
  modalStats: {
    gap: 6,
    marginBottom: 20,
  },
  modalStat: {
    fontSize: 14,
    color: '#8AABA5',
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  quitBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  quitBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#E74C3C',
  },
  hintBtn: {
    position: 'absolute',
    bottom: ms(16),
    right: 12,
    backgroundColor: 'rgba(250,234,177,0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(250,234,177,0.4)',
  },
  hintBtnDisabled: {
    opacity: 0.4,
  },
  hintBtnText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
  },
  scoreStat: {fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#FAEAB1', marginTop: 4},
  scoreDoubledText: {fontSize: 22, color: '#27AE60'},
  scoreDoubledLabel: {fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#27AE60', marginBottom: 4},
  doubleBtn: {
    backgroundColor: 'rgba(39,174,96,0.2)', borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: 'rgba(39,174,96,0.5)',
  },
  doubleBtnText: {fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#27AE60'},
});
