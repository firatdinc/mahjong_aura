import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';

interface LevelHeaderProps {
  levelNumber: number;
  timeRemaining: number;
  stars: number;
  onPause: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LevelHeader: React.FC<LevelHeaderProps> = ({
  levelNumber,
  timeRemaining,
  stars,
  onPause,
}) => {
  const {t} = useLanguage();
  const isLow = timeRemaining <= 30;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pauseBtn} onPress={onPause} activeOpacity={0.7}>
        <Text style={styles.pauseIcon}>⏸</Text>
      </TouchableOpacity>

      <View style={styles.levelInfo}>
        <Text style={styles.levelText}>
          {t.tmLevel} {levelNumber}
        </Text>
      </View>

      <Text style={[styles.timer, isLow && styles.timerLow]}>
        {formatTime(timeRemaining)}
      </Text>

      <View style={styles.starsContainer}>
        {[1, 2, 3].map(i => (
          <Text key={i} style={[styles.star, i <= stars && styles.starActive]}>
            ★
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#34656D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A5450',
  },
  pauseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(250,248,241,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIcon: {
    fontSize: 16,
  },
  levelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  levelText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
  },
  timer: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
    marginRight: 12,
  },
  timerLow: {
    color: '#EF5350',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 18,
    color: '#3D7A74',
  },
  starActive: {
    color: '#FAEAB1',
  },
});
