// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over. Clicks
// land on ingredient bins (pick one), on a station (walk there, or act when already
// there) or on the big action button (act); anywhere else the cook walks toward the click.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, COOK, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { INGREDIENT_BY_ID } from './recipes.js';
import { createWorld, EVENT_CHOP_DONE, EVENT_EXPIRE, EVENT_FAIL, EVENT_NO_MATCH, EVENT_OVER, EVENT_PLATE, EVENT_RUSH, EVENT_SERVE, EVENT_TOSS, EVENT_TRAY_FULL, EVENT_WOK_DONE, EVENT_WOK_HEI, stationAt } from './world.js';
import { ACTION_CONFIRM, ACTION_DUMP, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;
const NO_INPUT = { direction: 0, action: false, select: null, dump: false };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const shotStatus = document.getElementById('shotstatus');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Verification hook: the live world state, readable from the console.
window.__wokhei = world;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      if (shotStatus) shotStatus.textContent = 'ready';
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let pendingAction = false;
  let pendingDump = false;

  world.stageDemo();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    pendingAction = false;
    pendingDump = false;
    screen = SCREEN_PLAY;
    announce('Memasak! Terima order, potong bahan, masak di wok, sajikan tepat waktu.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_CHOP_DONE) audio.chop();
    if (events & EVENT_TOSS) audio.toss();
    if (events & EVENT_WOK_HEI) {
      audio.wokHei();
      announce('WOK HEI! Bonus 25 poin.');
    }
    if (events & EVENT_WOK_DONE) {
      audio.ding();
      announce('Masakan matang — bawa ke stasiun saji!');
    }
    if (events & EVENT_PLATE) audio.click();
    if (events & EVENT_SERVE) {
      audio.serve();
      announce(`Tersaji! Skor ${world.state.score}.`);
    }
    if (events & EVENT_EXPIRE) {
      audio.bad();
      announce('Satu order hangus — pelanggan pergi.');
    }
    if (events & EVENT_FAIL) {
      audio.bad();
      announce('Masakan gagal — resepnya tidak cocok.');
    }
    if (events & EVENT_TRAY_FULL) announce('Nampan penuh — masukkan dulu ke wok.');
    if (events & EVENT_NO_MATCH) announce('Tidak ada order yang cocok dengan piring ini.');
    if (events & EVENT_RUSH) announce('Jam makan malam! Order datang lebih cepat!');
  }

  /** Turn one click into a walk target, an ingredient pick or an action. */
  function handleClick(point) {
    const logical = renderer.toLogical(point.x, point.y);
    const bin = renderer.binAt(logical);
    if (bin) {
      world.state.selected = bin;
      audio.click();
      return;
    }
    if (renderer.actionButtonAt(logical)) {
      pendingAction = true;
      return;
    }
    const station = stationAt(logical.x);
    if (station && stationAt(world.state.cook.x) === station) {
      pendingAction = true;
      return;
    }
    world.state.cook.targetX = Math.min(FIELD.width - COOK.width / 2, Math.max(COOK.width / 2, logical.x));
  }

  function handleActions() {
    for (const select of input.takeSelects()) {
      if (INGREDIENT_BY_ID[select]) {
        world.state.selected = select;
        audio.click();
      }
    }
    for (const click of input.takeClicks()) handleClick(click);
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      pendingAction = true;
    }
    if (actions & ACTION_DUMP) pendingDump = true;
    if (pendingAction && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      pendingAction = false;
      pendingDump = false;
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if ((actions & (ACTION_PAUSE | ACTION_CONFIRM)) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Lanjut memasak.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, NO_INPUT, true);
      return;
    }
    const worldInput = {
      direction: input.direction(),
      action: pendingAction,
      select: null,
      dump: pendingDump,
    };
    pendingAction = false;
    pendingDump = false;
    const events = world.step(STEP, worldInput, false);
    playEvents(events);
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('WOK HEI — Nasi Goreng Night Market. Tekan Space atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
