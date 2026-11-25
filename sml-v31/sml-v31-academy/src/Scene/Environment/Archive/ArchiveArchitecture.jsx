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
      const ink = '#171614', orange = '#e85b19', paper = '#eee5d3', muted = '#766f63';
      g.fillStyle = paper; g.fillRect(0, 0, 768, 1024);
      for (let i = 0; i < 1800; i++) { const x=(i*137.5)%768, y=(i*83.7)%1024; g.fillStyle=i%3?'rgba(35,29,20,.035)':'rgba(255,255,255,.16)'; g.fillRect(x,y,1+(i%3),1); }
      g.strokeStyle='rgba(23,22,20,.42)'; g.lineWidth=2; g.strokeRect(28,28,712,968);
      g.strokeStyle=orange; g.lineWidth=7; g.beginPath(); g.moveTo(28,120); g.lineTo(28,28); g.lineTo(120,28); g.moveTo(648,996); g.lineTo(740,996); g.lineTo(740,904); g.stroke();
      g.save(); g.translate(112,118); g.rotate(-0.12); g.fillStyle=orange; g.font='italic 900 112px Georgia'; g.fillText(spec.number,0,0); g.restore();
      g.fillStyle=ink; g.font='900 47px Arial'; g.textBaseline='top';
      const words=spec.title.split(' '); let line='', y=190;
      words.forEach((word)=>{ const test=line?line+' '+word:word; if(g.measureText(test).width>650&&line){g.fillText(line,54,y);y+=54;line=word;}else line=test; });
      if(line){g.fillText(line,54,y);y+=62;}
      g.fillStyle=orange; g.fillRect(54,y+5,230,8); y+=52; g.fillStyle=muted; g.font='600 22px Arial';
      const subtitles={motion:'BIOMECÁNICA · TÉCNICA · EFICIENCIA',method:'CICLO DE APRENDIZAJE',sports:'DISCIPLINAS DE COMBATE',progress:'SEGUIMIENTO · PROGRESO · OBJETIVO'};
      g.fillText(subtitles[spec.type],56,y); y+=64;
      const brush=(x,yy,w,h,color=orange)=>{g.save();g.translate(x,yy);g.rotate(-0.035);g.fillStyle=color;g.beginPath();g.moveTo(0,8);g.lineTo(w-18,0);g.lineTo(w,h*.28);g.lineTo(w-12,h);g.lineTo(10,h-5);g.closePath();g.fill();g.restore();};
      const icon=(cx,cy,kind,color=ink)=>{g.save();g.translate(cx,cy);g.strokeStyle=color;g.lineWidth=7;g.lineCap='round';g.lineJoin='round';g.beginPath();
        if(kind==='eye'){g.moveTo(-35,0);g.quadraticCurveTo(0,-34,35,0);g.quadraticCurveTo(0,34,-35,0);g.moveTo(0,-10);g.arc(0,0,10,0,Math.PI*2);}
        else if(kind==='record'){g.ellipse(0,-22,27,10,0,0,Math.PI*2);g.moveTo(-27,-22);g.lineTo(-27,22);g.ellipse(0,22,27,10,0,0,Math.PI);g.moveTo(27,-22);g.lineTo(27,22);}
        else if(kind==='chart'){g.moveTo(-30,28);g.lineTo(-30,-4);g.moveTo(-8,28);g.lineTo(-8,-22);g.moveTo(14,28);g.lineTo(14,-42);g.moveTo(-40,30);g.lineTo(38,30);}
        else if(kind==='target'){g.arc(0,0,30,0,Math.PI*2);g.arc(0,0,10,0,Math.PI*2);g.moveTo(-43,0);g.lineTo(-28,0);g.moveTo(28,0);g.lineTo(43,0);}
        else if(kind==='glove'){g.moveTo(-24,26);g.lineTo(-32,4);g.quadraticCurveTo(-42,-35,-10,-42);g.quadraticCurveTo(26,-48,34,-15);g.lineTo(25,20);g.lineTo(8,34);g.lineTo(-24,26);}
        g.stroke();g.restore();};
      if(spec.type==='motion'){
        g.strokeStyle=ink;g.lineWidth=13;g.lineCap='round';g.beginPath();g.moveTo(310,y+30);g.lineTo(410,y+210);g.lineTo(340,y+390);g.stroke();
        g.strokeStyle=orange;g.lineWidth=5;g.beginPath();g.arc(410,y+210,82,0,Math.PI*2);g.arc(410,y+210,118,0,Math.PI*2);g.stroke();
        [[310,y+30],[410,y+210],[340,y+390]].forEach(([x,yy])=>{g.fillStyle=paper;g.beginPath();g.arc(x,yy,18,0,Math.PI*2);g.fill();g.strokeStyle=orange;g.lineWidth=7;g.stroke();});
        g.fillStyle=ink;g.font='italic 700 28px Georgia';g.fillText('EJE · ÁNGULO · TRAYECTORIA',74,900);
      }else if(spec.type==='method'){
        const steps=[['eye','OBSERVAR'],['record','REGISTRAR'],['chart','ANALIZAR'],['target','CORREGIR']], pts=[[384,y+130],[190,y+300],[578,y+300],[384,y+485]];
        g.strokeStyle=orange;g.lineWidth=8;g.beginPath();g.arc(384,y+300,205,.15,Math.PI*1.85);g.stroke();
        steps.forEach(([kind,label],i)=>{const [x,yy]=pts[i];icon(x,yy,kind,orange);g.fillStyle=ink;g.font='900 24px Arial';g.textAlign='center';g.fillText(label,x,yy+58);});g.textAlign='left';
      }else if(spec.type==='sports'){
        const rows=[['MUAY THAI','band'],['BOXEO','glove'],['KICKBOXING · K1','glove']];
        rows.forEach(([label,kind],i)=>{const yy=y+28+i*205;brush(58,yy,650,142,i===1?ink:orange);g.save();g.translate(160,yy+68);g.strokeStyle=i===1?paper:ink;g.lineWidth=8;g.lineCap='round';g.beginPath();
          if(kind==='glove'){g.moveTo(-30,32);g.quadraticCurveTo(-55,-25,-8,-45);g.quadraticCurveTo(48,-48,42,5);g.lineTo(20,38);g.closePath();}else{g.ellipse(0,0,62,20,0,0,Math.PI*2);g.moveTo(-55,0);g.lineTo(-76,32);g.moveTo(55,0);g.lineTo(76,32);}g.stroke();g.restore();g.fillStyle=i===1?paper:ink;g.font='italic 900 37px Arial';g.fillText(label,290,yy+52);});
      }else{
        g.strokeStyle=ink;g.lineWidth=3;g.beginPath();g.moveTo(86,y+330);g.lineTo(680,y+330);g.moveTo(86,y+30);g.lineTo(86,y+330);g.stroke();
        g.strokeStyle=orange;g.lineWidth=9;g.beginPath();g.moveTo(105,y+285);g.lineTo(220,y+250);g.lineTo(335,y+230);g.lineTo(450,y+145);g.lineTo(565,y+110);g.lineTo(660,y+45);g.stroke();
        [['TÉCNICA','target'],['CONDICIÓN','chart'],['CONTROL','eye'],['ESTRATEGIA','record']].forEach(([label,kind],i)=>{const yy=y+405+i*92;icon(112,yy,kind,orange);g.fillStyle=ink;g.font='900 27px Arial';g.fillText(label,180,yy-17);g.strokeStyle='rgba(23,22,20,.25)';g.lineWidth=13;g.beginPath();g.moveTo(180,yy+24);g.lineTo(665,yy+24);g.stroke();g.strokeStyle=orange;g.lineWidth=13;g.beginPath();g.moveTo(180,yy+24);g.lineTo(180+[270,350,310,390][i],yy+24);g.stroke();});
      }
      g.fillStyle=ink;g.font='italic 700 20px Georgia';g.fillText('COMBAT TRAINING · FIELD NOTES',56,970);
      const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;t.anisotropy=aniso;return t;
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
