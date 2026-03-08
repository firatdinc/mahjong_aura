import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image} from 'react-native';
import {SeatId, TurnPhase} from '../../types';
import {useLanguage} from '../../i18n/useLanguage';
import {getSeatLabel} from '../../constants/mahjong/game';

const energyImg = require('../../../assets/game/energy.png');
const trophyImg = require('../../../assets/game/trophy.png');

interface GameHeaderProps {
  wallCount: number;
  currentTurn: SeatId;
  turnPhase: TurnPhase;
  winner: SeatId | null;
  onPause: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  wallCount,
  currentTurn,
  turnPhase,
  winner,
  onPause,
}) => {
  const {t} = useLanguage();

  const statusText = winner
    ? `${getSeatLabel(winner, t)} ${t.winsExcl}`
    : turnPhase === 'gameOver'
      ? t.drawNoTiles
      : `${getSeatLabel(currentTurn, t)}${t.turn}`;

  const phaseText =
    turnPhase === 'drawing' ? t.drawing
    : turnPhase === 'discarding' ? t.discarding
    : turnPhase === 'claiming' ? t.claiming
    : turnPhase;

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>{t.wall}</Text>
        <Text style={styles.statValue}>{wallCount}</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          {winner ? (
            <Image source={trophyImg} style={styles.statusIcon} />
          ) : turnPhase !== 'gameOver' ? (
            <Image source={energyImg} style={styles.statusIcon} />
          ) : null}
          <Text
            style={[
              styles.status,
              winner && styles.winnerText,
              turnPhase === 'gameOver' && !winner && styles.drawText,
            ]}>
            {statusText}
          </Text>
        </View>
        {turnPhase !== 'gameOver' && (
          <Text style={styles.phase}>{phaseText}</Text>
        )}
      </View>

      <TouchableOpacity onPress={onPause} style={styles.pauseBtn} activeOpacity={0.7}>
        <Text style={styles.pauseText}>⏸</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#34656D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A5450',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#8AABA5',
    fontSize: 9,
    letterSpacing: 1,
  },
  statValue: {
    color: '#FAF8F1',
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  status: {
    color: '#FAF8F1',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  winnerText: {
    color: '#FAEAB1',
  },
  drawText: {
    color: '#FF8A65',
  },
  phase: {
    color: '#6B9C93',
    fontSize: 9,
    marginTop: 2,
  },
  pauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    color: '#FAF8F1',
    fontSize: 16,
  },
});
