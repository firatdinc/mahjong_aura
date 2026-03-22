import {TrashTile, GridSlot, TrashPlayerState, TrashGameState, TrashDifficulty} from '../../types/trashOkey';
import {TILE_NUMBERS, COPIES_PER_NUMBER, JOKER_COUNT, TILES_PER_PLAYER} from '../../constants/trashOkey/tiles';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTiles(): TrashTile[] {
  const tiles: TrashTile[] = [];
  let id = 0;

  for (const num of TILE_NUMBERS) {
    for (let copy = 0; copy < COPIES_PER_NUMBER; copy++) {
      tiles.push({
        id: `t_${id++}`,
        number: num,
        isJoker: false,
      });
    }
  }

  for (let j = 0; j < JOKER_COUNT; j++) {
    tiles.push({
      id: `t_joker_${j}`,
      number: 0,
      isJoker: true,
    });
  }

  return tiles;
}

function createSlots(): GridSlot[] {
  const slots: GridSlot[] = [];
  for (let i = 1; i <= TILES_PER_PLAYER; i++) {
    slots.push({
      position: i,
      tile: null,
      isRevealed: false,
    });
  }
  return slots;
}

export function dealTrashOkey(difficulty: TrashDifficulty): TrashGameState {
  const allTiles = shuffle(generateTiles());

  const playerTiles = allTiles.slice(0, TILES_PER_PLAYER);
  const botTiles = allTiles.slice(TILES_PER_PLAYER, TILES_PER_PLAYER * 2);
  const drawPile = allTiles.slice(TILES_PER_PLAYER * 2);

  const playerSlots = createSlots();
  const botSlots = createSlots();

  for (let i = 0; i < TILES_PER_PLAYER; i++) {
    playerSlots[i].tile = playerTiles[i];
    botSlots[i].tile = botTiles[i];
  }

  const playerState: TrashPlayerState = {
    side: 'player',
    slots: playerSlots,
    revealedCount: 0,
  };

  const botState: TrashPlayerState = {
    side: 'bot',
    slots: botSlots,
    revealedCount: 0,
  };

  return {
    players: {player: playerState, bot: botState},
    drawPile,
    discardPile: [],
    drawnTile: null,
    currentTurn: 'player',
    chainActive: false,
    chainLength: 0,
    status: 'playing',
    difficulty,
    turnCount: 0,
    longestChain: 0,
  };
}
