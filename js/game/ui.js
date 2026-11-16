/**
 * HUD, модалки, тосты. Без alert/prompt.
 */
import { LOCATIONS } from "../../data/locations.js";
import { getPokemonById } from "../../data/pokemon.js";
import { PHASE_LABELS } from "../engine/time.js";
import { WEATHER_LABELS } from "../engine/weather.js";

export function bindUi() {
  return {
    pokeballs: document.getElementById("hud-balls"),
    caught: document.getElementById("hud-caught"),
    phase: document.getElementById("hud-phase"),
    weather: document.getElementById("hud-weather"),
    location: document.getElementById("hud-location"),
    throwBtn: document.getElementById("btn-throw"),
    mapBtn: document.getElementById("btn-map"),
    dexBtn: document.getElementById("btn-dex"),
    mapModal: document.getElementById("modal-map"),
    dexModal: document.getElementById("modal-dex"),
    mapList: document.getElementById("map-list"),
    dexList: document.getElementById("dex-list"),
    toast: document.getElementById("toast"),
    bubble: document.getElementById("speech"),
    fade: document.getElementById("fade"),
    rotate: document.getElementById("rotate-hint"),
  };
}

export function renderHud(ui, state, clock, weather) {
  ui.pokeballs.textContent = String(state.pokeballs);
  ui.caught.textContent = String(state.caught.length);
  ui.phase.textContent = PHASE_LABELS[clock ? requirePhase(clock) : "day"];
  ui.weather.textContent = WEATHER_LABELS[displayWeather(weather)];
  ui.location.textContent = state.location.name;
  ui.throwBtn.disabled = state.busy || state.pokeballs <= 0 || !state.pokemon || !state.selected;
  ui.throwBtn.classList.toggle("is-off", ui.throwBtn.disabled);
}

function requirePhase(clock) {
  return ["morning", "day", "evening", "night"][clock.phaseIndex];
}

function displayWeather(weather) {
  if (!weather) return "clear";
  return weather.blend < 0.5 ? weather.current : weather.next;
}

export function showToast(ui, text, ms = 1800) {
  ui.toast.textContent = text;
  ui.toast.classList.add("is-on");
  clearTimeout(ui.toast._t);
  ui.toast._t = setTimeout(() => ui.toast.classList.remove("is-on"), ms);
}

export function showBubble(ui, text) {
  ui.bubble.textContent = text;
  ui.bubble.classList.add("is-on");
}

export function hideBubble(ui) {
  ui.bubble.classList.remove("is-on");
}

export function fillMap(ui, currentId, onPick) {
  ui.mapList.innerHTML = "";
  for (const loc of LOCATIONS) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "loc-card" + (loc.id === currentId ? " is-current" : "");
    item.innerHTML = `
      <span class="loc-preview" style="background:linear-gradient(180deg,${loc.preview.a},${loc.preview.b} 55%,${loc.preview.c})"></span>
      <span class="loc-meta">
        <strong>${loc.name}</strong>
        <small>${loc.description}</small>
      </span>
    `;
    item.addEventListener("click", () => onPick(loc.id));
    ui.mapList.appendChild(item);
  }
}

export function fillDex(ui, caughtIds) {
  ui.dexList.innerHTML = "";
  if (!caughtIds.length) {
    ui.dexList.innerHTML = `<p class="empty">Пока пусто. Бросайте покебол — коллекция начнётся.</p>`;
    return;
  }
  const counts = {};
  for (const id of caughtIds) counts[id] = (counts[id] || 0) + 1;
  for (const [id, n] of Object.entries(counts)) {
    const p = getPokemonById(id);
    const row = document.createElement("div");
    row.className = "dex-row";
    row.innerHTML = `<span class="dex-name">${p.name}</span><span class="dex-type">${p.type}</span><span class="dex-n">×${n}</span>`;
    ui.dexList.appendChild(row);
  }
}

export function openModal(el) {
  el.classList.add("is-on");
  el.setAttribute("aria-hidden", "false");
}

export function closeModal(el) {
  el.classList.remove("is-on");
  el.setAttribute("aria-hidden", "true");
}

export function fadeTo(ui, ms = 420) {
  return new Promise((resolve) => {
    ui.fade.classList.add("is-on");
    setTimeout(resolve, ms);
  });
}

export function fadeFrom(ui, ms = 420) {
  return new Promise((resolve) => {
    ui.fade.classList.remove("is-on");
    setTimeout(resolve, ms);
  });
}

export function watchOrientation(ui) {
  const check = () => {
    const landscape = window.innerWidth > window.innerHeight;
    const phone = Math.min(window.innerWidth, window.innerHeight) < 520;
    ui.rotate.classList.toggle("is-on", landscape && phone);
  };
  window.addEventListener("resize", check);
  window.addEventListener("orientationchange", check);
  check();
}
