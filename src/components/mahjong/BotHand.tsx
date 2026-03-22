import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Meld, SeatId, Location} from '../../types';
import {TileComponent} from '../shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';
import {getSeatLabel} from '../../constants/mahjong/game';

const MELD_LABEL_COLORS: Record<string, string> = {
  pong: '#FF9800',
  kong: '#E91E63',
  chow: '#4CAF50',
};

interface BotHandProps {
  seatId: SeatId;
  tileCount: number;
  revealedMelds: Meld[];
  isCurrentTurn: boolean;
  position: 'left' | 'top' | 'right';
}

export const BotHand: React.FC<BotHandProps> = ({
  seatId,
  tileCount,
  revealedMelds,
  isCurrentTurn,
  position,
}) => {
  const isHorizontal = position === 'top';

  // Create dummy tiles for face-down display
  const faceDownTiles = Array.from({length: tileCount}, (_, i) => ({
    id: `hidden-${seatId}-${i}`,
    suit: 'bamboo' as const,
    value: '0',
    location: seatId as Location,
    isHidden: true,
  }));

  const {t} = useLanguage();

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontal : styles.vertical,
        isCurrentTurn && styles.activeTurn,
      ]}>
      {/* Bot label */}
      <Text style={[styles.label, isCurrentTurn && styles.activeLabel]}>
        {getSeatLabel(seatId, t)}
        {isCurrentTurn ? ' ...' : ''}
      </Text>

      {/* Face-down tiles */}
      <View
        style={[
          styles.tilesContainer,
          isHorizontal ? styles.tilesHorizontal : styles.tilesVertical,
        ]}>
        {faceDownTiles.slice(0, isHorizontal ? 13 : 6).map(tile => (
          <TileComponent
            key={tile.id}
            tile={tile}
            size="small"
            faceDown
          />
        ))}
        {tileCount > (isHorizontal ? 13 : 6) && (
          <Text style={styles.moreCount}>
            +{tileCount - (isHorizontal ? 13 : 6)}
          </Text>
        )}
      </View>

      {/* Revealed melds */}
      {revealedMelds.length > 0 && (
        <View
          style={[
            styles.meldsContainer,
            isHorizontal ? styles.meldsHorizontal : styles.meldsVertical,
          ]}>
          {revealedMelds.map((meld, meldIdx) => (
            <View
              key={`meld-${meldIdx}`}
              style={[
                styles.meldGroup,
                isHorizontal ? styles.meldHorizontal : styles.meldVertical,
              ]}>
              <View style={[styles.meldLabel, {backgroundColor: MELD_LABEL_COLORS[meld.type]}]}>
                <Text style={styles.meldLabelText}>{meld.type.toUpperCase()}</Text>
              </View>
              <View style={styles.meldTilesRow}>
                {meld.tiles.map(tile => (
                  <TileComponent key={tile.id} tile={tile} size="small" />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  horizontal: {
    flexDirection: 'column',
  },
  vertical: {
    flexDirection: 'column',
  },
  activeTurn: {
    backgroundColor: 'rgba(250, 234, 177, 0.12)',
    borderRadius: 8,
  },
  label: {
    color: '#8AABA5',
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 2,
  },
  activeLabel: {
    color: '#FAEAB1',
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tilesHorizontal: {
    flexDirection: 'row',
  },
  tilesVertical: {
    flexDirection: 'row',
    maxWidth: 70,
  },
  moreCount: {
    color: '#6B9C93',
    fontSize: 10,
    alignSelf: 'center',
    marginLeft: 2,
  },
  meldsContainer: {
    marginTop: 4,
  },
  meldsHorizontal: {
    flexDirection: 'row',
    gap: 4,
  },
  meldsVertical: {
    flexDirection: 'column',
    gap: 2,
  },
  meldGroup: {
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderRadius: 4,
    padding: 2,
    gap: 1,
  },
  meldLabel: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  meldLabelText: {
    color: '#FFF',
    fontSize: 7,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.5,
  },
  meldTilesRow: {
    flexDirection: 'row',
  },
  meldHorizontal: {
    flexDirection: 'column',
  },
  meldVertical: {
    flexDirection: 'column',
  },
});
