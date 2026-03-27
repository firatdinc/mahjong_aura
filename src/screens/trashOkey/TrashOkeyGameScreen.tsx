import React, {useEffect, useCallback, useState, useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal, Animated, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTrashOkeyStore} from '../../store/useTrashOkeyStore';
import {useLanguage} from '../../i18n/useLanguage';
import {PlayerGrid} from '../../components/trashOkey/PlayerGrid';
import {BotGrid} from '../../components/trashOkey/BotGrid';
import {DrawArea} from '../../components/trashOkey/CenterTile';
import {ChainIndicator} from '../../components/trashOkey/ChainIndicator';
import {ms, modalWidth} from '../../utils/scaling';
import {canPlaceTile} from '../../engine/trashOkey/gridLogic';
import {loadRewarded, isRewardedReady, showRewarded} from '../../utils/adHelpers';
import {getSlotForNumber} from '../../engine/trashOkey/gridLogic';
import {getFreeHints, useFreeHint} from '../../utils/storage';

const GUIDE_KEY = '@mahjong_aura/trash_guide_seen';

type GuideStep = 'draw' | 'place' | 'chain' | null;

interface TrashOkeyGameScreenProps {
  onExit: () => void;
}

export const TrashOkeyGameScreen: React.FC<TrashOkeyGameScreenProps> = ({onExit}) => {
  const {
    players,
    drawPile,
    discardPile,
    drawnTile,
    currentTurn,
    chainActive,
    chainLength,
    status,
    turnCount,
    longestChain,
    drawFromPile,
    drawFromDiscard,
    placeDrawnTile,
    discardDrawnTile,
    playBotTurn,
    continueGame,
  } = useTrashOkeyStore();
  const {t} = useLanguage();

  // Guide
  const [guideStep, setGuideStep] = useState<GuideStep>(null);
  const guideChecked = useRef(false);

  useEffect(() => {
    if (guideChecked.current) return;
    guideChecked.current = true;
    AsyncStorage.getItem(GUIDE_KEY).then(val => {
      if (!val) setGuideStep('draw');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!guideStep) return;
    if (guideStep === 'draw' && drawnTile) {
      setGuideStep('place');
    }
    if (guideStep === 'place' && chainLength > 0 && drawnTile) {
      setGuideStep('chain');
    }
  }, [guideStep, drawnTile, chainLength]);

  const dismissGuide = useCallback(() => {
    setGuideStep(null);
    AsyncStorage.setItem(GUIDE_KEY, '1').catch(() => {});
  }, []);

  // Turn banner
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerY = useRef(new Animated.Value(-20)).current;
  const prevTurn = useRef(currentTurn);

  useEffect(() => {
    if (prevTurn.current !== currentTurn && status === 'playing') {
      bannerOpacity.setValue(1);
      bannerY.setValue(-20);
      Animated.sequence([
        Animated.spring(bannerY, {toValue: 0, friction: 6, tension: 80, useNativeDriver: true}),
        Animated.delay(1000),
        Animated.timing(bannerOpacity, {toValue: 0, duration: 300, useNativeDriver: true}),
      ]).start();
    }
    prevTurn.current = currentTurn;
  }, [currentTurn, status, bannerOpacity, bannerY]);

  // Auto-trigger bot
  const isBotPlaying = useRef(false);
  useEffect(() => {
    if (status === 'playing' && currentTurn === 'bot' && !isBotPlaying.current) {
      isBotPlaying.current = true;
      const timeout = setTimeout(() => {
        playBotTurn().finally(() => { isBotPlaying.current = false; });
      }, 400);
      return () => { clearTimeout(timeout); isBotPlaying.current = false; };
    }
  }, [status, currentTurn, playBotTurn]);

  const handleSlotPress = useCallback((position: number) => {
    placeDrawnTile(position);
  }, [placeDrawnTile]);

  // Preload interstitial + rewarded
  useEffect(() => { loadRewarded(); }, []);

  // Hint state
  const [freeHintCount, setFreeHintCount] = useState(getFreeHints());
  const [hintSlot, setHintSlot] = useState<number | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doHint = useCallback(() => {
    const state = useTrashOkeyStore.getState();
    const tile = state.drawnTile;
    if (!tile) return;
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (tile.isJoker) {
      const unrevealed = state.players.player.slots.filter(s => !s.isRevealed);
      if (unrevealed.length > 0) setHintSlot(unrevealed[0].position);
    } else {
      const slot = getSlotForNumber(state.players.player.slots, tile.number);
      if (slot) setHintSlot(slot.position);
    }
    hintTimerRef.current = setTimeout(() => setHintSlot(null), 5000);
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

  const [paused, setPaused] = useState(false);
  const [scoreDoubled, setScoreDoubled] = useState(false);
  const [hasUsedContinue, setHasUsedContinue] = useState(false);
  const [continueDeclined, setContinueDeclined] = useState(false);
  const baseScore = longestChain * 100 + Math.max(0, 20 - turnCount) * 10;
  const displayScore = scoreDoubled ? baseScore * 2 : baseScore;

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

  const canDraw = status === 'playing' && currentTurn === 'player' && !drawnTile && (drawPile.length > 0 || discardPile.length > 1);

  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const canDrawDiscard = status === 'playing' && currentTurn === 'player' && !drawnTile &&
    topDiscard !== null && canPlaceTile(players.player.slots, topDiscard);

  const shouldShowContinue = status === 'lost' && !hasUsedContinue && !continueDeclined;
  const showResult = status === 'won' || (status === 'lost' && !shouldShowContinue);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.pauseBtn} onPress={() => setPaused(true)} activeOpacity={0.7}>
          <Text style={styles.pauseText}>||</Text>
        </TouchableOpacity>
        <View style={styles.turnInfo}>
          <View style={[styles.turnDot, currentTurn === 'player' ? styles.dotPlayer : styles.dotBot]} />
          <Text style={styles.turnText}>
            {currentTurn === 'player' ? t.toYourTurn : t.toBotTurn}
          </Text>
        </View>
        <Text style={styles.headerStat}>{players.player.revealedCount}/10</Text>
      </View>

      {/* Turn banner */}
      <Animated.View
        style={[styles.turnBanner, {opacity: bannerOpacity, transform: [{translateY: bannerY}]}]}
        pointerEvents="none">
        <Text style={[styles.bannerText, currentTurn === 'player' ? styles.bannerPlayer : styles.bannerBot]}>
          {currentTurn === 'player' ? t.toYourTurnBanner : t.toBotPlacing}
        </Text>
      </Animated.View>

      {/* Bot grid */}
      <View style={styles.botSection}>
        <Text style={styles.sectionLabel}>{t.bot} ({players.bot.revealedCount}/10)</Text>
        <BotGrid slots={players.bot.slots} />
      </View>

      {/* Center: draw/discard + chain indicator */}
      <View style={styles.centerSection}>
        <ChainIndicator chainActive={chainActive} chainLength={chainLength} />
        <DrawArea
          drawPileCount={drawPile.length}
          topDiscard={topDiscard}
          drawnTile={currentTurn === 'player' ? drawnTile : null}
          canDraw={canDraw}
          canDrawDiscard={canDrawDiscard}
          onDrawPile={drawFromPile}
          onDrawDiscard={drawFromDiscard}
          onDiscard={discardDrawnTile}
        />
        {currentTurn === 'player' && drawnTile && (
          <Text style={styles.hintText}>{t.toPlaceTile}</Text>
        )}
      </View>

      {/* Hint button */}
      {currentTurn === 'player' && drawnTile && status === 'playing' && (
        <TouchableOpacity
          style={[styles.hintBtn, !isRewardedReady() && freeHintCount <= 0 && styles.hintBtnDisabled]}
          onPress={handleHint}
          activeOpacity={0.7}>
          <Text style={styles.hintBtnText}>
            {freeHintCount > 0 ? `${t.freeHints} (${freeHintCount})` : t.watchAdHint}
          </Text>
        </TouchableOpacity>
      )}

      {/* Player grid */}
      <View style={styles.playerSection}>
        <PlayerGrid
          slots={players.player.slots}
          drawnTile={currentTurn === 'player' ? drawnTile : null}
          chainActive={chainActive && currentTurn === 'player'}
          hintSlot={hintSlot}
          onSlotPress={handleSlotPress}
        />
      </View>

      {/* Guide overlay */}
      {guideStep && (
        <View style={styles.guideOverlay} pointerEvents="box-none">
          <View style={styles.guideTooltip}>
            <Text style={styles.guideText}>
              {guideStep === 'draw' && t.toGuidePickUp}
              {guideStep === 'place' && t.toGuidePlaceIt}
              {guideStep === 'chain' && t.toGuideChainContinue}
            </Text>
            {guideStep === 'chain' && (
              <TouchableOpacity style={styles.guideDismissBtn} onPress={dismissGuide} activeOpacity={0.8}>
                <Text style={styles.guideDismissText}>{t.toGuideGotIt}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Pause modal */}
      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.paused}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setPaused(false)} activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.resume}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitBtn} onPress={() => { setPaused(false); setTimeout(onExit, 100); }} activeOpacity={0.8}>
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

      {/* Result modal */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{status === 'won' ? t.toYouWin : t.toBotWins}</Text>
            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>{t.toLongestChain}: {longestChain}</Text>
              <Text style={styles.modalStat}>{t.turns}: {turnCount}</Text>
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
            <TouchableOpacity style={styles.modalBtn} onPress={() => setTimeout(onExit, 100)} activeOpacity={0.8}>
              <Text style={styles.modalBtnText}>{t.back}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#334443'},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  pauseBtn: {
    width: ms(36), height: ms(36), borderRadius: ms(10),
    backgroundColor: 'rgba(250,248,241,0.08)', borderWidth: 1, borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  pauseText: {fontSize: ms(14), color: '#FAF8F1', fontFamily: 'Nunito_700Bold', letterSpacing: 2},
  turnInfo: {flexDirection: 'row', alignItems: 'center', gap: 8},
  turnDot: {width: ms(10), height: ms(10), borderRadius: ms(5)},
  dotPlayer: {backgroundColor: '#27AE60'},
  dotBot: {backgroundColor: '#E74C3C'},
  turnText: {fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#FAF8F1'},
  headerStat: {fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#FAEAB1'},
  turnBanner: {position: 'absolute', top: ms(52), left: 0, right: 0, zIndex: 100, alignItems: 'center'},
  bannerText: {
    fontSize: ms(15), fontFamily: 'Nunito_700Bold', paddingHorizontal: 20, paddingVertical: 7,
    borderRadius: 10, overflow: 'hidden',
  },
  bannerPlayer: {backgroundColor: 'rgba(39, 174, 96, 0.9)', color: '#FAF8F1'},
  bannerBot: {backgroundColor: 'rgba(231, 76, 60, 0.9)', color: '#FAF8F1'},
  botSection: {alignItems: 'center', paddingVertical: 6},
  sectionLabel: {fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#6B9C93', letterSpacing: 1, marginBottom: 6},
  centerSection: {alignItems: 'center', justifyContent: 'center', flex: 1},
  hintText: {fontSize: 12, color: '#8AABA5', fontFamily: 'Nunito_500Medium', marginTop: 4},
  playerSection: {paddingBottom: 24, alignItems: 'center'},
  guideOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 200, justifyContent: 'center', alignItems: 'center',
  },
  guideTooltip: {
    backgroundColor: 'rgba(52, 101, 109, 0.95)', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 14, maxWidth: 280,
    borderWidth: 1.5, borderColor: '#FAEAB1',
    shadowColor: '#FAEAB1', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8, alignItems: 'center', gap: 10,
  },
  guideText: {fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: '#FAF8F1', textAlign: 'center', lineHeight: 22},
  guideDismissBtn: {backgroundColor: '#FAEAB1', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8},
  guideDismissText: {fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#334443'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center'},
  modalContent: {
    backgroundColor: '#34656D', borderRadius: 20, padding: ms(28), width: modalWidth(280),
    alignItems: 'center', borderWidth: 1, borderColor: '#2A5450',
  },
  modalTitle: {fontSize: ms(24), fontFamily: 'Nunito_700Bold', color: '#FAF8F1', marginBottom: 16},
  modalStats: {gap: 6, marginBottom: 20},
  modalStat: {fontSize: 14, color: '#8AABA5', textAlign: 'center'},
  modalBtn: {
    backgroundColor: '#FAEAB1', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36,
    width: '100%', alignItems: 'center',
  },
  modalBtnText: {fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#334443'},
  quitBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 36, width: '100%', alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  quitBtnText: {fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#E74C3C'},
  hintBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(250,234,177,0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(250,234,177,0.4)',
  },
  hintBtnDisabled: {opacity: 0.4},
  hintBtnText: {fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#FAEAB1'},
  scoreStat: {fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#FAEAB1', marginTop: 4},
  scoreDoubledText: {fontSize: 22, color: '#27AE60'},
  scoreDoubledLabel: {fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#27AE60', marginBottom: 4},
  doubleBtn: {
    backgroundColor: 'rgba(39,174,96,0.2)', borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: 'rgba(39,174,96,0.5)',
  },
  doubleBtnText: {fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#27AE60'},
});
