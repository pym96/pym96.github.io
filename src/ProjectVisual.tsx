import { useEffect, useRef } from 'react';

type Visual = { image: string; video?: string; caption: string; source: string; kind: string; alt: string };
const visuals: Record<string, Visual> = {
  'Pan-agent': { image: 'pan-agent.webp', video: 'pan-agent.mp4', caption: 'Recorded v0.1.0 terminal demo: a file task followed by saved-run replay. Idle waits shortened; input automated.', source: 'https://github.com/pym96/Pan-agent/releases/tag/v0.1.0', kind: 'TERMINAL RECORDING', alt: 'Pan Agent executing a file task in its terminal interface' },
  'Go2-Adaptive-LIO': { image: 'go2-lio.webp', video: 'go2-lio.mp4', caption: 'Quadruped simulation and mapping, from the repository demonstration.', source: 'https://github.com/pym96/Go2-Adaptive-LIO', kind: 'SIMULATION DEMO', alt: 'Go2 simulation and LiDAR mapping demonstration' },
  'Unitree-Go2-Adaptive-RL': { image: 'go2-rl.webp', video: 'go2-rl.mp4', caption: 'Go2 control demonstration from the project README.', source: 'https://github.com/pym96/Unitree-Go2-Adaptive-RL', kind: 'CONTROL DEMO', alt: 'Unitree Go2 reinforcement-learning control demonstration' },
  'Warehouse-Omni-Navigation': { image: 'warehouse.webp', caption: 'The warehouse simulation environment shown in the repository.', source: 'https://github.com/pym96/Warehouse-Omni-Navigation', kind: 'SIMULATION CAPTURE', alt: 'Warehouse simulation with an omnidirectional robot' },
  'PCA-Manim-Animation': { image: 'pca.webp', caption: 'Cover of my explainer on PCA for plane fitting. Open the video to see the animations.', source: 'https://www.bilibili.com/video/BV13bsVzMEAB/', kind: 'VIDEO COVER', alt: 'Video cover for the PCA plane-fitting explainer' },
  'matrix': { image: 'matrix.webp', caption: 'A frame rendered from the original Matrix animation source.', source: 'https://github.com/pym96/matrix', kind: 'RENDERED FROM SOURCE', alt: 'Green streams of binary characters in the Matrix animation' },
  'horizon': { image: 'horizon.webp', caption: 'The ASCII renderer used in this portfolio, adapted from SiddDevZ / horizon.', source: '/experiments/horizon/index.html?preset=video', kind: 'LIVE EXPERIMENT CAPTURE', alt: 'The rotating ASCII black hole surrounded by text' },
  'neurips-2026': { image: 'msr.webp', video: 'msr.mp4', caption: 'Query: “orange cat”. A released MSR-3D scene-query demonstration.', source: 'https://sparklingpumpkin.github.io/MSR-3D/', kind: '3D QUERY DEMO', alt: 'MSR-3D selecting the orange cat in a reconstructed 3D scene' },
};
const workflows: Record<string, { steps: [string, string][]; caption: string; source: string }> = {
  'pi-agent-platform': { steps: [['01 / SUBMIT', 'Text task'], ['02 / EXECUTE', 'Pi SDK'], ['03 / PERSIST', 'PostgreSQL events']], caption: 'Service schematic: committed events stream over SSE; reconnect with a cursor to resume reading history.', source: 'https://github.com/pym96/pi-agent-platform' },
  'Paper-Translation-Tools': { steps: [['01 / INPUT', 'Paper.pdf'], ['02 / PROCESS', 'Extract + translate'], ['03 / OUTPUT', 'Bilingual.docx']], caption: 'Workflow schematic: original and translated passages are organized in a Word document. Figure positions are marked for manual insertion.', source: 'https://github.com/pym96/Paper-Translation-Tools' },
  'skills': { steps: [['01 / DRAFT', 'Research paper'], ['02 / REVIEW', 'paper-reader'], ['03 / REVISE', 'Gaps + objections']], caption: 'Example workflow, not a recorded run. The library also includes testing, delivery, and engineering-judgment skills.', source: 'https://github.com/pym96/skills' },
};

export default function ProjectVisual({ id }: { id: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) node.pause(); });
    observer.observe(node);
    return () => { observer.disconnect(); node.pause(); };
  }, [id]);
  const visual = visuals[id];
  if (visual) return <figure className="project-visual">
    <div className="visual-label"><span>{visual.kind}</span><span>{visual.video ? 'PLAY TO EXPLORE ↓' : 'VIEW ↗'}</span></div>
    {visual.video ? <video ref={video} controls playsInline preload="none" poster={`/media/${visual.image}`} aria-label={visual.alt} src={`/media/${visual.video}`}><a href={`/media/${visual.video}`}>Open video</a></video> : <a className="visual-image-link" href={visual.source} target="_blank" rel="noreferrer"><img src={`/media/${visual.image}`} alt={visual.alt} width="1280" height="720" loading="lazy" decoding="async" /></a>}
    <figcaption>{visual.caption} <a href={visual.source} target="_blank" rel="noreferrer">Source ↗</a></figcaption>
  </figure>;
  const workflow = workflows[id];
  if (workflow) return <figure className="project-visual visual-schematic">
    <div className="visual-label"><span>{id === 'skills' ? 'SKILL IN USE / EXAMPLE' : 'WORKFLOW / SCHEMATIC'}</span><span>→</span></div>
    <ol className="workflow-steps">{workflow.steps.map(([label, title]) => <li key={label}><span>{label}</span><strong>{title}</strong></li>)}</ol>
    {id === 'skills' && <div className="skill-lenses">logic-gap · counter-argument · signpost-check</div>}
    {id === 'pi-agent-platform' && <div className="skill-lenses">SSE stream → client · reconnect → cursor replay</div>}
    <figcaption>{workflow.caption} <a href={workflow.source} target="_blank" rel="noreferrer">Source ↗</a></figcaption>
  </figure>;
  return <figure className="project-visual private-visual"><div className="visual-label"><span>RESEARCH / PRIVATE</span><span>[ — ]</span></div><div className="private-art" aria-hidden="true">{'┌────────────────┐\n│  BVI / PRIVATE │\n└────────────────┘'}</div><figcaption>Research visuals and repository are not public yet.</figcaption></figure>;
}
