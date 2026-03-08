import React, {useEffect, useCallback, useState, useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTrashOkeyStore} from '../../store/useTrashOkeyStore';
import {useLanguage} from '../../i18n/useLanguage';
import {PlayerGrid} from '../../components/trashOkey/PlayerGrid';
import {BotGrid} from '../../components/trashOkey/BotGrid';
import {CenterTile} from '../../components/trashOkey/CenterTile';
import {ChainIndicator} from '../../components/trashOkey/ChainIndicator';
import {ms, modalWidth} from '../../utils/scaling';

interface TrashOkeyGameScreenProps {
  onExit: () => void;
}

export const TrashOkeyGameScreen: React.FC<TrashOkeyGameScreenProps> = ({onExit}) => {
  const {
    players,
    centerTile,
    currentTurn,
    chainActive,
    chainLength,
    currentChainTile,
    status,
    difficulty,
    turnCount,
    longestChain,
    pickUpCenterTile,
    placeTileInSlot,
    endChain,
    playBotTurn,
  } = useTrashOkeyStore();
  const {t} = useLanguage();

  // Auto-trigger bot turn
  const isBotPlaying = useRef(false);
  useEffect(() => {
    if (status === 'playing' && currentTurn === 'bot' && !chainActive && !isBotPlaying.current) {
      isBotPlaying.current = true;
      const timeout = setTimeout(() => {
        playBotTurn().finally(() => { isBotPlaying.current = false; });
      }, 300);
      return () => { clearTimeout(timeout); isBotPlaying.current = false; };
    }
  }, [status, currentTurn, chainActive, playBotTurn]);

  const handleSlotPress = useCallback(
    (row: number, col: number) => {
      placeTileInSlot(row, col);
    },
    [placeTileInSlot],
  );

  const handlePickUp = useCallback(() => {
    pickUpCenterTile();
  }, [pickUpCenterTile]);

  const handleEndChain = useCallback(() => {
    endChain();
  }, [endChain]);

  const [paused, setPaused] = useState(false);

  const canPickUp =
    status === 'playing' &&
    currentTurn === 'player' &&
    centerTile !== null &&
    !chainActive;

  const showResult = status === 'won' || status === 'lost';

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
            {currentTurn === 'player' ? t.toYourTurn : t.toBotTurn}
          </Text>
        </View>
        <Text style={styles.headerStatText}>
          {t.toRevealedTiles}: {players.player.revealedCount}/48
        </Text>
      </View>

      {/* Bot Grid (top) */}
      <View style={styles.botSection}>
        <Text style={styles.sectionLabel}>{t.bot}</Text>
        <BotGrid grid={players.bot.grid} />
      </View>

      {/* Center area */}
      <View style={styles.centerSection}>
        {chainActive && currentChainTile ? (
          <View style={styles.chainArea}>
            <ChainIndicator
              chainActive={chainActive}
              chainLength={chainLength}
              currentChainTile={currentChainTile}
            />
            <Text style={styles.hintText}>{t.toPlaceTile}</Text>
            {currentTurn === 'player' && (
              <TouchableOpacity
                style={styles.endChainBtn}
                onPress={handleEndChain}
                activeOpacity={0.7}>
                <Text style={styles.endChainText}>{t.toCannotPlace}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.centerTileArea}>
            <CenterTile
              tile={centerTile}
              onPress={handlePickUp}
              disabled={!canPickUp}
            />
            {canPickUp && (
              <Text style={styles.hintText}>{t.toTapCenter}</Text>
            )}
          </View>
        )}
      </View>

      {/* Player Grid (bottom) */}
      <View style={styles.playerSection}>
        <PlayerGrid
          grid={players.player.grid}
          currentChainTile={currentChainTile}
          chainActive={chainActive && currentTurn === 'player'}
          onSlotPress={handleSlotPress}
        />
      </View>

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
              onPress={onExit}
              activeOpacity={0.8}>
              <Text style={styles.quitBtnText}>{t.quitGame}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {status === 'won' ? t.toYouWin : t.toBotWins}
            </Text>
            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>
                {t.toLongestChain}: {longestChain}
              </Text>
              <Text style={styles.modalStat}>
                {t.turns}: {turnCount}
              </Text>
              <Text style={styles.modalStat}>
                {t.toRevealedTiles}: {players.player.revealedCount}/48
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={onExit}
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
  headerStats: {
    flexDirection: 'row',
  },
  headerStatText: {
    fontSize: 12,
    color: '#8AABA5',
  },
  botSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6B9C93',
    letterSpacing: 1,
    marginBottom: 4,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  chainArea: {
    alignItems: 'center',
    gap: 6,
  },
  centerTileArea: {
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#8AABA5',
    fontFamily: 'Nunito_500Medium',
  },
  endChainBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  endChainText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#E74C3C',
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
});
