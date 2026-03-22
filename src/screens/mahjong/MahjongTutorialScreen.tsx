import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Tile} from '../../types';
import {TileComponent} from '../../components/shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';

interface MahjongTutorialScreenProps {
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

export const MahjongTutorialScreen: React.FC<MahjongTutorialScreenProps> = ({onComplete}) => {
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
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onComplete} activeOpacity={0.7}>
        <Text style={styles.skipText}>{t.tutorialSkip} →</Text>
      </TouchableOpacity>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({length: TOTAL_STEPS}).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}>
        {step === 0 && <StepWelcome t={t} />}
        {step === 1 && <StepTiles t={t} />}
        {step === 2 && <StepMelds t={t} />}
        {step === 3 && <StepWinning t={t} />}
        {step === 4 && <StepFlow t={t} />}
        {step === 5 && <StepReady t={t} />}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backText}>← {t.tutorialBack}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity onPress={goNext} style={[styles.nextButton, step === TOTAL_STEPS - 1 && styles.startButton]} activeOpacity={0.8}>
          <Text style={styles.nextText}>
            {step === TOTAL_STEPS - 1 ? t.tutorialStart : t.tutorialNext}
          </Text>
          {step < TOTAL_STEPS - 1 && <Text style={styles.nextArrow}>→</Text>}
          {step === TOTAL_STEPS - 1 && <Text style={styles.nextArrow}>▶</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Step Components ────────────────────────────────────────

function StepWelcome({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>🀄</Text>
      <Text style={styles.stepTitle}>{t.tutorialWelcomeTitle}</Text>
      <Text style={styles.stepBody}>{t.tutorialWelcomeBody}</Text>
    </View>
  );
}

function StepTiles({t}: {t: any}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.tutorialTilesTitle}</Text>
      <Text style={styles.stepBody}>{t.tutorialTilesBody}</Text>

      <Text style={styles.sectionLabel}>{t.tutorialTilesNumbered}</Text>

      <View style={styles.tileGroupBlock}>
        <Text style={styles.suitNameFull}>{t.suitBamboo} ({t.suitBambooLong})</Text>
        <View style={styles.tilesRow}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(v => (
            <TileComponent key={`bam-${v}`} tile={makeDemoTile('bamboo', v)} size="small" />
          ))}
        </View>
      </View>

      <View style={styles.tileGroupBlock}>
        <Text style={styles.suitNameFull}>{t.suitDot} ({t.suitDotLong})</Text>
        <View style={styles.tilesRow}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(v => (
            <TileComponent key={`dot-${v}`} tile={makeDemoTile('dot', v)} size="small" />
          ))}
        </View>
      </View>

      <View style={styles.tileGroupBlock}>
        <Text style={styles.suitNameFull}>{t.suitCharacter} ({t.suitCharacterLong})</Text>
        <View style={styles.tilesRow}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(v => (
            <TileComponent key={`chr-${v}`} tile={makeDemoTile('character', v)} size="small" />
          ))}
        </View>
      </View>

      <Text style={[styles.stepBody, {marginTop: 12, textAlign: 'left'}]}>
        {t.tutorialTilesNote}
      </Text>
    </View>
  );
}

function StepMelds({t}: {t: any}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.tutorialMeldsTitle}</Text>
      <Text style={styles.stepBody}>{t.tutorialMeldsBody}</Text>

      {/* Pong */}
      <View style={styles.meldCard}>
        <Text style={styles.meldName}>{t.tutorialPong}</Text>
        <Text style={styles.meldDesc}>{t.tutorialPongDesc}</Text>
        <View style={styles.tilesRow}>
          {[1, 2, 3].map(i => (
            <TileComponent
              key={`pong-${i}`}
              tile={makeDemoTile('dot', '4', `pong-${i}`)}
              size="medium"
            />
          ))}
        </View>
      </View>

      {/* Kong */}
      <View style={styles.meldCard}>
        <Text style={styles.meldName}>{t.tutorialKong}</Text>
        <Text style={styles.meldDesc}>{t.tutorialKongDesc}</Text>
        <View style={styles.tilesRow}>
          {[1, 2, 3, 4].map(i => (
            <TileComponent
              key={`kong-${i}`}
              tile={makeDemoTile('bamboo', '7', `kong-${i}`)}
              size="medium"
            />
          ))}
        </View>
      </View>

      {/* Chow */}
      <View style={styles.meldCard}>
        <Text style={styles.meldName}>{t.tutorialChow}</Text>
        <Text style={styles.meldDesc}>{t.tutorialChowDesc}</Text>
        <View style={styles.tilesRow}>
          {['3', '4', '5'].map(v => (
            <TileComponent
              key={`chow-${v}`}
              tile={makeDemoTile('character', v)}
              size="medium"
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function StepWinning({t}: {t: any}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.tutorialWinTitle}</Text>
      <Text style={styles.stepBody}>{t.tutorialWinBody}</Text>

      <Text style={styles.formula}>{t.tutorialWinFormula}</Text>

      {/* Example winning hand */}
      <View style={styles.winExample}>
        {/* Set 1: Pong */}
        <View style={styles.winGroup}>
          <Text style={styles.winGroupLabel}>{t.tutorialPong}</Text>
          <View style={styles.tilesRow}>
            {[1, 2, 3].map(i => (
              <TileComponent
                key={`w-pong-${i}`}
                tile={makeDemoTile('dot', '2', `w-pong-${i}`)}
                size="small"
              />
            ))}
          </View>
        </View>

        {/* Set 2: Chow */}
        <View style={styles.winGroup}>
          <Text style={styles.winGroupLabel}>{t.tutorialChow}</Text>
          <View style={styles.tilesRow}>
            {['4', '5', '6'].map(v => (
              <TileComponent
                key={`w-chow1-${v}`}
                tile={makeDemoTile('bamboo', v)}
                size="small"
              />
            ))}
          </View>
        </View>

        {/* Set 3: Chow */}
        <View style={styles.winGroup}>
          <Text style={styles.winGroupLabel}>{t.tutorialChow}</Text>
          <View style={styles.tilesRow}>
            {['1', '2', '3'].map(v => (
              <TileComponent
                key={`w-chow2-${v}`}
                tile={makeDemoTile('character', v)}
                size="small"
              />
            ))}
          </View>
        </View>

        {/* Set 4: Pong */}
        <View style={styles.winGroup}>
          <Text style={styles.winGroupLabel}>{t.tutorialPong}</Text>
          <View style={styles.tilesRow}>
            {[1, 2, 3].map(i => (
              <TileComponent
                key={`w-pong2-${i}`}
                tile={makeDemoTile('character', '9', `w-pong2-${i}`)}
                size="small"
              />
            ))}
          </View>
        </View>

        {/* Pair */}
        <View style={styles.winGroup}>
          <Text style={styles.winGroupLabel}>{t.tutorialPair}</Text>
          <View style={styles.tilesRow}>
            {[1, 2].map(i => (
              <TileComponent
                key={`w-pair-${i}`}
                tile={makeDemoTile('bamboo', '5', `w-pair-${i}`)}
                size="small"
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function StepFlow({t}: {t: any}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.tutorialFlowTitle}</Text>

      <View style={styles.flowStep}>
        <View style={styles.flowNumber}>
          <Text style={styles.flowNumberText}>1</Text>
        </View>
        <View style={styles.flowContent}>
          <Text style={styles.flowLabel}>{t.tutorialFlowDraw}</Text>
          <View style={styles.tilesRow}>
            <TileComponent
              tile={makeDemoTile('bamboo', '1')}
              size="medium"
              faceDown
            />
            <Text style={styles.flowArrow}>→</Text>
            <TileComponent
              tile={makeDemoTile('bamboo', '3')}
              size="medium"
            />
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.flowNumber}>
          <Text style={styles.flowNumberText}>2</Text>
        </View>
        <View style={styles.flowContent}>
          <Text style={styles.flowLabel}>{t.tutorialFlowDiscard}</Text>
          <View style={styles.tilesRow}>
            <TileComponent
              tile={makeDemoTile('dot', '1')}
              size="medium"
              highlighted
            />
          </View>
        </View>
      </View>

      <View style={styles.flowStep}>
        <View style={styles.flowNumber}>
          <Text style={styles.flowNumberText}>3</Text>
        </View>
        <View style={styles.flowContent}>
          <Text style={styles.flowLabel}>{t.tutorialFlowClaim}</Text>
          <View style={styles.tilesRow}>
            {[1, 2, 3].map(i => (
              <TileComponent
                key={`claim-${i}`}
                tile={makeDemoTile('dot', '8', `claim-${i}`)}
                size="medium"
              />
            ))}
          </View>
        </View>
      </View>

      <Text style={[styles.stepBody, {marginTop: 16}]}>{t.tutorialFlowBody}</Text>
    </View>
  );
}

function StepReady({t}: {t: any}) {
  return (
    <View style={styles.stepCenter}>
      <Text style={styles.bigIcon}>🎮</Text>
      <Text style={styles.stepTitle}>{t.tutorialReadyTitle}</Text>
      <Text style={styles.stepBody}>{t.tutorialReadyBody}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#334443',
    paddingTop: 16,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(250,248,241,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.1)',
  },
  skipText: {
    color: '#8AABA5',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A5450',
  },
  dotActive: {
    backgroundColor: '#FAEAB1',
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A5450',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(250,248,241,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.1)',
  },
  backText: {
    color: '#B0CBC5',
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
  nextButton: {
    backgroundColor: '#FAEAB1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButton: {
    paddingHorizontal: 32,
  },
  nextText: {
    color: '#334443',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  nextArrow: {
    color: '#334443',
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  // Step styles
  stepContainer: {
    paddingTop: 8,
  },
  stepCenter: {
    paddingTop: 40,
    alignItems: 'center',
  },
  bigIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  stepTitle: {
    color: '#FAEAB1',
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepBody: {
    color: '#D5E0DC',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#FAEAB1',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 8,
    marginBottom: 8,
  },
  tileGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  tileGroupBlock: {
    marginBottom: 12,
  },
  suitName: {
    color: '#B0CBC5',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    width: 50,
  },
  suitNameFull: {
    color: '#B0CBC5',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
  },
  tilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // Meld cards
  meldCard: {
    backgroundColor: '#34656D',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  meldName: {
    color: '#FAEAB1',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 4,
  },
  meldDesc: {
    color: '#B0CBC5',
    fontSize: 13,
    marginBottom: 10,
  },
  // Winning hand
  formula: {
    color: '#FAEAB1',
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  winExample: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  winGroup: {
    alignItems: 'center',
    backgroundColor: '#34656D',
    borderRadius: 8,
    padding: 8,
  },
  winGroupLabel: {
    color: '#8AABA5',
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
  },
  // Flow steps
  flowStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  flowNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAEAB1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  flowNumberText: {
    color: '#334443',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  flowContent: {
    flex: 1,
  },
  flowLabel: {
    color: '#FAF8F1',
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },
  flowArrow: {
    color: '#FAEAB1',
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    marginHorizontal: 8,
  },
});
