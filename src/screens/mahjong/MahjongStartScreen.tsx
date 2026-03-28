import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import {Difficulty} from '../../types';
import {loadStats, loadGameState, PlayerStats} from '../../utils/storage';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {AnimatedPressable} from '../../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../../components/shared/StaggeredEntry';
import {ms, vs, modalWidth, contentMaxWidth, isSmallScreen} from '../../utils/scaling';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_IDS} from '../../constants/adConfig';

const trophyImg = require('../../../assets/game/trophy.png');
const starImg = require('../../../assets/game/star.png');
const medalImg = require('../../../assets/game/medal.png');
const energyImg = require('../../../assets/game/energy.png');

interface MahjongStartScreenProps {
  onStart: (difficulty: Difficulty) => void;
  onResume: () => void;
  onTutorial: () => void;
  onBack: () => void;
}

export const MahjongStartScreen: React.FC<MahjongStartScreenProps> = ({onStart, onResume, onTutorial, onBack}) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const {t} = useLanguage();
  const {autoDraw, setAutoDraw, tileScale, setTileScale} = useSettings();

  // Title entrance animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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
  }, []);

  const DIFFICULTIES: {
    level: Difficulty;
    label: string;
    desc: string;
    icon: string;
  }[] = [
    {level: 'easy', label: t.easy, desc: t.easyDesc, icon: '🍃'},
    {level: 'medium', label: t.medium, desc: t.mediumDesc, icon: '⚡'},
    {level: 'hard', label: t.hard, desc: t.hardDesc, icon: '🔥'},
  ];

  useEffect(() => {
    setStats(loadStats());
    setHasSavedGame(loadGameState() !== null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Back button */}
      <AnimatedPressable
        style={styles.backButton}
        onPress={onBack}
        activeScale={0.85}>
        <Text style={styles.backIcon}>&#x2039;</Text>
      </AnimatedPressable>

      {/* Language gear icon */}
      <AnimatedPressable
        style={styles.gearButton}
        onPress={() => setLangModalVisible(true)}
        activeScale={0.85}>
        <Text style={styles.gearIcon}>{'\u2699'}</Text>
      </AnimatedPressable>

      <ScrollView
        style={{width: '100%'}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

      {/* Settings modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.settings}</Text>

            {/* Auto Draw toggle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setAutoDraw(!autoDraw)}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{t.autoDraw}</Text>
                <Text style={styles.settingDesc}>{t.autoDrawDesc}</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  autoDraw && styles.toggleActive,
                ]}>
                <View
                  style={[
                    styles.toggleThumb,
                    autoDraw && styles.toggleThumbActive,
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

      {/* Title with Crown */}
      <Animated.View
        style={[
          styles.titleContainer,
          {opacity: titleOpacity, transform: [{scale: titleScale}]},
        ]}>
        <Text style={styles.titleEmoji}>&#x1F004;</Text>
        <Text style={styles.title}>{t.mahjong}</Text>
        <Text style={styles.subtitle}>{t.aura}</Text>
      </Animated.View>

      {/* Stats display */}
      {stats && stats.gamesPlayed > 0 && (
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
              label={t.losses}
              value={stats.losses}
              color="#EF5350"
              image={energyImg}
            />
            <StatBadge
              label={t.draws}
              value={stats.draws}
              color="#FFA726"
              image={medalImg}
            />
          </View>
        </View>
      )}

      {/* Resume button */}
      {hasSavedGame && (
        <StaggeredEntry index={0} delay={100}>
          <AnimatedPressable
            style={styles.resumeButton}
            onPress={onResume}
            activeScale={0.96}>
            <View style={styles.resumeInner}>
              <Text style={styles.resumeIcon}>&#x25B6;</Text>
              <Text style={styles.resumeLabel}>{t.resumeGame}</Text>
            </View>
            <View style={styles.resumeShine} />
          </AnimatedPressable>
        </StaggeredEntry>
      )}

      <Text style={styles.prompt}>
        {(hasSavedGame ? t.orStartNew : t.selectDifficulty)}
      </Text>

      {/* Difficulty buttons */}
      <View style={styles.buttons}>
        {DIFFICULTIES.map(({level, label, desc, icon}, index) => (
          <StaggeredEntry key={level} index={index + 1} delay={80}>
            <AnimatedPressable
              style={styles.button}
              onPress={() => onStart(level)}
              activeScale={0.96}>
              <View style={styles.buttonIconWrap}>
                <Text style={styles.difficultyEmoji}>{icon}</Text>
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonLabel}>{label}</Text>
                <Text style={styles.buttonDesc}>{desc}</Text>
              </View>
              <Text style={styles.buttonChevron}>&#x203A;</Text>
            </AnimatedPressable>
          </StaggeredEntry>
        ))}
      </View>

      {/* How to Play button */}
      <StaggeredEntry index={4} delay={80}>
        <AnimatedPressable
          style={styles.tutorialButton}
          onPress={onTutorial}
          activeScale={0.95}>
          <Text style={styles.tutorialIcon}>&#x1F4D6;</Text>
          <Text style={styles.tutorialLabel}>{t.howToPlay}</Text>
        </AnimatedPressable>
      </StaggeredEntry>

      </ScrollView>

      {/* Banner Ad */}
      <View style={styles.bannerContainer}>
        <BannerAd
          key="mahjong-banner"
          unitId={AD_IDS.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{requestNonPersonalizedAdsOnly: false}}
          onAdFailedToLoad={() => {}}
        />
      </View>
    </View>
  );
};

const StatBadge: React.FC<{
  label: string;
  value: number;
  color?: string;
  image?: number;
}> = ({label, value, color = '#FAF8F1', image}) => (
  <View style={styles.statBadge}>
    {image ? (
      <Image source={image} style={styles.statIcon} />
    ) : null}
    <Text style={[styles.statValue, {color}]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334443',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 20 : 32,
    paddingTop: isSmallScreen ? 12 : 32,
    paddingBottom: isSmallScreen ? 8 : 32,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: vs(20),
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
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
    marginBottom: vs(24),
  },
  titleEmoji: {
    fontSize: ms(isSmallScreen ? 36 : 48),
    marginBottom: isSmallScreen ? 4 : 8,
  },
  title: {
    fontSize: ms(isSmallScreen ? 32 : 42),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: ms(isSmallScreen ? 16 : 20),
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
  resumeButton: {
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
  resumeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  resumeIcon: {
    fontSize: 14,
    color: '#334443',
  },
  resumeLabel: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
    letterSpacing: 1,
  },
  resumeShine: {
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
  tutorialIcon: {
    fontSize: 16,
  },
  tutorialLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
    letterSpacing: 1,
  },
  bannerContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
});
