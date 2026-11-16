/**
 * Логика броска покебола: шанс, бонусы погоды и времени суток.
 */
import { CATCH_BONUS } from "../config.js";
import { clamp } from "../engine/pixel.js";
import { getPhase } from "../engine/time.js";
import { weatherCatchBonus } from "../engine/weather.js";

export function calcCatchChance(poke, clock, weather) {
  let chance = poke.catchRate;
  chance += weatherCatchBonus(weather, poke.type);

  const phase = getPhase(clock);
  if (phase === "night" && (poke.type === "psychic" || poke.type === "dark")) {
    chance += CATCH_BONUS.night_psychic;
  }
  if (phase === "morning" && poke.type === "grass") chance += CATCH_BONUS.morning_grass;
  if (phase === "evening" && poke.type === "fire") chance += CATCH_BONUS.evening_fire;
  if (phase === "day" && poke.type === "electric") chance += CATCH_BONUS.day_electric;

  return clamp(chance, 0.08, 0.92);
}

export function rollCatch(chance) {
  return Math.random() < chance;
}
