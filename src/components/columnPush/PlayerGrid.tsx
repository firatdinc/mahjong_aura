import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Animated, Easing, Dimensions} from 'react-native';
import {CPGrid, CPTile} from '../../types/columnPush';
import {CP_COLS, CP_ROWS} from '../../constants/columnPush/grid';
import {getValidColumnsForPlacement} from '../../engine/columnPush/gridLogic';
import {getImageForTile} from '../../utils/columnPushEmoji';
import {useSettings} from '../../store/useSettings';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PlayerGridProps {
  grid: CPGrid;
  isPlayerTurn: boolean;
  activeTile: CPTile | null;
  chainLength: number;
  onColumnPress: (colIndex: number) => void;
  hintCol?: number | null;
}

const OWNER_BG = {
  player: '#E8F5E9',
  bot: '#FFEBEE',
  neutral: '#FAF8F1',
};

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  grid,
  isPlayerTurn,
  activeTile,
  chainLength,
  onColumnPress,
  hintCol,
}) => {
  const {tileScale} = useSettings();
  const SLOT_GAP = 3;
  const colPadding = 4; // padding per column
  const maxSlotW = Math.floor((SCREEN_WIDTH - 32 - (CP_COLS - 1) * SLOT_GAP - CP_COLS * colPadding) / CP_COLS);
  const slotW = Math.min(Math.round(36 * tileScale), maxSlotW);
  const slotH = Math.round(slotW * (38 / 36));
  const imgSize = Math.round(slotW * (28 / 36));
  const arrowW = slotW;
  const SHIFT_DISTANCE = slotH + SLOT_GAP;
  const prevGridRef = useRef<string[][]>([]);
  const animValues = useRef<Animated.Value[][]>(
    Array.from({length: CP_COLS}, () =>
      Array.from({length: CP_ROWS}, () => new Animated.Value(0)),
    ),
  ).current;
  const scaleValues = useRef<Animated.Value[]>(
    Array.from({length: CP_COLS}, () => new Animated.Value(1)),
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
        scaleValues[col].setValue(0.3);
        Animated.spring(scaleValues[col], {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }
    }
    prevGridRef.current = grid.map(col => col.map(t => t.id));
  }, [grid, animValues, scaleValues]);

  const validColumns = useMemo(() => {
    if (!isPlayerTurn || !activeTile) return new Set<number>();
    return new Set(getValidColumnsForPlacement(grid, activeTile));
  }, [isPlayerTurn, activeTile, grid]);

  const isColumnEnabled = useCallback(
    (col: number) => {
      if (!isPlayerTurn) return false;
      return validColumns.has(col);
    },
    [isPlayerTurn, validColumns],
  );

  const handlePress = useCallback(
    (col: number) => {
      if (isColumnEnabled(col)) onColumnPress(col);
    },
    [isColumnEnabled, onColumnPress],
  );

  return (
    <View style={styles.container}>
      {isPlayerTurn && (
        <View style={styles.arrowRow}>
          {Array.from({length: CP_COLS}, (_, col) => (
            <TouchableOpacity
              key={col}
              style={[
                styles.arrowBtn,
                {width: arrowW},
                !isColumnEnabled(col) && styles.arrowBtnDisabled,
              ]}
              onPress={() => handlePress(col)}
              activeOpacity={0.6}
              disabled={!isColumnEnabled(col)}>
              <Text
                style={[
                  styles.arrowText,
                  !isColumnEnabled(col) && styles.arrowTextDisabled,
                  chainLength > 0 && isColumnEnabled(col) && styles.arrowTextChain,
                ]}>
                ▼
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        {Array.from({length: CP_COLS}, (_, col) => {
          const enabled = isColumnEnabled(col);
          return (
            <TouchableOpacity
              key={col}
              style={[
                styles.column,
                enabled && styles.columnActive,
                chainLength > 0 && enabled && styles.columnChain,
                hintCol === col && styles.columnHint,
              ]}
              onPress={() => handlePress(col)}
              disabled={!enabled}
              activeOpacity={0.7}>
              {Array.from({length: CP_ROWS}, (__, row) => {
                const tile = grid[col][row];
                const isTopTile = row === 0;
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
                      {
                        transform: [
                          {translateY: animValues[col][row]},
                          ...(isTopTile ? [{scale: scaleValues[col]}] : []),
                        ],
                      },
                    ]}>
                    {tile.isHidden ? (
                      <Text style={styles.hiddenText}>?</Text>
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
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  arrowBtn: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 14,
    color: '#FAEAB1',
    fontFamily: 'Nunito_600SemiBold',
  },
  arrowTextDisabled: {
    color: '#6B9C93',
  },
  arrowTextChain: {
    color: '#27AE60',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  column: {
    gap: 3,
    borderRadius: 6,
    padding: 2,
    overflow: 'hidden',
  },
  columnActive: {
    backgroundColor: 'rgba(250, 234, 177, 0.08)',
  },
  columnChain: {
    backgroundColor: 'rgba(39, 174, 96, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.4)',
  },
  columnHint: {
    backgroundColor: 'rgba(250, 234, 177, 0.2)',
    borderWidth: 2,
    borderColor: '#FAEAB1',
  },
  slot: {
    borderRadius: 5,
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
  hiddenText: {
    fontSize: 12,
    color: '#6B9C93',
    fontFamily: 'Nunito_600SemiBold',
  },
});
