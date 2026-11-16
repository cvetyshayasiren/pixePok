/**
 * Погода: ясно / дождь / снег / ветер.
 * Частицы пиксельные, с лимитами для слабых телефонов.
 */
import { CONFIG } from "../config.js";
import { rand, randInt, clamp, lerp } from "./pixel.js";

export const WEATHERS = ["clear", "rain", "snow", "wind"];

export const WEATHER_LABELS = {
  clear: "Ясно",
  rain: "Дождь",
  snow: "Снег",
  wind: "Ветер",
};

export function createWeather() {
  return {
    current: "clear",
    next: "clear",
    blend: 1,
    timer: rand(CONFIG.WEATHER_MIN, CONFIG.WEATHER_MAX),
    rain: [],
    snow: [],
    gust: 0,
  };
}

function spawnRain(W, H) {
  return {
    x: rand(-10, W + 10),
    y: rand(-H, 0),
    len: randInt(3, 7),
    spd: rand(90, 140),
  };
}

function spawnSnow(W, H) {
  return {
    x: rand(0, W),
    y: rand(-H, H),
    s: randInt(1, 2),
    spd: rand(12, 28),
    wob: rand(0, Math.PI * 2),
  };
}

export function updateWeather(w, dt, W, H) {
  w.timer -= dt;
  if (w.timer <= 0) {
    w.next = WEATHERS[randInt(0, WEATHERS.length - 1)];
    w.blend = 0;
    w.timer = rand(CONFIG.WEATHER_MIN, CONFIG.WEATHER_MAX);
  }
  if (w.blend < 1) {
    w.blend = clamp(w.blend + dt / CONFIG.WEATHER_BLEND, 0, 1);
    if (w.blend >= 1) w.current = w.next;
  }

  const rainAmt = amount(w, "rain");
  const snowAmt = amount(w, "snow");
  const windAmt = amount(w, "wind");
  w.gust = lerp(w.gust, windAmt * 1.4 + rainAmt * 0.35, 0.08);

  const rainNeed = Math.round(CONFIG.MAX_RAIN * rainAmt);
  while (w.rain.length < rainNeed) w.rain.push(spawnRain(W, H));
  if (w.rain.length > rainNeed) w.rain.length = rainNeed;
  for (const d of w.rain) {
    d.y += d.spd * dt;
    d.x += w.gust * 28 * dt;
    if (d.y > H + 8) {
      d.y = rand(-20, -2);
      d.x = rand(-10, W + 10);
    }
  }

  const snowNeed = Math.round(CONFIG.MAX_SNOW * snowAmt);
  while (w.snow.length < snowNeed) w.snow.push(spawnSnow(W, H));
  if (w.snow.length > snowNeed) w.snow.length = snowNeed;
  for (const s of w.snow) {
    s.wob += dt * 2;
    s.y += s.spd * dt;
    s.x += Math.sin(s.wob) * 12 * dt + w.gust * 18 * dt;
    if (s.y > H + 4) {
      s.y = -2;
      s.x = rand(0, W);
    }
  }
}

export function amount(w, type) {
  const a = w.current === type ? 1 - w.blend : 0;
  const b = w.next === type ? w.blend : 0;
  return clamp(a + b, 0, 1);
}

export function drawWeather(ctx, w, W, H) {
  const rainAmt = amount(w, "rain");
  if (rainAmt > 0.02) {
    ctx.globalAlpha = 0.45 + rainAmt * 0.4;
    ctx.fillStyle = "#94b0c2";
    const tilt = w.gust * 0.35;
    for (const d of w.rain) {
      ctx.fillRect(d.x | 0, d.y | 0, 1, d.len);
      if (tilt > 0.2) ctx.fillRect((d.x + 1) | 0, (d.y + 2) | 0, 1, Math.max(1, d.len - 2));
    }
    ctx.globalAlpha = 1;
  }

  const snowAmt = amount(w, "snow");
  if (snowAmt > 0.02) {
    ctx.globalAlpha = 0.7 + snowAmt * 0.3;
    ctx.fillStyle = "#f4f4f4";
    for (const s of w.snow) {
      ctx.fillRect(s.x | 0, s.y | 0, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }
}

export function weatherCatchBonus(weather, pokeType) {
  const cur = weather.blend < 0.5 ? weather.current : weather.next;
  if (cur === "rain" && pokeType === "water") return 0.16;
  if (cur === "snow" && pokeType === "ice") return 0.16;
  if (cur === "wind" && pokeType === "flying") return 0.12;
  if (cur === "clear" && pokeType === "fire") return 0.1;
  return 0;
}
