import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Image, Animated, Easing, Dimensions} from 'react-native';
import {CPGrid} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';
import {getImageForTile} from '../../utils/columnPushEmoji';
import {useSettings} from '../../store/useSettings';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BotGridProps {
  grid: CPGrid;
}

const OWNER_BG = {
  player: '#E8F5E9',
  bot: '#FFEBEE',
  neutral: '#FAF8F1',
};

export const BotGrid: React.FC<BotGridProps> = ({grid}) => {
  const {tileScale} = useSettings();
  const SLOT_GAP = 2;
  const maxSlotW = Math.floor((SCREEN_WIDTH - 32 - (CP_COLS - 1) * SLOT_GAP) / CP_COLS);
  const slotW = Math.min(Math.round(26 * tileScale), maxSlotW);
  const slotH = Math.round(slotW * (24 / 26));
  const imgSize = Math.round(slotW * (18 / 26));
  const faceDownW = Math.round(slotW * (12 / 26));
  const faceDownH = Math.round(slotW * (8 / 26));
  const SHIFT_DISTANCE = slotH + SLOT_GAP;
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
                  {width: slotW, height: slotH},
                  tile.isHidden
                    ? styles.slotHidden
                    : {
                        ...styles.slotRevealed,
                        backgroundColor: OWNER_BG[tile.owner],
                      },
                  {transform: [{translateY: animValues[col][row]}]},
                ]}>
                {tile.isHidden ? (
                  <View style={{width: faceDownW, height: faceDownH, borderRadius: 2, backgroundColor: '#3D7A74'}} />
                ) : (
                  <Image
                    source={getImageForTile(tile)}
                    style={{width: imgSize, height: imgSize}}
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
});
