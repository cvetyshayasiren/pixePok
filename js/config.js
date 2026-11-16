/**
 * Настройки игры. Можно менять числа — после сохранения обновите страницу.
 * Комментарии на русском, чтобы было проще править вручную.
 */
export const CONFIG = {
  /** Логическое разрешение пиксель-арт сцены (не CSS-пиксели). */
  WIDTH: 160,
  HEIGHT: 280,

  /** Длительность одной фазы суток в секундах (утро/день/вечер/ночь). */
  PHASE_DURATION: 40,

  /** Стартовое число покеболов у игрока. */
  START_POKEBALLS: 8,

  /** Максимум покеболов, лежащих на локации одновременно. */
  MAX_WORLD_BALLS: 3,
  /** Пауза между появлением покеболов на локации (секунды). */
  BALL_SPAWN_MIN: 7,
  BALL_SPAWN_MAX: 14,
  /** Сколько штук даёт один подобранный покебол. */
  BALL_PICK_MIN: 1,
  BALL_PICK_MAX: 3,

  /**
   * Как часто покемон говорит фразу (секунды между пузырями).
   * Правьте эти два числа, если фразы появляются слишком часто или редко.
   */
  PHRASE_MIN: 7,
  PHRASE_MAX: 14,
  PHRASE_DURATION: 3.2,

  /** Шанс, что после промаха покемон убежит (0..1). */
  FLEE_CHANCE: 0.42,

  /** Как часто меняется погода (секунды). */
  WEATHER_MIN: 28,
  WEATHER_MAX: 52,
  WEATHER_BLEND: 2.8,

  /** Лимиты частиц — чтобы слабые телефоны не тормозили. */
  MAX_RAIN: 64,
  MAX_SNOW: 42,
  MAX_SMOKE: 10,
  MAX_BIRDS: 3,
  MAX_CLOUDS: 5,

  /** Масштаб спрайта покемона в логических пикселях (крупный передний план). */
  POKEMON_SCALE: 5,

  STORAGE_KEY: "pixel-poke-catcher-v1",
};

/** Бонусы к шансу поимки. */
export const CATCH_BONUS = {
  rain_water: 0.16,
  snow_ice: 0.16,
  wind_flying: 0.12,
  clear_fire: 0.1,
  night_psychic: 0.1,
  night_dark: 0.1,
  morning_grass: 0.1,
  evening_fire: 0.08,
  day_electric: 0.06,
};

/** Общая палитра сцены (ограниченная, уютная). */
export const PALETTE = {
  ink: "#1a1c2c",
  white: "#f4f4f4",
  paper: "#fff1e8",
  gray: "#94b0c2",
  dusk: "#566c86",
  night: "#333c57",
  brick: "#b13e53",
  roof: "#5d275d",
  orange: "#ef7d57",
  sun: "#ffcd75",
  leaf: "#38b764",
  grass: "#257179",
  sky: "#41a6f6",
  deep: "#29366f",
  wood: "#8f563b",
  lamp: "#ffcd75",
};
