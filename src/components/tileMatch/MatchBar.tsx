import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Animated} from 'react-native';
import {TileMatchTile} from '../../types/tileMatch';
import {TileComponent} from '../shared/TileComponent';
import {Tile, Suit} from '../../types';
import {BAR_SIZE} from '../../constants/tileMatch/levels';

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
        <View key={tile?.id ?? `empty-${i}`} style={styles.slot}>
          {tile ? (
            <Animated.View
              style={{
                transform: [
                  {translateY: getAnim(tile.id).translateY},
                  {scale: getAnim(tile.id).scale},
                ],
              }}>
              <TileComponent tile={toDisplayTile(tile)} size="large" />
            </Animated.View>
          ) : (
            <View style={styles.emptySlot} />
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
    width: 46,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlot: {
    width: 44,
    height: 62,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D7A74',
    borderStyle: 'dashed',
  },
});
