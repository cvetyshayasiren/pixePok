/**
 * Рисование вертикальной городской локации.
 * Каждая локация — свой силуэт домов, но общая палитра и освещение.
 */
import { CONFIG, PALETTE } from "../config.js";
import { lerpColor, mulColor } from "./pixel.js";
import { getSkyColors, getLight, getSunPos, getMoonPos, isNightish } from "./time.js";
import { amount } from "./weather.js";

const W = CONFIG.WIDTH;
const H = CONFIG.HEIGHT;
const GROUND = 214;

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w, h);
}

function windowGlow(ctx, x, y, lit, night) {
  const on = lit > 0.4;
  px(ctx, x, y, 6, 7, on ? "#ffcd75" : night ? "#1a1c2c" : "#cfe8ff");
  px(ctx, x + 1, y + 1, 2, 2, on ? "#fff1e8" : night ? "#333c57" : "#e8f4ff");
  px(ctx, x + 3, y + 1, 2, 2, on ? "#ef7d57" : night ? "#1a1c2c" : "#94b0c2");
}

function drawHouse(ctx, x, y, w, h, roofH, brick, roof, light, night, seed) {
  px(ctx, x, y, w, h, brick);
  px(ctx, x, y + h - 3, w, 3, mulColor(brick, 0.72));
  // Крыша
  for (let i = 0; i < roofH; i++) {
    const inset = Math.floor((i / roofH) * 4);
    px(ctx, x - 2 + inset, y - roofH + i, w + 4 - inset * 2, 1, i < 2 ? mulColor(roof, 1.15) : roof);
  }
  // Окна
  const cols = Math.max(1, Math.floor((w - 8) / 12));
  const rows = Math.max(1, Math.floor((h - 10) / 16));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 4 + c * 12;
      const wy = y + 6 + r * 16;
      const flicker = ((seed * 17 + r * 13 + c * 9) % 10) / 10;
      const lit = light.lamps * (flicker > 0.25 ? 1 : 0.2);
      windowGlow(ctx, wx, wy, lit, night);
    }
  }
  // Дверь
  px(ctx, x + (w >> 1) - 4, y + h - 16, 8, 16, "#5d275d");
  px(ctx, x + (w >> 1) - 3, y + h - 15, 6, 14, "#8f563b");
  px(ctx, x + (w >> 1) + 1, y + h - 9, 1, 1, "#ffcd75");
}

function drawTree(ctx, tree, t, wind, night) {
  const { x, y, h } = tree;
  const sway = Math.sin(t * 1.4 + x) * (1 + wind * 2);
  px(ctx, x + 3, y - h + 10, 4, h - 10, night ? "#3a2418" : "#8f563b");
  const leaf = night ? "#1d4a3a" : "#257179";
  const leaf2 = night ? "#38b764" : "#38b764";
  const cx = x + 4 + sway;
  px(ctx, cx - 10, y - h, 22, 14, leaf);
  px(ctx, cx - 7, y - h - 8, 16, 12, leaf2);
  px(ctx, cx - 4, y - h - 12, 10, 8, "#a7f070");
}

function drawLamp(ctx, lamp, light, t) {
  const { x, y } = lamp;
  px(ctx, x, y - 28, 3, 28, "#333c57");
  px(ctx, x - 3, y - 32, 9, 6, "#1a1c2c");
  const on = light.lamps;
  if (on > 0.08) {
    const flicker = 0.85 + Math.sin(t * 9 + x) * 0.08;
    ctx.globalAlpha = on * flicker * 0.55;
    px(ctx, x - 10, y - 26, 23, 26, "#ffcd75");
    ctx.globalAlpha = on * flicker;
    px(ctx, x - 2, y - 31, 7, 5, "#fff1e8");
    ctx.globalAlpha = 1;
  } else {
    px(ctx, x - 2, y - 31, 7, 5, "#566c86");
  }
}

function drawClouds(ctx, clouds, t, wind) {
  ctx.fillStyle = "#f4f4f4";
  ctx.globalAlpha = 0.55;
  for (const c of clouds) {
    const x = (c.x + t * c.spd * (1 + wind)) % (W + 40) - 20;
    px(ctx, x, c.y, 18, 5, "#f4f4f4");
    px(ctx, x + 4, c.y - 3, 12, 4, "#fff1e8");
    px(ctx, x + 8, c.y + 2, 10, 3, "#94b0c2");
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx, stars, nightAmt) {
  if (nightAmt < 0.08) return;
  for (const s of stars) {
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.ph));
    ctx.globalAlpha = nightAmt * tw;
    ctx.fillStyle = s.big ? "#fff1e8" : "#94b0c2";
    ctx.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}

function drawSun(ctx, sun) {
  if (!sun.visible) return;
  ctx.globalAlpha = sun.alpha;
  px(ctx, sun.x - 7, sun.y - 7, 14, 14, "#ffcd75");
  px(ctx, sun.x - 5, sun.y - 5, 10, 10, "#fff1e8");
  ctx.globalAlpha = sun.alpha * 0.25;
  px(ctx, sun.x - 12, sun.y - 12, 24, 24, "#ffcd75");
  ctx.globalAlpha = 1;
}

function drawMoon(ctx, moon) {
  if (!moon.visible) return;
  ctx.globalAlpha = moon.alpha;
  px(ctx, moon.x - 6, moon.y - 6, 12, 12, "#f4f4f4");
  px(ctx, moon.x - 4, moon.y - 4, 5, 5, "#94b0c2");
  px(ctx, moon.x + 1, moon.y + 1, 3, 3, "#cfe8ff");
  ctx.globalAlpha = 1;
}

function drawBirds(ctx, birds, t) {
  ctx.fillStyle = "#1a1c2c";
  for (const b of birds) {
    const x = b.x;
    const y = b.y + Math.sin(t * b.flap + b.ph) * 3;
    const wing = Math.sin(t * b.flap * 2 + b.ph) > 0 ? 1 : -1;
    px(ctx, x, y, 3, 1, "#1a1c2c");
    px(ctx, x - 3, y + wing, 3, 1, "#1a1c2c");
    px(ctx, x + 3, y + wing, 3, 1, "#1a1c2c");
  }
}

function drawSmoke(ctx, puffs) {
  ctx.fillStyle = "#94b0c2";
  for (const p of puffs) {
    ctx.globalAlpha = p.a;
    px(ctx, p.x, p.y, p.s, p.s, "#94b0c2");
  }
  ctx.globalAlpha = 1;
}

function drawSkyGradient(ctx, sky) {
  // Три полосы с ручной интерполяцией — без blur, пиксельно.
  for (let y = 0; y < GROUND; y++) {
    const t = y / GROUND;
    let c;
    if (t < 0.45) c = lerpColor(sky.top, sky.mid, t / 0.45);
    else c = lerpColor(sky.mid, sky.bot, (t - 0.45) / 0.55);
    px(ctx, 0, y, W, 1, c);
  }
}

function drawSunset(ctx, loc, light, night) {
  drawHouse(ctx, 18, 128, 52, 86, 16, "#b13e53", "#5d275d", light, night, 3);
  drawHouse(ctx, 78, 108, 46, 106, 18, "#8f563b", "#b13e53", light, night, 7);
  drawHouse(ctx, 112, 140, 40, 74, 12, "#566c86", "#29366f", light, night, 11);
  px(ctx, 0, GROUND, W, H - GROUND, "#3a5a40");
  px(ctx, 0, GROUND, W, 3, "#257179");
  px(ctx, 20, GROUND + 8, W - 40, 18, "#4a4a58");
  px(ctx, 20, GROUND + 16, W - 40, 2, "#ffcd75");
}

function drawPark(ctx, loc, light, night) {
  drawHouse(ctx, 8, 150, 36, 64, 12, "#8f563b", "#5d275d", light, night, 2);
  drawHouse(ctx, 118, 158, 34, 56, 10, "#b13e53", "#29366f", light, night, 5);
  px(ctx, 0, GROUND, W, H - GROUND, "#257179");
  px(ctx, 0, GROUND, W, 4, "#38b764");
  px(ctx, 54, GROUND + 10, 18, 4, "#8f563b");
  px(ctx, 100, GROUND + 10, 18, 4, "#8f563b");
  // Кусты
  px(ctx, 40, GROUND - 8, 22, 8, "#38b764");
  px(ctx, 86, GROUND - 10, 18, 10, "#1d4a3a");
}

function drawNeon(ctx, loc, light, night) {
  drawHouse(ctx, 6, 40, 44, 174, 8, "#333c57", "#1a1c2c", light, night, 13);
  drawHouse(ctx, 56, 70, 48, 144, 10, "#5d275d", "#b13e53", light, night, 17);
  drawHouse(ctx, 110, 28, 44, 186, 8, "#29366f", "#1a1c2c", light, night, 19);
  // Вывески
  px(ctx, 18, 90, 22, 6, "#ef7d57");
  px(ctx, 64, 110, 28, 5, "#41a6f6");
  px(ctx, 120, 78, 20, 6, "#ffcd75");
  px(ctx, 0, GROUND, W, H - GROUND, "#1a1c2c");
  px(ctx, 0, GROUND, W, 2, "#5d275d");
  px(ctx, 8, GROUND + 12, W - 16, 14, "#333c57");
}

function drawHarbor(ctx, loc, light, night) {
  // Вода
  px(ctx, 0, 188, W, H - 188, night ? "#1a1c2c" : "#29366f");
  px(ctx, 0, 188, W, 3, "#41a6f6");
  for (let i = 0; i < 8; i++) {
    px(ctx, 10 + i * 18, 196 + (i % 3), 10, 1, "#73eff7");
  }
  drawHouse(ctx, 12, 128, 50, 60, 8, "#8f563b", "#5d275d", light, night, 4);
  drawHouse(ctx, 70, 118, 40, 70, 6, "#566c86", "#1a1c2c", light, night, 8);
  // Ящики
  px(ctx, 116, 196, 16, 12, "#8f563b");
  px(ctx, 134, 200, 12, 8, "#b13e53");
  // Мачта
  px(ctx, 148, 140, 2, 50, "#1a1c2c");
  px(ctx, 138, 148, 12, 8, "#f4f4f4");
  px(ctx, 0, GROUND, W, 4, "#8f563b");
}

function drawSquare(ctx, loc, light, night) {
  // Башня
  px(ctx, 64, 70, 32, 144, "#566c86");
  px(ctx, 60, 58, 40, 16, "#b13e53");
  px(ctx, 72, 40, 16, 22, "#5d275d");
  px(ctx, 78, 28, 4, 14, "#1a1c2c");
  px(ctx, 70, 88, 20, 14, night ? "#ffcd75" : "#fff1e8");
  px(ctx, 78, 90, 2, 8, "#1a1c2c");
  px(ctx, 74, 96, 10, 2, "#1a1c2c");
  drawHouse(ctx, 8, 140, 44, 74, 14, "#8f563b", "#5d275d", light, night, 6);
  drawHouse(ctx, 108, 148, 44, 66, 12, "#b13e53", "#29366f", light, night, 9);
  px(ctx, 0, GROUND, W, H - GROUND, "#4a4a58");
  px(ctx, 0, GROUND, W, 3, "#94b0c2");
  // Фонтан
  px(ctx, 70, GROUND - 8, 20, 8, "#41a6f6");
  px(ctx, 76, GROUND - 16, 8, 8, "#73eff7");
}

const DRAWERS = {
  sunset: drawSunset,
  park: drawPark,
  neon: drawNeon,
  harbor: drawHarbor,
  square: drawSquare,
};

export function drawLocationBase(ctx, loc, clock, weather, extras, t) {
  const sky = getSkyColors(clock);
  const light = getLight(clock);
  const night = isNightish(clock);
  const nightAmt = light.lamps;
  const wind = extras.wind || 0;

  drawSkyGradient(ctx, sky);
  drawStars(ctx, extras.stars, nightAmt);
  drawSun(ctx, getSunPos(clock, W, H));
  drawMoon(ctx, getMoonPos(clock, W, H));
  drawClouds(ctx, extras.clouds, t, wind);

  const drawer = DRAWERS[loc.id] || drawSunset;
  drawer(ctx, loc, light, night);

  for (const tree of loc.trees) drawTree(ctx, tree, t, wind, night);
  for (const lamp of loc.lamps) drawLamp(ctx, lamp, light, t);
  drawSmoke(ctx, extras.smoke);
  drawBirds(ctx, extras.birds, t);

  // Снежный намёт на землю
  const snow = amount(weather, "snow");
  if (snow > 0.15) {
    ctx.globalAlpha = (snow - 0.15) * 0.7;
    px(ctx, 0, GROUND - 2, W, 6, "#f4f4f4");
    ctx.globalAlpha = 1;
  }
}

/** Освещение поверх всей сцены, включая покемона. */
export function drawTimeOverlay(ctx, clock) {
  const light = getLight(clock);
  if (light.amount <= 0.01) return;
  ctx.globalAlpha = light.amount;
  px(ctx, 0, 0, W, H, light.overlay);
  ctx.globalAlpha = 1;
}

export { GROUND };
