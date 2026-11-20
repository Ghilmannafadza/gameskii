import type { GameName } from '../types';

/**
 * Photos: Wikimedia Commons (CC BY / CC BY-SA / CC0, credited on the Bantuan page)
 * and Unsplash (Unsplash License). Every remote image falls back to a local gradient.
 */
const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;
const c = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`;

export interface PhotoCredit { title: string; author: string; license: string; page: string }

const COMMONS = {
  ffWorldCup: {
    src: c('4/4b/Free_Fire_World_Cup_2019_gameplay.png/1280px-Free_Fire_World_Cup_2019_gameplay.png'),
    credit: { title: 'Free Fire World Cup 2019 gameplay', author: 'Sygnustv Media', license: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Free_Fire_World_Cup_2019_gameplay.png' },
  },
  ffws: {
    src: c('b/b7/Free_Fire_World_Series_2024%2C_R%C3%ADo_de_Janeiro_A74227020241122.jpg/1280px-Free_Fire_World_Series_2024%2C_R%C3%ADo_de_Janeiro_A74227020241122.jpg'),
    credit: { title: 'Free Fire World Series 2024, Rio de Janeiro', author: 'Rjcastillo', license: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Free_Fire_World_Series_2024,_R%C3%ADo_de_Janeiro_A74227020241122.jpg' },
  },
  mlMalaysia: {
    src: c('6/63/Pertandingan_ML_Malaysia_Digital_Content_Festival.jpg/1280px-Pertandingan_ML_Malaysia_Digital_Content_Festival.jpg'),
    credit: { title: 'Pertandingan ML Malaysia Digital Content Festival', author: 'PeaceSeekers', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Pertandingan_ML_Malaysia_Digital_Content_Festival.jpg' },
  },
  pubgStar: {
    src: c('e/e8/2019_pubgm_star_challenge.png/1280px-2019_pubgm_star_challenge.png'),
    credit: { title: '2019 PUBG Mobile Star Challenge', author: 'Crazyharlem', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:2019_pubgm_star_challenge.png' },
  },
  pesGamescom: {
    src: c('1/1c/Football_PES_2020_Gamescom_2019_%2848605747541%29.jpg/1280px-Football_PES_2020_Gamescom_2019_%2848605747541%29.jpg'),
    credit: { title: 'Football PES 2020, Gamescom 2019', author: 'dronepicr', license: 'CC BY 2.0', page: 'https://commons.wikimedia.org/wiki/File:Football_PES_2020_Gamescom_2019_(48605747541).jpg' },
  },
  pialaPresiden: {
    src: c('a/ac/Piala_Presiden_Esports.jpg/1280px-Piala_Presiden_Esports.jpg'),
    credit: { title: 'Piala Presiden Esports', author: 'KINCIR', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Piala_Presiden_Esports.jpg' },
  },
  pialaPresiden2019: {
    src: c('b/b7/Piala_Presiden_Esports_2019_Day_1.jpg/1280px-Piala_Presiden_Esports_2019_Day_1.jpg'),
    credit: { title: 'Piala Presiden Esports 2019 Day 1', author: 'KINCIR', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Piala_Presiden_Esports_2019_Day_1.jpg' },
  },
  pialaPresiden2020: {
    src: c('0/03/Piala_Presiden_Esports_2020.jpg/1280px-Piala_Presiden_Esports_2020.jpg'),
    credit: { title: 'Piala Presiden Esports 2020', author: 'KINCIR', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Piala_Presiden_Esports_2020.jpg' },
  },
  pialaPresiden2021: {
    src: c('3/3b/Piala_Presiden_Esports_2021_-_Kick_Off_Ceremony.jpg/1280px-Piala_Presiden_Esports_2021_-_Kick_Off_Ceremony.jpg'),
    credit: { title: 'Piala Presiden Esports 2021, Kick Off Ceremony', author: 'KINCIR', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Piala_Presiden_Esports_2021_-_Kick_Off_Ceremony.jpg' },
  },
};

export const PHOTO_CREDITS: PhotoCredit[] = Object.values(COMMONS).map((x) => x.credit);

export const IMG = {
  hero: COMMONS.pialaPresiden.src,
  stage: COMMONS.pialaPresiden2020.src,
  upload: u('1545804913-688517980abc', 1400), // "Game On" neon
  referee: u('1580234811497-9df7fd2f357e', 1400),
  help: u('1587095951604-b9d924a3fda0', 1400),
  mobileSquad: u('1759701546851-1d903ac1a2e2', 900),
};

/** Cover photo per game category, taken at that game's own events. */
export const GAME_COVERS: Record<string, string> = {
  'Free Fire': COMMONS.ffWorldCup.src,
  'Mobile Legends': COMMONS.mlMalaysia.src,
  'PUBG Mobile': COMMONS.pubgStar.src,
  'e-Football Console': COMMONS.pesGamescom.src,
};

/** One distinct photo per competition (C01..C10, all Free Fire / mobile esports). */
export const CARD_IMAGES = [
  COMMONS.ffWorldCup.src,
  COMMONS.ffws.src,
  COMMONS.pialaPresiden2019.src,
  u('1759701546851-1d903ac1a2e2'), // mobile squad at table
  COMMONS.pialaPresiden2020.src,
  u('1759701547797-15ee208edc40'), // mobile event table
  COMMONS.pialaPresiden2021.src,
  u('1558008258-7ff8888b42b0'), // lan players
  u('1534423861386-85a16f5d13fd'), // red monitor glow
  u('1548686304-5c3be888a00b'), // pc player, headset
];

export function imageForCompetition(id: string) {
  const n = parseInt(id.replace(/\D/g, ''), 10) || 1;
  return CARD_IMAGES[(n - 1) % CARD_IMAGES.length];
}

export interface GameMeta {
  name: GameName;
  short: string;
  icon: string;
  color: string;
  glyph?: string; // key in BRAND_PATHS for offline fallback
}

export const GAMES: GameMeta[] = [
  {
    name: 'Free Fire',
    short: 'FF',
    icon: 'https://play-lh.googleusercontent.com/cK-U0_B9GrnSy26SNISDuvU_hL4VggyqJ1J5V2oiuyVEfiGo7fzegdBjk0ejXPg3PKK5sPwumdLBbWv8KkBKLQ=w240-h480',
    color: '#F26B1D',
  },
  {
    name: 'Mobile Legends',
    short: 'ML',
    icon: 'https://play-lh.googleusercontent.com/r3VU-78TGaJWewvEll8oNl0SF-ESsOiS--jQkdcSOSblzu9fY0j3xWA49pIjsGXOfheldafcPQHV_eegp_Z-MQ=w240-h480',
    color: '#2F6FE4',
  },
  {
    name: 'PUBG Mobile',
    short: 'PG',
    icon: 'https://play-lh.googleusercontent.com/Se7jR6A5R0Mk9ClaIguf46yi2K3k32JsqKb3gAtrktIh3JwnFfxrQRmG9GLvdMpbxbMrReUOxzDkStxGxNo-5Q=w240-h480',
    color: '#F2A900',
    glyph: 'pubg',
  },
  {
    name: 'e-Football Console',
    short: 'eF',
    icon: '', // official store icon shows a real player; use local Konami glyph instead
    color: '#1C46C9',
    glyph: 'konami',
  },
];

export function gameMeta(name: GameName | string): GameMeta {
  return GAMES.find((g) => g.name === name) || GAMES[0];
}
