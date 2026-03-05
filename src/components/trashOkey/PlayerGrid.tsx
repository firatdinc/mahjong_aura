import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Animated} from 'react-native';
import {GridSlot, OkeyTile} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';
import {OKEY_TILE_IMAGES} from '../../constants/gameAssets';

interface PlayerGridProps {
  grid: GridSlot[][];
  currentChainTile: OkeyTile | null;
  chainActive: boolean;
  onSlotPress: (row: number, col: number) => void;
}

const OKEY_COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  yellow: '#F1C40F',
  black: '#2C3E50',
};

function canPlaceHere(slot: GridSlot, tile: OkeyTile | null): boolean {
  if (!tile || !slot.isFaceDown) return false;
  if (tile.isFalseJoker) return true;
  return slot.targetNumber === tile.number;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  grid,
  currentChainTile,
  chainActive,
  onSlotPress,
}) => {
  // Track which slots just got revealed for animation
  const prevRevealedRef = useRef<boolean[][]>([]);
  const scaleAnims = useRef<Animated.Value[][]>(
    Array.from({length: GRID_ROWS}, () =>
      Array.from({length: GRID_COLS}, () => new Animated.Value(1)),
    ),
  ).current;
  const opacityAnims = useRef<Animated.Value[][]>(
    Array.from({length: GRID_ROWS}, () =>
      Array.from({length: GRID_COLS}, () => new Animated.Value(1)),
    ),
  ).current;

  // Pulse animation for valid slots
  const pulseAnims = useRef<Animated.Value[][]>(
    Array.from({length: GRID_ROWS}, () =>
      Array.from({length: GRID_COLS}, () => new Animated.Value(1)),
    ),
  ).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const prev = prevRevealedRef.current;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const wasRevealed = prev[r]?.[c] ?? false;
        const isRevealed = grid[r][c].isRevealed;
        if (isRevealed && !wasRevealed) {
          // Newly revealed — pop-in animation
          scaleAnims[r][c].setValue(0.3);
          opacityAnims[r][c].setValue(0);
          Animated.parallel([
            Animated.spring(scaleAnims[r][c], {
              toValue: 1,
              friction: 5,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnims[r][c], {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    }
    prevRevealedRef.current = grid.map(row => row.map(s => s.isRevealed));
  }, [grid, scaleAnims, opacityAnims]);

  // Pulse valid slots
  useEffect(() => {
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
      pulseAnimRef.current = null;
    }

    if (chainActive && currentChainTile) {
      const validAnims: Animated.CompositeAnimation[] = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (canPlaceHere(grid[r][c], currentChainTile)) {
            validAnims.push(
              Animated.loop(
                Animated.sequence([
                  Animated.timing(pulseAnims[r][c], {
                    toValue: 1.08,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                  Animated.timing(pulseAnims[r][c], {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                ]),
              ),
            );
          } else {
            pulseAnims[r][c].setValue(1);
          }
        }
      }
      if (validAnims.length > 0) {
        const anim = Animated.parallel(validAnims);
        pulseAnimRef.current = anim;
        anim.start();
      }
    } else {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          pulseAnims[r][c].setValue(1);
        }
      }
    }

    return () => {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.stop();
      }
    };
  }, [chainActive, currentChainTile, grid, pulseAnims]);

  return (
    <View style={styles.container}>
      {Array.from({length: GRID_ROWS}, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({length: GRID_COLS}, (_, col) => {
            const slot = grid[row][col];
            const isValid = chainActive && canPlaceHere(slot, currentChainTile);

            return (
              <Animated.View
                key={col}
                style={{
                  transform: [
                    {scale: Animated.multiply(scaleAnims[row][col], pulseAnims[row][col])},
                  ],
                  opacity: opacityAnims[row][col],
                }}>
                <TouchableOpacity
                  style={[
                    styles.slot,
                    slot.isRevealed && styles.slotRevealed,
                    isValid && styles.slotValid,
                  ]}
                  onPress={() => onSlotPress(row, col)}
                  disabled={!isValid}
                  activeOpacity={0.7}>
                  {slot.isRevealed && slot.tile ? (
                    <View style={styles.tileContent}>
                      {slot.tile.isFalseJoker ? (
                        <Text style={[styles.tileNumber, {color: OKEY_COLOR_MAP[slot.tile.color] ?? '#334443'}]}>J</Text>
                      ) : (
                        <Image
                          source={OKEY_TILE_IMAGES[slot.tile.number]}
                          style={styles.tileImage}
                          resizeMode="contain"
                        />
                      )}
                      <View style={[styles.colorDot, {backgroundColor: OKEY_COLOR_MAP[slot.tile.color] ?? '#334443'}]} />
                    </View>
                  ) : (
                    <Image
                      source={OKEY_TILE_IMAGES[slot.targetNumber]}
                      style={styles.targetImage}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
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
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  slot: {
    width: 44,
    height: 40,
    borderRadius: 6,
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
  slotValid: {
    borderColor: '#FAEAB1',
    borderWidth: 2,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileImage: {
    width: 28,
    height: 28,
  },
  tileNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 1,
    right: 1,
  },
  targetImage: {
    width: 22,
    height: 22,
    opacity: 0.3,
  },
});
