import { ZARATHUSTRA } from './zarathustra.js';
import { DEFAULTS, STORAGE_KEY, PORTAL_MODE } from './config.js';

export const S = Object.assign({}, DEFAULTS);
try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (raw) Object.assign(S, raw); } catch (e) {}

if (PORTAL_MODE) Object.assign(S, { theme: 'paper', mass: innerWidth < 640 ? 0.48 : 0.78, cell: 8, drift: true, mouse: false, eat: false, accent: false, spin: 1.3, tilt: 14, text: ZARATHUSTRA, aspect: 'fill' });

let saveT = 0;
export const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) {} }, 200); };

export function resetSettings() {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, DEFAULTS);
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mqReduce.matches && !S.ignoreReduced;
