import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, Animated} from 'react-native';
import {OkeyTile} from '../../types/trashOkey';
import {OKEY_TILE_IMAGES} from '../../constants/gameAssets';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';

interface CenterTileProps {
  tile: OkeyTile | null;
  onPress: () => void;
  disabled: boolean;
}

const OKEY_COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  yellow: '#F1C40F',
  black: '#2C3E50',
};

export const CenterTile: React.FC<CenterTileProps> = ({tile, onPress, disabled}) => {
  const {t} = useLanguage();
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
    } else if (!currentId && prevTileId.current) {
      Animated.timing(scale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
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

  return (
    <View style={styles.container}>
      <Animated.View style={{transform: [{scale}], opacity}}>
        <TouchableOpacity
          style={[styles.tile, {width: tileW, height: tileH}, !disabled && styles.tileActive]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.7}>
          {tile.isFalseJoker ? (
            <Text style={[styles.tileNumber, {color: OKEY_COLOR_MAP[tile.color] ?? '#334443'}]}>
              {t.joker}
            </Text>
          ) : (
            <Image
              source={OKEY_TILE_IMAGES[tile.number]}
              style={{width: imgSize, height: imgSize}}
              resizeMode="contain"
            />
          )}
          <View style={[styles.colorDot, {backgroundColor: OKEY_COLOR_MAP[tile.color] ?? '#334443'}]} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
    borderColor: '#FAEAB1',
    shadowColor: '#FAEAB1',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  tileNumber: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
