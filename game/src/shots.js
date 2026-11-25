// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a simple autopilot
// (walk to the station the next step needs, chop what the oldest order is missing, toss
// the wok only while the flame burns high, plate and serve), so the frame is what a real
// game looks like and the same seed always gives the same frame. The play and rush scenes
// hold one finished plate back instead of serving it at once, so the cover shows a plate
// ready to serve beside a dish still cooking in the wok.
import { STEP, STATIONS } from './config.js';
import { RECIPE_BY_ID, RECIPES, matchRecipe } from './recipes.js';
import { EVENT_OVER, stationAt } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_LIMIT_SECONDS = 110;
const RUSH_LIMIT_SECONDS = 200;
const END_LIMIT_SECONDS = 200;
const SAMPLE_STEPS = 1;

/** The wok-hei toss only pays off while the flame is this high. */
const HEI_FLAME = 72;

/** Pick the order to cook next: the one the tray already helps most, oldest first. */
function pickTargetOrder(state) {
  let best = null;
  let bestOverlap = -1;
  for (const order of state.orders) {
    const recipe = RECIPE_BY_ID[order.recipeId];
    const overlap = state.tray.filter((id) => recipe.needs.includes(id)).length;
    if (overlap > bestOverlap || (overlap === bestOverlap && best !== null && order.timeLeft < best.timeLeft)) {
      best = order;
      bestOverlap = overlap;
    }
  }
  return best;
}

/** Steer the cook through one step of real play. `holdPlate` keeps a finished plate on
 *  the serving counter instead of serving it, so the cover shows it waiting. While a dish
 *  cooks, the autopilot preps the next order's ingredients in parallel and only runs back
 *  to the wok when the flame is high enough for a WOK HEI toss. */
export function autopilot(state, holdPlate) {
  const input = { direction: 0, action: false, select: null, dump: false };
  const cook = state.cook;
  const station = stationAt(cook.x);

  function goTo(name) {
    const zone = STATIONS[name];
    const centre = zone.x + zone.width / 2;
    const delta = centre - cook.x;
    if (Math.abs(delta) < 12) {
      input.direction = 0;
      return true;
    }
    input.direction = delta > 0 ? 1 : -1;
    return false;
  }

  /** Walk to the chopping board and prepare the next missing ingredient for `recipe`. */
  function prepIngredient(recipe) {
    const missing = recipe.needs.filter((id) => !state.tray.includes(id));
    if (missing.length === 0) return false;
    input.select = missing[0];
    if (goTo('chop') && station === 'chop' && !state.chopping) input.action = true;
    return true;
  }

  // 1. Serve a plate that matches an open order (unless the shot holds plates back).
  if (!holdPlate && state.plates.length > 0) {
    const match = state.plates.some((plate) => state.orders.some((order) => order.recipeId === plate.recipeId));
    if (match) {
      if (goTo('plate') && station === 'plate') input.action = true;
      return input;
    }
  }
  // 1b. A full counter of plates nobody ordered blocks the wok: throw the oldest away.
  if (state.plates.length >= 2 && state.wok.done) {
    if (goTo('plate') && station === 'plate') input.dump = true;
    return input;
  }
  // 2. A finished dish goes to the serving counter.
  if (state.wok.done) {
    if (goTo('plate') && station === 'plate') input.action = true;
    return input;
  }
  // 3. A failed dish gets dumped before anything else can cook.
  if (state.wok.failed) {
    if (goTo('wok') && station === 'wok') input.action = true;
    return input;
  }
  // 4. While the wok cooks: toss when the flame is high, otherwise prep the next dish.
  if (state.wok.cooking) {
    if (state.wok.flame >= HEI_FLAME) {
      if (goTo('wok') && station === 'wok') input.action = true;
      return input;
    }
    const cookingRecipe = matchRecipe(state.wok.contents);
    const nextOrder = state.orders.find((order) => !cookingRecipe || order.recipeId !== cookingRecipe.id)
      || state.orders[0];
    if (nextOrder && state.tray.length < 4) {
      const nextRecipe = RECIPE_BY_ID[nextOrder.recipeId];
      const stillUseful = state.tray.every((id) => nextRecipe.needs.includes(id));
      if (stillUseful && prepIngredient(nextRecipe)) return input;
    }
    if (goTo('wok')) return input;
    return input;
  }
  // 5. A full matching tray goes straight into the wok.
  if (state.tray.length > 0 && matchRecipe(state.tray)) {
    if (goTo('wok') && station === 'wok') input.action = true;
    return input;
  }
  // 6. Otherwise chop what the target order is still missing.
  const targetOrder = pickTargetOrder(state);
  const target = targetOrder ? RECIPE_BY_ID[targetOrder.recipeId] : RECIPES[0];
  const wrong = state.tray.some((id) => !target.needs.includes(id));
  if (wrong) {
    if (goTo('chop') && station === 'chop') input.dump = true;
    return input;
  }
  if (prepIngredient(target)) return input;
  if (goTo('wok') && station === 'wok') input.action = true;
  return input;
}

/** The cover wants every element of a complete cooking game in one frame. */
function isCoverReady(state) {
  return state.orders.length >= 2
    && state.wok.cooking && !state.wok.done
    && state.wok.progress > 0.2 && state.wok.progress < 0.9
    && state.plates.length >= 1
    && (state.tray.length >= 1 || state.chopping !== null);
}

/**
 * Set `world` to the named scene (start, play, rush or end; any other name is start) and
 * return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    world.stageDemo();
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { direction: 0, action: false, select: null, dump: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.reset();
  const holdPlate = name !== 'end';
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'rush' ? RUSH_LIMIT_SECONDS : PLAY_LIMIT_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state, holdPlate), false);
    if (name === 'end' && events & EVENT_OVER) break;
    if (name === 'play' && isCoverReady(world.state)) break;
    if (name === 'rush' && world.state.rush && isCoverReady(world.state)) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}

export { SAMPLE_STEPS };
