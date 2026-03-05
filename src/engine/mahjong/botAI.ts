import {Tile, SeatId, Difficulty, MeldType, GameState} from '../../types';
import {
  tileKey,
  countTiles,
  isNumberedTile,
  findPongMatch,
  findKongMatch,
  findChowMatches,
} from './meldUtils';
import {BOT_THINK_MIN_MS, BOT_THINK_MAX_MS} from '../../constants/mahjong/game';

// ─── Claim decision result ──────────────────────────────────
export interface ClaimDecision {
  shouldClaim: boolean;
  meldType: MeldType;
  tileIds: string[]; // IDs of tiles from hand used in the meld
}

const NO_CLAIM: ClaimDecision = {
  shouldClaim: false,
  meldType: 'pong',
  tileIds: [],
};

// ─── Simulate bot thinking time ─────────────────────────────
export function getBotThinkingDelay(): number {
  return (
    BOT_THINK_MIN_MS +
    Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS)
  );
}

export function waitForThinking(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, getBotThinkingDelay()));
}

// ═══════════════════════════════════════════════════════════════
// DISCARD STRATEGY — which tile should the bot discard?
// ═══════════════════════════════════════════════════════════════

/** Easy: discard a random tile, biased toward orphans (isolated tiles) */
export function chooseDiscardEasy(hand: Tile[]): string {
  // 70% chance to discard the highest-scoring orphan, 30% pure random
  if (Math.random() < 0.7) {
    const orphan = findOrphanTile(hand);
    if (orphan) {return orphan.id;}
  }
  const idx = Math.floor(Math.random() * hand.length);
  return hand[idx].id;
}

/** Medium: discard the tile that contributes least to forming melds */
export function chooseDiscardMedium(hand: Tile[]): string {
  const scores = hand.map(tile => ({
    tile,
    score: scoreTileUsefulness(tile, hand),
  }));
  // Sort ascending — least useful first
  scores.sort((a, b) => a.score - b.score);
  return scores[0].tile.id;
}

/** Hard: discard defensively, avoiding tiles the player likely needs */
export function chooseDiscardHard(
  hand: Tile[],
  gameState: GameState,
): string {
  const playerDiscards = gameState.players.player.discards;
  const allDiscards = gameState.discardPile;

  const scores = hand.map(tile => {
    const usefulness = scoreTileUsefulness(tile, hand);
    const danger = scoreTileDanger(tile, playerDiscards, allDiscards);
    // Low usefulness + low danger = best discard candidate
    // We want to minimize: usefulness + danger
    return {tile, score: usefulness + danger * 2};
  });

  scores.sort((a, b) => a.score - b.score);
  return scores[0].tile.id;
}

// ═══════════════════════════════════════════════════════════════
// CLAIM STRATEGY — should the bot claim a discarded tile?
// ═══════════════════════════════════════════════════════════════

/** Easy: rarely claims (10% chance for Pong only) */
export function evaluateClaimEasy(
  hand: Tile[],
  discard: Tile,
): ClaimDecision {
  // Only consider Pong, and only 10% of the time
  if (Math.random() > 0.1) {return NO_CLAIM;}

  const pongTiles = findPongMatch(hand, discard);
  if (pongTiles) {
    return {
      shouldClaim: true,
      meldType: 'pong',
      tileIds: pongTiles.map(t => t.id),
    };
  }
  return NO_CLAIM;
}

/** Medium: claims Pong and Chow if immediately available */
export function evaluateClaimMedium(
  hand: Tile[],
  discard: Tile,
  botSeat: SeatId,
  discardedBy: SeatId,
): ClaimDecision {
  // Kong — always claim if possible
  const kongTiles = findKongMatch(hand, discard);
  if (kongTiles) {
    return {
      shouldClaim: true,
      meldType: 'kong',
      tileIds: kongTiles.map(t => t.id),
    };
  }

  // Pong — always claim
  const pongTiles = findPongMatch(hand, discard);
  if (pongTiles) {
    return {
      shouldClaim: true,
      meldType: 'pong',
      tileIds: pongTiles.map(t => t.id),
    };
  }

  // Chow — only the next player in turn can claim a Chow
  if (canClaimChow(botSeat, discardedBy)) {
    const chowOptions = findChowMatches(hand, discard);
    if (chowOptions.length > 0) {
      return {
        shouldClaim: true,
        meldType: 'chow',
        tileIds: chowOptions[0].map(t => t.id),
      };
    }
  }

  return NO_CLAIM;
}

/** Hard: claims strategically, weighing hand completeness */
export function evaluateClaimHard(
  hand: Tile[],
  discard: Tile,
  botSeat: SeatId,
  discardedBy: SeatId,
): ClaimDecision {
  // Kong — always claim
  const kongTiles = findKongMatch(hand, discard);
  if (kongTiles) {
    return {
      shouldClaim: true,
      meldType: 'kong',
      tileIds: kongTiles.map(t => t.id),
    };
  }

  // Pong — claim if it improves hand structure
  const pongTiles = findPongMatch(hand, discard);
  if (pongTiles) {
    // Calculate how many near-melds exist without claiming
    const currentPairs = countPairsAndTriples(hand);
    // Claiming removes 2 tiles from hand, so check if it's worth it
    if (currentPairs.triples >= 1 || currentPairs.pairs >= 2) {
      return {
        shouldClaim: true,
        meldType: 'pong',
        tileIds: pongTiles.map(t => t.id),
      };
    }
    // Still claim 60% of the time even if hand isn't great
    if (Math.random() < 0.6) {
      return {
        shouldClaim: true,
        meldType: 'pong',
        tileIds: pongTiles.map(t => t.id),
      };
    }
  }

  // Chow — only next-in-turn, and only if it helps
  if (canClaimChow(botSeat, discardedBy)) {
    const chowOptions = findChowMatches(hand, discard);
    if (chowOptions.length > 0) {
      // Pick the chow that leaves the best remaining hand
      const bestChow = chowOptions.reduce((best, option) => {
        const remaining = hand.filter(t => !option.some(o => o.id === t.id));
        const bestRemaining = hand.filter(
          t => !best.some(b => b.id === t.id),
        );
        return scoreTileUsefulness(remaining[0], remaining) >
          scoreTileUsefulness(bestRemaining[0], bestRemaining)
          ? option
          : best;
      });
      return {
        shouldClaim: true,
        meldType: 'chow',
        tileIds: bestChow.map(t => t.id),
      };
    }
  }

  return NO_CLAIM;
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED BOT TURN — called by the store
// ═══════════════════════════════════════════════════════════════

/** Choose which tile to discard based on difficulty */
export function chooseBotDiscard(
  hand: Tile[],
  difficulty: Difficulty,
  gameState: GameState,
): string {
  switch (difficulty) {
    case 'easy':
      return chooseDiscardEasy(hand);
    case 'medium':
      return chooseDiscardMedium(hand);
    case 'hard':
      return chooseDiscardHard(hand, gameState);
  }
}

/** Evaluate whether a bot should claim a discard */
export function evaluateBotClaim(
  hand: Tile[],
  discard: Tile,
  difficulty: Difficulty,
  botSeat: SeatId,
  discardedBy: SeatId,
): ClaimDecision {
  switch (difficulty) {
    case 'easy':
      return evaluateClaimEasy(hand, discard);
    case 'medium':
      return evaluateClaimMedium(hand, discard, botSeat, discardedBy);
    case 'hard':
      return evaluateClaimHard(hand, discard, botSeat, discardedBy);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** In standard Mahjong, only the next player in turn order can claim a Chow */
function canClaimChow(claimerSeat: SeatId, discardedBy: SeatId): boolean {
  const order: SeatId[] = ['player', 'bot1', 'bot2', 'bot3'];
  const discIdx = order.indexOf(discardedBy);
  const nextIdx = (discIdx + 1) % order.length;
  return order[nextIdx] === claimerSeat;
}

/** Find an isolated tile (no pairs, no sequence neighbors) */
function findOrphanTile(hand: Tile[]): Tile | null {
  const counts = countTiles(hand);

  for (const tile of hand) {
    const key = tileKey(tile);
    const count = counts.get(key)?.length ?? 0;

    // Already paired or tripled — not an orphan
    if (count >= 2) {continue;}

    // Check for sequence neighbors (numbered suits only)
    if (isNumberedTile(tile)) {
      const val = parseInt(tile.value, 10);
      const hasNeighbor =
        counts.has(`${tile.suit}_${val - 1}`) ||
        counts.has(`${tile.suit}_${val + 1}`);
      if (hasNeighbor) {continue;}
    }

    // This tile is isolated
    return tile;
  }

  // No orphan found — return the last tile (least important by sort order)
  return hand[hand.length - 1] ?? null;
}

/** Score how useful a tile is for forming melds (higher = more useful) */
function scoreTileUsefulness(tile: Tile, hand: Tile[]): number {
  let score = 0;
  const counts = countTiles(hand);
  const key = tileKey(tile);
  const count = counts.get(key)?.length ?? 0;

  // Pairs and triples are valuable
  if (count >= 3) {score += 6;}
  else if (count === 2) {score += 3;}

  // Sequence potential (numbered suits)
  if (isNumberedTile(tile)) {
    const val = parseInt(tile.value, 10);
    // Adjacent tiles
    if (counts.has(`${tile.suit}_${val - 1}`)) {score += 2;}
    if (counts.has(`${tile.suit}_${val + 1}`)) {score += 2;}
    // Gap tiles (e.g., 3 and 5 for a potential 3-4-5)
    if (counts.has(`${tile.suit}_${val - 2}`)) {score += 1;}
    if (counts.has(`${tile.suit}_${val + 2}`)) {score += 1;}
    // Middle values (4-6) are more flexible than edges (1, 9)
    if (val >= 3 && val <= 7) {score += 1;}
  }

  return score;
}

/** Score how dangerous a tile is to discard (how likely the player needs it) */
function scoreTileDanger(
  tile: Tile,
  playerDiscards: Tile[],
  allDiscards: Tile[],
): number {
  let danger = 0;
  const key = tileKey(tile);

  // Count how many copies of this tile are already discarded
  const discardedCount = allDiscards.filter(t => tileKey(t) === key).length;
  // Fewer discarded = more dangerous (player might still want it)
  danger += (4 - discardedCount) * 2;

  // If the player has NOT discarded this tile type, it's more dangerous
  const playerDiscardedThis = playerDiscards.some(t => tileKey(t) === key);
  if (!playerDiscardedThis) {danger += 3;}

  // If the player hasn't discarded tiles of this suit recently, risky
  if (isNumberedTile(tile)) {
    const playerSuitDiscards = playerDiscards.filter(
      t => t.suit === tile.suit,
    );
    if (playerSuitDiscards.length === 0) {danger += 2;}
  }

  return danger;
}

/** Count pairs and triples in a hand for claim evaluation */
function countPairsAndTriples(hand: Tile[]): {
  pairs: number;
  triples: number;
} {
  const counts = countTiles(hand);
  let pairs = 0;
  let triples = 0;
  for (const tiles of counts.values()) {
    if (tiles.length >= 3) {triples++;}
    else if (tiles.length === 2) {pairs++;}
  }
  return {pairs, triples};
}
