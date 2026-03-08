import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import {useTrashOkeyStore} from '../../store/useTrashOkeyStore';
import {TrashOkeyDifficulty} from '../../types/trashOkey';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {AnimatedPressable} from '../../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../../components/shared/StaggeredEntry';

const trophyImg = require('../../../assets/game/trophy.png');
const starImg = require('../../../assets/game/star.png');
const medalImg = require('../../../assets/game/medal.png');
const energyImg = require('../../../assets/game/energy.png');

interface TrashOkeyStartScreenProps {
  onStart: (difficulty: TrashOkeyDifficulty) => void;
  onBack: () => void;
  onTutorial: () => void;
}

export const TrashOkeyStartScreen: React.FC<TrashOkeyStartScreenProps> = ({
  onStart,
  onBack,
  onTutorial,
}) => {
  const {stats, loadStats} = useTrashOkeyStore();
  const {t} = useLanguage();
  const {toHighlightSlots, setToHighlightSlots, tileScale, setTileScale} = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Title entrance animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  const DIFFICULTIES: {
    key: TrashOkeyDifficulty;
    label: string;
    desc: string;
    icon: string;
  }[] = [
    {key: 'easy', label: t.easy, desc: t.toEasyDesc, icon: '🍃'},
    {key: 'medium', label: t.medium, desc: t.toMediumDesc, icon: '⚡'},
    {key: 'hard', label: t.hard, desc: t.toHardDesc, icon: '🔥'},
  ];

  useEffect(() => {
    loadStats();
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadStats]);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <AnimatedPressable
        style={styles.backButton}
        onPress={onBack}
        activeScale={0.85}>
        <Text style={styles.backIcon}>&#x2039;</Text>
      </AnimatedPressable>

      {/* Settings gear icon */}
      <AnimatedPressable
        style={styles.gearButton}
        onPress={() => setSettingsVisible(true)}
        activeScale={0.85}>
        <Text style={styles.gearIcon}>{'\u2699'}</Text>
      </AnimatedPressable>

      {/* Settings modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.settings}</Text>

            {/* Highlight Slots toggle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setToHighlightSlots(!toHighlightSlots)}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t.toHighlightSlots}</Text>
                <Text style={styles.settingDesc}>{t.toHighlightSlotsDesc}</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  toHighlightSlots && styles.toggleActive,
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    toHighlightSlots && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* Large Tiles toggle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setTileScale(tileScale === 1.0 ? 1.25 : 1.0)}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t.largeTiles}</Text>
                <Text style={styles.settingDesc}>{t.largeTilesDesc}</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  tileScale > 1 && styles.toggleActive,
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    tileScale > 1 && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {opacity: titleOpacity, transform: [{scale: titleScale}]},
        ]}>
        <View style={styles.gameIconWrap}>
          <Text style={styles.gameIcon}>&#x1F3B4;</Text>
        </View>
        <Text style={styles.title}>{t.hubTrashOkeyTitle}</Text>
      </Animated.View>

      {/* Stats display */}
      {stats.gamesPlayed > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <StatBadge
              label={t.played}
              value={stats.gamesPlayed}
              image={starImg}
            />
            <StatBadge
              label={t.wins}
              value={stats.wins}
              color="#4CAF50"
              image={trophyImg}
            />
            <StatBadge
              label={t.toLongestChain}
              value={stats.longestChain}
              color="#FFA726"
              image={medalImg}
            />
            <StatBadge
              label={t.winPercent}
              value={
                stats.gamesPlayed > 0
                  ? Math.round((stats.wins / stats.gamesPlayed) * 100)
                  : 0
              }
              color="#64B5F6"
              suffix="%"
              image={energyImg}
            />
          </View>
        </View>
      )}

      <Text style={styles.prompt}>{t.selectDifficulty}</Text>

      {/* Difficulty buttons */}
      <View style={styles.buttons}>
        {DIFFICULTIES.map(({key, label, desc, icon}, index) => {
          const diffStats = stats.byDifficulty[key];
          return (
            <StaggeredEntry key={key} index={index} delay={80}>
              <AnimatedPressable
                style={styles.button}
                onPress={() => onStart(key)}
                activeScale={0.96}>
                <View style={styles.buttonIconWrap}>
                  <Text style={styles.difficultyEmoji}>{icon}</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>{label}</Text>
                  <Text style={styles.buttonDesc}>
                    {desc}
                    {diffStats.played > 0
                      ? `  •  ${diffStats.wins}/${diffStats.played}`
                      : ''}
                  </Text>
                </View>
                <Text style={styles.buttonChevron}>&#x203A;</Text>
              </AnimatedPressable>
            </StaggeredEntry>
          );
        })}
      </View>

      <StaggeredEntry index={4} delay={80}>
        <AnimatedPressable
          style={styles.tutorialButton}
          onPress={onTutorial}
          activeScale={0.95}>
          <Text style={styles.tutorialIcon}>&#x1F4D6;</Text>
          <Text style={styles.tutorialLabel}>{t.howToPlay}</Text>
        </AnimatedPressable>
      </StaggeredEntry>
    </View>
  );
};

const StatBadge: React.FC<{
  label: string;
  value: number;
  color?: string;
  image?: number;
  suffix?: string;
}> = ({label, value, color = '#FAF8F1', image, suffix}) => (
  <View style={styles.statBadge}>
    {image ? <Image source={image} style={styles.statIcon} /> : null}
    <Text style={[styles.statValue, {color}]}>
      {value}
      {suffix ?? ''}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334443',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 28,
    color: '#B0CBC5',
    marginTop: -2,
  },
  gearButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gearIcon: {
    fontSize: 22,
    color: '#B0CBC5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#34656D',
    borderRadius: 16,
    padding: 24,
    width: 260,
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#FAF8F1',
    fontFamily: 'Nunito_600SemiBold',
  },
  settingDesc: {
    fontSize: 11,
    color: '#8AABA5',
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3D7A74',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FAEAB1',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8AABA5',
  },
  toggleThumbActive: {
    backgroundColor: '#334443',
    alignSelf: 'flex-end',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  gameIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Nunito_300Light',
    color: '#FAEAB1',
    letterSpacing: 8,
    marginTop: 4,
  },
  statsContainer: {
    marginBottom: 24,
    backgroundColor: '#34656D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statBadge: {
    alignItems: 'center',
  },
  statIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
  statLabel: {
    fontSize: 9,
    color: '#8AABA5',
    marginTop: 2,
  },
  prompt: {
    fontSize: 14,
    color: '#8AABA5',
    marginBottom: 20,
    letterSpacing: 2,
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  button: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(250,248,241,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  difficultyEmoji: {
    fontSize: 22,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
  },
  buttonDesc: {
    fontSize: 12,
    color: '#8AABA5',
    marginTop: 3,
  },
  buttonChevron: {
    fontSize: 24,
    color: '#6B9C93',
    fontFamily: 'Nunito_300Light',
    marginLeft: 8,
  },
  tutorialButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(250,234,177,0.4)',
    backgroundColor: 'rgba(250,234,177,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tutorialIcon: {fontSize: 16},
  tutorialLabel: {fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#FAEAB1', letterSpacing: 1},
});
