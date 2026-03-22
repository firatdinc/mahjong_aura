import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';

interface ChainIndicatorProps {
  chainActive: boolean;
  chainLength: number;
}

export const ChainIndicator: React.FC<ChainIndicatorProps> = ({
  chainActive,
  chainLength,
}) => {
  const {t} = useLanguage();

  if (!chainActive || chainLength === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.text}>
          {t.toChain}: {chainLength}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  badge: {
    backgroundColor: 'rgba(250, 234, 177, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(250, 234, 177, 0.3)',
  },
  text: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
  },
});
