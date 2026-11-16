/**
 * Хелперы пиксель-арта: цвета, спрайты из символьных карт, без внешних PNG.
 */

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpColor(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: lerp(A.r, B.r, t),
    g: lerp(A.g, B.g, t),
    b: lerp(A.b, B.b, t),
  });
}

export function mulColor(hex, k) {
  const c = hexToRgb(hex);
  return rgbToHex({ r: c.r * k, g: c.g * k, b: c.b * k });
}

export function mixColors(hex, overlay, amount) {
  return lerpColor(hex, overlay, amount);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function randInt(a, b) {
  return Math.floor(rand(a, b + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Рисует спрайт из массива строк. '.' — прозрачный пиксель.
 * scale — сколько логических пикселей на клетку спрайта.
 */
export function drawSprite(ctx, sprite, palette, x, y, scale = 1, flip = false) {
  const h = sprite.length;
  const w = sprite[0].length;
  for (let sy = 0; sy < h; sy++) {
    const row = sprite[sy];
    for (let sx = 0; sx < w; sx++) {
      const ch = row[sx];
      if (!ch || ch === ".") continue;
      const color = palette[ch];
      if (!color) continue;
      const px = flip ? x + (w - 1 - sx) * scale : x + sx * scale;
      ctx.fillStyle = color;
      ctx.fillRect(px, y + sy * scale, scale, scale);
    }
  }
}

export function spriteSize(sprite, scale = 1) {
  return { w: sprite[0].length * scale, h: sprite.length * scale };
}

/** Крошечный покебол 7x7. */
export const POKEBALL_SPRITE = [
  ".kkkkk.",
  "krrrrrk",
  "krrrrrk",
  "kkwkwkk",
  "kwwwwwk",
  "kwwwwwk",
  ".kkkkk.",
];

export const POKEBALL_PALETTE = {
  k: "#1a1c2c",
  r: "#b13e53",
  w: "#f4f4f4",
};

export function drawPokeball(ctx, x, y, scale = 1) {
  drawSprite(ctx, POKEBALL_SPRITE, POKEBALL_PALETTE, x, y, scale);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
