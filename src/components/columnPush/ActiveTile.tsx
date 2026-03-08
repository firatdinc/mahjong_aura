import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, Animated} from 'react-native';
import {CPTile} from '../../types/columnPush';
import {getImageForTile} from '../../utils/columnPushEmoji';
import {useSettings} from '../../store/useSettings';

interface ActiveTileProps {
  tile: CPTile | null;
  isPlayerTurn: boolean;
}

const OWNER_COLORS = {
  player: '#27AE60',
  bot: '#E74C3C',
  neutral: '#8AABA5',
};

export const ActiveTile: React.FC<ActiveTileProps> = ({tile, isPlayerTurn}) => {
  const {tileScale} = useSettings();
  const tileW = Math.round(64 * tileScale);
  const tileH = Math.round(80 * tileScale);
  const imgSize = Math.round(44 * tileScale);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevTileId = useRef<string | null>(null);

  useEffect(() => {
    const currentId = tile?.id ?? null;
    if (currentId && currentId !== prevTileId.current) {
      scale.setValue(0.2);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevTileId.current = currentId;
  }, [tile, scale, opacity]);

  if (!tile) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptySlot, {width: tileW, height: tileH}]}>
          <Text style={styles.emptyText}>—</Text>
        </View>
      </View>
    );
  }

  const ownerColor = OWNER_COLORS[tile.owner];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.tile,
          {width: tileW, height: tileH},
          isPlayerTurn && styles.tileActive,
          {borderColor: ownerColor, transform: [{scale}], opacity},
        ]}>
        <Image
          source={getImageForTile(tile)}
          style={{width: imgSize, height: imgSize}}
          resizeMode="contain"
        />
        <View style={[styles.ownerDot, {backgroundColor: ownerColor}]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    borderRadius: 10,
    backgroundColor: '#FAF8F1',
    borderWidth: 2,
    borderColor: '#D5C89A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tileActive: {
    shadowColor: '#FAEAB1',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  ownerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptySlot: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3D7A74',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#3D7A74',
  },
});
