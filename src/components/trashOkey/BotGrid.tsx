import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, Animated, Dimensions} from 'react-native';
import {GridSlot} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';
import {OKEY_TILE_IMAGES} from '../../constants/gameAssets';
import {useSettings} from '../../store/useSettings';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BotGridProps {
  grid: GridSlot[][];
}

const OKEY_COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  yellow: '#F1C40F',
  black: '#2C3E50',
};

export const BotGrid: React.FC<BotGridProps> = ({grid}) => {
  const {tileScale} = useSettings();
  const gap = 2;
  const maxSlotW = Math.floor((SCREEN_WIDTH - 32 - (GRID_COLS - 1) * gap) / GRID_COLS);
  const slotW = Math.min(Math.round(28 * tileScale), maxSlotW);
  const slotH = Math.round(slotW * (24 / 28));
  const imgSize = Math.round(slotW * (18 / 28));
  const faceDownW = Math.round(slotW * (14 / 28));
  const faceDownH = Math.round(slotW * (10 / 28));
  const prevRevealedRef = useRef<boolean[][]>([]);
  const scaleAnims = useRef<Animated.Value[][]>(
    Array.from({length: GRID_ROWS}, () =>
      Array.from({length: GRID_COLS}, () => new Animated.Value(1)),
    ),
  ).current;

  useEffect(() => {
    const prev = prevRevealedRef.current;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const wasRevealed = prev[r]?.[c] ?? false;
        const isRevealed = grid[r][c].isRevealed;
        if (isRevealed && !wasRevealed) {
          scaleAnims[r][c].setValue(0.3);
          Animated.spring(scaleAnims[r][c], {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }
      }
    }
    prevRevealedRef.current = grid.map(row => row.map(s => s.isRevealed));
  }, [grid, scaleAnims]);

  return (
    <View style={styles.container}>
      {Array.from({length: GRID_ROWS}, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({length: GRID_COLS}, (_, col) => {
            const slot = grid[row][col];
            return (
              <Animated.View
                key={col}
                style={[
                  styles.slot,
                  {width: slotW, height: slotH},
                  slot.isRevealed && styles.slotRevealed,
                  {transform: [{scale: scaleAnims[row][col]}]},
                ]}>
                {slot.isRevealed && slot.tile ? (
                  <>
                    {slot.tile.isFalseJoker ? (
                      <Text style={[styles.tileNumber, {color: OKEY_COLOR_MAP[slot.tile.color] ?? '#334443'}]}>J</Text>
                    ) : (
                      <Image
                        source={OKEY_TILE_IMAGES[slot.tile.number]}
                        style={{width: imgSize, height: imgSize}}
                        resizeMode="contain"
                      />
                    )}
                  </>
                ) : (
                  <View style={{width: faceDownW, height: faceDownH, borderRadius: 2, backgroundColor: '#3D7A74'}} />
                )}
              </Animated.View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  slot: {
    borderRadius: 3,
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotRevealed: {
    backgroundColor: '#FAF8F1',
    borderColor: '#D5C89A',
  },
  tileNumber: {
    fontSize: 9,
    fontFamily: 'Nunito_700Bold',
  },
});
