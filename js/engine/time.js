/**
 * Цикл суток: утро → день → вечер → ночь.
 * Цвета неба интерполируются, солнце/луна движутся по дуге.
 */
import { lerp, lerpColor, clamp } from "./pixel.js";
import { CONFIG } from "../config.js";

export const PHASES = ["morning", "day", "evening", "night"];

export const PHASE_LABELS = {
  morning: "Утро",
  day: "День",
  evening: "Вечер",
  night: "Ночь",
};

const SKY = {
  morning: { top: "#6ec6ff", mid: "#c9e8ff", bot: "#ffe0b0" },
  day: { top: "#41a6f6", mid: "#7ec8f8", bot: "#cfefff" },
  evening: { top: "#29366f", mid: "#b13e53", bot: "#ffcd75" },
  night: { top: "#0d1024", mid: "#1a1c2c", bot: "#29366f" },
};

const LIGHT = {
  morning: { overlay: "#ffd8a8", amount: 0.08, lamps: 0.15, shade: 0.04 },
  day: { overlay: "#ffffff", amount: 0.0, lamps: 0.0, shade: 0.0 },
  evening: { overlay: "#ef7d57", amount: 0.18, lamps: 0.55, shade: 0.12 },
  night: { overlay: "#1a1c2c", amount: 0.42, lamps: 1.0, shade: 0.28 },
};

export function createClock() {
  return {
    elapsed: 0,
    phaseIndex: 0,
    phaseT: 0,
  };
}

export function updateClock(clock, dt) {
  clock.elapsed += dt;
  const cycle = CONFIG.PHASE_DURATION * PHASES.length;
  const t = ((clock.elapsed % cycle) + cycle) % cycle;
  const raw = t / CONFIG.PHASE_DURATION;
  clock.phaseIndex = Math.floor(raw) % PHASES.length;
  clock.phaseT = raw - Math.floor(raw);
}

export function getPhase(clock) {
  return PHASES[clock.phaseIndex];
}

export function getNextPhase(clock) {
  return PHASES[(clock.phaseIndex + 1) % PHASES.length];
}

/** 0..1 внутри полного цикла (0 = начало утра). */
export function getDayProgress(clock) {
  return (clock.phaseIndex + clock.phaseT) / PHASES.length;
}

function blendSky(a, b, t) {
  return {
    top: lerpColor(a.top, b.top, t),
    mid: lerpColor(a.mid, b.mid, t),
    bot: lerpColor(a.bot, b.bot, t),
  };
}

export function getSkyColors(clock) {
  const a = SKY[getPhase(clock)];
  const b = SKY[getNextPhase(clock)];
  // Плавный переход ближе к концу фазы.
  const t = clock.phaseT < 0.72 ? 0 : (clock.phaseT - 0.72) / 0.28;
  return blendSky(a, b, ease(t));
}

function ease(t) {
  return t * t * (3 - 2 * t);
}

export function getLight(clock) {
  const a = LIGHT[getPhase(clock)];
  const b = LIGHT[getNextPhase(clock)];
  const t = clock.phaseT < 0.72 ? 0 : (clock.phaseT - 0.72) / 0.28;
  const e = ease(t);
  return {
    overlay: lerpColor(a.overlay, b.overlay, e),
    amount: lerp(a.amount, b.amount, e),
    lamps: lerp(a.lamps, b.lamps, e),
    shade: lerp(a.shade, b.shade, e),
  };
}

/**
 * Положение светила по дуге. dayArc 0..1 — для солнца днём, moon ночью.
 */
export function getSunPos(clock, W, H) {
  const p = getDayProgress(clock);
  // Солнце видно примерно с 0.0 (утро) до 0.55 (конец дня).
  const vis = clamp((0.58 - p) / 0.58, 0, 1);
  const arc = clamp(p / 0.55, 0, 1);
  const x = lerp(18, W - 18, arc);
  const y = lerp(H * 0.42, 18, Math.sin(arc * Math.PI));
  return { x, y, visible: vis > 0.02 && p < 0.58, alpha: vis };
}

export function getMoonPos(clock, W, H) {
  const p = getDayProgress(clock);
  // Луна: вечер-ночь-утро (0.55 .. 1.0 .. 0.12)
  let arc;
  if (p >= 0.55) arc = (p - 0.55) / 0.57;
  else if (p < 0.12) arc = (0.45 + p) / 0.57;
  else return { x: 0, y: 0, visible: false, alpha: 0 };
  arc = clamp(arc, 0, 1);
  const x = lerp(22, W - 22, arc);
  const y = lerp(H * 0.38, 16, Math.sin(arc * Math.PI));
  const alpha = p > 0.62 && p < 0.98 ? 1 : p >= 0.55 ? (p - 0.55) / 0.07 : 1 - p / 0.12;
  return { x, y, visible: true, alpha: clamp(alpha, 0, 1) };
}

export function isNightish(clock) {
  const p = getPhase(clock);
  return p === "night" || (p === "evening" && clock.phaseT > 0.45);
}
