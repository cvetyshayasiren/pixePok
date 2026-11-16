/**
 * Сохранение прогресса в localStorage.
 */
import { CONFIG } from "../config.js";

const EMPTY = () => ({
  pokeballs: CONFIG.START_POKEBALLS,
  caught: [],
  locationId: "sunset",
  selectedId: null,
});

export function loadSave() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return EMPTY();
    const data = JSON.parse(raw);
    return {
      pokeballs: Number.isFinite(data.pokeballs) ? data.pokeballs : CONFIG.START_POKEBALLS,
      caught: Array.isArray(data.caught) ? data.caught : [],
      locationId: data.locationId || "sunset",
      selectedId: data.selectedId || null,
    };
  } catch {
    return EMPTY();
  }
}

export function writeSave(state) {
  const data = {
    pokeballs: state.pokeballs,
    caught: state.caught,
    locationId: state.location.id,
    selectedId: state.selectedId,
  };
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* квота или приватный режим — игра продолжит без сохранения */
  }
}
