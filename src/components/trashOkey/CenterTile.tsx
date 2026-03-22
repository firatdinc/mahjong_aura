import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Animated} from 'react-native';
import {TrashTile} from '../../types/trashOkey';
import {TRASH_TILE_IMAGES} from '../../constants/gameAssets';
import {useLanguage} from '../../i18n/useLanguage';

interface DrawAreaProps {
  drawPileCount: number;
  topDiscard: TrashTile | null;
  drawnTile: TrashTile | null;
  canDraw: boolean;
  canDrawDiscard: boolean;
  onDrawPile: () => void;
  onDrawDiscard: () => void;
  onDiscard: () => void;
}

export const DrawArea: React.FC<DrawAreaProps> = ({
  drawPileCount,
  topDiscard,
  drawnTile,
  canDraw,
  canDrawDiscard,
  onDrawPile,
  onDrawDiscard,
  onDiscard,
}) => {
  const {t} = useLanguage();

  const drawnScale = useRef(new Animated.Value(0)).current;
  const prevDrawnId = useRef<string | null>(null);

  useEffect(() => {
    const currentId = drawnTile?.id ?? null;
    if (currentId && currentId !== prevDrawnId.current) {
      drawnScale.setValue(0.3);
      Animated.spring(drawnScale, {
        toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
      }).start();
    }
    prevDrawnId.current = currentId;
  }, [drawnTile, drawnScale]);

  const tileIcon = (tile: TrashTile, size: number) => {
    const img = TRASH_TILE_IMAGES[tile.number];
    return img ? <Image source={img} style={{width: size, height: size}} resizeMode="contain" /> : null;
  };

  return (
    <View style={styles.container}>
      {/* Drawn tile display */}
      {drawnTile && (
        <Animated.View style={[styles.drawnTileWrap, {transform: [{scale: drawnScale}]}]}>
          <View style={styles.drawnTile}>
            {tileIcon(drawnTile, 40)}
            <Text style={styles.drawnNumber}>
              {drawnTile.isJoker ? 'JOKER' : drawnTile.number}
            </Text>
          </View>
          <TouchableOpacity style={styles.discardBtn} onPress={onDiscard} activeOpacity={0.7}>
            <Text style={styles.discardBtnText}>{t.toDropToCenter}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Piles */}
      {!drawnTile && (
        <View style={styles.pilesRow}>
          {/* Draw pile */}
          <TouchableOpacity
            style={[styles.pile, canDraw && styles.pileActive]}
            onPress={onDrawPile}
            disabled={!canDraw}
            activeOpacity={0.7}>
            <Text style={styles.pileIcon}>?</Text>
            <Text style={styles.pileCount}>{drawPileCount}</Text>
          </TouchableOpacity>

          {/* Discard pile */}
          {topDiscard ? (
            <TouchableOpacity
              style={[styles.pile, styles.discardPile, canDrawDiscard && styles.pileActive]}
              onPress={onDrawDiscard}
              disabled={!canDrawDiscard}
              activeOpacity={0.7}>
              {tileIcon(topDiscard, 28)}
              <Text style={styles.discardNumber}>
                {topDiscard.isJoker ? 'J' : topDiscard.number}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.pile, styles.emptyDiscard]}>
              <Text style={styles.emptyText}>-</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// Keep old export name
export const CenterTile = DrawArea;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  pilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  pile: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#34656D',
    borderWidth: 2,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pileActive: {
    borderColor: '#FAEAB1',
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pileIcon: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#6B9C93',
  },
  pileCount: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8AABA5',
    marginTop: 2,
  },
  discardPile: {
    backgroundColor: '#FAF8F1',
    borderColor: '#D5C89A',
  },
  emptyDiscard: {
    borderStyle: 'dashed',
    borderColor: '#3D7A74',
  },
  emptyText: {
    fontSize: 24,
    color: '#3D7A74',
  },
  discardNumber: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
    marginTop: 2,
  },
  drawnTileWrap: {
    alignItems: 'center',
    gap: 10,
  },
  drawnTile: {
    width: 84,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#FAF8F1',
    borderWidth: 3,
    borderColor: '#FAEAB1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  drawnNumber: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  discardBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.25)',
  },
  discardBtnText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#E74C3C',
  },
});
