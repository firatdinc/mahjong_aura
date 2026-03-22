import React, {useState} from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity, ScrollView} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';
import {TRASH_TILE_IMAGES} from '../../constants/gameAssets';

interface TrashOkeyTutorialScreenProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

// Mini visual examples for each step
const StepVisual: React.FC<{step: number}> = ({step}) => {
  if (step === 0) {
    // Show 5 numbered slots with icons
    return (
      <View style={vis.row}>
        {[1, 2, 3, 4, 5].map(n => (
          <View key={n} style={vis.slot}>
            <Image source={TRASH_TILE_IMAGES[n]} style={vis.icon} resizeMode="contain" />
            <Text style={vis.num}>{n}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (step === 1) {
    // Show draw pile -> tile 5 -> slot 5 highlighted
    return (
      <View style={vis.flowRow}>
        <View style={vis.pile}>
          <Text style={vis.pileQ}>?</Text>
        </View>
        <Text style={vis.arrow}>→</Text>
        <View style={vis.drawnTile}>
          <Image source={TRASH_TILE_IMAGES[5]} style={vis.iconMd} resizeMode="contain" />
          <Text style={vis.drawnNum}>5</Text>
        </View>
        <Text style={vis.arrow}>→</Text>
        <View style={[vis.slot, vis.slotHighlight]}>
          <Text style={vis.numHighlight}>5</Text>
        </View>
      </View>
    );
  }
  if (step === 2) {
    // Chain illustration: 5 -> reveals 8 -> goes to slot 8
    return (
      <View style={vis.flowRow}>
        <View style={vis.miniSlot}>
          <Image source={TRASH_TILE_IMAGES[5]} style={vis.iconSm} resizeMode="contain" />
          <Text style={vis.miniNum}>5</Text>
        </View>
        <Text style={vis.arrow}>→</Text>
        <View style={vis.miniSlot}>
          <Image source={TRASH_TILE_IMAGES[8]} style={vis.iconSm} resizeMode="contain" />
          <Text style={vis.miniNum}>8</Text>
        </View>
        <Text style={vis.arrow}>→</Text>
        <View style={[vis.miniSlot, vis.slotHighlight]}>
          <Text style={vis.numHighlight}>8</Text>
        </View>
        <Text style={vis.chainBadge}>Chain!</Text>
      </View>
    );
  }
  // Step 3: Joker + discard pile
  return (
    <View style={vis.flowRow}>
      <View style={vis.drawnTile}>
        <Image source={TRASH_TILE_IMAGES[0]} style={vis.iconMd} resizeMode="contain" />
        <Text style={vis.jokerLabel}>J</Text>
      </View>
      <Text style={vis.arrow}>→</Text>
      <Text style={vis.anySlot}>?</Text>
    </View>
  );
};

export const TrashOkeyTutorialScreen: React.FC<TrashOkeyTutorialScreenProps> = ({onComplete}) => {
  const [step, setStep] = useState(0);
  const {t} = useLanguage();

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else onComplete();
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const steps = [
    {title: t.toTutWelcomeTitle, body: t.toTutWelcomeBody},
    {title: t.toTutGridTitle, body: t.toTutGridBody},
    {title: t.toTutChainTitle, body: t.toTutChainBody},
    {title: t.toTutReadyTitle, body: t.toTutReadyBody},
  ];

  const current = steps[step];

  return (
    <View style={styles.container}>
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
        <View style={styles.stepCenter}>
          <Text style={styles.stepTitle}>{current.title}</Text>

          {/* Visual example */}
          <View style={styles.visualWrap}>
            <StepVisual step={step} />
          </View>

          <Text style={styles.stepBody}>{current.body}</Text>
        </View>
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
          <Text style={styles.nextArrow}>{step === TOTAL_STEPS - 1 ? '▶' : '→'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const vis = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  slot: {
    width: 52,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#FAF8F1',
    borderWidth: 2,
    borderColor: '#D5C89A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  slotHighlight: {
    borderColor: '#FAEAB1',
    borderWidth: 2.5,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {width: 24, height: 24},
  iconMd: {width: 28, height: 28},
  iconSm: {width: 20, height: 20},
  num: {fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#334443'},
  numHighlight: {fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#FAEAB1'},
  pile: {
    width: 48,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#34656D',
    borderWidth: 2,
    borderColor: '#3D7A74',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pileQ: {fontSize: 22, fontFamily: 'Nunito_700Bold', color: '#6B9C93'},
  arrow: {fontSize: 20, color: '#8AABA5', fontFamily: 'Nunito_700Bold'},
  drawnTile: {
    width: 56,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#FAF8F1',
    borderWidth: 2.5,
    borderColor: '#FAEAB1',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  drawnNum: {fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#334443'},
  miniSlot: {
    width: 44,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#FAF8F1',
    borderWidth: 1.5,
    borderColor: '#D5C89A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  miniNum: {fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#334443'},
  chainBadge: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
    backgroundColor: 'rgba(250, 234, 177, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  jokerLabel: {fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#E74C3C'},
  anySlot: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#FAEAB1',
    backgroundColor: 'rgba(250, 234, 177, 0.1)',
    width: 48,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FAEAB1',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
});

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#334443', paddingTop: 16},
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
  stepCenter: {paddingTop: 24, alignItems: 'center'},
  stepTitle: {
    color: '#FAEAB1', fontSize: 26, fontFamily: 'Nunito_700Bold',
    textAlign: 'center', marginBottom: 24,
  },
  visualWrap: {
    backgroundColor: 'rgba(52, 101, 109, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(61, 122, 116, 0.3)',
  },
  stepBody: {
    color: '#D5E0DC', fontSize: 16, lineHeight: 24,
    textAlign: 'center', marginBottom: 16,
  },
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
});
