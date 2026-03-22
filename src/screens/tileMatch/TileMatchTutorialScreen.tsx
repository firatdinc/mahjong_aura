import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';
import {TileComponent} from '../../components/shared/TileComponent';
import {Tile} from '../../types';

interface TileMatchTutorialScreenProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 6;

function makeDemoTile(suit: Tile['suit'], value: string, id?: string): Tile {
  return {
    id: id ?? `demo-${suit}-${value}`,
    suit,
    value,
    location: 'wall',
    isHidden: false,
  };
}

export const TileMatchTutorialScreen: React.FC<TileMatchTutorialScreenProps> = ({onComplete}) => {
  const [step, setStep] = useState(0);
  const {t} = useLanguage();

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onComplete} activeOpacity={0.7}>
        <Text style={styles.skipText}>{t.tutorialSkip} →</Text>
      </TouchableOpacity>

      <View style={styles.dotsRow}>
        {Array.from({length: TOTAL_STEPS}).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}>
        {step === 0 && <StepWelcome t={t} />}
        {step === 1 && <StepLayers t={t} />}
        {step === 2 && <StepBar t={t} />}
        {step === 3 && <StepTimer t={t} />}
        {step === 4 && <StepStars t={t} />}
        {step === 5 && <StepReady t={t} />}
      </ScrollView>

      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backText}>← {t.tutorialBack}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          onPress={goNext}
          style={[styles.nextButton, step === TOTAL_STEPS - 1 && styles.startButton]}
          activeOpacity={0.8}>
          <Text style={styles.nextText}>
            {step === TOTAL_STEPS - 1 ? t.tutorialStart : t.tutorialNext}
          </Text>
          <Text style={styles.nextArrow}>{step === TOTAL_STEPS - 1 ? '\u25B6' : '\u2192'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Step Components ──────────────────────────────────────

function StepWelcome({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\uD83E\uDDE9'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutWelcomeTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutWelcomeBody}</Text>
      <View style={styles.demoRow}>
        <TileComponent tile={makeDemoTile('bamboo', '3', 'w1')} size="medium" />
        <TileComponent tile={makeDemoTile('bamboo', '3', 'w2')} size="medium" />
        <TileComponent tile={makeDemoTile('bamboo', '3', 'w3')} size="medium" />
        <Text style={styles.demoArrow}>{'\u2192'}</Text>
        <Text style={styles.demoCheck}>{'\u2713'}</Text>
      </View>
    </View>
  );
}

function StepLayers({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\uD83D\uDCE6'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutLayersTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutLayersBody}</Text>
      <View style={styles.layerDemo}>
        <View style={styles.layerBack}>
          <TileComponent tile={makeDemoTile('dot', '5', 'l1')} size="medium" dimmed />
        </View>
        <View style={styles.layerFront}>
          <TileComponent tile={makeDemoTile('character', '7', 'l2')} size="medium" highlighted />
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#FAEAB1'}]} />
          <Text style={styles.legendText}>{t.tmTutLayersTitle.split('&')[1]?.trim() || 'Free'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: '#3D7A74'}]} />
          <Text style={styles.legendText}>Blocked</Text>
        </View>
      </View>
    </View>
  );
}

function StepBar({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\uD83D\uDCCA'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutBarTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutBarBody}</Text>
      <View style={styles.barDemo}>
        <TileComponent tile={makeDemoTile('wind', 'east', 'b1')} size="small" />
        <TileComponent tile={makeDemoTile('dragon', 'red', 'b2')} size="small" />
        <TileComponent tile={makeDemoTile('dragon', 'red', 'b3')} size="small" />
        <View style={styles.barEmptySlot} />
        <View style={styles.barEmptySlot} />
        <View style={styles.barEmptySlot} />
        <View style={styles.barEmptySlot} />
      </View>
      <Text style={styles.demoCaption}>7 / 7 = {'\u274C'}</Text>
    </View>
  );
}

function StepTimer({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\u23F1'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutTimerTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutTimerBody}</Text>
      <View style={styles.comboDemo}>
        <View style={styles.comboBadge}>
          <Text style={styles.comboBadgeText}>x1</Text>
        </View>
        <Text style={styles.demoArrow}>{'\u2192'}</Text>
        <View style={styles.comboBadge}>
          <Text style={styles.comboBadgeText}>x2</Text>
        </View>
        <Text style={styles.demoArrow}>{'\u2192'}</Text>
        <View style={[styles.comboBadge, styles.comboBadgeHigh]}>
          <Text style={[styles.comboBadgeText, styles.comboBadgeHighText]}>x3</Text>
        </View>
      </View>
    </View>
  );
}

function StepStars({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\u2B50'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutStarsTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutStarsBody}</Text>
      <View style={styles.starsDemo}>
        <View style={styles.starRow}>
          <Text style={styles.starActive}>{'\u2605\u2605\u2605'}</Text>
          <Text style={styles.starDesc}>{t.tmTutStarsTitle}</Text>
        </View>
      </View>
    </View>
  );
}

function StepReady({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>{'\uD83C\uDFAE'}</Text>
      <Text style={styles.stepTitle}>{t.tmTutReadyTitle}</Text>
      <Text style={styles.stepBody}>{t.tmTutReadyBody}</Text>
      <View style={styles.powerUpDemo}>
        <View style={styles.powerUpItem}>
          <Text style={styles.powerUpIcon}>{'\u21A9'}</Text>
          <Text style={styles.powerUpLabel}>{t.tmUndo}</Text>
        </View>
        <View style={styles.powerUpItem}>
          <Text style={styles.powerUpIcon}>{'\uD83D\uDD04'}</Text>
          <Text style={styles.powerUpLabel}>{t.tmShuffle}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#334443'},
  skipButton: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: 'rgba(250,248,241,0.06)', borderWidth: 1, borderColor: 'rgba(250,248,241,0.1)',
  },
  skipText: {color: '#8AABA5', fontSize: 13, fontFamily: 'Nunito_600SemiBold'},
  dotsRow: {flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 8, paddingBottom: 12},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A5450'},
  dotActive: {backgroundColor: '#FAEAB1', width: 24},
  content: {flex: 1},
  contentInner: {paddingHorizontal: 24, paddingBottom: 24},
  stepCenter: {paddingTop: 32, alignItems: 'center'},
  bigIcon: {fontSize: 56, marginBottom: 16},
  stepTitle: {color: '#FAEAB1', fontSize: 22, fontFamily: 'Nunito_700Bold', textAlign: 'center', marginBottom: 10},
  stepBody: {color: '#D5E0DC', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20, paddingHorizontal: 8},
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#2A5450',
  },
  backButton: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: 'rgba(250,248,241,0.06)', borderWidth: 1, borderColor: 'rgba(250,248,241,0.1)',
  },
  backText: {color: '#B0CBC5', fontSize: 15, fontFamily: 'Nunito_600SemiBold'},
  nextButton: {
    backgroundColor: '#FAEAB1', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#FAEAB1', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  startButton: {paddingHorizontal: 32},
  nextText: {color: '#334443', fontSize: 16, fontFamily: 'Nunito_700Bold'},
  nextArrow: {color: '#334443', fontSize: 14, fontFamily: 'Nunito_700Bold'},

  // Demo visuals
  demoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#34656D', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#3D7A74',
  },
  demoArrow: {color: '#FAEAB1', fontSize: 20, marginHorizontal: 4},
  demoCheck: {color: '#4CAF50', fontSize: 28, fontWeight: '700'},
  demoCaption: {color: '#8AABA5', fontSize: 13, marginTop: 8},
  layerDemo: {
    width: 100, height: 80, position: 'relative', marginBottom: 12,
  },
  layerBack: {position: 'absolute', left: 0, top: 0},
  layerFront: {position: 'absolute', left: 20, top: 12},
  legendRow: {flexDirection: 'row', gap: 20, marginTop: 8},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 6},
  legendDot: {width: 10, height: 10, borderRadius: 5},
  legendText: {color: '#8AABA5', fontSize: 12},
  barDemo: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#34656D', borderRadius: 10, padding: 8,
    borderWidth: 1, borderColor: '#3D7A74',
  },
  barEmptySlot: {
    width: 28, height: 38, borderRadius: 4,
    borderWidth: 1, borderColor: '#3D7A74', borderStyle: 'dashed',
  },
  comboDemo: {flexDirection: 'row', alignItems: 'center', gap: 10},
  comboBadge: {
    backgroundColor: '#34656D', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#3D7A74',
  },
  comboBadgeText: {color: '#D5E0DC', fontSize: 18, fontFamily: 'Nunito_700Bold'},
  comboBadgeHigh: {backgroundColor: '#FAEAB1', borderColor: '#FAEAB1'},
  comboBadgeHighText: {color: '#334443'},
  starsDemo: {marginTop: 4},
  starRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  starActive: {color: '#FAEAB1', fontSize: 28},
  starDesc: {color: '#D5E0DC', fontSize: 14},
  powerUpDemo: {flexDirection: 'row', gap: 16},
  powerUpItem: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#34656D', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#3D7A74',
  },
  powerUpIcon: {fontSize: 20},
  powerUpLabel: {color: '#FAF8F1', fontSize: 12, fontFamily: 'Nunito_600SemiBold'},
});
