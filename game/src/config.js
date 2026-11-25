// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full dinner shift, in seconds. */
export const SHIFT_SECONDS = 180;
/** When this many seconds are left the dinner rush starts: orders arrive faster. */
export const RUSH_AT_REMAINING = 60;

export const COOK = {
  width: 64,
  height: 96,
  speed: 540,
  /** Y of the cook's feet on the kitchen floor. */
  floorY: 470,
};

/** The three work stations, as horizontal zones the cook stands in. */
export const STATIONS = {
  chop: { x: 40, width: 300, label: 'POTONG', hint: 'SPACE: potong / ambil bahan' },
  wok: { x: 470, width: 340, label: 'WOK', hint: 'SPACE: masukkan / lempar wajan' },
  plate: { x: 930, width: 310, label: 'SAJI', hint: 'SPACE: plating / sajikan' },
};

export const CHOP_SECONDS = 1.1;
export const WOK_COOK_SECONDS = 9.0;
/** Flame value (0..100) at or above which a toss scores the WOK HEI bonus. */
export const WOK_HEI_MIN = 68;
export const WOK_HEI_POINTS = 25;
/** How many chopped or ready items the cook's tray holds at once. */
export const TRAY_MAX = 4;
/** How many finished plates may wait on the serving counter. */
export const PLATE_MAX = 2;
/** How many order tickets the board holds at once. */
export const ORDER_MAX = 4;

export const ORDER = {
  /** Seconds an order lives before the customer walks away. */
  timeMin: 38,
  timeMax: 52,
  /** Seconds between new orders, before the rush. */
  spawnEvery: 11,
  /** Seconds between new orders during the dinner rush. */
  spawnEveryRush: 6.5,
  basePoints: 100,
  /** Extra points for serving with this much of the order timer left (scaled). */
  timeBonusMax: 60,
  /** Points lost when an order expires (also resets the combo). */
  expirePenalty: 25,
};

export const COMBO = {
  /** Combo multiplier grows one step per served dish, capped here. */
  maxSteps: 5,
  /** Extra points per combo step. */
  perStep: 10,
};

export const PALETTE = {
  skyTop: '#1a1033',
  skyBottom: '#3b1d4e',
  awningRed: '#c0392b',
  awningCream: '#f5e6c8',
  wall: '#2c1f3d',
  floor: '#4a2f23',
  floorLine: '#5d3d2e',
  counter: '#7a4a2b',
  counterTop: '#a06a3f',
  counterEdge: '#e8b04b',
  board: '#241a2e',
  boardFrame: '#e8b04b',
  ticket: '#fdf3d8',
  ticketInk: '#2b2118',
  wok: '#2f2a33',
  wokRim: '#8a7f8a',
  flameLow: '#e67e22',
  flameHigh: '#f1c40f',
  flameCore: '#fde68a',
  plate: '#f8f4ec',
  text: '#fdf3d8',
  muted: '#c9b8a3',
  accent: '#ffb347',
  danger: '#e5534b',
  good: '#7bc96f',
  cookShirt: '#f5f0e6',
  cookApron: '#2e86ab',
  cookSkin: '#e8b88a',
  cookHat: '#f8f4ec',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'wok-hei.best';
