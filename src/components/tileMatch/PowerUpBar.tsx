import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {TileMatchPowerUp} from '../../types/tileMatch';
import {useLanguage} from '../../i18n/useLanguage';
import {Translations} from '../../i18n/translations';

interface PowerUpBarProps {
  powerUps: Record<TileMatchPowerUp, number>;
  onUsePowerUp: (type: TileMatchPowerUp) => void;
}

const POWER_UPS: {type: TileMatchPowerUp; icon: string; labelKey: keyof Translations}[] = [
  {type: 'undo', icon: '↩', labelKey: 'tmUndo'},
  {type: 'shuffle', icon: '🔄', labelKey: 'tmShuffle'},
  {type: 'remove', icon: '🗑', labelKey: 'tmRemove'},
];

export const PowerUpBar: React.FC<PowerUpBarProps> = ({powerUps, onUsePowerUp}) => {
  const {t} = useLanguage();

  return (
    <View style={styles.container}>
      {POWER_UPS.map(({type, icon, labelKey}) => {
        const count = powerUps[type];
        const disabled = count <= 0;
        return (
          <TouchableOpacity
            key={type}
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => onUsePowerUp(type)}
            disabled={disabled}
            activeOpacity={0.7}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.label, disabled && styles.labelDisabled]}>
              {t[labelKey]}
            </Text>
            <View style={[styles.badge, disabled && styles.badgeDisabled]}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34656D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#3D7A74',
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAF8F1',
  },
  labelDisabled: {
    color: '#8AABA5',
  },
  badge: {
    backgroundColor: '#FAEAB1',
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDisabled: {
    backgroundColor: '#3D7A74',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
});
