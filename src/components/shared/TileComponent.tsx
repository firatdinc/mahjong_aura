import React, {useRef} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Animated,
} from 'react-native';
import {Tile} from '../../types';
import {getTileImage} from '../../constants/gameAssets';

interface TileComponentProps {
  tile: Tile;
  onPress?: (tile: Tile) => void;
  size?: 'small' | 'medium' | 'large';
  customSize?: {width: number; height: number; fontSize: number; labelSize: number};
  faceDown?: boolean;
  highlighted?: boolean;
}

const SIZE_MAP = {
  small: {width: 28, height: 38, fontSize: 10, labelSize: 7},
  medium: {width: 36, height: 50, fontSize: 14, labelSize: 9},
  large: {width: 44, height: 62, fontSize: 18, labelSize: 10},
};

export const TileComponent: React.FC<TileComponentProps> = ({
  tile,
  onPress,
  size = 'medium',
  customSize,
  faceDown = false,
  highlighted = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const dims = customSize ?? SIZE_MAP[size];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress?.(tile);
  };

  if (faceDown) {
    return (
      <View
        style={[
          styles.tile,
          styles.faceDown,
          {width: dims.width, height: dims.height},
        ]}
      />
    );
  }

  const imageSource = getTileImage(tile.suit, tile.value);
  const imgSize = Math.min(dims.width - 4, dims.height - 4);

  return (
    <Animated.View style={[{transform: [{scale}]}]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={!onPress}
        style={[
          styles.tile,
          styles.faceUp,
          {width: dims.width, height: dims.height},
          highlighted && styles.highlighted,
        ]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={{width: imgSize, height: imgSize}}
            resizeMode="contain"
          />
        ) : (
          <View style={{width: imgSize, height: imgSize, backgroundColor: '#DDD', borderRadius: 4}} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: 4,
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceUp: {
    backgroundColor: '#FAF8F1',
    borderWidth: 1,
    borderColor: '#D5C89A',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  faceDown: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
  },
  highlighted: {
    borderColor: '#FAEAB1',
    borderWidth: 2,
    shadowColor: '#FAEAB1',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
