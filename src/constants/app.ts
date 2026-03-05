import {Translations} from '../i18n/translations';

export type GameId = 'mahjong' | 'tileMatch' | 'trashOkey' | 'columnPush';

export interface GameDefinition {
  id: GameId;
  icon: string;
  image?: number;
  titleKey: keyof Translations;
  descriptionKey: keyof Translations;
}

export const GAMES: GameDefinition[] = [
  {
    id: 'mahjong',
    icon: '🀄',
    titleKey: 'hubMahjongTitle',
    descriptionKey: 'hubMahjongDesc',
  },
  {
    id: 'tileMatch',
    icon: '🧩',
    titleKey: 'hubTileMatchTitle',
    descriptionKey: 'hubTileMatchDesc',
  },
  {
    id: 'trashOkey',
    icon: '🎴',
    titleKey: 'hubTrashOkeyTitle',
    descriptionKey: 'hubTrashOkeyDesc',
  },
  {
    id: 'columnPush',
    icon: '🏛️',
    titleKey: 'hubColumnPushTitle',
    descriptionKey: 'hubColumnPushDesc',
  },
];
