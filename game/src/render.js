// Every pixel of the night market, drawn in code: the sky and string lights, the order
// board, the recipe panel, the three stations, the cook, the wok flame, the ingredient
// counter and the title / pause / game-over screens. The renderer only paints the state it
// is given; it never changes it.
import { COOK, FIELD, FONT, PALETTE, STATIONS } from './config.js';
import { INGREDIENT_BY_ID, INGREDIENTS, RECIPE_BY_ID, RECIPES } from './recipes.js';
import { stationAt } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

const BIN = { x: 16, y: 584, width: 118, height: 112, gap: 4 };
const ACTION_BUTTON = { x: 1092, y: 584, width: 172, height: 112 };

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** One ingredient's glyph, drawn from its shape name: no image files anywhere. */
export function drawIngredientIcon(ctx, ingredient, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  if (ingredient.shape === 'rice') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.ellipse(0, 2, radius, radius * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ingredient.accent;
    for (const [dx, dy] of [[-6, -2], [0, -5], [6, -1], [-3, 3], [4, 4]]) {
      ctx.beginPath();
      ctx.arc(dx * radius / 12, dy * radius / 12, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingredient.shape === 'noodle') {
    ctx.strokeStyle = ingredient.color;
    ctx.lineWidth = radius * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const yy = -radius * 0.55 + i * radius * 0.55;
      ctx.moveTo(-radius * 0.8, yy);
      ctx.bezierCurveTo(-radius * 0.3, yy - radius * 0.35, radius * 0.3, yy + radius * 0.35, radius * 0.8, yy);
    }
    ctx.stroke();
  } else if (ingredient.shape === 'egg') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.95, radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ingredient.accent;
    ctx.beginPath();
    ctx.arc(radius * 0.15, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'meat') {
    ctx.fillStyle = ingredient.color;
    roundRect(ctx, -radius * 0.85, -radius * 0.55, radius * 1.7, radius * 1.1, radius * 0.4);
    ctx.fill();
    ctx.fillStyle = ingredient.accent;
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.1, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(radius * 0.35, radius * 0.15, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'shrimp') {
    ctx.strokeStyle = ingredient.color;
    ctx.lineWidth = radius * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.7, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = ingredient.accent;
    ctx.beginPath();
    ctx.arc(radius * 0.62, -radius * 0.45, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient.shape === 'leaf') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.9, radius * 0.55, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ingredient.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, radius * 0.35);
    ctx.lineTo(radius * 0.7, -radius * 0.35);
    ctx.stroke();
  } else if (ingredient.shape === 'chili') {
    ctx.strokeStyle = ingredient.color;
    ctx.lineWidth = radius * 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -radius * 0.4);
    ctx.quadraticCurveTo(0, radius * 0.9, radius * 0.85, -radius * 0.5);
    ctx.stroke();
    ctx.strokeStyle = ingredient.accent;
    ctx.lineWidth = radius * 0.2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.8, -radius * 0.4);
    ctx.lineTo(-radius * 0.95, -radius * 0.75);
    ctx.stroke();
  } else if (ingredient.shape === 'bean') {
    ctx.fillStyle = ingredient.color;
    for (const [dx, dy] of [[-0.45, -0.2], [0.1, 0.25], [0.55, -0.25]]) {
      ctx.beginPath();
      ctx.ellipse(dx * radius, dy * radius, radius * 0.42, radius * 0.26, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ingredient.accent;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // sauce: a small bottle with a drip
    ctx.fillStyle = ingredient.color;
    roundRect(ctx, -radius * 0.4, -radius * 0.8, radius * 0.8, radius * 1.4, radius * 0.25);
    ctx.fill();
    ctx.fillStyle = ingredient.accent;
    ctx.fillRect(-radius * 0.22, -radius * 1.05, radius * 0.44, radius * 0.3);
    ctx.beginPath();
    ctx.arc(0, radius * 0.85, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A finished dish: a white plate with a mound in the recipe's colour and garnish. */
function drawPlatedDish(ctx, recipe, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = recipe.dish;
  ctx.beginPath();
  ctx.ellipse(0, -6, 34, 13, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7bc96f';
  ctx.beginPath();
  ctx.arc(-14, -14, 3, 0, Math.PI * 2);
  ctx.arc(10, -17, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(0, -18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }

  /** Map a click in canvas CSS pixels onto the 1280x720 logical field. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    return { x: (px - offsetX) / scale, y: (py - offsetY) / scale };
  }

  /** The ingredient bin a logical point falls in, or null. */
  function binAt(point) {
    if (point.y < BIN.y || point.y > BIN.y + BIN.height) return null;
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const x = BIN.x + i * (BIN.width + BIN.gap);
      if (point.x >= x && point.x <= x + BIN.width) return INGREDIENTS[i].id;
    }
    return null;
  }

  function actionButtonAt(point) {
    return point.x >= ACTION_BUTTON.x && point.x <= ACTION_BUTTON.x + ACTION_BUTTON.width
      && point.y >= ACTION_BUTTON.y && point.y <= ACTION_BUTTON.y + ACTION_BUTTON.height;
  }

  function drawBackground(state, screen) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Back wall and floor.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 204, FIELD.width, 266);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, COOK.floorY, FIELD.width, 96);
    ctx.fillStyle = PALETTE.floorLine;
    for (let x = 0; x < FIELD.width; x += 90) ctx.fillRect(x, COOK.floorY + 48, 60, 3);
    // Awning stripes over the stall.
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? PALETTE.awningRed : PALETTE.awningCream;
      ctx.fillRect(i * 80, 180, 80, 22);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, 198, FIELD.width, 6);
    // String lights sagging below the awning.
    ctx.strokeStyle = '#3d2b52';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 206);
    ctx.quadraticCurveTo(640, 240, 1280, 206);
    ctx.stroke();
    const bulbColors = ['#ffd166', '#ff7b7b', '#7bc96f', '#6ec6ff'];
    for (let i = 0; i < 17; i += 1) {
      const x = 40 + i * 72;
      const y = 206 + Math.sin((x / 1280) * Math.PI) * 28 + 6;
      ctx.fillStyle = bulbColors[i % bulbColors.length];
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 130, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    // Neon sign (hidden behind the title and game-over overlays, where it would collide
    // with the big headings).
    if (screen !== SCREEN_TITLE && screen !== SCREEN_OVER) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `bold 34px ${FONT}`;
      ctx.fillStyle = '#ff5d8f';
      ctx.shadowColor = '#ff5d8f';
      ctx.shadowBlur = 18;
      ctx.fillText('WOK HEI', 640, 278);
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fillText('★ NASI GORENG ★ PASAR MALAM ★', 640, 300);
      ctx.restore();
    }
  }

  function drawHud(state, best) {
    ctx.fillStyle = 'rgba(16, 10, 26, 0.92)';
    ctx.fillRect(0, 0, FIELD.width, 56);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 24px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('WOK HEI', 16, 36);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText('Nasi Goreng Night Market', 128, 34);
    // Shift timer, centre.
    const urgent = state.remaining <= 30;
    ctx.textAlign = 'center';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillStyle = urgent ? PALETTE.danger : PALETTE.text;
    ctx.fillText(`⏱ ${formatTime(state.remaining)}`, 640, 38);
    if (state.rush) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillText('JAM MAKAN MALAM — RUSH!', 640, 53);
    }
    // Score, right.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText(`Skor ${state.score}`, 1264, 30);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`Saji ${state.served}  •  Kombo x${state.combo}  •  Terbaik ${best}`, 1264, 50);
    ctx.textAlign = 'left';
  }

  function drawOrderBoard(state) {
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, 12, 62, 700, 112, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardFrame;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.boardFrame;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('PAPAN ORDER', 24, 82);
    if (state.orders.length === 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `15px ${FONT}`;
      ctx.fillText('Belum ada order — pelanggan segera datang…', 24, 130);
      return;
    }
    state.orders.forEach((order, index) => {
      const recipe = RECIPE_BY_ID[order.recipeId];
      const x = 24 + index * 170;
      const y = 88;
      ctx.fillStyle = PALETTE.ticket;
      roundRect(ctx, x, y, 160, 78, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.ticketInk;
      ctx.font = `bold 14px ${FONT}`;
      ctx.fillText(recipe.short, x + 10, y + 20);
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = '#7a6a55';
      ctx.fillText(`Rp ${recipe.price}`, x + 10, y + 36);
      recipe.needs.forEach((id, i) => {
        drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], x + 16 + i * 24, y + 52, 9);
      });
      const fraction = Math.max(0, order.timeLeft / order.timeMax);
      ctx.fillStyle = '#e0d5c0';
      roundRect(ctx, x + 10, y + 64, 140, 7, 3);
      ctx.fill();
      ctx.fillStyle = fraction > 0.5 ? PALETTE.good : fraction > 0.25 ? '#e8a33d' : PALETTE.danger;
      roundRect(ctx, x + 10, y + 64, 140 * fraction, 7, 3);
      ctx.fill();
      if (order.timeLeft < 10) {
        ctx.fillStyle = PALETTE.danger;
        ctx.font = `bold 13px ${FONT}`;
        ctx.fillText(`${Math.ceil(order.timeLeft)} dtk!`, x + 118, y + 20);
      }
    });
  }

  function drawRecipePanel() {
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, 724, 62, 544, 112, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardFrame;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.boardFrame;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('MENU — 6 RESEP', 736, 82);
    RECIPES.forEach((recipe, index) => {
      const x = 736 + (index % 3) * 180;
      const y = 100 + Math.floor(index / 3) * 34;
      ctx.fillStyle = PALETTE.text;
      ctx.font = `12px ${FONT}`;
      ctx.fillText(recipe.short, x, y);
      recipe.needs.forEach((id, i) => {
        drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], x + 96 + i * 16, y - 4, 6);
      });
    });
  }

  function drawChopStation(state) {
    const station = STATIONS.chop;
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, station.x, 396, station.width, 74, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(station.x, 396, station.width, 14);
    // Cutting board.
    ctx.fillStyle = '#e8c98f';
    roundRect(ctx, station.x + 40, 372, 170, 30, 6);
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.chopping) {
      const ingredient = INGREDIENT_BY_ID[state.chopping];
      drawIngredientIcon(ctx, ingredient, station.x + 125, 387, 12);
      const fraction = 1 - state.chopTimer / 1.1;
      ctx.fillStyle = '#e0d5c0';
      roundRect(ctx, station.x + 60, 408, 130, 8, 4);
      ctx.fill();
      ctx.fillStyle = PALETTE.good;
      roundRect(ctx, station.x + 60, 408, 130 * fraction, 8, 4);
      ctx.fill();
    } else {
      ctx.fillStyle = '#8a6a45';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('TALENAN', station.x + 125, 392);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('1 · POTONG', station.x + 12, 452);
  }

  function drawWokStation(state) {
    const station = STATIONS.wok;
    const wok = state.wok;
    // Stove body.
    ctx.fillStyle = '#3a3340';
    roundRect(ctx, station.x + 30, 400, station.width - 60, 70, 8);
    ctx.fill();
    ctx.fillStyle = '#241f28';
    ctx.fillRect(station.x + 30, 400, station.width - 60, 10);
    const cx = station.x + station.width / 2;
    const cy = 398;
    // Flame under the wok, breathing with the flame meter.
    const flameHeight = 34 + (wok.flame / 100) * 54 + Math.sin(state.steam * 9) * 5;
    if (wok.cooking || wok.done) {
      const flameGradient = ctx.createLinearGradient(0, cy + 10, 0, cy - flameHeight);
      flameGradient.addColorStop(0, PALETTE.flameLow);
      flameGradient.addColorStop(0.6, PALETTE.flameHigh);
      flameGradient.addColorStop(1, PALETTE.flameCore);
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.moveTo(cx - 62, cy + 12);
      ctx.quadraticCurveTo(cx - 40, cy - flameHeight * 0.5, cx - 12, cy - flameHeight * 0.7);
      ctx.quadraticCurveTo(cx, cy - flameHeight - 8, cx + 12, cy - flameHeight * 0.7);
      ctx.quadraticCurveTo(cx + 40, cy - flameHeight * 0.5, cx + 62, cy + 12);
      ctx.closePath();
      ctx.fill();
    }
    // The wok itself.
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 92, 30, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#453e4a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 92, 26, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.wokRim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, 92, 26, 0, 0, Math.PI);
    ctx.stroke();
    // Ingredients sizzling inside.
    if (wok.contents.length > 0) {
      wok.contents.forEach((id, i) => {
        const angle = (i / wok.contents.length) * Math.PI * 2 + state.steam * 0.4;
        drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], cx + Math.cos(angle) * 46, cy - 8 + Math.sin(angle) * 10, 11);
      });
    }
    // Flame tongues licking around the wok's rim, so the fire reads at a glance.
    if (wok.cooking || wok.done) {
      const tongue = (x, baseY, height) => {
        const tongueGradient = ctx.createLinearGradient(0, baseY, 0, baseY - height);
        tongueGradient.addColorStop(0, PALETTE.flameLow);
        tongueGradient.addColorStop(0.6, PALETTE.flameHigh);
        tongueGradient.addColorStop(1, PALETTE.flameCore);
        ctx.fillStyle = tongueGradient;
        ctx.beginPath();
        ctx.moveTo(x - 9, baseY);
        ctx.quadraticCurveTo(x - 7, baseY - height * 0.6, x, baseY - height);
        ctx.quadraticCurveTo(x + 7, baseY - height * 0.6, x + 9, baseY);
        ctx.closePath();
        ctx.fill();
      };
      const flicker = Math.sin(state.steam * 11) * 4;
      const tall = 16 + (wok.flame / 100) * 26;
      tongue(cx - 88, cy + 6, tall + flicker);
      tongue(cx + 88, cy + 6, tall - flicker);
      tongue(cx - 96, cy + 12, tall * 0.7);
      tongue(cx + 96, cy + 12, tall * 0.7 + flicker);
      // Warm glow under the wok.
      const glow = ctx.createRadialGradient(cx, cy + 16, 10, cx, cy + 16, 120);
      glow.addColorStop(0, `rgba(230, 126, 34, ${0.25 + (wok.flame / 100) * 0.2})`);
      glow.addColorStop(1, 'rgba(230, 126, 34, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 16, 120, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Steam.
    if (wok.cooking) {
      for (let i = 0; i < 5; i += 1) {
        const phase = (state.steam * 0.5 + i * 0.2) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - phase)})`;
        ctx.beginPath();
        ctx.arc(cx - 30 + i * 15 + Math.sin(state.steam * 3 + i) * 6, cy - 30 - phase * 55, 5 + phase * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Cook progress ring + flame meter. The ring leaves a gap at the top so it never
    // touches the neon sign above the wok.
    if (wok.cooking && !wok.done) {
      const ringStart = -Math.PI / 2 + 0.61;
      const ringEnd = -Math.PI / 2 + Math.PI * 2 - 0.61;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 108, ringStart, ringEnd);
      ctx.stroke();
      ctx.strokeStyle = wok.flame >= 68 ? PALETTE.flameHigh : PALETTE.accent;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 108, ringStart, ringStart + (ringEnd - ringStart) * wok.progress);
      ctx.stroke();
      // Flame meter bar.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, cx - 70, cy + 34, 140, 12, 6);
      ctx.fill();
      const flameGradient = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
      flameGradient.addColorStop(0, '#e67e22');
      flameGradient.addColorStop(0.68, '#f1c40f');
      flameGradient.addColorStop(1, '#ff5d8f');
      ctx.fillStyle = flameGradient;
      roundRect(ctx, cx - 70, cy + 34, 140 * (wok.flame / 100), 12, 6);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(wok.flame >= 68 ? 'WOK HEI! LEMPAR SEKARANG!' : 'API', cx, cy + 62);
      ctx.textAlign = 'left';
    }
    if (wok.flash > 0) {
      ctx.fillStyle = `rgba(253, 230, 138, ${wok.flash * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a4a00';
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('WOK HEI!', cx, cy - 60);
      ctx.textAlign = 'left';
    }
    if (wok.done) {
      ctx.fillStyle = PALETTE.good;
      roundRect(ctx, cx - 44, cy - 78, 88, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#12330f';
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('SIAP!', cx, cy - 60);
      ctx.textAlign = 'left';
    }
    if (wok.failed) {
      ctx.fillStyle = PALETTE.danger;
      roundRect(ctx, cx - 52, cy - 78, 104, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('GAGAL — BUANG!', cx, cy - 60);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('2 · WOK', station.x + 12, 452);
  }

  function drawPlateStation(state) {
    const station = STATIONS.plate;
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, station.x, 396, station.width, 74, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(station.x, 396, station.width, 14);
    // Stack of clean plates.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = PALETTE.plate;
      ctx.beginPath();
      ctx.ellipse(station.x + 56, 392 - i * 7, 40, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8cfc0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Plated dishes waiting to be served.
    state.plates.forEach((plate, i) => {
      drawPlatedDish(ctx, RECIPE_BY_ID[plate.recipeId], station.x + 170 + i * 78, 384, 1);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(RECIPE_BY_ID[plate.recipeId].short, station.x + 170 + i * 78, 408);
      ctx.textAlign = 'left';
    });
    if (state.plates.length === 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `13px ${FONT}`;
      ctx.fillText('Belum ada piring saji', station.x + 150, 392);
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('3 · SAJI', station.x + 12, 452);
  }

  function drawCook(state) {
    const cook = state.cook;
    const bob = cook.moving ? Math.sin(cook.walkPhase) * 3 : Math.sin(state.steam * 2) * 1.5;
    const x = cook.x;
    const feet = COOK.floorY;
    const top = feet - COOK.height + bob;
    ctx.save();
    ctx.translate(x, 0);
    if (cook.facing < 0) ctx.scale(-1, 1);
    // Legs.
    ctx.fillStyle = '#3a3340';
    ctx.fillRect(-14, feet - 26, 11, 26);
    ctx.fillRect(3, feet - 26, 11, 26);
    // Body + apron.
    ctx.fillStyle = PALETTE.cookShirt;
    roundRect(ctx, -22, top + 42, 44, 32, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.cookApron;
    roundRect(ctx, -16, top + 52, 32, 22, 6);
    ctx.fill();
    // Arms reaching toward the station.
    ctx.strokeStyle = PALETTE.cookShirt;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(14, top + 50);
    ctx.lineTo(30, top + 62);
    ctx.stroke();
    // Head.
    ctx.fillStyle = PALETTE.cookSkin;
    ctx.beginPath();
    ctx.arc(0, top + 28, 17, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = PALETTE.cookHat;
    ctx.beginPath();
    ctx.arc(-10, top + 12, 10, 0, Math.PI * 2);
    ctx.arc(0, top + 8, 11, 0, Math.PI * 2);
    ctx.arc(10, top + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-16, top + 12, 32, 8);
    // Face.
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(-6, top + 28, 2, 0, Math.PI * 2);
    ctx.arc(6, top + 28, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, top + 32, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
    // The tray the cook carries, floating just above the hat.
    if (state.tray.length > 0 || state.chopping) {
      const trayWidth = Math.max(1, state.tray.length) * 26 + 12;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, x - trayWidth / 2, top - 26, trayWidth, 24, 8);
      ctx.fill();
      state.tray.forEach((id, i) => {
        drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], x - trayWidth / 2 + 20 + i * 26, top - 14, 9);
      });
      if (state.chopping) {
        ctx.fillStyle = PALETTE.accent;
        ctx.font = `bold 12px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('…', x - trayWidth / 2 + 20 + state.tray.length * 26, top - 10);
        ctx.textAlign = 'left';
      }
    }
    // Station hint above the cook.
    const station = stationAt(cook.x);
    if (station) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      const label = STATIONS[station].label;
      ctx.font = `bold 12px ${FONT}`;
      const width = ctx.measureText(label).width + 18;
      roundRect(ctx, x - width / 2, top - 52, width, 20, 10);
      ctx.fill();
      ctx.fillStyle = PALETTE.accent;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, top - 38);
      ctx.textAlign = 'left';
    }
  }

  function drawCounter(state) {
    ctx.fillStyle = '#241a2e';
    ctx.fillRect(0, 566, FIELD.width, 154);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.fillText('BAHAN — klik atau tekan 1–9 untuk memilih  •  ← → gerak  •  SPACE aksi  •  X buang isi nampan  •  P jeda', 16, 580);
    INGREDIENTS.forEach((ingredient, i) => {
      const x = BIN.x + i * (BIN.width + BIN.gap);
      const selected = state.selected === ingredient.id;
      ctx.fillStyle = selected ? '#4a3421' : '#33263d';
      roundRect(ctx, x, BIN.y, BIN.width, BIN.height, 8);
      ctx.fill();
      ctx.strokeStyle = selected ? PALETTE.accent : '#4a3a55';
      ctx.lineWidth = selected ? 3 : 1;
      ctx.stroke();
      drawIngredientIcon(ctx, ingredient, x + BIN.width / 2, BIN.y + 34, 20);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(ingredient.name, x + BIN.width / 2, BIN.y + 70);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `11px ${FONT}`;
      ctx.fillText(ingredient.chop ? `potong · ${ingredient.key}` : `siap · ${ingredient.key}`, x + BIN.width / 2, BIN.y + 88);
      ctx.textAlign = 'left';
    });
    // The big context action button (mouse players press this instead of Space).
    const station = stationAt(state.cook.x);
    let label = 'PILIH STASIUN';
    if (station === 'chop') label = state.chopping ? 'MEMOTONG…' : `POTONG ${INGREDIENT_BY_ID[state.selected].name.toUpperCase()}`;
    else if (station === 'wok') {
      if (state.wok.failed) label = 'BUANG MASAKAN';
      else if (state.wok.done) label = 'BAWA KE SAJI →';
      else if (state.wok.cooking) label = state.wok.flame >= 68 ? 'LEMPAR! WOK HEI!' : 'ADUK / LEMPAR';
      else if (state.tray.length > 0) label = 'MASUKKAN KE WOK';
      else label = 'WOK KOSONG';
    } else if (station === 'plate') {
      if (state.wok.done) label = 'PLATING';
      else if (state.plates.length > 0) label = 'SAJIKAN!';
      else label = 'BELUM ADA PIRING';
    }
    ctx.fillStyle = station ? PALETTE.accent : '#4a3a55';
    roundRect(ctx, ACTION_BUTTON.x, ACTION_BUTTON.y, ACTION_BUTTON.width, ACTION_BUTTON.height, 10);
    ctx.fill();
    ctx.fillStyle = station ? '#2b1c05' : PALETTE.muted;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    const words = label.split(' ');
    if (words.length > 2) {
      ctx.fillText(words.slice(0, 2).join(' '), ACTION_BUTTON.x + ACTION_BUTTON.width / 2, ACTION_BUTTON.y + 48);
      ctx.fillText(words.slice(2).join(' '), ACTION_BUTTON.x + ACTION_BUTTON.width / 2, ACTION_BUTTON.y + 70);
    } else {
      ctx.fillText(label, ACTION_BUTTON.x + ACTION_BUTTON.width / 2, ACTION_BUTTON.y + 58);
    }
    ctx.font = `11px ${FONT}`;
    ctx.fillText('[ SPACE / klik ]', ACTION_BUTTON.x + ACTION_BUTTON.width / 2, ACTION_BUTTON.y + 92);
    ctx.textAlign = 'left';
  }

  function drawKitchen(state) {
    drawChopStation(state);
    drawWokStation(state);
    drawPlateStation(state);
    drawCook(state);
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(12, 7, 22, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 72px ${FONT}`;
    ctx.fillText('WOK HEI', 640, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('Nasi Goreng Night Market', 640, 232);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `18px ${FONT}`;
    ctx.fillText('Pasar malam paling sibuk di kota — satu wajan, enam resep, dan pelanggan yang tidak sabar.', 640, 268);
    const lines = [
      '1 · POTONG bahan di talenan (pilih bahan 1–9, SPACE untuk memotong)',
      '2 · WOK: masukkan isi nampan, lalu LEMPAR saat api penuh — WOK HEI! +25 poin',
      '3 · SAJI: plating lalu sajikan ke order yang cocok sebelum timernya habis',
      'Shift 3 menit. Jam makan malam = RUSH: order datang lebih cepat!',
    ];
    ctx.fillStyle = PALETTE.text;
    ctx.font = `17px ${FONT}`;
    lines.forEach((line, i) => ctx.fillText(line, 640, 330 + i * 30));
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('Tekan SPACE atau klik untuk mulai memasak', 640, 500);
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `16px ${FONT}`;
      ctx.fillText(`Skor terbaik: ${best}`, 640, 534);
    }
    ctx.textAlign = 'left';
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(12, 7, 22, 0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 48px ${FONT}`;
    ctx.fillText('JEDA', 640, 340);
    ctx.font = `18px ${FONT}`;
    ctx.fillText('Tekan P atau SPACE untuk lanjut memasak', 640, 380);
    ctx.textAlign = 'left';
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(12, 7, 22, 0.84)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 52px ${FONT}`;
    ctx.fillText('SHIFT SELESAI!', 640, 180);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(`Skor akhir: ${state.score}`, 640, 236);
    if (state.score >= best && state.score > 0) {
      ctx.fillStyle = PALETTE.good;
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText('★ Skor terbaik baru! ★', 640, 268);
    }
    const rows = [
      `Hidangan tersaji: ${state.served}`,
      `Kombo terbaik: x${state.bestCombo}`,
      `Lemparan WOK HEI: ${state.wokHei}`,
      `Order hangus: ${state.expired}  •  Masakan gagal: ${state.failed}`,
    ];
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    rows.forEach((row, i) => ctx.fillText(row, 640, 330 + i * 32));
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('Tekan SPACE atau klik untuk masak lagi', 640, 500);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#11141b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawBackground(state, screen);
    drawHud(state, best);
    drawOrderBoard(state);
    drawRecipePanel();
    drawKitchen(state);
    drawCounter(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw, resize, toLogical, binAt, actionButtonAt };
}
