import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import {WebView} from 'react-native-webview';
import {GameId} from '../constants/app';
import {GAMES} from '../constants/app';
import {GameCard} from '../components/shared/GameCard';
import {AnimatedPressable} from '../components/shared/AnimatedPressable';
import {StaggeredEntry} from '../components/shared/StaggeredEntry';
import {useLanguage} from '../i18n/useLanguage';
import {LANGUAGES, Language} from '../i18n/translations';

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
            <Text style={styles.modalTitle}>{t.language}</Text>

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

            <View style={styles.divider} />

            {/* Privacy Policy */}
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => {
                setSettingsVisible(false);
                setTimeout(() => setPrivacyVisible(true), 300);
              }}
              activeOpacity={0.7}>
              <Text style={styles.privacyButtonText}>🔒  {t.privacyPolicy}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Policy WebView Modal */}
      <Modal visible={privacyVisible} animationType="slide" onRequestClose={() => setPrivacyVisible(false)}>
        <SafeAreaView style={styles.privacyContainer}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyTitle}>{t.privacyPolicy}</Text>
            <TouchableOpacity
              style={styles.privacyCloseBtn}
              onPress={() => setPrivacyVisible(false)}
              activeOpacity={0.7}>
              <Text style={styles.privacyCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{uri: PRIVACY_URLS[language]}}
            style={styles.webview}
            startInLoadingState
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
                disabled={!isAvailable}
                disabledLabel={t.hubComingSoon}
                onPress={() => onSelectGame(game.id)}
              />
            </StaggeredEntry>
          );
        })}
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
  langButton: {
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
  langIcon: {
    fontSize: 22,
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
    fontWeight: '700',
    color: '#FAF8F1',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
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
    fontWeight: '500',
  },
  langLabelActive: {
    color: '#FAEAB1',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A5450',
    marginVertical: 12,
  },
  privacyButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  privacyButtonText: {
    color: '#8AABA5',
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FAF8F1',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#FAEAB1',
    letterSpacing: 8,
    marginTop: 4,
  },
  gameList: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
});
