import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import {Tile, Meld} from '../../types';
import {TileComponent} from '../shared/TileComponent';
import {useLanguage} from '../../i18n/useLanguage';
import {useSettings} from '../../store/useSettings';
import {tileKey, isNumberedTile} from '../../engine/mahjong/meldUtils';
import {checkWin} from '../../engine/mahjong/winDetection';
import {NUMBERED_SUITS} from '../../constants/mahjong/tiles';
import {scoreTileUsefulness} from '../../engine/mahjong/botAI';

const MELD_LABEL_COLORS: Record<string, string> = {
  pong: '#FF9800',
  kong: '#E91E63',
  chow: '#4CAF50',
  pair: '#42A5F5',
};

interface PlayerHandProps {
  hand: Tile[];
  revealedMelds: Meld[];
  onTilePress: (tile: Tile) => void;
  onDrawTile?: () => void;
  isCurrentTurn: boolean;
  canDiscard: boolean;
  canDraw: boolean;
  hintTileId?: string | null;
}

// Detect concealed melds in hand (pongs and chows)
interface ConcealedMeldInfo {
  type: 'pong' | 'chow' | 'pair';
  tileIds: Set<string>;
}

function findConcealedMelds(hand: Tile[]): ConcealedMeldInfo[] {
  const melds: ConcealedMeldInfo[] = [];
  const usedIds = new Set<string>();

  // Group tiles by key
  const groups = new Map<string, Tile[]>();
  for (const tile of hand) {
    const key = tileKey(tile);
    const arr = groups.get(key) ?? [];
    arr.push(tile);
    groups.set(key, arr);
  }

  // Find pongs (3+ identical)
  for (const [, tiles] of groups) {
    if (tiles.length >= 3) {
      const pongTiles = tiles.slice(0, 3);
      const ids = new Set(pongTiles.map(t => t.id));
      melds.push({type: 'pong', tileIds: ids});
      for (const id of ids) {usedIds.add(id);}
    }
  }

  // Find chows (3 consecutive same suit) from remaining tiles
  const remaining = hand.filter(t => !usedIds.has(t.id));
  const sortedNumbered = remaining
    .filter(t => isNumberedTile(t))
    .sort((a, b) => {
      if (a.suit !== b.suit) {return a.suit.localeCompare(b.suit);}
      return parseInt(a.value) - parseInt(b.value);
    });

  const chowUsed = new Set<string>();
  for (let i = 0; i < sortedNumbered.length; i++) {
    const t1 = sortedNumbered[i];
    if (chowUsed.has(t1.id)) {continue;}
    const v1 = parseInt(t1.value);

    const t2 = sortedNumbered.find(
      t => !chowUsed.has(t.id) && t.id !== t1.id && t.suit === t1.suit && parseInt(t.value) === v1 + 1,
    );
    if (!t2) {continue;}

    const t3 = sortedNumbered.find(
      t => !chowUsed.has(t.id) && t.id !== t1.id && t.id !== t2.id && t.suit === t1.suit && parseInt(t.value) === v1 + 2,
    );
    if (!t3) {continue;}

    const ids = new Set([t1.id, t2.id, t3.id]);
    melds.push({type: 'chow', tileIds: ids});
    for (const id of ids) {chowUsed.add(id);}
  }

  // Find pairs from remaining tiles (not used in any meld)
  const allUsed = new Set<string>();
  for (const m of melds) {
    for (const id of m.tileIds) {allUsed.add(id);}
  }
  const pairCandidates = hand.filter(t => !allUsed.has(t.id));
  const pairGroups = new Map<string, Tile[]>();
  for (const tile of pairCandidates) {
    const key = tileKey(tile);
    const arr = pairGroups.get(key) ?? [];
    arr.push(tile);
    pairGroups.set(key, arr);
  }
  // Only mark the first pair found (only 1 pair needed for win)
  let pairFound = false;
  for (const [, tiles] of pairGroups) {
    if (tiles.length >= 2 && !pairFound) {
      const pairTiles = tiles.slice(0, 2);
      melds.push({type: 'pair', tileIds: new Set(pairTiles.map(t => t.id))});
      pairFound = true;
    }
  }

  return melds;
}

// Check if player is in tenpai (one tile away from winning)
// Properly tests by simulating adding each possible tile and running checkWin.
function isTenpai(hand: Tile[], revealedMelds: Meld[]): boolean {
  const kongCount = revealedMelds.filter(m => m.type === 'kong').length;
  const revealedTileCount = revealedMelds.reduce((s, m) => s + m.tiles.length, 0);
  const totalNow = hand.length + revealedTileCount;
  // Must have exactly 13 tiles (waiting for the 14th)
  if (totalNow !== 13 + kongCount) {return false;}

  // Try adding each possible tile type and check if it creates a winning hand
  for (const suit of NUMBERED_SUITS) {
    for (let v = 1; v <= 9; v++) {
      const fakeTile: Tile = {
        id: '__tenpai_test__',
        suit,
        value: String(v),
        location: 'player',
        isHidden: false,
      };
      const testHand = [...hand, fakeTile];
      if (checkWin({seatId: 'player', hand: testHand, revealedMelds, discards: []})) {
        return true;
      }
    }
  }
  return false;
}

// Get progress info
function getMeldProgress(hand: Tile[], revealedMelds: Meld[]): {
  melds: number;
  concealedMelds: number;
  hasPair: boolean;
  needsFromHand: number;
} {
  const melds = revealedMelds.length;
  const concealed = findConcealedMelds(hand);
  const concealedMelds = concealed.filter(c => c.type !== 'pair').length;
  const needsFromHand = 4 - melds;

  // Check for pairs in hand (exclude tiles used in concealed melds)
  const concealedIds = new Set<string>();
  for (const cm of concealed) {
    for (const id of cm.tileIds) {concealedIds.add(id);}
  }
  const counts = new Map<string, number>();
  for (const tile of hand) {
    if (concealedIds.has(tile.id)) {continue;}
    const key = tileKey(tile);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const hasPair = [...counts.values()].some(c => c >= 2);

  return {melds, concealedMelds, hasPair, needsFromHand};
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  revealedMelds,
  onTilePress,
  onDrawTile,
  isCurrentTurn,
  canDiscard,
  canDraw,
  hintTileId,
}) => {
  const {t} = useLanguage();
  const {autoDraw, tileScale} = useSettings();

  // Progress calculations
  const progress = useMemo(() => getMeldProgress(hand, revealedMelds), [hand, revealedMelds]);
  const tenpai = useMemo(() => isTenpai(hand, revealedMelds), [hand, revealedMelds]);
  const concealedMelds = useMemo(() => findConcealedMelds(hand), [hand]);

  // Build set of tile IDs that are part of concealed melds
  const concealedMeldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cm of concealedMelds) {
      for (const id of cm.tileIds) {ids.add(id);}
    }
    return ids;
  }, [concealedMelds]);

  // Discard hints: dim orphan/low-value tiles when it's time to discard
  const dimmedTileIds = useMemo(() => {
    if (!canDiscard) {return new Set<string>();}
    const scores = hand.map(tile => ({id: tile.id, score: scoreTileUsefulness(tile, hand)}));
    const maxScore = Math.max(...scores.map(s => s.score), 1);
    // Dim tiles with score <= 1 (true orphans with no neighbors/pairs)
    const dimThreshold = Math.min(1, maxScore * 0.25);
    return new Set(scores.filter(s => s.score <= dimThreshold).map(s => s.id));
  }, [hand, canDiscard]);

  // Two-row layout: split hand into two rows
  const screenWidth = Dimensions.get('window').width;
  const padding = 16;
  const availableWidth = screenWidth - padding;
  const tilesPerRow = Math.ceil(hand.length / 2);
  const tileMargin = 2;
  const maxTileWidth =
    Math.floor(availableWidth / Math.max(tilesPerRow, 1)) - tileMargin;
  const tileWidth = Math.min(maxTileWidth, Math.round(44 * tileScale));
  const tileHeight = Math.round(tileWidth * 1.4);
  const fontSize = Math.max(Math.round(tileWidth * 0.4), 10);
  const labelSize = Math.max(Math.round(tileWidth * 0.22), 7);

  const topRow = hand.slice(0, tilesPerRow);
  const bottomRow = hand.slice(tilesPerRow);

  const customSize = {width: tileWidth, height: tileHeight, fontSize, labelSize};

  // Animation tracking
  const prevIdsRef = useRef<Set<string>>(new Set());
  const animsRef = useRef<Map<string, {scale: Animated.Value; translateY: Animated.Value}>>(new Map());

  const getAnim = useCallback((id: string) => {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, {
        scale: new Animated.Value(1),
        translateY: new Animated.Value(0),
      });
    }
    return animsRef.current.get(id)!;
  }, []);

  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = new Set(hand.map(tile => tile.id));

    for (const tile of hand) {
      if (!prevIds.has(tile.id)) {
        const anim = getAnim(tile.id);
        anim.translateY.setValue(30);
        anim.scale.setValue(0.5);
        Animated.parallel([
          Animated.spring(anim.translateY, {
            toValue: 0,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }

    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        animsRef.current.delete(id);
      }
    }

    prevIdsRef.current = currentIds;
  }, [hand, getAnim]);

  const handleDiscard = useCallback((tile: Tile) => {
    const anim = getAnim(tile.id);
    Animated.parallel([
      Animated.timing(anim.scale, {
        toValue: 0.3,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(anim.translateY, {
        toValue: -20,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onTilePress(tile);
    });
  }, [onTilePress, getAnim]);

  const renderTileRow = (tiles: Tile[]) => {
    const elements: React.ReactNode[] = [];

    // Find which concealed meld each tile belongs to (if any)
    const tileToMeld = new Map<string, ConcealedMeldInfo>();
    for (const cm of concealedMelds) {
      for (const id of cm.tileIds) {
        tileToMeld.set(id, cm);
      }
    }

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const prevTile = i > 0 ? tiles[i - 1] : null;
      const anim = getAnim(tile.id);
      const isInMeld = concealedMeldIds.has(tile.id);
      const meldInfo = tileToMeld.get(tile.id);
      const prevMeld = prevTile ? tileToMeld.get(prevTile.id) : null;

      // Spacer between different suits (but not between tiles of the same meld)
      if (prevTile && prevTile.suit !== tile.suit && !(meldInfo && meldInfo === prevMeld)) {
        elements.push(
          <View key={`spacer-${tile.id}`} style={styles.suitSpacer} />,
        );
      }

      // Check if this is the first tile of a concealed meld group in this row
      const isFirstOfMeld = isInMeld && (!prevTile || !prevMeld || prevMeld !== meldInfo);
      // Check if this is the last tile of a concealed meld group in this row
      const nextTile = i < tiles.length - 1 ? tiles[i + 1] : null;
      const nextMeld = nextTile ? tileToMeld.get(nextTile.id) : null;
      const isLastOfMeld = isInMeld && (!nextTile || !nextMeld || nextMeld !== meldInfo);

      const isPairMeld = meldInfo?.type === 'pair';
      const meldBorderColor = isPairMeld ? 'rgba(66,165,245,0.5)' : 'rgba(255,183,77,0.5)';
      const meldBgColor = isPairMeld ? 'rgba(66,165,245,0.12)' : 'rgba(255,183,77,0.15)';

      elements.push(
        <Animated.View
          key={tile.id}
          style={[
            {
              transform: [
                {translateY: anim.translateY},
                {scale: anim.scale},
              ],
            },
            isInMeld && [styles.concealedMeldTile, {borderColor: meldBorderColor, backgroundColor: meldBgColor}],
            isFirstOfMeld && styles.concealedMeldFirst,
            isLastOfMeld && styles.concealedMeldLast,
          ]}>
          <TileComponent
            tile={tile}
            customSize={customSize}
            onPress={canDiscard ? handleDiscard : undefined}
            highlighted={isCurrentTurn && canDiscard}
            dimmed={dimmedTileIds.has(tile.id) && hintTileId !== tile.id}
          />
          {hintTileId === tile.id && (
            <View style={styles.hintGlow} />
          )}
          {/* Meld type badge on first tile */}
          {isFirstOfMeld && meldInfo && (
            <View style={[styles.concealedBadge, {backgroundColor: MELD_LABEL_COLORS[meldInfo.type]}]}>
              <Text style={styles.concealedBadgeText}>
                {meldInfo.type === 'pong' ? 'P' : meldInfo.type === 'pair' ? '2' : 'C'}
              </Text>
            </View>
          )}
        </Animated.View>,
      );
    }
    return elements;
  };

  return (
    <View style={styles.container}>
      {/* Goal indicator — child-friendly */}
      <View style={styles.goalBar}>
        <Text style={styles.goalLabel}>{t.goalLabel}</Text>
        <View style={styles.goalSlots}>
          {[0, 1, 2, 3].map(i => {
            const filled = i < progress.melds;
            const concealed = !filled && i < progress.melds + progress.concealedMelds;
            return (
              <View key={`g-${i}`} style={[
                styles.goalSlot,
                filled && styles.goalSlotFilled,
                concealed && styles.goalSlotConcealed,
              ]}>
                <Text style={[styles.goalSlotText, (filled || concealed) && styles.goalSlotTextDone]}>
                  {filled ? '3' : concealed ? '3' : '?'}
                </Text>
              </View>
            );
          })}
          <Text style={styles.goalPlus}>+</Text>
          <View style={[
            styles.goalSlot,
            styles.goalSlotPair,
            progress.hasPair && styles.goalSlotPairFilled,
          ]}>
            <Text style={[styles.goalSlotText, progress.hasPair && styles.goalSlotTextDone]}>
              {progress.hasPair ? '2' : '?'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tenpai alert */}
      {tenpai && (
        <View style={styles.tenpaiBar}>
          <Text style={styles.tenpaiText}>{t.tenpai}</Text>
          <Text style={styles.tenpaiDesc}>
            {progress.melds >= 4 ? t.needPair : t.tenpaiDesc}
          </Text>
        </View>
      )}

      {/* Revealed melds — compact horizontal scroll */}
      {revealedMelds.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.meldsScrollContent}
          style={styles.meldsScroll}>
          {revealedMelds.map((meld, meldIdx) => (
            <View key={`meld-${meldIdx}`} style={styles.meldGroup}>
              <View style={[styles.meldLabelInline, {backgroundColor: MELD_LABEL_COLORS[meld.type]}]}>
                <Text style={styles.meldLabelText}>
                  {meld.type.toUpperCase()}
                </Text>
              </View>
              {meld.tiles.map(meldTile => (
                <TileComponent key={meldTile.id} tile={meldTile} size="small" />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Two-row hand with suit grouping */}
      <View style={styles.handContainer}>
        <View style={styles.handRow}>
          {renderTileRow(topRow)}
        </View>
        {bottomRow.length > 0 && (
          <View style={styles.handRow}>
            {renderTileRow(bottomRow)}
          </View>
        )}
      </View>

      {isCurrentTurn && canDiscard && (
        <Text style={styles.hint}>
          {dimmedTileIds.size > 0 ? t.discardHint : t.tapToDiscard}
        </Text>
      )}

      {/* Manual draw button */}
      {!autoDraw && isCurrentTurn && canDraw && (
        <TouchableOpacity
          style={styles.drawButton}
          onPress={onDrawTile}
          activeOpacity={0.8}>
          <Text style={styles.drawButtonText}>{t.drawTile}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#34656D',
    borderTopWidth: 1,
    borderTopColor: '#2A5450',
  },
  // Goal indicator
  goalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
  },
  goalLabel: {
    color: '#8AABA5',
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
  },
  goalSlots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalSlot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(250,248,241,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(250,248,241,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSlotFilled: {
    backgroundColor: 'rgba(76,175,80,0.25)',
    borderColor: '#4CAF50',
  },
  goalSlotConcealed: {
    backgroundColor: 'rgba(255,183,77,0.2)',
    borderColor: '#FFB74D',
  },
  goalSlotPair: {
    borderColor: 'rgba(66,165,245,0.4)',
  },
  goalSlotPairFilled: {
    backgroundColor: 'rgba(66,165,245,0.25)',
    borderColor: '#42A5F5',
  },
  goalSlotText: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(250,248,241,0.35)',
  },
  goalSlotTextDone: {
    color: '#FAF8F1',
  },
  goalPlus: {
    color: '#8AABA5',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  // Tenpai alert
  tenpaiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(255,183,77,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,183,77,0.4)',
  },
  tenpaiText: {
    color: '#FFB74D',
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 1,
  },
  tenpaiDesc: {
    color: '#FAEAB1',
    fontSize: 10,
    fontFamily: 'Nunito_500Medium',
  },
  // Melds
  meldsScroll: {
    marginBottom: 4,
  },
  meldsScrollContent: {
    gap: 4,
    justifyContent: 'center',
    flexGrow: 1,
  },
  meldGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,241,0.08)',
    borderRadius: 5,
    padding: 2,
    gap: 1,
  },
  meldLabelInline: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 1,
  },
  meldLabelText: {
    color: '#FFF',
    fontSize: 7,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.5,
  },
  // Hand
  handContainer: {
    gap: 2,
  },
  handRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  suitSpacer: {
    width: 6,
  },
  // Concealed meld highlighting
  concealedMeldTile: {
    paddingTop: 2,
    paddingBottom: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  concealedMeldFirst: {
    borderLeftWidth: 2,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    paddingLeft: 2,
  },
  concealedMeldLast: {
    borderRightWidth: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    paddingRight: 2,
  },
  concealedBadge: {
    position: 'absolute',
    top: -4,
    alignSelf: 'center',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  concealedBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontFamily: 'Nunito_700Bold',
  },
  hint: {
    color: '#FAEAB1',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Nunito_500Medium',
  },
  drawButton: {
    backgroundColor: '#FAEAB1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FAEAB1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  drawButtonText: {
    color: '#334443',
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  hintGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FAEAB1',
    backgroundColor: 'rgba(250,234,177,0.25)',
  },
});
