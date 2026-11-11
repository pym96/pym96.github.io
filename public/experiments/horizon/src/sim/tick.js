import { THEMES, VIDEO_MODE, PORTAL_MODE } from '../config.js';
import { S, reduced } from '../settings.js';
import { G, H, U, st, ptr, perf, col } from '../state.js';
import { clamp, ss, hex, DEG } from '../util.js';
import { el } from '../ui/dom.js';
import { syncSpec } from '../ui/hud.js';
import { introAt } from './hole.js';
import { eat, stepParts } from './eat.js';

let fpsE = 60, statT = 0;

export function tick(dt) {
  if (perf.ss === 6) { perf.slow = dt > 0.022 ? perf.slow + dt : Math.max(0, perf.slow - dt * 0.5); if (perf.slow > 1.5) perf.ss = 1; }
  const rm = reduced();
  const sdt = st.paused ? 0 : dt;
  st.intro += sdt; st.sim += sdt;
  const I = introAt(st.intro);

  // the hole wanders on a slow looping path, or holds still with drift off
  let tx = H.tx, ty = H.ty;
  if (S.drift && !rm && !H.manual) {
    const t = st.sim, w = ss(3.2, 6.5, st.intro);
    tx = w * (0.3 * Math.sin(t * 0.17) + 0.07 * Math.sin(t * 0.43 + 1));
    ty = w * (0.1 * Math.sin(t * 0.23 + 0.6) + 0.04 * Math.sin(t * 0.51));
  }
  // Keep the large hole in the central reading gap, with a small living drift.
  // Normalize the envelope to the viewport so navigation stays clear on mobile too.
  if (PORTAL_MODE && S.drift && !rm && !H.manual) {
    const t = st.sim, w = ss(3.2, 6.5, st.intro);
    const ax = G.gw / G.unit * 0.02;
    const ay = G.gh / G.unit * 0.025;
    tx = w * ax * (0.8 * Math.sin(t * 0.28) + 0.2 * Math.sin(t * 0.53));
    ty = w * ay * (0.8 * Math.sin(t * 0.21) + 0.2 * Math.sin(t * 0.41));
  }
  // Blend back to idle drift after the pointer stops, as in the early public version.
  if (VIDEO_MODE && S.mouse && !rm) {
    const idleSeconds = (performance.now() - ptr.lastMove) / 1000;
    const follow = 1 - ss(2.5, 5, idleSeconds);
    tx += (ptr.tx - tx) * follow; ty += (ptr.ty - ty) * follow;
  }
  const lim = [G.gw / 2 / G.unit - 0.04, G.gh / 2 / G.unit - 0.04];
  H.tx = clamp(tx, -lim[0], lim[0]); H.ty = clamp(ty, -lim[1], lim[1]);
  // a slightly underdamped spring follows the target
  if (!ptr.dragging && sdt > 0) {
    const k = 34, c = 2 * Math.sqrt(k) * 0.92;
    const h = Math.min(sdt, 1 / 30);
    H.vx += ((H.tx - H.x) * k - H.vx * c) * h; H.vy += ((H.ty - H.y) * k - H.vy * c) * h;
    H.x += H.vx * h; H.y += H.vy * h;
  }
  st.speed += (Math.hypot(H.vx, H.vy) - st.speed) * (1 - Math.exp(-dt * 8));

  // tilt and roll settle toward their targets
  H.tilt += ((S.tilt + (PORTAL_MODE && !rm ? 3.5 * Math.sin(st.sim * 0.45) : 0)) * DEG - H.tilt) * (1 - Math.exp(-dt * 6));
  H.roll += (H.rollT + (PORTAL_MODE && !rm ? 0.065 * Math.sin(st.sim * 0.32) : 0) - H.roll) * (1 - Math.exp(-dt * 6));

  // feeding kicks the mass, a damped spring brings it back
  H.kickV += (-H.kick * 60 - H.kickV * 9) * Math.min(sdt, 1 / 30);
  H.kick += H.kickV * Math.min(sdt, 1 / 30);
  H.pulseT += sdt;
  H.spinT += sdt * (rm ? 0 : S.spin);

  U.rs = S.mass * I.m * (1 + H.kick);
  U.disk = I.disk; U.rout = I.rout; U.flash = I.flash; U.dot = I.dot;

  if (I.eat && S.eat && sdt > 0 && !rm) eat(sdt, false);
  stepParts(sdt);

  const t = THEMES[S.theme] || THEMES.stage;
  const tk = 1 - Math.exp(-dt * 7);
  for (const key of ['bg', 'ink', 'pink']) { const target = hex(t[key]); for (let i = 0; i < 3; i++) col[key][i] += (target[i] - col[key][i]) * tk; }

  if (S.stats) {
    fpsE += (1 / Math.max(dt, 1e-3) - fpsE) * 0.05;
    if ((statT += dt) > 0.5) { statT = 0; el.stats.textContent = `${Math.round(fpsE)} fps, ${G.cols} by ${G.rows} cells`; }
  }
  syncSpec();
  const mtxt = `M ${(S.mass * (1 + H.kick)).toFixed(2)}`;
  if (el.mass.textContent !== mtxt) el.mass.textContent = mtxt;
}
