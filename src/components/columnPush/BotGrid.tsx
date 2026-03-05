import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Image, Animated, Easing} from 'react-native';
import {CPGrid} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';
import {getImageForTile} from '../../utils/columnPushEmoji';

interface BotGridProps {
  grid: CPGrid;
}

const OWNER_BG = {
  player: '#E8F5E9',
  bot: '#FFEBEE',
  neutral: '#FAF8F1',
};

const SLOT_HEIGHT = 24;
const SLOT_GAP = 2;
const SHIFT_DISTANCE = SLOT_HEIGHT + SLOT_GAP;

export const BotGrid: React.FC<BotGridProps> = ({grid}) => {
  const prevGridRef = useRef<string[][]>([]);
  const animValues = useRef<Animated.Value[][]>(
    Array.from({length: CP_COLS}, () =>
      Array.from({length: CP_ROWS}, () => new Animated.Value(0)),
    ),
  ).current;

  useEffect(() => {
    const prevGrid = prevGridRef.current;
    for (let col = 0; col < CP_COLS; col++) {
      const prevIds = prevGrid[col] ?? [];
      const currIds = grid[col].map(t => t.id);

      if (prevIds.length > 0 && prevIds[0] !== currIds[0]) {
        for (let row = 0; row < CP_ROWS; row++) {
          animValues[col][row].setValue(-SHIFT_DISTANCE);
          Animated.timing(animValues[col][row], {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
          }).start();
        }
      }
    }
    prevGridRef.current = grid.map(col => col.map(t => t.id));
  }, [grid, animValues]);

  return (
    <View style={styles.grid}>
      {Array.from({length: CP_COLS}, (_, col) => (
        <View key={col} style={styles.column}>
          {Array.from({length: CP_ROWS}, (__, row) => {
            const tile = grid[col][row];
            return (
              <Animated.View
                key={`${col}-${row}`}
                style={[
                  styles.slot,
                  tile.isHidden
                    ? styles.slotHidden
                    : {
                        ...styles.slotRevealed,
                        backgroundColor: OWNER_BG[tile.owner],
                      },
                  {transform: [{translateY: animValues[col][row]}]},
                ]}>
                {tile.isHidden ? (
                  <View style={styles.faceDown} />
                ) : (
                  <Image
                    source={getImageForTile(tile)}
                    style={styles.tileImage}
                    resizeMode="contain"
                  />
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
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  column: {
    gap: 2,
    overflow: 'hidden',
  },
  slot: {
    width: 26,
    height: 24,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotHidden: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
  },
  slotRevealed: {
    borderWidth: 1,
    borderColor: '#D5C89A',
  },
  faceDown: {
    width: 12,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#3D7A74',
  },
  tileImage: {
    width: 18,
    height: 18,
  },
});
