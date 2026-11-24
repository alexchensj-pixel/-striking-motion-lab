import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BoxGeometry, CanvasTexture, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { getArchiveGain } from '../Machine/machineGain.js';
import { rng } from '../Room/roomPaint.js';
import { ARCHIVE, FLOOR, slabX } from './archiveSpec.js';
import { paintSlabSide, paintSlabEnd, paintArchiveFloor, paintStreak } from './archivePaint.js';

// ESCENA 05 · SOBRE CHEN — los nueve volúmenes que YA estaban dibujados, desarrollados con material, relieve, luz y suelo.
// Las aristas de WireBox (blockouts.jsx#Archive) siguen exactamente donde estaban: aquí solo se les da cuerpo POR DENTRO
// de cada volumen (2 mm de holgura + polygonOffset), así cada línea original queda como la arista exterior. Misma
// técnica que la sala 03 (Room/RoomArchitecture.jsx): SOMBREADO HORNEADO en texturas, cero luces nuevas, cero sombras
// dinámicas. Lo único vivo es la intensidad: la estación activa (los mismos pesos `weights` que mueven las líneas) sube el
// brillo de sus volúmenes, de su canto luminoso y del reflejo en el suelo. Aparece y se apaga con getArchiveGain().
const INSET = 0.002;
const STREAK = { w: 0.5, len: 3.5 }; // reflejo del canto en el suelo (m)
const PANEL_SPECS = [
  { index: 1, number: '01', title: 'ANÁLISIS DEL MOVIMIENTO', lines: ['OBSERVAR · REGISTRAR', 'ANALIZAR · CORREGIR'], type: 'motion' },
  { index: 3, number: '02', title: 'MÉTODO DE ENTRENAMIENTO', lines: ['TÉCNICA', 'PLANIFICACIÓN', 'SEGUIMIENTO'], type: 'method' },
  { index: 6, number: '03', title: 'DISCIPLINAS', lines: ['MUAY THAI', 'BOXEO', 'KICKBOXING · K1'], type: 'sports' },
  { index: 7, number: '04', title: 'EVOLUCIÓN', lines: ['TÉCNICA', 'CONDICIÓN', 'ESTRATEGIA', 'CONFIANZA'], type: 'progress' },
];

export default function ArchiveArchitecture({ weights }) {
  const root = useRef();
  const gl = useThree((s) => s.gl);
  const [SW, SH, SD] = ARCHIVE.size;

  const res = useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const tex = (w, h, paint, repeatAniso = true) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      paint(c.getContext('2d'), w, h);
      const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
      if (repeatAniso) t.anisotropy = aniso;
      return t;
    };
    const PPM = { slab: 96, floor: 20 };
    const panelTextures = PANEL_SPECS.map((spec) => {
      const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 1024;
      const g = canvas.getContext('2d');
      const bg = g.createLinearGradient(0, 0, 768, 1024); bg.addColorStop(0, '#111a22'); bg.addColorStop(1, '#05090e');
      g.fillStyle = bg; g.fillRect(0, 0, 768, 1024);
      g.strokeStyle = 'rgba(84,217,232,.75)'; g.lineWidth = 5; g.strokeRect(22, 22, 724, 980);
      g.fillStyle = '#54d9e8'; g.font = '700 32px Arial'; g.fillText('STRIKING MOTION LAB', 58, 92);
      g.font = '700 76px Arial'; g.fillText(spec.number, 58, 205);
      g.fillStyle = '#f2f6f8'; g.font = '700 48px Arial';
      const words = spec.title.split(' '); let line = '', y = 300;
      words.forEach((word) => { const test = line ? `${line} ${word}` : word; if (g.measureText(test).width > 630 && line) { g.fillText(line, 58, y); y += 58; line = word; } else line = test; });
      if (line) { g.fillText(line, 58, y); y += 76; }
      g.strokeStyle = 'rgba(84,217,232,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(58, y); g.lineTo(710, y); g.stroke(); y += 78;
      spec.lines.forEach((label) => { g.fillStyle = '#54d9e8'; g.fillRect(62, y - 25, 14, 14); g.fillStyle = '#dce7ed'; g.font = '600 30px Arial'; g.fillText(label, 100, y); y += 68; });
      g.strokeStyle = 'rgba(84,217,232,.85)'; g.lineWidth = 5; g.beginPath();
      if (spec.type === 'progress' || spec.type === 'motion') { g.moveTo(90, 900); g.lineTo(220, 850); g.lineTo(350, 790); g.lineTo(480, 690); g.lineTo(650, 590); }
      else { g.moveTo(90, 900); g.lineTo(220, 830); g.lineTo(350, 870); g.lineTo(480, 760); g.lineTo(650, 800); }
      g.stroke();
      const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; t.anisotropy = aniso; return t;
    });
    const tx = {
      // BoxGeometry invierte la U entre +x y −x: el canto delantero (+z) cae a la izquierda en +x y a la derecha en −x
      sideP: tex(SD * PPM.slab, SH * PPM.slab, (g, w, h) => paintSlabSide(g, w, h, { ppm: PPM.slab, frontAtLeft: true, seed: 3 })),
      sideN: tex(SD * PPM.slab, SH * PPM.slab, (g, w, h) => paintSlabSide(g, w, h, { ppm: PPM.slab, frontAtLeft: false, seed: 7 })),
      end: tex(48, 256, paintSlabEnd, false),
      floor: tex(FLOOR.size[0] * PPM.floor, FLOOR.size[1] * PPM.floor, (g, w, h) => paintArchiveFloor(g, w, h, { ppm: PPM.floor })),
      streak: tex(64, 256, paintStreak, false),
    };
    const po = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
    const dark = new MeshBasicMaterial({ color: '#0d1016', ...po });
    const floor = new MeshBasicMaterial({ map: tx.floor, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });

    // Variación de tono entre volúmenes (determinista): no son nueve copias idénticas.
    const r = rng(41);
    const slabs = Array.from({ length: ARCHIVE.n }, () => {
      const tint = 0.9 + r() * 0.18;
      return {
        tint,
        px: new MeshBasicMaterial({ map: tx.sideP, ...po }),
        nx: new MeshBasicMaterial({ map: tx.sideN, ...po }),
        end: new MeshBasicMaterial({ map: tx.end, ...po }),
        streak: new MeshBasicMaterial({ map: tx.streak, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
      };
    });
    // Orden de caras de BoxGeometry: +x, −x, +y, −y, +z, −z
    const mats = slabs.map((s) => [s.px, s.nx, dark, dark, s.end, dark]);
    const body = new BoxGeometry(SW - 2 * INSET, SH - 2 * INSET, SD - 2 * INSET);
    const floorGeo = new PlaneGeometry(FLOOR.size[0], FLOOR.size[1]);
    const streakGeo = new PlaneGeometry(STREAK.w, STREAK.len);
    const panelGeo = new PlaneGeometry(SD * 0.88, SH * 0.88);
    const panelMaterials = panelTextures.map((map) => new MeshBasicMaterial({ map, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    return { tx, dark, floor, slabs, mats, body, floorGeo, streakGeo, panelTextures, panelGeo, panelMaterials };
  }, [gl, SW, SH, SD]);

  useEffect(() => () => {
    res.dark.dispose(); res.floor.dispose();
    res.slabs.forEach((s) => { s.px.dispose(); s.nx.dispose(); s.end.dispose(); s.streak.dispose(); });
    Object.values(res.tx).forEach((t) => t.dispose());
    res.body.dispose(); res.floorGeo.dispose(); res.streakGeo.dispose(); res.panelGeo.dispose();
    res.panelMaterials.forEach((m) => m.dispose()); res.panelTextures.forEach((t) => t.dispose());
  }, [res]);

  useFrame(() => {
    const g = getArchiveGain();
    if (!root.current) return;
    root.current.visible = g > 0.01;
    if (!root.current.visible) return;
    const w = weights.current;
    res.dark.color.setScalar(g);
    res.floor.opacity = g;
    res.slabs.forEach((s, i) => {
      const k = g * (0.6 + 0.55 * w[i]) * s.tint; // cuerpo: en reposo apagado, enfocado más claro
      s.px.color.setScalar(k);
      s.nx.color.setScalar(k);
      s.end.color.setScalar(g * (0.8 + 0.4 * w[i]));  // rendija del canto: tenue siempre, más viva al enfocar (la cara es hormigón oscuro)
      s.streak.opacity = g * (0.15 + 0.85 * w[i]) * 0.2; // reflejo en el suelo
    });
    res.panelMaterials.forEach((m, i) => { m.opacity = g * (0.72 + 0.28 * w[PANEL_SPECS[i].index]); });
  });

  return (
    <group ref={root} visible={false}>
      {/* Suelo pulido sobre la retícula global; renderOrder bajo para ir antes que la superficie oscura (−1) y los reflejos */}
      <mesh position={[0, FLOOR.y, 0]} rotation-x={-Math.PI / 2} geometry={res.floorGeo} material={res.floor} renderOrder={-2} />
      {res.slabs.map((s, i) => (
        <group key={i} position={[slabX(i), 0, 0]}>
          <mesh position={[0, ARCHIVE.y, 0]} geometry={res.body} material={res.mats[i]} />
          {/* Reflejo del canto luminoso: nace en el frente del volumen (z = +1,5) y se alarga hacia la cámara */}
          <mesh position={[0, FLOOR.y + 0.004, SD / 2 + STREAK.len / 2]} rotation-x={-Math.PI / 2} geometry={res.streakGeo} material={s.streak} renderOrder={2} />
        </group>
      ))}
      {PANEL_SPECS.map((spec, i) => (
        <mesh key={`panel-${spec.index}`} position={[slabX(spec.index) + ARCHIVE.size[0] / 2 + 0.012, ARCHIVE.y, 0]} rotation-y={Math.PI / 2} geometry={res.panelGeo} material={res.panelMaterials[i]} renderOrder={3} />
      ))}
    </group>
  );
}
