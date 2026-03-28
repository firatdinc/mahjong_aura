import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {ms, vs, modalWidth, contentMaxWidth, isSmallScreen} from '../utils/scaling';
import {GameId} from '../constants/app';
import {GAMES} from '../constants/app';
import {GameCard} from '../components/shared/GameCard';
import {AnimatedPressable} from '../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../components/shared/StaggeredEntry';
import {useLanguage} from '../i18n/useLanguage';
import {LANGUAGES, Language, translations} from '../i18n/translations';
import {isRewardedReady, showRewarded, loadRewarded} from '../utils/adHelpers';
import {canClaimDailyReward, claimDailyReward, getFreeHints} from '../utils/storage';

const logoImg = require('../../assets/mahjong_aura_logo.png');

const PRIVACY_BASE_URL = 'https://felabs.app/apps/mahjong-aura/privacy-policy';
const PRIVACY_URLS: Record<Language, string> = {
  en: `${PRIVACY_BASE_URL}/en.html`,
  tr: `${PRIVACY_BASE_URL}/tr.html`,
  zh: `${PRIVACY_BASE_URL}/zh.html`,
  es: `${PRIVACY_BASE_URL}/es.html`,
  fr: `${PRIVACY_BASE_URL}/fr.html`,
  de: `${PRIVACY_BASE_URL}/de.html`,
};

interface GameHubScreenProps {
  onSelectGame: (gameId: GameId) => void;
}

export const GameHubScreen: React.FC<GameHubScreenProps> = ({onSelectGame}) => {
  const {t, language, setLanguage} = useLanguage();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [privacyLang, setPrivacyLang] = useState<Language>(language);
  const [canClaim, setCanClaim] = useState(canClaimDailyReward());
  const [freeHints, setFreeHints] = useState(getFreeHints());

  useEffect(() => { loadRewarded(); }, []);

  const handleDailyReward = useCallback(() => {
    if (!canClaim || !isRewardedReady()) return;
    showRewarded(() => {
      claimDailyReward();
      setCanClaim(false);
      setFreeHints(getFreeHints());
    });
  }, [canClaim]);

  // Title entrance animation
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

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
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  const getTitle = (key: keyof typeof t): string => {
    return t[key];
  };

  return (
    <View style={styles.container}>
      {/* Language icon */}
      <AnimatedPressable
        style={styles.langButton}
        onPress={() => setSettingsVisible(true)}
        activeScale={0.85}>
        <Text style={styles.langIcon}>🌐</Text>
      </AnimatedPressable>

      {/* Language & Privacy Modal */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.language}</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSettingsVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              scrollEnabled={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.langOption,
                    item.code === language && styles.langOptionActive,
                  ]}
                  onPress={() => setLanguage(item.code)}>
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langLabel,
                      item.code === language && styles.langLabelActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Policy WebView Modal */}
      <Modal visible={privacyVisible} animationType="slide" onRequestClose={() => setPrivacyVisible(false)}>
        <SafeAreaView style={styles.privacyContainer}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyTitle}>{translations[privacyLang].privacyPolicy}</Text>
            <TouchableOpacity
              style={styles.privacyCloseBtn}
              onPress={() => setPrivacyVisible(false)}
              activeOpacity={0.7}>
              <Text style={styles.privacyCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{uri: PRIVACY_URLS[privacyLang]}}
            style={styles.webview}
            startInLoadingState
            onNavigationStateChange={(navState) => {
              const url = navState.url;
              const match = url.match(/\/([a-z]{2})\.html/);
              if (match) {
                const lang = match[1] as Language;
                if (lang in PRIVACY_URLS && lang !== privacyLang) {
                  setPrivacyLang(lang);
                }
              }
            }}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <Text style={styles.webviewLoadingText}>{t.loading}</Text>
              </View>
            )}
            renderError={() => (
              <View style={styles.webviewError}>
                <Text style={styles.webviewErrorIcon}>📡</Text>
                <Text style={styles.webviewErrorTitle}>{t.noConnection}</Text>
                <Text style={styles.webviewErrorText}>{t.noConnectionDesc}</Text>
                <TouchableOpacity
                  style={styles.webviewErrorBtn}
                  onPress={() => setPrivacyVisible(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.webviewErrorBtnText}>{t.close}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      <ScrollView
        style={{width: '100%'}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {opacity: titleOpacity, transform: [{scale: titleScale}]},
          ]}>
          <Animated.Image
            source={logoImg}
            style={[styles.logoImage, {transform: [{rotate: logoSpin}]}]}
          />
          <Text style={styles.title}>{t.mahjong}</Text>
          <Text style={styles.subtitle}>{t.aura}</Text>
        </Animated.View>

        {/* Game Cards */}
        <View style={styles.gameList}>
          {GAMES.map((game, index) => {
            const isAvailable = game.id === 'mahjong' || game.id === 'tileMatch' || game.id === 'trashOkey' || game.id === 'columnPush';
            return (
              <StaggeredEntry key={game.id} index={index} delay={80}>
                <GameCard
                  icon={game.icon}
                  title={getTitle(game.titleKey)}
                  description={getTitle(game.descriptionKey)}
                  badge={game.id === 'columnPush' ? t.cpTrending : undefined}
                  disabled={!isAvailable}
                  disabledLabel={t.hubComingSoon}
                  onPress={() => onSelectGame(game.id)}
                />
              </StaggeredEntry>
            );
          })}
        </View>

        {/* Daily Reward */}
        <TouchableOpacity
          style={[styles.dailyRewardBtn, !canClaim && styles.dailyRewardClaimed]}
          onPress={handleDailyReward}
          activeOpacity={canClaim ? 0.7 : 1}
          disabled={!canClaim}>
          <Text style={styles.dailyRewardIcon}>{canClaim ? '🎁' : '✅'}</Text>
          <View>
            <Text style={[styles.dailyRewardText, !canClaim && styles.dailyRewardTextClaimed]}>
              {canClaim ? t.dailyReward : t.dailyRewardClaimed}
            </Text>
            {freeHints > 0 && (
              <Text style={styles.dailyRewardHints}>{t.freeHints}: {freeHints}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Privacy Policy link */}
        <TouchableOpacity
          style={styles.privacyLink}
          onPress={() => {
            setPrivacyLang(language);
            setPrivacyVisible(true);
          }}
          activeOpacity={0.7}>
          <Text style={styles.privacyLinkText}>{t.privacyPolicy}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

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
    flexGrow: 1,
    justifyContent: isSmallScreen ? 'flex-start' : 'center',
    paddingTop: isSmallScreen ? 10 : vs(20),
    paddingBottom: 8,
  },
  langButton: {
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
  langIcon: {
    fontSize: ms(22),
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#B0CBC5',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    textAlign: 'center',
    letterSpacing: 2,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  langOptionActive: {
    backgroundColor: 'rgba(250, 234, 177, 0.15)',
  },
  langFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  langLabel: {
    fontSize: 16,
    color: '#D5E0DC',
    fontFamily: 'Nunito_500Medium',
  },
  langLabelActive: {
    color: '#FAEAB1',
    fontFamily: 'Nunito_700Bold',
  },
  privacyContainer: {
    flex: 1,
    backgroundColor: '#334443',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#34656D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A5450',
  },
  privacyTitle: {
    color: '#FAF8F1',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  privacyCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyCloseText: {
    color: '#B0CBC5',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  webview: {
    flex: 1,
    backgroundColor: '#334443',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#334443',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewLoadingText: {
    color: '#8AABA5',
    fontSize: 15,
  },
  webviewError: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#334443',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webviewErrorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  webviewErrorTitle: {
    color: '#FAF8F1',
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 8,
  },
  webviewErrorText: {
    color: '#8AABA5',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  webviewErrorBtn: {
    backgroundColor: 'rgba(250,234,177,0.15)',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FAEAB1',
  },
  webviewErrorBtnText: {
    color: '#FAEAB1',
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : vs(28),
  },
  logoImage: {
    width: ms(isSmallScreen ? 56 : 100),
    height: ms(isSmallScreen ? 56 : 100),
    borderRadius: ms(20),
    resizeMode: 'contain',
    marginBottom: isSmallScreen ? 4 : 12,
  },
  title: {
    fontSize: ms(isSmallScreen ? 26 : 42),
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: ms(isSmallScreen ? 13 : 20),
    fontFamily: 'Nunito_300Light',
    color: '#FAEAB1',
    letterSpacing: 8,
    marginTop: 2,
  },
  gameList: {
    width: '100%',
    maxWidth: contentMaxWidth(340),
    gap: isSmallScreen ? 8 : 12,
  },
  dailyRewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: vs(16),
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(250,234,177,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,234,177,0.35)',
    width: '100%',
    maxWidth: contentMaxWidth(340),
  },
  dailyRewardClaimed: {
    backgroundColor: 'rgba(250,248,241,0.05)',
    borderColor: 'rgba(250,248,241,0.1)',
  },
  dailyRewardIcon: {
    fontSize: 24,
  },
  dailyRewardText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FAEAB1',
  },
  dailyRewardTextClaimed: {
    color: '#6B9C93',
  },
  dailyRewardHints: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: '#8AABA5',
    marginTop: 2,
  },
  privacyLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  privacyLinkText: {
    fontSize: 12,
    color: '#6B9C93',
    fontFamily: 'Nunito_400Regular',
  },
});
