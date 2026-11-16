/**
 * Полноэкранный canvas: логическое 160×280, целочисленный масштаб,
 * imageSmoothing выключен — пиксели остаются чёткими.
 */
import { CONFIG } from "../config.js";

export function createCanvasController(canvas) {
  const ctx = canvas.getContext("2d");
  const state = {
    canvas,
    ctx,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    cssW: 0,
    cssH: 0,
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;

    const scale = Math.max(1, Math.floor(Math.min(vw / CONFIG.WIDTH, vh / CONFIG.HEIGHT)));
    state.scale = scale;
    state.cssW = vw;
    state.cssH = vh;

    const drawW = CONFIG.WIDTH * scale;
    const drawH = CONFIG.HEIGHT * scale;
    state.offsetX = Math.floor((vw - drawW) / 2);
    state.offsetY = Math.floor((vh - drawH) / 2);

    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function begin() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0c14";
    ctx.fillRect(0, 0, state.cssW, state.cssH);
    ctx.save();
    ctx.translate(state.offsetX, state.offsetY);
    ctx.scale(state.scale, state.scale);
  }

  function end() {
    ctx.restore();
  }

  /** Клиентские координаты → логические пиксели сцены (или null, если мимо). */
  function toWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - state.offsetX;
    const y = clientY - rect.top - state.offsetY;
    const lx = x / state.scale;
    const ly = y / state.scale;
    if (lx < 0 || ly < 0 || lx >= CONFIG.WIDTH || ly >= CONFIG.HEIGHT) return null;
    return { x: lx, y: ly };
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 120));
  resize();

  return { state, ctx, resize, begin, end, toWorld };
}
