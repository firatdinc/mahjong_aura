import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Animated, Dimensions} from 'react-native';
import {GridSlot, TrashTile} from '../../types/trashOkey';
import {GRID_ROWS, GRID_COLS} from '../../constants/trashOkey/grid';
import {TRASH_TILE_IMAGES} from '../../constants/gameAssets';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PlayerGridProps {
  slots: GridSlot[];
  drawnTile: TrashTile | null;
  chainActive: boolean;
  onSlotPress: (position: number) => void;
  hintSlot?: number | null;
}

function canPlaceHere(slot: GridSlot, tile: TrashTile | null): boolean {
  if (!tile || slot.isRevealed) return false;
  if (tile.isJoker) return true;
  return slot.position === tile.number;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  slots,
  drawnTile,
  chainActive,
  onSlotPress,
  hintSlot,
}) => {
  const gap = 8;
  const padH = 20;
  const slotW = Math.floor((SCREEN_WIDTH - padH * 2 - (GRID_COLS - 1) * gap) / GRID_COLS);
  const slotH = Math.round(slotW * 1.35);
  const iconSize = Math.round(slotW * 0.52);

  const prevRevealedRef = useRef<boolean[]>(Array(10).fill(false));
  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({length: 10}, () => new Animated.Value(1)),
  ).current;

  const pulseAnims = useRef<Animated.Value[]>(
    Array.from({length: 10}, () => new Animated.Value(1)),
  ).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const prev = prevRevealedRef.current;
    for (let i = 0; i < 10; i++) {
      if (slots[i].isRevealed && !prev[i]) {
        scaleAnims[i].setValue(0.5);
        Animated.spring(scaleAnims[i], {
          toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
        }).start();
      }
    }
    prevRevealedRef.current = slots.map(s => s.isRevealed);
  }, [slots, scaleAnims]);

  useEffect(() => {
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stop();
      pulseAnimRef.current = null;
    }

    if (chainActive && drawnTile) {
      const validAnims: Animated.CompositeAnimation[] = [];
      for (let i = 0; i < 10; i++) {
        if (canPlaceHere(slots[i], drawnTile)) {
          validAnims.push(
            Animated.loop(
              Animated.sequence([
                Animated.timing(pulseAnims[i], {toValue: 1.06, duration: 500, useNativeDriver: true}),
                Animated.timing(pulseAnims[i], {toValue: 1, duration: 500, useNativeDriver: true}),
              ]),
            ),
          );
        } else {
          pulseAnims[i].setValue(1);
        }
      }
      if (validAnims.length > 0) {
        const anim = Animated.parallel(validAnims);
        pulseAnimRef.current = anim;
        anim.start();
      }
    } else {
      for (let i = 0; i < 10; i++) pulseAnims[i].setValue(1);
    }
    return () => { pulseAnimRef.current?.stop(); };
  }, [chainActive, drawnTile, slots, pulseAnims]);

  const renderSlot = (slot: GridSlot, index: number) => {
    const isValid = chainActive && canPlaceHere(slot, drawnTile);
    const tileImg = slot.tile ? TRASH_TILE_IMAGES[slot.tile.number] : undefined;

    return (
      <Animated.View
        key={slot.position}
        style={{
          transform: [{scale: Animated.multiply(scaleAnims[index], pulseAnims[index])}],
        }}>
        <TouchableOpacity
          style={[
            styles.slot,
            {width: slotW, height: slotH},
            slot.isRevealed && styles.slotRevealed,
            isValid && styles.slotValid,
            hintSlot === slot.position && styles.slotHint,
          ]}
          onPress={() => onSlotPress(slot.position)}
          disabled={!isValid}
          activeOpacity={0.7}>
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
            <Text style={[styles.ghostNumber, isValid && styles.ghostNumberValid]}>
              {slot.position}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, {paddingHorizontal: padH}]}>
      <View style={styles.rowLabels}>
        <Text style={styles.rowLabel}>1 - 5</Text>
      </View>
      <View style={[styles.row, {gap}]}>
        {slots.slice(0, GRID_COLS).map((slot, i) => renderSlot(slot, i))}
      </View>
      <View style={[styles.rowSeparator]} />
      <View style={styles.rowLabels}>
        <Text style={styles.rowLabel}>6 - 10</Text>
      </View>
      <View style={[styles.row, {gap}]}>
        {slots.slice(GRID_COLS, GRID_COLS * GRID_ROWS).map((slot, i) => renderSlot(slot, i + GRID_COLS))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  rowLabels: {
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6B9C93',
    letterSpacing: 2,
  },
  rowSeparator: {
    height: 1,
    backgroundColor: 'rgba(107, 156, 147, 0.15)',
    marginHorizontal: 12,
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  slot: {
    borderRadius: 10,
    backgroundColor: '#34656D',
    borderWidth: 2,
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
    borderWidth: 2.5,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  revealedNumber: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  ghostNumber: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(138, 171, 165, 0.3)',
  },
  ghostNumberValid: {
    color: 'rgba(250, 234, 177, 0.7)',
  },
  slotHint: {
    borderColor: '#FAEAB1',
    borderWidth: 3,
    backgroundColor: 'rgba(250, 234, 177, 0.15)',
  },
});
