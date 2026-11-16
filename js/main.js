/**
 * Точка входа: игровой цикл, ввод, смена локаций.
 */
import { CONFIG } from "./config.js";
import { POKEMON } from "../data/pokemon.js";
import { getLocationById } from "../data/locations.js";
import { pick, rand, clamp, easeOutCubic, drawPokeball } from "./engine/pixel.js";
import { createCanvasController } from "./engine/canvas.js";
import { createClock, updateClock, getPhase, PHASE_LABELS } from "./engine/time.js";
import { createWeather, updateWeather, drawWeather, WEATHER_LABELS } from "./engine/weather.js";
import { drawLocationBase, drawTimeOverlay } from "./engine/scene.js";
import {
  createStars,
  createClouds,
  createBirds,
  createSmoke,
  createWorldBalls,
  updateBirds,
  updateStars,
  updateSmoke,
  updateWorldBalls,
  hitWorldBall,
  drawWorldBalls,
  drawPokemon,
  hitPokemon,
  pokemonBox,
  idleOffset,
} from "./engine/entities.js";
import { loadSave, writeSave } from "./game/save.js";
import { calcCatchChance, rollCatch } from "./game/catch.js";
import {
  bindUi,
  renderHud,
  showToast,
  showBubble,
  hideBubble,
  fillMap,
  fillDex,
  openModal,
  closeModal,
  fadeTo,
  fadeFrom,
  watchOrientation,
} from "./game/ui.js";

const canvas = document.getElementById("game");
const view = createCanvasController(canvas);
const ui = bindUi();
watchOrientation(ui);

let phrases = [];

const save = loadSave();
const state = {
  pokeballs: save.pokeballs,
  caught: save.caught,
  location: getLocationById(save.locationId),
  pokemon: null,
  selected: false,
  selectedId: save.selectedId,
  busy: false,
  blink: false,
  phraseT: rand(CONFIG.PHRASE_MIN, CONFIG.PHRASE_MAX),
  phraseOn: 0,
  spawnBalls: { t: 0.4 },
};

const clock = createClock();
const weather = createWeather();
const extras = {
  stars: createStars(),
  clouds: createClouds(),
  birds: createBirds(),
  smoke: createSmoke(),
  balls: createWorldBalls(),
  wind: 0,
};

let anim = null;
let last = performance.now();
let worldT = 0;

function persist() {
  writeSave(state);
}

function spawnPokemon(avoidId) {
  hideBubble(ui);
  state.phraseOn = 0;
  state.phraseT = rand(CONFIG.PHRASE_MIN, CONFIG.PHRASE_MAX);
  state.selected = false;
  const pool = POKEMON.filter((p) => p.id !== avoidId);
  state.pokemon = pick(pool.length ? pool : POKEMON);
}

function sayRandom() {
  if (!phrases.length || !state.pokemon) return;
  showBubble(ui, pick(phrases));
  state.phraseOn = CONFIG.PHRASE_DURATION;
}

async function changeLocation(id) {
  if (id === state.location.id || state.busy) {
    closeModal(ui.mapModal);
    return;
  }
  closeModal(ui.mapModal);
  state.busy = true;
  await fadeTo(ui, 380);
  state.location = getLocationById(id);
  extras.balls.length = 0;
  extras.smoke.length = 0;
  extras.clouds = createClouds();
  extras.birds = createBirds();
  spawnPokemon(state.pokemon && state.pokemon.id);
  persist();
  await fadeFrom(ui, 380);
  state.busy = false;
  showToast(ui, state.location.name);
}

function tryPickBall(wx, wy) {
  const got = hitWorldBall(extras.balls, wx, wy);
  if (got > 0) {
    state.pokeballs += got;
    persist();
    showToast(ui, `+${got} покебол${got > 1 ? "а" : ""}`);
    return true;
  }
  return false;
}

function onPointer(clientX, clientY) {
  if (state.busy) return;
  const world = view.toWorld(clientX, clientY);
  if (!world) return;
  if (tryPickBall(world.x, world.y)) return;
  if (state.pokemon && hitPokemon(state.pokemon, world.x, world.y, worldT)) {
    state.selected = true;
    showToast(ui, `${state.pokemon.name} выбран`);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  onPointer(e.clientX, e.clientY);
});
document.addEventListener(
  "touchmove",
  (e) => {
    if (ui.mapModal.classList.contains("is-on") || ui.dexModal.classList.contains("is-on")) return;
    e.preventDefault();
  },
  { passive: false }
);

ui.throwBtn.addEventListener("click", () => throwBall());
ui.mapBtn.addEventListener("click", () => {
  fillMap(ui, state.location.id, changeLocation);
  openModal(ui.mapModal);
});
ui.dexBtn.addEventListener("click", () => {
  fillDex(ui, state.caught);
  openModal(ui.dexModal);
});

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(document.getElementById(btn.getAttribute("data-close")));
  });
});

document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) closeModal(m);
  });
});

async function throwBall() {
  if (state.busy || !state.pokemon) return;
  if (!state.selected) {
    showToast(ui, "Сначала тапните по покемону");
    return;
  }
  if (state.pokeballs <= 0) {
    showToast(ui, "Нет покеболов — ищите на локации");
    return;
  }
  state.busy = true;
  hideBubble(ui);
  state.pokeballs -= 1;
  persist();

  const poke = state.pokemon;
  const box = pokemonBox(poke);
  const chance = calcCatchChance(poke, clock, weather);
  anim = {
    kind: "throw",
    t: 0,
    dur: 0.7,
    done: false,
    from: { x: 72, y: 250 },
    to: { x: box.x + box.w / 2 - 6, y: box.y + box.h * 0.35 },
  };

  await waitUntil(() => anim && anim.done);

  const ok = rollCatch(chance);
  anim = { kind: "shake", t: 0, dur: 0.9, hits: 0, done: false };

  await waitUntil(() => anim && anim.done);

  if (ok) {
    state.caught.push(poke.id);
    persist();
    anim = { kind: "catch", t: 0, dur: 0.85, done: false };
    showToast(ui, `${poke.name} пойман!`, 2200);
    if (phrases.length) showBubble(ui, pick(phrases));
    await waitUntil(() => !anim || anim.done);
    await pause(0.45);
    spawnPokemon(poke.id);
  } else {
    const flee = Math.random() < CONFIG.FLEE_CHANCE;
    if (flee) {
      anim = { kind: "flee", t: 0, dur: 0.7, done: false };
      showToast(ui, `${poke.name} убежал...`);
      await waitUntil(() => !anim || anim.done);
      await pause(0.35);
      spawnPokemon(poke.id);
    } else {
      showToast(ui, `Промах. Шанс был ${Math.round(chance * 100)}%`);
    }
  }

  anim = null;
  state.busy = false;
}

function waitUntil(pred) {
  return new Promise((resolve) => {
    const tick = () => {
      if (pred()) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
}

function pause(sec) {
  return new Promise((r) => setTimeout(r, sec * 1000));
}

function drawThrow(ctx) {
  if (!anim || anim.kind !== "throw") return;
  const k = easeOutCubic(clamp(anim.t / anim.dur, 0, 1));
  const x = anim.from.x + (anim.to.x - anim.from.x) * k;
  const y = anim.from.y + (anim.to.y - anim.from.y) * k - Math.sin(k * Math.PI) * 40;
  drawPokeball(ctx, x, y, 2);
}

function placeBubble() {
  if (!state.pokemon || state.phraseOn <= 0) return;
  const box = pokemonBox(state.pokemon);
  const s = view.state;
  const left = s.offsetX + (box.x + box.w / 2) * s.scale;
  const top = s.offsetY + box.y * s.scale;
  ui.bubble.style.left = `${left}px`;
  ui.bubble.style.top = `${Math.max(72, top - 8)}px`;
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  worldT += dt;

  updateClock(clock, dt);
  updateWeather(weather, dt, CONFIG.WIDTH, CONFIG.HEIGHT);
  extras.wind = weather.gust;
  updateStars(extras.stars, dt);
  updateBirds(extras.birds, dt);
  updateSmoke(extras.smoke, state.location.chimneys, dt);
  updateWorldBalls(extras.balls, state.location, dt, state.spawnBalls);

  if (anim) {
    anim.t += dt;
    if (anim.t >= anim.dur) {
      if (anim.kind === "shake" && anim.hits < 2) {
        anim.hits += 1;
        anim.t = 0;
        anim.dur = 0.28;
      } else {
        anim.done = true;
        if (anim.kind === "throw" || anim.kind === "shake") {
          /* ждущий код снимет анимацию */
        } else {
          anim = null;
        }
      }
    }
  }

  if (state.pokemon && !state.busy) {
    state.phraseT -= dt;
    if (state.phraseT <= 0) {
      sayRandom();
      state.phraseT = rand(CONFIG.PHRASE_MIN, CONFIG.PHRASE_MAX);
    }
  }
  if (state.phraseOn > 0) {
    state.phraseOn -= dt;
    if (state.phraseOn <= 0) hideBubble(ui);
  }

  // Моргание раз в несколько секунд
  state.blink = Math.sin(worldT * 1.7) > 0.92;

  view.begin();
  const ctx = view.ctx;
  drawLocationBase(ctx, state.location, clock, weather, extras, worldT);
  drawWorldBalls(ctx, extras.balls);

  if (state.pokemon) {
    let extraY = 0;
    let alpha = 1;
    if (anim && anim.kind === "shake") {
      extraY = Math.sin(anim.t * 40) * 3;
    }
    if (anim && anim.kind === "catch") {
      alpha = 1 - anim.t / anim.dur;
      extraY = -anim.t * 20;
    }
    if (anim && anim.kind === "flee") {
      extraY = anim.t * 8;
      alpha = 1 - anim.t / anim.dur;
    }
    drawPokemon(ctx, state.pokemon, worldT, extraY, state.blink, alpha);
    if (state.selected && (!anim || anim.kind === "throw" || anim.kind === "shake")) {
      const box = pokemonBox(state.pokemon);
      const off = idleOffset(state.pokemon.idle, worldT);
      ctx.strokeStyle = "#ffcd75";
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1;
      ctx.strokeRect((box.x + off.x) | 0, (box.y + off.y + extraY) | 0, box.w, box.h);
      ctx.globalAlpha = 1;
    }
  }

  drawThrow(ctx);
  drawTimeOverlay(ctx, clock);
  drawWeather(ctx, weather, CONFIG.WIDTH, CONFIG.HEIGHT);
  view.end();
  placeBubble();

  ui.phase.textContent = PHASE_LABELS[getPhase(clock)];
  ui.weather.textContent = WEATHER_LABELS[weather.blend < 0.5 ? weather.current : weather.next];
  renderHud(ui, state, clock, weather);

  requestAnimationFrame(loop);
}

async function boot() {
  try {
    const res = await fetch("./data/phrases.json");
    phrases = await res.json();
    if (!Array.isArray(phrases)) phrases = [];
  } catch {
    phrases = ["Привет!"];
  }
  spawnPokemon();
  fillMap(ui, state.location.id, changeLocation);
  renderHud(ui, state, clock, weather);
  requestAnimationFrame(loop);
}

boot();
