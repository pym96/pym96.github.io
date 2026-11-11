import { VIDEO_MODE, PORTAL_MODE } from './config.js';
import { S, reduced } from './settings.js';
import { G, H, U, st, perf, parts } from './state.js';
import { initGL } from './gl/context.js';
import { fontsReady } from './gl/glyphs.js';
import { initRenderer, render } from './gl/renderer.js';
import { layout, rebuildGlyphs } from './layout.js';
import { tick } from './sim/tick.js';
import { stage, cv, el } from './ui/dom.js';
import { applyTheme, applyMouse, feed, replay, restore, view, setMass, setPaused } from './ui/actions.js';
import { initControls, placeInd } from './ui/controls.js';
import { initPointer } from './ui/pointer.js';
import { initKeys } from './ui/keys.js';

const placeAll = () => document.querySelectorAll('.seg').forEach(placeInd);

function boot() {
  if (VIDEO_MODE) document.body.classList.add('rec');
  if (!initGL(cv)) {
    stage.insertAdjacentHTML('beforeend', '<p class="fallback">This demo needs WebGL 2. Try a current Chrome, Safari or Firefox.</p>');
    return;
  }
  initRenderer();
  initControls();
  initPointer();
  initKeys();

  addEventListener('resize', () => {
    const d = Math.min(2, devicePixelRatio || 1);
    if (d !== G.dpr) { G.dpr = d; rebuildGlyphs(); } else layout();
    placeAll();
  });

  // hooks for scripted capture, e.g. __demo.seek(4); __demo.feed()
  window.__demo = {
    feed, replay, restore, view, setMass,
    seek(t) { st.intro = t; },
    pause(v = true) { setPaused(v); },
    get state() { return { intro: st.intro, rs: U.rs, hole: [H.x, H.y], eaten: H.eaten, parts: parts.length, sample: parts.slice(0, 6).map((p) => [+p.x.toFixed(3), +p.y.toFixed(3), +p.r0.toFixed(3), +(p.age / p.life).toFixed(2)]), cols: G.cols, rows: G.rows, ss: perf.ss }; }
  };

  if (PORTAL_MODE) {
    st.intro = 12;
    addEventListener('message', (event) => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'portfolio-scene') return;
      if (event.data.action === 'pause') setPaused(true);
      if (event.data.action === 'play') setPaused(false);
      if (event.data.action === 'resize' && Number.isFinite(event.data.delta)) {
        const delta = Math.max(-120, Math.min(120, event.data.delta));
        setMass(Math.min(innerWidth < 640 ? 0.9 : 1.4, S.mass * Math.exp(-delta * 0.0012)));
        G.pageDirty = true;
      }
      if (event.data.action === 'reset-size') {
        setMass(innerWidth < 640 ? 0.48 : 0.78);
        G.pageDirty = true;
      }
      if (event.data.action === 'feed') { setPaused(false); feed(); }
    });
    parent.postMessage({ type: 'portfolio-ready' }, location.origin);
  }

  G.dpr = Math.min(2, devicePixelRatio || 1);
  applyTheme(true);
  el.stats.hidden = !S.stats;
  applyMouse(false);
  rebuildGlyphs();

  let last = performance.now(), sent = 0, renderedW = 0, renderedH = 0;
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    tick(dt);
    if (!PORTAL_MODE || !st.paused || G.W !== renderedW || G.H !== renderedH || G.pageDirty) {
      render(); renderedW = G.W; renderedH = G.H;
    }
    if (PORTAL_MODE && now - sent > 45) {
      parent.postMessage({ type: 'portfolio-gravity', time: st.sim,
        x: H.x * G.unit / G.W, y: -H.y * G.unit / G.H,
        reduced: reduced(), paused: st.paused }, location.origin);
      sent = now;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(loop); });
  fontsReady.then(() => { rebuildGlyphs(); placeAll(); });
}

boot();
