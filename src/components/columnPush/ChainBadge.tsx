import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';

interface ChainBadgeProps {
  chainLength: number;
  isActive: boolean;
}

export const ChainBadge: React.FC<ChainBadgeProps> = ({chainLength, isActive}) => {
  const {t} = useLanguage();

  if (!isActive || chainLength <= 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.cpChain}</Text>
      <View style={styles.badge}>
        <Text style={styles.count}>{chainLength}</Text>
      </View>
      {chainLength >= 3 && (
        <Text style={styles.combo}>{t.cpCombo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
  },
  badge: {
    backgroundColor: 'rgba(250, 234, 177, 0.2)',
    borderRadius: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 234, 177, 0.4)',
  },
  count: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
  },
  combo: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: '#F39C12',
  },
});
