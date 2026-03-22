import React, {useRef, useEffect, useMemo} from 'react';
import {StyleSheet, View, Animated, Dimensions} from 'react-native';
import {TileMatchTile} from '../../types/tileMatch';
import {TileComponent} from '../shared/TileComponent';
import {Tile, Suit} from '../../types';
import {BAR_SIZE} from '../../constants/tileMatch/levels';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface MatchBarProps {
  bar: TileMatchTile[];
}

function toDisplayTile(t: TileMatchTile): Tile {
  return {
    id: t.id,
    suit: t.suit as Suit,
    value: t.value,
    location: 'wall',
    isHidden: false,
  };
}

export const MatchBar: React.FC<MatchBarProps> = ({bar}) => {
  const {slotW, slotH, emptyW, emptyH, tileFontSize, tileLabelSize} = useMemo(() => {
    const barPadding = 6 * 2;
    const totalGap = (BAR_SIZE - 1) * 4;
    const availableW = SCREEN_WIDTH - 32 - barPadding - totalGap;
    const sw = Math.min(46, Math.floor(availableW / BAR_SIZE));
    const sh = Math.round(sw * 1.4);
    return {
      slotW: sw,
      slotH: sh,
      emptyW: sw - 2,
      emptyH: sh - 2,
      tileFontSize: Math.max(Math.round(sw * 0.38), 10),
      tileLabelSize: Math.max(Math.round(sw * 0.22), 6),
    };
  }, []);
  const slots = Array.from({length: BAR_SIZE}, (_, i) => bar[i] ?? null);

  // Track previous tile IDs to detect new arrivals
  const prevIdsRef = useRef<Set<string>>(new Set());
  const animsRef = useRef<Map<string, {scale: Animated.Value; translateY: Animated.Value}>>(new Map());

  const getAnim = (id: string) => {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, {
        scale: new Animated.Value(1),
        translateY: new Animated.Value(0),
      });
    }
    return animsRef.current.get(id)!;
  };

  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = new Set(bar.map(t => t.id));

    // Animate new tiles sliding in from above
    for (const t of bar) {
      if (!prevIds.has(t.id)) {
        const anim = getAnim(t.id);
        anim.translateY.setValue(-40);
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
  }, [bar]);

  return (
    <View style={styles.container}>
      {slots.map((tile, i) => (
        <View key={tile?.id ?? `empty-${i}`} style={[styles.slot, {width: slotW, height: slotH}]}>
          {tile ? (
            <Animated.View
              style={{
                transform: [
                  {translateY: getAnim(tile.id).translateY},
                  {scale: getAnim(tile.id).scale},
                ],
              }}>
              <TileComponent
                tile={toDisplayTile(tile)}
                customSize={{width: emptyW, height: emptyH, fontSize: tileFontSize, labelSize: tileLabelSize}}
              />
            </Animated.View>
          ) : (
            <View style={[styles.emptySlot, {width: emptyW, height: emptyH}]} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34656D',
    borderRadius: 12,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#3D7A74',
  },
  slot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D7A74',
    borderStyle: 'dashed',
  },
});
