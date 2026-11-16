/**
 * Живые детали: облака, звёзды, дым, птицы, покеболы на локации, покемон.
 */
import { CONFIG } from "../config.js";
import { rand, randInt, pick, drawSprite, spriteSize, drawPokeball, POKEBALL_SPRITE } from "./pixel.js";
import { GROUND } from "./scene.js";

export function createStars() {
  const stars = [];
  for (let i = 0; i < 36; i++) {
    stars.push({
      x: randInt(2, CONFIG.WIDTH - 2),
      y: randInt(4, 90),
      ph: rand(0, Math.PI * 2),
      spd: rand(1.2, 3.4),
      big: Math.random() < 0.18,
    });
  }
  return stars;
}

export function createClouds() {
  const n = randInt(3, CONFIG.MAX_CLOUDS);
  const clouds = [];
  for (let i = 0; i < n; i++) {
    clouds.push({
      x: rand(0, CONFIG.WIDTH),
      y: rand(10, 48),
      spd: rand(4, 12),
    });
  }
  return clouds;
}

export function createBirds() {
  const birds = [];
  const n = randInt(1, CONFIG.MAX_BIRDS);
  for (let i = 0; i < n; i++) {
    birds.push({
      x: rand(0, CONFIG.WIDTH),
      y: rand(28, 70),
      spd: rand(18, 34) * (Math.random() < 0.5 ? 1 : -1),
      flap: rand(6, 10),
      ph: rand(0, 10),
    });
  }
  return birds;
}

export function updateBirds(birds, dt) {
  for (const b of birds) {
    b.x += b.spd * dt;
    if (b.x > CONFIG.WIDTH + 10) b.x = -10;
    if (b.x < -10) b.x = CONFIG.WIDTH + 10;
  }
}

export function updateStars(stars, dt) {
  for (const s of stars) s.ph += dt * s.spd;
}

export function createSmoke() {
  return [];
}

export function updateSmoke(smoke, chimneys, dt) {
  if (Math.random() < dt * 3 && smoke.length < CONFIG.MAX_SMOKE && chimneys.length) {
    const c = pick(chimneys);
    smoke.push({
      x: c.x + rand(-1, 2),
      y: c.y,
      s: randInt(2, 3),
      a: 0.55,
      vy: -rand(8, 16),
      vx: rand(-4, 6),
    });
  }
  for (let i = smoke.length - 1; i >= 0; i--) {
    const p = smoke[i];
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    p.a -= dt * 0.22;
    if (p.a <= 0) smoke.splice(i, 1);
  }
}

export function createWorldBalls() {
  return [];
}

export function updateWorldBalls(balls, loc, dt, spawnTimer) {
  spawnTimer.t -= dt;
  if (spawnTimer.t <= 0 && balls.length < CONFIG.MAX_WORLD_BALLS) {
    const used = new Set(balls.map((b) => b.spot));
    const free = loc.pokeballSpots.map((_, i) => i).filter((i) => !used.has(i));
    if (free.length) {
      const spot = pick(free);
      const p = loc.pokeballSpots[spot];
      balls.push({
        x: p.x,
        y: p.y,
        spot,
        bob: rand(0, Math.PI * 2),
        amount: randInt(CONFIG.BALL_PICK_MIN, CONFIG.BALL_PICK_MAX),
      });
    }
    spawnTimer.t = rand(CONFIG.BALL_SPAWN_MIN, CONFIG.BALL_SPAWN_MAX);
  }
  for (const b of balls) b.bob += dt * 2.2;
  return spawnTimer;
}

export function hitWorldBall(balls, wx, wy) {
  const s = 14;
  const pad = 8;
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    const y = b.y + Math.sin(b.bob) * 1.5;
    if (wx >= b.x - pad && wx <= b.x + s + pad && wy >= y - pad && wy <= y + s + pad) {
      const got = b.amount;
      balls.splice(i, 1);
      return got;
    }
  }
  return 0;
}

export function drawWorldBalls(ctx, balls) {
  for (const b of balls) {
    const y = b.y + Math.sin(b.bob) * 1.5;
    const pulse = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(b.bob * 2));
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ffcd75";
    ctx.fillRect((b.x - 1) | 0, (y - 1) | 0, 16, 16);
    ctx.globalAlpha = 1;
    drawPokeball(ctx, b.x, y, 2);
  }
}

export function pokemonBox(poke) {
  const scale = CONFIG.POKEMON_SCALE;
  const { w, h } = spriteSize(poke.sprite, scale);
  const x = Math.floor((CONFIG.WIDTH - w) / 2);
  const y = GROUND - h - 18;
  return { x, y, w, h, scale };
}

export function idleOffset(kind, t) {
  switch (kind) {
    case "sway":
      return { x: Math.sin(t * 1.6) * 2, y: Math.sin(t * 3.2) * 0.6 };
    case "float":
      return { x: Math.sin(t * 1.1) * 1.2, y: Math.sin(t * 2.1) * 3 };
    case "breathe":
      return { x: 0, y: Math.sin(t * 2.4) * 1.4 };
    default:
      return { x: Math.sin(t * 2.0) * 0.8, y: Math.sin(t * 4.0) * 1.8 };
  }
}

export function drawPokemon(ctx, poke, t, extraY = 0, blink = false, alpha = 1) {
  const box = pokemonBox(poke);
  const off = idleOffset(poke.idle, t);
  ctx.globalAlpha = alpha;
  drawSprite(ctx, poke.sprite, poke.palette, box.x + off.x, box.y + off.y + extraY, box.scale);
  if (blink) {
    const eyeY = box.y + off.y + extraY + 6 * box.scale;
    ctx.fillStyle = poke.palette.k;
    ctx.fillRect(box.x + off.x + 5 * box.scale, eyeY, box.scale * 2, box.scale);
    ctx.fillRect(box.x + off.x + 9 * box.scale, eyeY, box.scale * 2, box.scale);
  }
  ctx.globalAlpha = 1;
}

export function hitPokemon(poke, wx, wy, t) {
  const box = pokemonBox(poke);
  const off = idleOffset(poke.idle, t);
  const pad = 8;
  return (
    wx >= box.x + off.x - pad &&
    wx <= box.x + off.x + box.w + pad &&
    wy >= box.y + off.y - pad &&
    wy <= box.y + off.y + box.h + pad
  );
}

export { POKEBALL_SPRITE };
