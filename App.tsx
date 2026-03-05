import React, {useState, useCallback, useEffect, useRef} from 'react';
import {StatusBar, StyleSheet, ActivityIndicator, View, Animated, Easing} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {GameId} from './src/constants/app';
import {GameHubScreen} from './src/screens/GameHubScreen';
import {MahjongRouter} from './src/screens/mahjong/MahjongRouter';
import {TileMatchRouter} from './src/screens/tileMatch/TileMatchRouter';
import {TrashOkeyRouter} from './src/screens/trashOkey/TrashOkeyRouter';
import {ColumnPushRouter} from './src/screens/columnPush/ColumnPushRouter';
import {initStorage} from './src/utils/storage';
import {initLanguage} from './src/i18n/useLanguage';
import {initSettings} from './src/store/useSettings';

type Screen =
  | {type: 'hub'}
  | {type: 'mahjong'}
  | {type: 'tileMatch'}
  | {type: 'trashOkey'}
  | {type: 'columnPush'};

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([initStorage(), initLanguage(), initSettings()]).then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FAEAB1" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#334443" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <AppContent />
        </SafeAreaView>
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
});
