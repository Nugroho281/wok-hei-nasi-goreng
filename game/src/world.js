// The game's rules and state, with no drawing and no browser in it: the cook, the three
// stations (chop, wok, plate), the order board, the tray, the wok with its flame-timing
// toss, scoring and the dinner shift. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react (sounds, announcements) without the world
// knowing about screens or sound. Nothing here allocates after createWorld returns.
import {
  CHOP_SECONDS, COMBO, COOK, FIELD, ORDER, ORDER_MAX, PLATE_MAX, RUSH_AT_REMAINING,
  SHIFT_SECONDS, STATIONS, TRAY_MAX, WOK_COOK_SECONDS, WOK_HEI_MIN, WOK_HEI_POINTS,
} from './config.js';
import { INGREDIENT_BY_ID, RECIPE_BY_ID, isPartialMatch, matchRecipe, RECIPES } from './recipes.js';

export const EVENT_CHOP_DONE = 1;
export const EVENT_TOSS = 2;
export const EVENT_WOK_HEI = 4;
export const EVENT_WOK_DONE = 8;
export const EVENT_PLATE = 16;
export const EVENT_SERVE = 32;
export const EVENT_EXPIRE = 64;
export const EVENT_FAIL = 128;
export const EVENT_OVER = 256;
export const EVENT_TRAY_FULL = 512;
export const EVENT_NO_MATCH = 1024;
export const EVENT_RUSH = 2048;

/** Which station the cook's centre stands in, or null when between stations. */
export function stationAt(x) {
  for (const name of Object.keys(STATIONS)) {
    const station = STATIONS[name];
    if (x >= station.x && x <= station.x + station.width) return name;
  }
  return null;
}

export function createWorld(random) {
  const cook = { x: FIELD.width / 2, targetX: null, facing: 1, walkPhase: 0, moving: false };
  const wok = { contents: [], cooking: false, progress: 0, flame: 30, flameDir: 1, done: false, failed: false, flash: 0 };
  const state = {
    cook, wok,
    selected: 'nasi',
    tray: [],
    plates: [],
    orders: [],
    score: 0,
    served: 0,
    failed: 0,
    expired: 0,
    combo: 0,
    bestCombo: 0,
    wokHei: 0,
    elapsed: 0,
    remaining: SHIFT_SECONDS,
    rush: false,
    spawnTimer: 4,
    nextOrderId: 1,
    chopping: null,
    chopTimer: 0,
    over: false,
    steam: 0,
  };

  function reset() {
    cook.x = FIELD.width / 2;
    cook.targetX = null;
    cook.facing = 1;
    cook.walkPhase = 0;
    cook.moving = false;
    wok.contents.length = 0;
    wok.cooking = false;
    wok.progress = 0;
    wok.flame = 30;
    wok.flameDir = 1;
    wok.done = false;
    wok.failed = false;
    wok.flash = 0;
    state.selected = 'nasi';
    state.tray.length = 0;
    state.plates.length = 0;
    state.orders.length = 0;
    state.score = 0;
    state.served = 0;
    state.failed = 0;
    state.expired = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.wokHei = 0;
    state.elapsed = 0;
    state.remaining = SHIFT_SECONDS;
    state.rush = false;
    state.spawnTimer = 4;
    state.nextOrderId = 1;
    state.chopping = null;
    state.chopTimer = 0;
    state.over = false;
    state.steam = 0;
  }

  function spawnOrder() {
    if (state.orders.length >= ORDER_MAX) return;
    const recipe = RECIPES[Math.floor(random() * RECIPES.length)];
    const timeMax = state.rush
      ? 30 + random() * 12
      : ORDER.timeMin + random() * (ORDER.timeMax - ORDER.timeMin);
    state.orders.push({ id: state.nextOrderId, recipeId: recipe.id, timeLeft: timeMax, timeMax });
    state.nextOrderId += 1;
  }

  function doAction() {
    const station = stationAt(cook.x);
    if (!station) return 0;
    if (station === 'chop') {
      if (state.chopping) return 0;
      if (state.tray.length >= TRAY_MAX) return EVENT_TRAY_FULL;
      const ingredient = INGREDIENT_BY_ID[state.selected];
      if (!ingredient) return 0;
      if (ingredient.chop) {
        state.chopping = ingredient.id;
        state.chopTimer = CHOP_SECONDS;
      } else {
        state.tray.push(ingredient.id);
      }
      return 0;
    }
    if (station === 'wok') {
      if (wok.failed) {
        wok.contents.length = 0;
        wok.failed = false;
        wok.cooking = false;
        wok.progress = 0;
        state.failed += 1;
        return EVENT_FAIL;
      }
      if (!wok.cooking && !wok.done) {
        if (state.tray.length === 0) return 0;
        wok.contents = [...state.tray];
        state.tray.length = 0;
        wok.cooking = true;
        wok.progress = 0;
        wok.flame = 45;
        wok.flameDir = 1;
        if (!matchRecipe(wok.contents)) {
          wok.failed = true;
          wok.cooking = false;
        }
        return EVENT_TOSS;
      }
      if (wok.cooking && !wok.done) {
        // The toss: only a toss while the flame burns high earns the WOK HEI bonus.
        if (wok.flame >= WOK_HEI_MIN) {
          wok.progress = Math.min(1, wok.progress + 0.15);
          wok.flame = 38;
          wok.flash = 0.5;
          state.wokHei += 1;
          state.score += WOK_HEI_POINTS;
          return EVENT_WOK_HEI;
        }
        wok.progress = Math.min(1, wok.progress + 0.04);
        return EVENT_TOSS;
      }
      return 0;
    }
    // plate station
    if (wok.done && state.plates.length < PLATE_MAX) {
      const recipe = matchRecipe(wok.contents);
      wok.contents.length = 0;
      wok.cooking = false;
      wok.done = false;
      wok.progress = 0;
      if (recipe) state.plates.push({ recipeId: recipe.id });
      return EVENT_PLATE;
    }
    if (state.plates.length > 0) {
      // Serve the first plate that matches an open order, not just the oldest plate:
      // a stale plate must never block a fresh one behind it.
      const plateIndex = state.plates.findIndex((plate) => state.orders.some((order) => order.recipeId === plate.recipeId));
      if (plateIndex === -1) return EVENT_NO_MATCH;
      const plate = state.plates[plateIndex];
      const orderIndex = state.orders.findIndex((order) => order.recipeId === plate.recipeId);
      const order = state.orders[orderIndex];
      const recipe = RECIPE_BY_ID[plate.recipeId];
      const timeBonus = Math.round(ORDER.timeBonusMax * (order.timeLeft / order.timeMax));
      const comboBonus = Math.min(state.combo, COMBO.maxSteps) * COMBO.perStep;
      state.score += recipe.price + timeBonus + comboBonus;
      state.served += 1;
      state.combo += 1;
      if (state.combo > state.bestCombo) state.bestCombo = state.combo;
      state.orders.splice(orderIndex, 1);
      state.plates.splice(plateIndex, 1);
      return EVENT_SERVE;
    }
    return 0;
  }

  function step(dt, input, attract) {
    let events = 0;
    state.steam += dt;
    if (wok.flash > 0) wok.flash = Math.max(0, wok.flash - dt);

    // The cook walks toward a clicked station, or steers with the keys.
    let direction = input.direction || 0;
    if (cook.targetX !== null) {
      const delta = cook.targetX - cook.x;
      if (Math.abs(delta) < 6) {
        cook.targetX = null;
        direction = 0;
      } else direction = delta > 0 ? 1 : -1;
    }
    if (direction !== 0) {
      cook.facing = direction;
      cook.moving = true;
      cook.walkPhase += dt * 10;
      cook.x = Math.min(FIELD.width - COOK.width / 2, Math.max(COOK.width / 2, cook.x + direction * COOK.speed * dt));
    } else {
      cook.moving = false;
    }

    if (input.select) state.selected = input.select;
    if (input.dump && stationAt(cook.x) === 'chop') {
      state.tray.length = 0;
      state.chopping = null;
      state.chopTimer = 0;
    }
    // At the serving counter, dump throws away the oldest waiting plate: the escape
    // hatch when the counter is full of dishes no open order wants.
    if (input.dump && stationAt(cook.x) === 'plate' && state.plates.length > 0) {
      state.plates.shift();
    }
    if (input.action) events |= doAction();

    // Chopping finishes on its own clock.
    if (state.chopping) {
      state.chopTimer -= dt;
      if (state.chopTimer <= 0) {
        state.tray.push(state.chopping);
        state.chopping = null;
        events |= EVENT_CHOP_DONE;
      }
    }

    // The wok flame breathes up and down; cooking speeds up on a high flame.
    if (wok.cooking && !wok.done) {
      wok.flame += wok.flameDir * dt * 44;
      if (wok.flame >= 100) { wok.flame = 100; wok.flameDir = -1; }
      if (wok.flame <= 8) { wok.flame = 8; wok.flameDir = 1; }
      wok.progress += (dt / WOK_COOK_SECONDS) * (1 + wok.flame / 220);
      if (wok.progress >= 1) {
        wok.progress = 1;
        wok.done = true;
        events |= EVENT_WOK_DONE;
      }
    }

    if (!attract) {
      state.elapsed += dt;
      state.remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
      if (!state.rush && state.remaining <= RUSH_AT_REMAINING) {
        state.rush = true;
        events |= EVENT_RUSH;
      }
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnOrder();
        state.spawnTimer = state.rush ? ORDER.spawnEveryRush : ORDER.spawnEvery;
      }
      for (let index = state.orders.length - 1; index >= 0; index -= 1) {
        const order = state.orders[index];
        order.timeLeft -= dt;
        if (order.timeLeft <= 0) {
          state.orders.splice(index, 1);
          state.expired += 1;
          state.combo = 0;
          state.score = Math.max(0, state.score - ORDER.expirePenalty);
          events |= EVENT_EXPIRE;
        }
      }
      if (state.remaining <= 0 && !state.over) {
        state.over = true;
        events |= EVENT_OVER;
      }
    } else {
      // Attract mode (title screen): orders arrive and tick but never expire or end.
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnOrder();
        state.spawnTimer = ORDER.spawnEvery;
      }
      for (const order of state.orders) {
        order.timeLeft -= dt;
        if (order.timeLeft < 8) order.timeLeft = order.timeMax;
      }
    }
    return events;
  }

  /** Stage the title screen's kitchen: orders on the board, a dish mid-cook in the wok,
   *  a plate ready on the serving counter, ingredients waiting on the counter. */
  function stageDemo() {
    reset();
    state.orders.push(
      { id: 1, recipeId: 'ayam', timeLeft: 34, timeMax: 48 },
      { id: 2, recipeId: 'seafood', timeLeft: 26, timeMax: 44 },
      { id: 3, recipeId: 'mie', timeLeft: 41, timeMax: 50 },
    );
    state.nextOrderId = 4;
    state.tray.push('nasi', 'telur');
    state.selected = 'ayam';
    state.chopping = 'ayam';
    state.chopTimer = 0.6;
    wok.contents = ['nasi', 'ayam', 'telur', 'kecap'];
    wok.cooking = true;
    wok.progress = 0.55;
    wok.flame = 82;
    wok.flameDir = 1;
    state.plates.push({ recipeId: 'biasa' });
    state.score = 340;
    state.served = 3;
    state.combo = 2;
    state.remaining = 132;
    state.elapsed = SHIFT_SECONDS - 132;
    cook.x = 640;
  }

  return {
    state,
    reset,
    step,
    stageDemo,
    stationAt,
    matchRecipe,
    isPartialMatch,
  };
}
