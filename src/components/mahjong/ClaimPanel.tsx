import React, {useEffect, useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Animated} from 'react-native';
import {ClaimOption, Tile} from '../../types';
import {TileComponent} from '../shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';
import {ms} from '../../utils/scaling';

interface ClaimPanelProps {
  options: ClaimOption[];
  discardedTile: Tile;
  playerHand: Tile[];
  onClaim: (option: ClaimOption) => void;
  onSkip: () => void;
}

const MELD_COLORS: Record<string, string> = {
  pong: '#FF9800',
  kong: '#E91E63',
  chow: '#4CAF50',
};

export const ClaimPanel: React.FC<ClaimPanelProps> = ({
  options,
  discardedTile,
  playerHand,
  onClaim,
  onSkip,
}) => {
  const {t} = useLanguage();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const getMeldLabel = (type: string): string => {
    switch (type) {
      case 'pong': return t.claimPong;
      case 'kong': return t.claimKong;
      case 'chow': return t.claimChow;
      default: return type;
    }
  };

  const getMeldDesc = (type: string): string => {
    switch (type) {
      case 'pong': return t.claimPongDesc;
      case 'kong': return t.claimKongDesc;
      case 'chow': return t.claimChowDesc;
      default: return '';
    }
  };

  // Get the actual tiles from hand that would form the meld
  const getMeldTiles = (option: ClaimOption): Tile[] => {
    const handTiles = option.tileIds
      .map(id => playerHand.find(t => t.id === id))
      .filter(Boolean) as Tile[];
    return [...handTiles, discardedTile];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      {/* Header */}
      <Text style={styles.promptText}>{t.claimPrompt}</Text>

      {/* Options with tile previews */}
      <View style={styles.optionsContainer}>
        {options.map((option, idx) => {
          const meldTiles = getMeldTiles(option);
          const color = MELD_COLORS[option.meldType] ?? '#666';

          return (
            <TouchableOpacity
              key={`${option.meldType}-${idx}`}
              style={[styles.optionCard, {borderColor: color}]}
              onPress={() => onClaim(option)}
              activeOpacity={0.7}>
              {/* Meld type label */}
              <View style={[styles.optionHeader, {backgroundColor: color}]}>
                <Text style={styles.optionLabel}>{getMeldLabel(option.meldType)}</Text>
                <Text style={styles.optionDesc}>{getMeldDesc(option.meldType)}</Text>
              </View>

              {/* Tile preview: show hand tiles + discarded tile */}
              <View style={styles.tilePreviewRow}>
                {meldTiles.map((tile, tileIdx) => (
                  <View key={tile.id} style={styles.previewTileWrap}>
                    <TileComponent tile={tile} size="small" />
                    {tileIdx === meldTiles.length - 1 && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>+</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={onSkip}
        activeOpacity={0.7}>
        <Text style={styles.skipButtonText}>{t.claimSkip}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A3A3A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: ms(14),
    paddingTop: ms(14),
    paddingBottom: ms(24),
    borderTopWidth: 2,
    borderTopColor: '#FAEAB1',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  promptText: {
    color: '#FAEAB1',
    fontSize: ms(15),
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: ms(10),
  },
  optionsContainer: {
    gap: ms(8),
    marginBottom: ms(10),
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(250,248,241,0.06)',
    overflow: 'hidden',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(6),
    paddingHorizontal: ms(12),
    gap: ms(8),
  },
  optionLabel: {
    color: '#FFF',
    fontSize: ms(16),
    fontFamily: 'Nunito_700Bold',
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: ms(11),
    fontFamily: 'Nunito_500Medium',
  },
  tilePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: ms(8),
    paddingHorizontal: ms(8),
    gap: ms(4),
  },
  previewTileWrap: {
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FAEAB1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: '#1A3A3A',
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    lineHeight: 14,
  },
  skipButton: {
    borderRadius: 14,
    paddingVertical: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,248,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,241,0.2)',
  },
  skipButtonText: {
    color: '#B0CBC5',
    fontSize: ms(15),
    fontFamily: 'Nunito_600SemiBold',
  },
});
