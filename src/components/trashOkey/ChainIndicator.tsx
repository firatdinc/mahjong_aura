import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {OkeyTile} from '../../types/trashOkey';
import {useLanguage} from '../../i18n/useLanguage';

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
        <Text
          style={[
            styles.tileNumber,
            {color: OKEY_COLOR_MAP[currentChainTile.color] ?? '#334443'},
          ]}>
          {currentChainTile.isFalseJoker ? 'J' : currentChainTile.number}
        </Text>
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
    width: 36,
    height: 44,
    borderRadius: 6,
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
  tileNumber: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#FAEAB1',
  },
});
