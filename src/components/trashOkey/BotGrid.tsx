import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, Animated, Dimensions} from 'react-native';
import {GridSlot} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';
import {TRASH_TILE_IMAGES} from '../../constants/gameAssets';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BotGridProps {
  slots: GridSlot[];
}

export const BotGrid: React.FC<BotGridProps> = ({slots}) => {
  const gap = 4;
  const padH = 48;
  const slotW = Math.floor((SCREEN_WIDTH - padH * 2 - (GRID_COLS - 1) * gap) / GRID_COLS);
  const slotH = Math.round(slotW * 1.2);
  const iconSize = Math.round(slotW * 0.48);

  const prevRevealedRef = useRef<boolean[]>(Array(10).fill(false));
  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({length: 10}, () => new Animated.Value(1)),
  ).current;
  const flashAnims = useRef<Animated.Value[]>(
    Array.from({length: 10}, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const prev = prevRevealedRef.current;
    for (let i = 0; i < 10; i++) {
      if (slots[i].isRevealed && !prev[i]) {
        scaleAnims[i].setValue(0.3);
        Animated.spring(scaleAnims[i], {
          toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
        }).start();
        flashAnims[i].setValue(1);
        Animated.timing(flashAnims[i], {
          toValue: 0, duration: 800, useNativeDriver: true,
        }).start();
      }
    }
    prevRevealedRef.current = slots.map(s => s.isRevealed);
  }, [slots, scaleAnims, flashAnims]);

  const renderSlot = (slot: GridSlot, index: number) => {
    const tileImg = slot.tile ? TRASH_TILE_IMAGES[slot.tile.number] : undefined;

    return (
      <Animated.View
        key={slot.position}
        style={[
          styles.slot,
          {width: slotW, height: slotH},
          slot.isRevealed && styles.slotRevealed,
          {transform: [{scale: scaleAnims[index]}]},
        ]}>
        {slot.isRevealed && slot.tile ? (
          <View style={styles.tileContent}>
            {tileImg && (
              <Image source={tileImg} style={{width: iconSize, height: iconSize}} resizeMode="contain" />
            )}
            <Text style={styles.revealedNumber}>
              {slot.tile.isJoker ? 'J' : slot.tile.number}
            </Text>
          </View>
        ) : (
          <View style={styles.hiddenDot} />
        )}
        <Animated.View
          style={[styles.flashOverlay, {opacity: flashAnims[index]}]}
          pointerEvents="none"
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, {paddingHorizontal: padH}]}>
      <View style={[styles.row, {gap}]}>
        {slots.slice(0, GRID_COLS).map((s, i) => renderSlot(s, i))}
      </View>
      <View style={[styles.row, {gap}]}>
        {slots.slice(GRID_COLS, GRID_COLS * GRID_ROWS).map((s, i) => renderSlot(s, i + GRID_COLS))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  slot: {
    borderRadius: 6,
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slotRevealed: {
    backgroundColor: '#FAF8F1',
    borderColor: '#D5C89A',
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  revealedNumber: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  hiddenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D7A74',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 234, 177, 0.5)',
    borderRadius: 6,
  },
});
