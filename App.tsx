import React, {useState, useCallback, useEffect, useRef} from 'react';
import {StatusBar, StyleSheet, ActivityIndicator, View, Animated, Easing, Modal, Text, TouchableOpacity, Linking} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import mobileAds, {AdsConsent} from 'react-native-google-mobile-ads';
import {GameId} from './src/constants/app';
import {GameHubScreen} from './src/screens/GameHubScreen';
import {MahjongRouter} from './src/screens/mahjong/MahjongRouter';
import {TileMatchRouter} from './src/screens/tileMatch/TileMatchRouter';
import {TrashOkeyRouter} from './src/screens/trashOkey/TrashOkeyRouter';
import {ColumnPushRouter} from './src/screens/columnPush/ColumnPushRouter';
import {initStorage} from './src/utils/storage';
import {initLanguage, useLanguage} from './src/i18n/useLanguage';
import {initSettings} from './src/store/useSettings';
import {loadInterstitial, loadRewarded} from './src/utils/adHelpers';
import {checkForUpdate, UpdateStatus, openStore} from './src/utils/versionCheck';

type Screen =
  | {type: 'hub'}
  | {type: 'mahjong'}
  | {type: 'tileMatch'}
  | {type: 'trashOkey'}
  | {type: 'columnPush'};

export default function App() {
  const [ready, setReady] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({type: 'upToDate'});
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    async function init() {
      await Promise.all([
        initStorage(),
        initLanguage(),
        initSettings(),
        Font.loadAsync({
          Nunito_300Light,
          Nunito_400Regular,
          Nunito_500Medium,
          Nunito_600SemiBold,
          Nunito_700Bold,
          Nunito_800ExtraBold,
        }),
      ]);
      // GDPR consent — shows form in EEA/UK, silent elsewhere
      try {
        await AdsConsent.gatherConsent();
      } catch {}
      // Initialize Mobile Ads SDK after consent
      try {
        await mobileAds().initialize();
        loadInterstitial();
        loadRewarded();
      } catch {}
      // Check for updates
      try {
        const status = await checkForUpdate();
        setUpdateStatus(status);
      } catch {}
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FAEAB1" />
      </View>
    );
  }

  const t = useLanguage(s => s.t);

  const showUpdateModal =
    (updateStatus.type === 'forceUpdate') ||
    (updateStatus.type === 'updateAvailable' && !updateDismissed);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#334443" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <AppContent />
        </SafeAreaView>

        {/* Update Modal */}
        <Modal visible={showUpdateModal} transparent animationType="fade">
          <View style={styles.updateOverlay}>
            <View style={styles.updateCard}>
              <Text style={styles.updateIcon}>
                {updateStatus.type === 'forceUpdate' ? '🔒' : '🎉'}
              </Text>
              <Text style={styles.updateTitle}>
                {updateStatus.type === 'forceUpdate'
                  ? t.updateRequired
                  : t.updateAvailable}
              </Text>
              <Text style={styles.updateMessage}>
                {updateStatus.type === 'forceUpdate'
                  ? t.updateRequiredMsg
                  : t.updateAvailableMsg}
              </Text>
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() => {
                  if (updateStatus.type !== 'upToDate') openStore(updateStatus.storeUrl);
                }}
                activeOpacity={0.8}>
                <Text style={styles.updateBtnText}>{t.updateNow}</Text>
              </TouchableOpacity>
              {updateStatus.type === 'updateAvailable' && (
                <TouchableOpacity
                  style={styles.updateLaterBtn}
                  onPress={() => setUpdateDismissed(true)}
                  activeOpacity={0.8}>
                  <Text style={styles.updateLaterText}>{t.updateLater}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>({type: 'hub'});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback(
    (nextScreen: Screen, direction: 'forward' | 'back') => {
      const slideOut = direction === 'forward' ? -30 : 30;
      const slideIn = direction === 'forward' ? 30 : -30;

      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: slideOut,
          duration: 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setScreen(nextScreen);
        slideAnim.setValue(slideIn);
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim],
  );

  const goToHub = useCallback(
    () => animateTransition({type: 'hub'}, 'back'),
    [animateTransition],
  );

  const handleSelectGame = useCallback(
    (gameId: GameId) => animateTransition({type: gameId}, 'forward'),
    [animateTransition],
  );

  const renderScreen = () => {
    switch (screen.type) {
      case 'mahjong':
        return <MahjongRouter onBack={goToHub} />;
      case 'tileMatch':
        return <TileMatchRouter onBack={goToHub} />;
      case 'trashOkey':
        return <TrashOkeyRouter onBack={goToHub} />;
      case 'columnPush':
        return <ColumnPushRouter onBack={goToHub} />;
      default:
        return <GameHubScreen onSelectGame={handleSelectGame} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.flex,
        {
          opacity: fadeAnim,
          transform: [{translateX: slideAnim}],
        },
      ]}>
      {renderScreen()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#334443',
  },
  loading: {
    flex: 1,
    backgroundColor: '#334443',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateCard: {
    backgroundColor: '#34656D',
    borderRadius: 20,
    padding: 28,
    width: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D7A74',
  },
  updateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  updateTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#FAF8F1',
    marginBottom: 8,
    textAlign: 'center',
  },
  updateMessage: {
    fontSize: 14,
    color: '#B0CBC5',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  updateBtn: {
    backgroundColor: '#FAEAB1',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#334443',
  },
  updateLaterBtn: {
    paddingVertical: 12,
    marginTop: 8,
  },
  updateLaterText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8AABA5',
  },
});
