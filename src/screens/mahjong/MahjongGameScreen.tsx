import React, {useEffect, useCallback, useState, useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal, Animated} from 'react-native';
import {useGameStore} from '../../store/useGameStore';
import {Tile, ClaimOption} from '../../types';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {getSeatLabel} from '../../constants/mahjong/game';
import {GameHeader} from '../../components/mahjong/GameHeader';
import {PlayerHand} from '../../components/mahjong/PlayerHand';
import {BotHand} from '../../components/mahjong/BotHand';
import {DiscardPile} from '../../components/mahjong/DiscardPile';
import {ClaimPanel} from '../../components/mahjong/ClaimPanel';
import {ms, modalWidth} from '../../utils/scaling';
import {loadRewarded, isRewardedReady, showRewarded} from '../../utils/adHelpers';
import {scoreTileUsefulness} from '../../engine/mahjong/botAI';

interface MahjongGameScreenProps {
  onExit: () => void;
}

export const MahjongGameScreen: React.FC<MahjongGameScreenProps> = ({onExit}) => {
  const {
    wall,
    discardPile,
    players,
    currentTurn,
    turnPhase,
    winner,
    lastDiscardedTile,
    playerClaimOptions,
    waitingForPlayerClaim,
    drawTile,
    discardTile,
    processBotActions,
    playerClaim,
    playerSkipClaim,
  } = useGameStore();

  const {t} = useLanguage();
  const {autoDraw} = useSettings();

  // Auto-draw for human player when it's their drawing phase (only if autoDraw enabled)
  useEffect(() => {
    if (
      autoDraw &&
      currentTurn === 'player' &&
      turnPhase === 'drawing' &&
      !winner
    ) {
      const timeout = setTimeout(() => {
        drawTile();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [autoDraw, currentTurn, turnPhase, winner, drawTile]);

  // Auto-trigger bot turns when it's a bot's turn
  const isBotPlaying = useRef(false);
  useEffect(() => {
    if (currentTurn !== 'player' && turnPhase === 'drawing' && !winner && !isBotPlaying.current) {
      isBotPlaying.current = true;
      const timeout = setTimeout(() => {
        const {playBotTurn} = useGameStore.getState();
        playBotTurn().finally(() => { isBotPlaying.current = false; });
      }, 300);
      return () => {
        clearTimeout(timeout);
        isBotPlaying.current = false;
      };
    }
  }, [currentTurn, turnPhase, winner]);

  // Safety: unstick bots if they freeze for more than 5 seconds
  useEffect(() => {
    if (currentTurn !== 'player' && !winner && turnPhase !== 'gameOver') {
      const safety = setTimeout(() => {
        isBotPlaying.current = false;
        const s = useGameStore.getState();
        if (s.currentTurn !== 'player' && !s.winner && s.turnPhase !== 'gameOver') {
          if (s.turnPhase === 'claiming') {
            s.skipClaim();
          } else if (s.turnPhase === 'drawing') {
            s.drawTile();
          }
        }
      }, 5000);
      return () => clearTimeout(safety);
    }
  }, [currentTurn, turnPhase, winner]);

  // Preload interstitial + rewarded
  useEffect(() => { loadRewarded(); }, []);

  // Hint state
  const [hintTileId, setHintTileId] = useState<string | null>(null);
  const handleHint = useCallback(() => {
    if (!isRewardedReady()) return;
    showRewarded(() => {
      const state = useGameStore.getState();
      const hand = state.players.player.hand;
      if (hand.length === 0) return;
      let worst = hand[0];
      let worstScore = Infinity;
      for (const tile of hand) {
        const score = scoreTileUsefulness(tile, hand);
        if (score < worstScore) {
          worstScore = score;
          worst = tile;
        }
      }
      setHintTileId(worst.id);
      setTimeout(() => setHintTileId(null), 5000);
    });
  }, []);

  // Show game over modal
  const [gameOverVisible, setGameOverVisible] = useState(false);
  useEffect(() => {
    if (turnPhase === 'gameOver') {
      const timer = setTimeout(() => {
        setGameOverVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turnPhase]);

  // Handle human player discarding a tile
  const handleTilePress = useCallback(
    (tile: Tile) => {
      if (currentTurn !== 'player' || turnPhase !== 'discarding') {return;}

      discardTile(tile.id);

      setTimeout(() => {
        processBotActions();
      }, 100);
    },
    [currentTurn, turnPhase, discardTile, processBotActions],
  );

  // Handle manual draw
  const handleDrawTile = useCallback(() => {
    if (currentTurn === 'player' && turnPhase === 'drawing' && !winner) {
      drawTile();
    }
  }, [currentTurn, turnPhase, winner, drawTile]);

  const [pauseVisible, setPauseVisible] = useState(false);
  const handlePause = useCallback(() => {
    setPauseVisible(true);
  }, []);

  // Dealing animation (RN Animated)
  const [isDealing, setIsDealing] = useState(true);
  const dealOpacity = useRef(new Animated.Value(0)).current;
  const dealTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(dealOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dealTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => setIsDealing(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [dealOpacity, dealTranslateY]);

  const playerState = players.player;
  const isPlayerTurn = currentTurn === 'player';
  const canDiscard = isPlayerTurn && turnPhase === 'discarding' && !isDealing;
  const canDraw =
    isPlayerTurn && turnPhase === 'drawing' && !winner && !isDealing;

  return (
    <View style={styles.container}>
      <GameHeader
        wallCount={wall.length}
        currentTurn={currentTurn}
        turnPhase={turnPhase}
        winner={winner}
        onPause={handlePause}
      />

      <Animated.View
        style={[
          styles.gameArea,
          {opacity: dealOpacity, transform: [{translateY: dealTranslateY}]},
        ]}>
        <View style={styles.topBot}>
          <BotHand
            seatId="bot2"
            tileCount={players.bot2.hand.length}
            revealedMelds={players.bot2.revealedMelds}
            isCurrentTurn={currentTurn === 'bot2'}
            position="top"
          />
        </View>

        <View style={styles.middleRow}>
          <View style={styles.sideBot}>
            <BotHand
              seatId="bot1"
              tileCount={players.bot1.hand.length}
              revealedMelds={players.bot1.revealedMelds}
              isCurrentTurn={currentTurn === 'bot1'}
              position="left"
            />
          </View>

          <DiscardPile
            tiles={discardPile}
            lastDiscardedTile={lastDiscardedTile}
          />

          <View style={styles.sideBot}>
            <BotHand
              seatId="bot3"
              tileCount={players.bot3.hand.length}
              revealedMelds={players.bot3.revealedMelds}
              isCurrentTurn={currentTurn === 'bot3'}
              position="right"
            />
          </View>
        </View>
      </Animated.View>

      <PlayerHand
        hand={playerState.hand}
        revealedMelds={playerState.revealedMelds}
        onTilePress={handleTilePress}
        onDrawTile={handleDrawTile}
        isCurrentTurn={isPlayerTurn}
        canDiscard={canDiscard}
        canDraw={canDraw}
        hintTileId={hintTileId}
      />

      {/* Hint button */}
      {canDiscard && !winner && (
        <TouchableOpacity
          style={[styles.hintBtn, !isRewardedReady() && styles.hintBtnDisabled]}
          onPress={handleHint}
          activeOpacity={0.7}>
          <Text style={styles.hintBtnText}>{t.watchAdHint}</Text>
        </TouchableOpacity>
      )}

      {/* Pause Modal */}
      <Modal visible={pauseVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⏸</Text>
            <Text style={styles.modalTitle}>{t.paused}</Text>
            <Text style={styles.modalMessage}>{t.whatToDo}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => setPauseVisible(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalBtnPrimaryIcon}>▶</Text>
                <Text style={styles.modalBtnPrimaryText}>{t.resume}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnDanger}
                onPress={() => { setPauseVisible(false); onExit(); }}
                activeOpacity={0.8}>
                <Text style={styles.modalBtnDangerText}>{t.quitGame}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Claim Panel */}
      {waitingForPlayerClaim && playerClaimOptions.length > 0 && lastDiscardedTile && (
        <ClaimPanel
          options={playerClaimOptions}
          discardedTile={lastDiscardedTile}
          playerHand={playerState.hand}
          onClaim={(option: ClaimOption) => playerClaim(option)}
          onSkip={playerSkipClaim}
        />
      )}

      {/* Game Over Modal */}
      <Modal visible={gameOverVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>
              {winner ? (winner === 'player' ? '🏆' : '😔') : '🤝'}
            </Text>
            <Text style={[styles.modalTitle, winner === 'player' && styles.modalTitleWin]}>
              {winner
                ? winner === 'player'
                  ? t.youWin
                  : `${getSeatLabel(winner, t)} ${t.winsExcl}`
                : t.draw}
            </Text>
            <Text style={styles.modalMessage}>
              {winner
                ? winner === 'player'
                  ? t.congratulations
                  : t.betterLuck
                : t.wallExhausted}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => { setGameOverVisible(false); onExit(); }}
                activeOpacity={0.8}>
                <Text style={styles.modalBtnPrimaryText}>{t.newGame}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setGameOverVisible(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalBtnSecondaryText}>{t.reviewBoard}</Text>
              </TouchableOpacity>
            </View>
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
  gameArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBot: {
    alignItems: 'center',
    paddingTop: 4,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  sideBot: {
    width: ms(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#34656D',
    borderRadius: 20,
    padding: ms(28),
    width: modalWidth(280),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D7A74',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIcon: {
    fontSize: ms(48),
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: ms(22),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 8,
    letterSpacing: 1,
  },
  modalTitleWin: {
    color: '#FAEAB1',
  },
  modalMessage: {
    fontSize: 14,
    color: '#B0CBC5',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalBtnPrimary: {
    backgroundColor: '#FAEAB1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBtnPrimaryIcon: {
    fontSize: 12,
    color: '#334443',
  },
  modalBtnPrimaryText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  modalBtnSecondary: {
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#B0CBC5',
  },
  modalBtnDanger: {
    backgroundColor: 'rgba(239,83,80,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,83,80,0.25)',
  },
  modalBtnDangerText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#EF5350',
  },
  hintBtn: {
    position: 'absolute',
    bottom: ms(90),
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
});
