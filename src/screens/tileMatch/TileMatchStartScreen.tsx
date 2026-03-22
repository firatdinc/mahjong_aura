import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Animated,
  Easing,
} from 'react-native';
import {useTileMatchStore} from '../../store/useTileMatchStore';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {AnimatedPressable} from '../../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../../components/shared/StaggeredEntry';
import {ms, modalWidth, contentMaxWidth} from '../../utils/scaling';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_IDS} from '../../constants/adConfig';

const trophyImg = require('../../../assets/game/trophy.png');
const starImg = require('../../../assets/game/star.png');
const medalImg = require('../../../assets/game/medal.png');

interface TileMatchStartScreenProps {
  onStartLevel: (level: number) => void;
  onBack: () => void;
  onTutorial: () => void;
}

export const TileMatchStartScreen: React.FC<TileMatchStartScreenProps> = ({
  onStartLevel,
  onBack,
  onTutorial,
}) => {
  const {progress, stats, loadProgress} = useTileMatchStore();
  const {t} = useLanguage();
  const {tmRelaxedMode, setTmRelaxedMode, tileScale, setTileScale} = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Title entrance animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadProgress();
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
  }, [loadProgress]);

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

            {/* Relaxed Mode toggle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setTmRelaxedMode(!tmRelaxedMode)}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t.tmRelaxedMode}</Text>
                <Text style={styles.settingDesc}>{t.tmRelaxedModeDesc}</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  tmRelaxedMode && styles.toggleActive,
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    tmRelaxedMode && styles.toggleThumbActive,
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
        <Text style={styles.titleEmoji}>&#x1F004;</Text>
        <Text style={styles.title}>{t.hubTileMatchTitle}</Text>
        <Text style={styles.subtitle}>{t.tmTapToMatch}</Text>
      </Animated.View>

      {/* Stats */}
      {stats.levelsCompleted > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statBadge}>
              <Image source={trophyImg} style={styles.statIcon} />
              <Text style={styles.statValue}>{stats.levelsCompleted}</Text>
              <Text style={styles.statLabel}>{t.tmLevelsCompleted}</Text>
            </View>
            <View style={styles.statBadge}>
              <Image source={starImg} style={styles.statIcon} />
              <Text style={[styles.statValue, {color: '#FAEAB1'}]}>
                {stats.totalStars}
              </Text>
              <Text style={styles.statLabel}>{t.tmStars}</Text>
            </View>
            <View style={styles.statBadge}>
              <Image source={medalImg} style={styles.statIcon} />
              <Text style={[styles.statValue, {color: '#4CAF50'}]}>
                {stats.bestCombo}
              </Text>
              <Text style={styles.statLabel}>{t.tmBestCombo}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Continue button */}
      <StaggeredEntry index={0} delay={100}>
        <AnimatedPressable
          style={styles.continueButton}
          onPress={() => onStartLevel(progress.currentLevel)}
          activeScale={0.96}>
          <View style={styles.continueInner}>
            <Text style={styles.continueIcon}>&#x25B6;</Text>
            <Text style={styles.continueText}>
              {t.tmLevel} {progress.currentLevel}
            </Text>
          </View>
          <View style={styles.continueShine} />
        </AnimatedPressable>
      </StaggeredEntry>

      <Text style={styles.prompt}>{t.tmSelectLevel}</Text>

      {/* Level grid */}
      <ScrollView
        style={styles.levelScroll}
        contentContainerStyle={styles.levelGrid}
        showsVerticalScrollIndicator={false}>
        {Array.from(
          {length: Math.max(progress.highestLevel, 10)},
          (_, i) => i + 1,
        ).map(lvl => {
          const stars = progress.starsByLevel[lvl] ?? 0;
          const unlocked = lvl <= progress.currentLevel;
          return (
            <StaggeredEntry key={lvl} index={lvl - 1} delay={30}>
              <AnimatedPressable
                style={[styles.levelBtn, !unlocked && styles.levelBtnLocked]}
                onPress={() => onStartLevel(lvl)}
                disabled={!unlocked}
                activeScale={0.9}>
                <Text
                  style={[styles.levelNum, !unlocked && styles.levelNumLocked]}>
                  {lvl}
                </Text>
                {unlocked && (
                  <View style={styles.levelStars}>
                    {[1, 2, 3].map(s => (
                      <Text
                        key={s}
                        style={[
                          styles.levelStar,
                          s <= stars && styles.levelStarActive,
                        ]}>
                        &#x2605;
                      </Text>
                    ))}
                  </View>
                )}
              </AnimatedPressable>
            </StaggeredEntry>
          );
        })}
      </ScrollView>

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
    fontSize: ms(28),
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
    marginBottom: 32,
  },
  titleEmoji: {
    fontSize: ms(64),
    marginBottom: 12,
  },
  title: {
    fontSize: ms(42),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_300Light',
    color: '#FAEAB1',
    letterSpacing: 4,
    marginTop: 4,
    textAlign: 'center',
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
    color: '#FAF8F1',
  },
  statLabel: {
    fontSize: 9,
    color: '#8AABA5',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#FAEAB1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 36,
    marginBottom: 20,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  continueInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueIcon: {
    fontSize: 14,
    color: '#334443',
  },
  continueText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
    letterSpacing: 1,
  },
  continueShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  prompt: {
    fontSize: 14,
    color: '#8AABA5',
    marginBottom: 20,
    letterSpacing: 2,
  },
  levelScroll: {
    width: '100%',
    maxWidth: contentMaxWidth(320),
    maxHeight: ms(220),
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  levelBtn: {
    width: ms(56),
    height: ms(64),
    borderRadius: ms(10),
    backgroundColor: '#34656D',
    borderWidth: 1,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  levelBtnLocked: {
    opacity: 0.35,
  },
  levelNum: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
  },
  levelNumLocked: {
    color: '#8AABA5',
  },
  levelStars: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  levelStar: {
    fontSize: 10,
    color: '#3D7A74',
  },
  levelStarActive: {
    color: '#FAEAB1',
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
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 4,
  },
});
