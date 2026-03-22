import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useLanguage} from '../../i18n/useLanguage';

interface ColumnPushTutorialScreenProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 6;

export const ColumnPushTutorialScreen: React.FC<ColumnPushTutorialScreenProps> = ({onComplete}) => {
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

  const steps = [
    {icon: '🏖️', title: t.cpTutWelcomeTitle, body: t.cpTutWelcomeBody},
    {icon: '⬇️', title: t.cpTutPushTitle, body: t.cpTutPushBody},
    {icon: '🎨', title: t.cpTutThemeTitle, body: t.cpTutThemeBody},
    {icon: '🔗', title: t.cpTutChainTitle, body: t.cpTutChainBody},
    {icon: '🏁', title: t.cpTutFinalTitle, body: t.cpTutFinalBody},
    {icon: '🎮', title: t.cpTutReadyTitle, body: t.cpTutReadyBody},
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
          <Text style={styles.bigIcon}>{current.icon}</Text>
          <Text style={styles.stepTitle}>{current.title}</Text>
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
  stepCenter: {paddingTop: 40, alignItems: 'center'},
  bigIcon: {fontSize: 64, marginBottom: 20},
  stepTitle: {color: '#FAEAB1', fontSize: 24, fontFamily: 'Nunito_700Bold', textAlign: 'center', marginBottom: 12},
  stepBody: {color: '#D5E0DC', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 16},
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
