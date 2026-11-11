'use client';

import { useEffect, useRef, useState } from 'react';
import { projects } from './projects';

type Category = { id: string; number: string; title: string; en: string; description: string; glyph: string };
const categories: Category[] = [
  { id: 'previous', number: '01', title: 'Previous Work', en: 'PREVIOUS WORK', description: 'Robotics and earlier explorations.', glyph: '[ ]' },
  { id: 'current', number: '02', title: 'Current Work', en: 'CURRENT WORK', description: 'Agents, tools, and what I am building now.', glyph: '{ }' },
  { id: 'academic', number: '03', title: 'Academic Work', en: 'ACADEMIC WORK', description: 'Research, collaborations, and forthcoming code.', glyph: '</>' },
  { id: 'skills', number: '04', title: 'My Skills', en: 'MY SKILLS', description: 'Reusable agent skills. My own workflow.', glyph: '.*' },
];

function Infall({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current, ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = innerWidth, h = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
    const field = document.querySelector('.universe');
    const style = field ? getComputedStyle(field) : null;
    const cx = (parseFloat(style?.getPropertyValue('--hole-x') || '50') / 100) * w;
    const cy = (parseFloat(style?.getPropertyValue('--hole-y') || '50') / 100) * h;
    const start = performance.now(); let frame = 0;
    const chars = '01<>/{}[]:;.*+ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const points = Array.from({ length: 550 }, (_, i) => ({ a: i * 2.39996, r: 90 + ((i * 137) % Math.max(w, h)), delay: (i % 13) / 60, glyph: chars[i % chars.length] }));
    function draw(now: number) {
      if (!ctx) return;
      const t = (now - start) / 1450;
      ctx.clearRect(0, 0, w, h); ctx.font = '12px monospace';
      for (const p of points) {
        const q = Math.max(0, Math.min(1, (t - p.delay) / .78));
        const r = p.r * Math.pow(1 - q, 2.2), a = p.a + q * q * 5;
        ctx.globalAlpha = Math.sin(q * Math.PI) * .85;
        ctx.fillStyle = p.glyph === '*' ? '#a86640' : '#55584a';
        ctx.fillText(p.glyph, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .63);
      }
      ctx.globalAlpha = 1;
      if (t < 1.2) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, w, h); };
  }, [active]);
  return <canvas ref={ref} className="infall" aria-hidden="true" />;
}

export default function Home() {
  const [phase, setPhase] = useState<'home' | 'entering' | 'collection'>('home');
  const [selected, setSelected] = useState<Category | null>(null);
  const [paused, setPaused] = useState(false);
  const [moveEnabled, setMoveEnabled] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; holeX: number; holeY: number } | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = useRef(false);
  const universe = useRef<HTMLElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const about = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  function scene(action: string, delta = 0) { iframe.current?.contentWindow?.postMessage({ type: 'portfolio-scene', action, delta }, location.origin); }
  function toggleMovement() {
    const enabled = !moveEnabled;
    drag.current = null;
    setMoveEnabled(enabled);
    scene(enabled ? 'enable-move' : 'disable-move');
  }
  function back() {
    if (timer.current) clearTimeout(timer.current);
    lock.current = false; setPhase('home'); setSelected(null); scene(paused ? 'pause' : 'play');
    requestAnimationFrame(() => trigger.current?.focus());
  }
  function enter(category: Category, button: HTMLButtonElement) {
    if (lock.current) return;
    lock.current = true; trigger.current = button; setSelected(category);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('collection'); return; }
    setPhase('entering'); if (!paused) scene('feed');
    timer.current = setTimeout(() => { setPhase('collection'); }, 1550);
  }
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== location.origin || e.source !== iframe.current?.contentWindow) return;
      if (e.data?.type === 'portfolio-ready') setReady(true);
      if (e.data?.type !== 'portfolio-gravity' || !universe.current) return;
      const { time, x, y, reduced } = e.data;
      if (![time, x, y].every(Number.isFinite)) return;
      universe.current.style.setProperty('--hole-x', `${(0.5 + x) * 100}%`);
      universe.current.style.setProperty('--hole-y', `${(0.5 + y) * 100}%`);
      const nodes = universe.current.querySelectorAll<HTMLElement>('.category');
      const boxes = [...nodes].map(node => node.getBoundingClientRect());
      nodes.forEach((node, index) => {
        const box = boxes[index];
        const towardX = .5 + x - (box.left + box.width / 2) / innerWidth;
        const towardY = .5 + y - (box.top + box.height / 2) / innerHeight;
        const distance = Math.hypot(towardX, towardY);
        const strength = .7 + 1.1 * Math.exp(-Math.pow(distance / .35, 2));
        const pull = reduced ? 0 : 2.5 * strength;
        node.style.setProperty('--pull-x', `${pull * towardX / Math.max(distance, .08)}px`);
        node.style.setProperty('--pull-y', `${pull * towardY / Math.max(distance, .08)}px`);
        node.querySelectorAll<HTMLElement>('.gravity-letter').forEach((letter, i) => {
          const wave = time * .9 + i * .3 + index * 1.4;
          const dx = reduced ? 0 : Math.sin(wave * .8) * .55 * strength;
          const dy = reduced ? 0 : Math.sin(wave) * .8 * strength;
          const angle = reduced ? 0 : Math.cos(wave) * .55 * strength;
          letter.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`;
        });
      });
    }
    addEventListener('message', onMessage);
    return () => { removeEventListener('message', onMessage); if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (phase === 'collection') heading.current?.focus();
    function key(e: KeyboardEvent) { if (e.key === 'Escape' && phase !== 'home' && !about.current?.open) back(); }
    addEventListener('keydown', key); return () => removeEventListener('keydown', key);
  }, [phase, paused]);
  useEffect(() => {
    function resizeHole(event: WheelEvent) {
      if (phase !== 'home' || !ready || about.current?.open || event.ctrlKey || event.metaKey || event.deltaY === 0) return;
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      scene('resize', Math.max(-120, Math.min(120, event.deltaY * units)));
    }
    window.addEventListener('wheel', resizeHole, { passive: false });
    return () => window.removeEventListener('wheel', resizeHole);
  }, [phase, ready]);
  return <main ref={universe} className={`universe phase-${phase}`}>
    <div className="scene" aria-hidden="true"><iframe ref={iframe} src="/experiments/horizon/index.html?preset=portal" title="A living ASCII black hole" tabIndex={-1} /><div className="scene-vignette" /></div>
    <dialog ref={about} className="about-dialog" aria-labelledby="about-title" onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) about.current?.close(); } }}>
      <div className="about-top"><span>README / PYM96</span><button onClick={() => about.current?.close()} aria-label="Close about me" autoFocus>ESC / CLOSE ×</button></div>
      <div className="about-identity"><pre aria-hidden="true">{'[ R P ]\n  /_>'}</pre><div><span className="tiny">HELLO, WORLD.</span><h2 id="about-title">I’m Ryan Pan<span>.</span></h2><p>Graduate student. Builder. Curious about how models behave.</p></div></div>
      <p className="about-intro">I build reliable agent systems and turn research ideas into reproducible engineering projects. My current interests are large language models, AI agents, and post-training.</p>
      <div className="about-sections">
        <section><span className="tiny">01 / BUILDING</span><h3>Agents you can inspect.</h3><p>Runtime, tool calling, trace and replay, permission control, and reproducible evaluation — the pieces behind my agent harness.</p></section>
        <section><span className="tiny">02 / EXPLORING</span><h3>From 3D scenes to model behavior.</h3><p>I explore LLM and agent reliability, building on earlier work in 3D reconstruction, reinforcement learning, and computer vision.</p></section>
        <section><span className="tiny">03 / SHARING</span><h3>Make the work understandable.</h3><p>I share what I learn through research tools, mathematical animations, and reusable agent skills.</p></section>
      </div>
      <div className="about-tags">LLM · AI AGENTS · POST-TRAINING · TOOL USE · EVALUATION</div>
      <footer className="about-footer"><span>Away from the terminal: a meat lover.</span><a href="https://github.com/pym96" target="_blank" rel="noreferrer">Read my GitHub profile ↗</a></footer>
    </dialog>
    <Infall active={phase === 'entering'} />
    <header className="topbar"><button className="wordmark" onClick={back} aria-label="Return to the black hole"><span>[/]</span> ryan.pan</button><nav className="profile-nav" aria-label="Profile"><button disabled={phase === 'entering'} onClick={() => about.current?.showModal()}>ABOUT ME</button><a href="https://github.com/pym96" target="_blank" rel="noreferrer">GITHUB ↗</a></nav><button className="motion" disabled={phase === 'entering'} onClick={() => { scene(paused ? 'play' : 'pause'); setPaused(!paused); }} aria-label={paused ? 'Resume animation' : 'Pause animation'}>{paused ? '▷ RESUME' : 'Ⅱ PAUSE'}</button></header>
    <div className="coordinate coord-left" aria-hidden="true">X / 00.000<br />Y / 00.000</div><div className="coordinate coord-right" aria-hidden="true">ASCII<br />EVENT HORIZON</div>
    {phase !== 'collection' && <section className="portal-home" aria-label="Explore work categories" aria-busy={phase === 'entering'}>
      <div className="center-caption"><span className="tiny">RYAN PAN / YIMING</span><h1>attention is all we need<span>.</span></h1><p>Graduate student · LLMs, AI agents, and post-training.</p></div>
      {moveEnabled && phase === 'home' && <div className="drag-surface" aria-hidden="true"
        onPointerDown={event => {
          if (event.button !== 0 || !event.isPrimary) return;
          event.preventDefault();
          const style = universe.current?.style;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, holeX: parseFloat(style?.getPropertyValue('--hole-x') || '50') / 100, holeY: parseFloat(style?.getPropertyValue('--hole-y') || '50') / 100 };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.classList.add('dragging');
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start || start.id !== event.pointerId) return;
          const x = Math.max(.08, Math.min(.92, start.holeX + (event.clientX - start.x) / innerWidth));
          const y = Math.max(.08, Math.min(.92, start.holeY + (event.clientY - start.y) / innerHeight));
          iframe.current?.contentWindow?.postMessage({ type: 'portfolio-scene', action: 'move', x, y }, location.origin);
        }}
        onPointerUp={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); }}
        onPointerCancel={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); }}
        onLostPointerCapture={event => { drag.current = null; event.currentTarget.classList.remove('dragging'); }}
      />}
      <div className="category-orbits">{categories.map((category, index) => <button key={category.id} className={`category category-${index} ${selected?.id === category.id ? 'chosen' : ''}`} disabled={phase !== 'home'} onClick={e => enter(category, e.currentTarget)}>
        <div className="category-content"><div className="category-meta"><span className="category-number">{category.number}</span><span className="category-arrow">↗</span></div>
        <h2 aria-label={category.title}><span aria-hidden="true">{category.title.split(' ').map((word, wi) => <span className="gravity-word" key={wi}>{[...word].map((letter, i) => <span className="gravity-letter" key={i}>{letter}</span>)}{' '}</span>)}</span></h2><p>{category.description}</p><span className="category-enter">[ EXPLORE {projects.filter(project => project.category === category.id).length} {category.id === 'skills' ? 'LIBRARY' : 'WORKS'} ]</span></div>
      </button>)}</div>
      <div className="size-control" aria-label="Black hole size"><button className="move-toggle" aria-label="Move black hole" aria-pressed={moveEnabled} disabled={!ready || phase !== 'home'} onClick={toggleMovement}>{moveEnabled ? 'MOVE ON · DRAG' : 'MOVE OFF'}</button><span>SCROLL TO RESIZE</span><button aria-label="Shrink black hole" disabled={!ready || phase !== 'home'} onClick={() => scene('resize', 100)}>−</button><button aria-label="Reset black hole size" disabled={!ready || phase !== 'home'} onClick={() => scene('reset-size')}>RESET</button><button aria-label="Enlarge black hole" disabled={!ready || phase !== 'home'} onClick={() => scene('resize', -100)}>+</button></div>
      <div className="center-reticle" aria-hidden="true">+<span>+</span></div>
      <p className="enter-status" role="status">{phase === 'entering' ? `ENTERING / ${selected?.title}` : ''}</p>
    </section>}
    {phase === 'collection' && selected && <section className="collection" aria-label={`${selected.title} collection`}>
      <button className="back" onClick={back}>← Back to the center <span>ESC</span></button>
      <div className="collection-heading"><span className="tiny">WORK / {selected.number}</span><h1 ref={heading} tabIndex={-1}>{selected.title}<span>.</span></h1><p>{selected.description}</p></div>
      <nav className="collection-nav" aria-label="Switch category">{categories.map(c => <button key={c.id} aria-current={selected.id === c.id ? 'page' : undefined} onClick={() => setSelected(c)}>{c.number} / {c.title}</button>)}</nav>
      <div className="project-list">{projects.filter(project => project.category === selected.id).map((project, index) => <article className="work-entry" key={project.id}>
        <div className="work-index">{String(index + 1).padStart(2, '0')}</div>
        <div className="work-body"><span className="work-kind">{project.kind}</span><h2>{project.title}</h2>{(project.category === 'academic' || !project.description) && <p className="project-summary">{project.headline}</p>}{project.description && <p>{project.description}</p>}<div className="tags">{project.tags}</div>{project.note && <details className="project-notes"><summary>Notes & attribution</summary><p className="credit">{project.note}</p></details>}</div>
        <div className="project-links">{project.url ? <a href={project.url} target="_blank" rel="noreferrer">{project.linkLabel} ↗</a> : <span className="project-status">{project.status}</span>}{project.secondaryUrl && <a href={project.secondaryUrl} target="_blank" rel="noreferrer">{project.secondaryLabel} ↗</a>}</div>
      </article>)}</div>
      <footer className="collection-footer"><a href="https://github.com/pym96?tab=repositories" target="_blank" rel="noreferrer">MORE ON GITHUB ↗</a><button onClick={back}>Back to the center ↗</button></footer>
    </section>}
    <footer className="bottom-bar"><span><i />{phase === 'entering' ? 'ENTERING SUBSPACE' : phase === 'collection' ? `SPACE ${selected?.number}` : paused ? 'TIME SUSPENDED' : ready ? 'GRAVITY IS ACTIVE' : 'INITIALIZING GRAVITY'}</span><a className="book-credit" href="https://www.gutenberg.org/ebooks/1998" target="_blank" rel="noreferrer" title="Friedrich Nietzsche · Thomas Common translation · Prologue §1">TEXT: THUS SPAKE ZARATHUSTRA / NIETZSCHE ↗</a></footer>
  </main>;
}
