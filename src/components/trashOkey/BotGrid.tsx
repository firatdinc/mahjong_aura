import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, Animated} from 'react-native';
import {GridSlot} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';
import {OKEY_TILE_IMAGES} from '../../constants/gameAssets';

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
                        style={styles.tileImage}
                        resizeMode="contain"
                      />
                    )}
                  </>
                ) : (
                  <View style={styles.faceDown} />
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
    width: 28,
    height: 24,
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
  faceDown: {
    width: 14,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#3D7A74',
  },
  tileImage: {
    width: 18,
    height: 18,
  },
  tileNumber: {
    fontSize: 9,
    fontWeight: '700',
  },
});
