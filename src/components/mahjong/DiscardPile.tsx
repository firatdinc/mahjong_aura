import React, {useRef, useEffect, useCallback} from 'react';
import {StyleSheet, View, Text, Animated} from 'react-native';
import {Tile} from '../../types';
import {TileComponent} from '../shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';

interface DiscardPileProps {
  tiles: Tile[];
  lastDiscardedTile: Tile | null;
}

export const DiscardPile: React.FC<DiscardPileProps> = ({
  tiles,
  lastDiscardedTile,
}) => {
  const {t} = useLanguage();

  // Animation tracking for new tiles entering the discard pile
  const prevIdsRef = useRef<Set<string>>(new Set());
  const animsRef = useRef<Map<string, {scale: Animated.Value; opacity: Animated.Value}>>(new Map());

  const getAnim = useCallback((id: string) => {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      });
    }
    return animsRef.current.get(id)!;
  }, []);

  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = new Set(tiles.map(tile => tile.id));

    // Animate newly discarded tiles
    for (const tile of tiles) {
      if (!prevIds.has(tile.id)) {
        const anim = getAnim(tile.id);
        anim.scale.setValue(0.3);
        anim.opacity.setValue(0);
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }

    prevIdsRef.current = currentIds;
  }, [tiles, getAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.discards}</Text>
      <View style={styles.grid}>
        {tiles.map(tile => {
          const anim = getAnim(tile.id);
          return (
            <Animated.View
              key={tile.id}
              style={{
                transform: [{scale: anim.scale}],
                opacity: anim.opacity,
              }}>
              <TileComponent
                tile={tile}
                size="small"
                highlighted={tile.id === lastDiscardedTile?.id}
              />
            </Animated.View>
          );
        })}
        {tiles.length === 0 && (
          <Text style={styles.empty}>{t.noDiscardsYet}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#6B9C93',
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 240,
  },
  empty: {
    color: '#3D7A74',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
