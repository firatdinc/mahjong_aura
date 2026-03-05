import React, {useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {Tile, Meld} from '../../types';
import {TileComponent} from '../shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';

interface PlayerHandProps {
  hand: Tile[];
  revealedMelds: Meld[];
  onTilePress: (tile: Tile) => void;
  onDrawTile?: () => void;
  isCurrentTurn: boolean;
  canDiscard: boolean;
  canDraw: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  revealedMelds,
  onTilePress,
  onDrawTile,
  isCurrentTurn,
  canDiscard,
  canDraw,
}) => {
  const {t} = useLanguage();
  const {autoDraw} = useSettings();

  // Two-row layout: split hand into two rows
  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const availableWidth = screenWidth - padding;
  const tilesPerRow = Math.ceil(hand.length / 2);
  const tileMargin = 2;
  const maxTileWidth =
    Math.floor(availableWidth / Math.max(tilesPerRow, 1)) - tileMargin;
  const tileWidth = Math.min(maxTileWidth, 44);
  const tileHeight = Math.round(tileWidth * 1.4);
  const fontSize = Math.max(Math.round(tileWidth * 0.4), 10);
  const labelSize = Math.max(Math.round(tileWidth * 0.22), 7);

  const topRow = hand.slice(0, tilesPerRow);
  const bottomRow = hand.slice(tilesPerRow);

  const customSize = {width: tileWidth, height: tileHeight, fontSize, labelSize};

  // Animation tracking
  const prevIdsRef = useRef<Set<string>>(new Set());
  const animsRef = useRef<Map<string, {scale: Animated.Value; translateY: Animated.Value}>>(new Map());

  const getAnim = useCallback((id: string) => {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, {
        scale: new Animated.Value(1),
        translateY: new Animated.Value(0),
      });
    }
    return animsRef.current.get(id)!;
  }, []);

  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = new Set(hand.map(tile => tile.id));

    // Animate newly drawn tiles (slide up from below)
    for (const tile of hand) {
      if (!prevIds.has(tile.id)) {
        const anim = getAnim(tile.id);
        anim.translateY.setValue(30);
        anim.scale.setValue(0.5);
        Animated.parallel([
          Animated.spring(anim.translateY, {
            toValue: 0,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }

    // Clean up removed tiles
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        animsRef.current.delete(id);
      }
    }

    prevIdsRef.current = currentIds;
  }, [hand, getAnim]);

  const handleDiscard = useCallback((tile: Tile) => {
    const anim = getAnim(tile.id);
    // Shrink + slide up before removing
    Animated.parallel([
      Animated.timing(anim.scale, {
        toValue: 0.3,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(anim.translateY, {
        toValue: -20,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onTilePress(tile);
    });
  }, [onTilePress, getAnim]);

  const renderTile = (tile: Tile) => {
    const anim = getAnim(tile.id);
    return (
      <Animated.View
        key={tile.id}
        style={{
          transform: [
            {translateY: anim.translateY},
            {scale: anim.scale},
          ],
        }}>
        <TileComponent
          tile={tile}
          customSize={customSize}
          onPress={canDiscard ? handleDiscard : undefined}
          highlighted={isCurrentTurn && canDiscard}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Revealed melds */}
      {revealedMelds.length > 0 && (
        <View style={styles.meldsRow}>
          {revealedMelds.map((meld, meldIdx) => (
            <View key={`meld-${meldIdx}`} style={styles.meldGroup}>
              {meld.tiles.map(meldTile => (
                <TileComponent key={meldTile.id} tile={meldTile} size="small" />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Two-row hand */}
      <View style={styles.handContainer}>
        <View style={styles.handRow}>
          {topRow.map(renderTile)}
        </View>
        <View style={styles.handRow}>
          {bottomRow.map(renderTile)}
        </View>
      </View>

      {isCurrentTurn && canDiscard && (
        <Text style={styles.hint}>{t.tapToDiscard}</Text>
      )}

      {/* Manual draw button */}
      {!autoDraw && isCurrentTurn && canDraw && (
        <TouchableOpacity
          style={styles.drawButton}
          onPress={onDrawTile}
          activeOpacity={0.8}>
          <Text style={styles.drawButtonIcon}>🎴</Text>
          <Text style={styles.drawButtonText}>{t.drawTile}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#34656D',
    borderTopWidth: 1,
    borderTopColor: '#2A5450',
  },
  meldsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
    justifyContent: 'center',
  },
  meldGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderRadius: 4,
    padding: 2,
  },
  handContainer: {
    gap: 2,
  },
  handRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hint: {
    color: '#FAEAB1',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  drawButton: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  drawButtonIcon: {
    fontSize: 14,
  },
  drawButtonText: {
    color: '#334443',
    fontSize: 14,
    fontWeight: '700',
  },
});
