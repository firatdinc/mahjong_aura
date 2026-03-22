import React, {useRef} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Image,
  Animated,
} from 'react-native';
import {Tile} from '../../types';
import {getTileImage} from '../../constants/gameAssets';
import {useSettings} from '../../store/useSettings';
import {
  SUIT_COLORS,
  SUIT_BG_COLORS,
  SUIT_BORDER_COLORS,
  SUIT_ICONS,
  HONOR_DISPLAY,
} from '../../constants/mahjong/tileDisplay';
import {NUMBERED_SUITS} from '../../constants/mahjong/tiles';

interface TileComponentProps {
  tile: Tile;
  onPress?: (tile: Tile) => void;
  size?: 'small' | 'medium' | 'large';
  customSize?: {width: number; height: number; fontSize: number; labelSize: number};
  faceDown?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
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
  dimmed = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const {tileScale} = useSettings();
  const baseSize = customSize ?? SIZE_MAP[size];
  const dims = customSize
    ? baseSize
    : {
        width: Math.round(baseSize.width * tileScale),
        height: Math.round(baseSize.height * tileScale),
        fontSize: Math.round(baseSize.fontSize * tileScale),
        labelSize: Math.round(baseSize.labelSize * tileScale),
      };

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
  const suitColor = SUIT_COLORS[tile.suit] ?? '#666';
  const bgColor = SUIT_BG_COLORS[tile.suit] ?? '#FAF8F1';
  const borderColor = SUIT_BORDER_COLORS[tile.suit] ?? '#D5C89A';
  const suitIcon = SUIT_ICONS[tile.suit] ?? '';
  const isNumbered = NUMBERED_SUITS.includes(tile.suit as any);
  const valueLabel = isNumbered
    ? tile.value
    : (HONOR_DISPLAY[tile.value] ?? tile.value[0]?.toUpperCase());

  // Scaled sizes
  const valueFontSize = Math.max(Math.round(dims.width * 0.38), 10);
  const iconFontSize = Math.max(Math.round(dims.width * 0.22), 6);
  const imgSize = Math.round(Math.min(dims.width, dims.height) * 0.45);

  return (
    <Animated.View style={[{transform: [{scale}]}, dimmed && {opacity: 0.4}]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={!onPress}
        style={[
          styles.tile,
          styles.faceUp,
          {
            width: dims.width,
            height: dims.height,
            backgroundColor: bgColor,
            borderColor: highlighted ? '#FAEAB1' : borderColor,
            borderWidth: highlighted ? 2 : 1.5,
          },
          highlighted && styles.highlighted,
        ]}>
        {/* Top: suit icon + value number */}
        <View style={styles.topRow}>
          <Text style={[styles.suitIconText, {fontSize: iconFontSize, color: suitColor}]}>
            {suitIcon}
          </Text>
          <Text style={[styles.valueText, {fontSize: valueFontSize, color: suitColor}]}>
            {valueLabel}
          </Text>
        </View>

        {/* Center: tile image (smaller, as visual reference) */}
        {imageSource ? (
          <Image
            source={imageSource}
            style={{width: imgSize, height: imgSize}}
            resizeMode="contain"
          />
        ) : (
          <View style={{width: imgSize, height: imgSize, backgroundColor: '#DDD', borderRadius: 4}} />
        )}

        {/* Bottom: colored suit bar */}
        <View style={[styles.suitBar, {backgroundColor: suitColor}]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: 5,
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceUp: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
  faceDown: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
  },
  highlighted: {
    shadowColor: '#FAEAB1',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 2,
  },
  suitIconText: {
    fontWeight: '700',
    includeFontPadding: false,
  },
  valueText: {
    fontFamily: 'Nunito_800ExtraBold',
    includeFontPadding: false,
  },
  suitBar: {
    width: '100%',
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
