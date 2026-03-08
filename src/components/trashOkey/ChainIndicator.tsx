import React from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';
import {OkeyTile} from '../../types/trashOkey';
import {useLanguage} from '../../i18n/useLanguage';
import {OKEY_TILE_IMAGES} from '../../constants/gameAssets';

interface ChainIndicatorProps {
  chainActive: boolean;
  chainLength: number;
  currentChainTile: OkeyTile | null;
}

const OKEY_COLOR_MAP: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  yellow: '#F1C40F',
  black: '#2C3E50',
};

export const ChainIndicator: React.FC<ChainIndicatorProps> = ({
  chainActive,
  chainLength,
  currentChainTile,
}) => {
  const {t} = useLanguage();

  if (!chainActive || !currentChainTile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tilePreview}>
        {currentChainTile.isFalseJoker ? (
          <Text style={[styles.tileNumber, {color: OKEY_COLOR_MAP[currentChainTile.color] ?? '#334443'}]}>
            J
          </Text>
        ) : (
          <Image
            source={OKEY_TILE_IMAGES[currentChainTile.number]}
            style={styles.tileImage}
            resizeMode="contain"
          />
        )}
        <View style={[styles.colorDot, {backgroundColor: OKEY_COLOR_MAP[currentChainTile.color] ?? '#334443'}]} />
      </View>
      {chainLength > 0 && (
        <View style={styles.chainBadge}>
          <Text style={styles.chainText}>
            {t.toChain}: {chainLength}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  tilePreview: {
    width: 52,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#FAF8F1',
    borderWidth: 2,
    borderColor: '#FAEAB1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  tileImage: {
    width: 34,
    height: 34,
  },
  tileNumber: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  chainBadge: {
    backgroundColor: 'rgba(250, 234, 177, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(250, 234, 177, 0.3)',
  },
  chainText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
  },
});
