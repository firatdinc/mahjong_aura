import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Easing,
} from 'react-native';
import {useColumnPushStore} from '../../store/useColumnPushStore';
import {CPDifficulty} from '../../types/columnPush';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {AnimatedPressable} from '../../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../../components/shared/StaggeredEntry';
import {ms, modalWidth, contentMaxWidth} from '../../utils/scaling';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_IDS} from '../../constants/adConfig';

const trophyImg = require('../../../assets/game/trophy.png');
const medalImg = require('../../../assets/game/medal.png');
const energyImg = require('../../../assets/game/energy.png');

interface ColumnPushStartScreenProps {
  onStart: (difficulty: CPDifficulty) => void;
  onBack: () => void;
  onTutorial: () => void;
}

import {Translations} from '../../i18n/translations';

const DIFFICULTIES: {key: CPDifficulty; labelKey: keyof Translations; descKey: keyof Translations; icon: string}[] = [
  {key: 'easy', labelKey: 'easy', descKey: 'cpEasyDesc', icon: '🍃'},
  {key: 'medium', labelKey: 'medium', descKey: 'cpMediumDesc', icon: '⚡'},
  {key: 'hard', labelKey: 'hard', descKey: 'cpHardDesc', icon: '🔥'},
];

export const ColumnPushStartScreen: React.FC<ColumnPushStartScreenProps> = ({
  onStart,
  onBack,
  onTutorial,
}) => {
  const {stats, loadStats} = useColumnPushStore();
  const {t} = useLanguage();
  const {cpShowPreview, setCpShowPreview, tileScale, setTileScale} = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Title entrance animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

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

            {/* Show Preview toggle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setCpShowPreview(!cpShowPreview)}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t.cpShowPreview}</Text>
                <Text style={styles.settingDesc}>{t.cpShowPreviewDesc}</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  cpShowPreview && styles.toggleActive,
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    cpShowPreview && styles.toggleThumbActive,
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
        <Text style={styles.titleEmoji}>&#x1F3D6;</Text>
        <Text style={styles.title}>{t.hubColumnPushTitle}</Text>
        <View style={styles.taglineRow}>
          <View style={styles.trendingBadge}>
            <Text style={styles.trendingText}>{t.cpTrending}</Text>
          </View>
          <Text style={styles.subtitle}>{t.cpTagline}</Text>
        </View>
      </Animated.View>

      {/* Stats */}
      {stats.gamesPlayed > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statBadge}>
              <Image source={trophyImg} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.wins}</Text>
              <Text style={styles.statLabel}>{t.cpGamesWon}</Text>
            </View>
            <View style={styles.statBadge}>
              <Image source={medalImg} style={styles.statIcon} />
              <Text style={[styles.statValue, {color: '#FFA726'}]}>
                {stats.longestChain}
              </Text>
              <Text style={styles.statLabel}>{t.cpLongestChain}</Text>
            </View>
            <View style={styles.statBadge}>
              <Image source={energyImg} style={styles.statIcon} />
              <Text style={[styles.statValue, {color: '#64B5F6'}]}>
                {stats.gamesPlayed > 0
                  ? Math.round((stats.wins / stats.gamesPlayed) * 100)
                  : 0}
                %
              </Text>
              <Text style={styles.statLabel}>{t.winPercent}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.prompt}>{t.selectDifficulty}</Text>

      {/* Difficulty buttons */}
      <View style={styles.buttons}>
        {DIFFICULTIES.map((d, index) => {
          const diffStats = stats.byDifficulty[d.key];
          return (
            <StaggeredEntry key={d.key} index={index} delay={80}>
              <AnimatedPressable
                style={styles.button}
                onPress={() => onStart(d.key)}
                activeScale={0.96}>
                <View style={styles.buttonIconWrap}>
                  <Text style={styles.difficultyEmoji}>{d.icon}</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonLabel}>
                    {t[d.labelKey]}
                  </Text>
                  <Text style={styles.buttonDesc}>
                    {t[d.descKey]}
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

      {/* Banner Ad */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={AD_IDS.BANNER}
          size={BannerAdSize.BANNER}
          requestOptions={{requestNonPersonalizedAdsOnly: true}}
        />
      </View>
    </View>
  );
};

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
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
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
    width: ms(44),
    height: ms(44),
    borderRadius: ms(14),
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
    padding: ms(24),
    width: modalWidth(260),
    borderWidth: 1,
    borderColor: '#2A5450',
  },
  modalTitle: {
    fontSize: ms(16),
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
    marginBottom: 16,
  },
  titleEmoji: {
    fontSize: ms(48),
    marginBottom: 8,
  },
  title: {
    fontSize: ms(32),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    letterSpacing: 4,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  trendingBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendingText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
    letterSpacing: 2,
  },
  statsContainer: {
    marginBottom: 12,
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
    justifyContent: 'center',
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
    color: '#FAF8F1',
  },
  statLabel: {
    fontSize: 9,
    color: '#8AABA5',
    marginTop: 2,
  },
  prompt: {
    fontSize: 14,
    color: '#8AABA5',
    marginBottom: 12,
    letterSpacing: 2,
  },
  buttons: {
    width: '100%',
    maxWidth: contentMaxWidth(320),
    gap: 10,
  },
  button: {
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    borderRadius: 14,
    paddingVertical: 12,
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
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
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
    textTransform: 'capitalize',
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
    marginTop: 16,
    marginBottom: 60,
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
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 4,
  },
});
