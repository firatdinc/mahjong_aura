import React, {useMemo, useRef, useEffect} from 'react';
import {StyleSheet, View, TouchableOpacity, Dimensions, Animated} from 'react-native';
import {TileMatchTile} from '../../types/tileMatch';
import {TileComponent} from '../shared/TileComponent';
import {Tile, Suit} from '../../types';
import {useSettings} from '../../store/useSettings';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const isSmall = SCREEN_HEIGHT < 700;

interface TileBoardProps {
  board: TileMatchTile[];
  onTapTile: (tileId: string) => void;
  hintTileId?: string | null;
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

export const TileBoard: React.FC<TileBoardProps> = React.memo(({board, onTapTile, hintTileId}) => {
  const {tileScale} = useSettings();
  const activeTiles = board.filter(t => !t.isInBar && !t.isMatched);

  const {tileWidth, tileHeight, offsetX, offsetY, spacingX, spacingY} = useMemo(() => {
    if (activeTiles.length === 0) {
      return {tileWidth: 44, tileHeight: 62, offsetX: 0, offsetY: 0, spacingX: 1, spacingY: 1};
    }
    const maxCol = Math.max(...activeTiles.map(t => t.col)) + 1;
    const maxRow = Math.max(...activeTiles.map(t => t.row)) + 1;
    const maxLayer = Math.max(...activeTiles.map(t => t.layer));
    const boardWidth = SCREEN_WIDTH - 24;
    const layerOffset = maxLayer * 4;
    // Calculate tile width so tiles fit with no overlap
    const baseTileW = isSmall ? 40 : 48;
    const maxTileW = Math.round(baseTileW * tileScale);
    const tw = Math.min(maxTileW, Math.floor((boardWidth - layerOffset) / (maxCol + 0.2)));
    const th = Math.floor(tw * 1.4);
    const totalW = maxCol * tw + layerOffset;
    const oX = Math.max(0, (boardWidth - totalW) / 2);
    const gap = isSmall ? 1 : 2;
    return {tileWidth: tw, tileHeight: th, offsetX: oX, offsetY: 4, spacingX: tw + gap, spacingY: th + gap};
  }, [activeTiles.length, tileScale]);

  const containerHeight = useMemo(() => {
    if (activeTiles.length === 0) return 200;
    const maxRow = Math.max(...activeTiles.map(t => t.row));
    const maxLayer = Math.max(...activeTiles.map(t => t.layer));
    return (maxRow + 1) * spacingY + maxLayer * 4 + tileHeight + 16;
  }, [activeTiles.length, tileHeight, spacingY]);

  // Animated scales per tile ID for tap feedback + disappear
  const tileAnimsRef = useRef<Map<string, {scale: Animated.Value; opacity: Animated.Value}>>(new Map());

  // Ensure animated values exist for current tiles
  const getAnim = (id: string) => {
    if (!tileAnimsRef.current.has(id)) {
      tileAnimsRef.current.set(id, {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
      });
    }
    return tileAnimsRef.current.get(id)!;
  };

  // Detect removed tiles and animate them out
  const prevTileIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(activeTiles.map(t => t.id));
    const prevIds = prevTileIdsRef.current;

    // Tiles that were just removed (moved to bar or matched)
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        const anim = tileAnimsRef.current.get(id);
        if (anim) {
          // Already gone from render, clean up
          tileAnimsRef.current.delete(id);
        }
      }
    }

    // Tiles that just appeared (new tiles from shuffle, etc.)
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        const anim = getAnim(id);
        anim.scale.setValue(0.3);
        anim.opacity.setValue(0);
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
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

    prevTileIdsRef.current = currentIds;
  }, [activeTiles]);

  const handleTap = (tileId: string) => {
    onTapTile(tileId);
    const anim = getAnim(tileId);
    Animated.parallel([
      Animated.timing(anim.scale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(anim.opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, {height: containerHeight}]}>
      {activeTiles.map(tile => {
        const x = tile.col * spacingX + tile.layer * 4 + offsetX;
        const y = tile.row * spacingY + tile.layer * 4 + offsetY;
        const anim = getAnim(tile.id);

        return (
          <Animated.View
            key={tile.id}
            style={[
              styles.tileWrap,
              {
                left: x,
                top: y,
                zIndex: tile.layer * 100 + Math.floor(tile.row * 10),
                opacity: tile.isFree
                  ? anim.opacity
                  : Animated.multiply(anim.opacity, 0.5),
                transform: [{scale: anim.scale}],
              },
            ]}>
            <TouchableOpacity
              onPress={() => tile.isFree && handleTap(tile.id)}
              activeOpacity={0.7}
              disabled={!tile.isFree}>
              <TileComponent
                tile={toDisplayTile(tile)}
                size="medium"
                highlighted={tile.isFree}
              />
              {hintTileId === tile.id && (
                <View style={styles.hintGlow} />
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  tileWrap: {
    position: 'absolute',
  },
  hintGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FAEAB1',
    backgroundColor: 'rgba(250,234,177,0.25)',
  },
});
