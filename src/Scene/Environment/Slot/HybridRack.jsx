import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial,
  PlaneGeometry, SphereGeometry, SRGBColorSpace,
} from 'three';
import { getSlotGain } from '../Machine/machineGain.js';
import { PALETTE } from '../Machine/machineSpec.js';
import { makeStudioEnv } from '../Machine/SelectionMachine.jsx';
import { slotState, stepDrum, FACES } from '../../../Experience/Slot/slotState.js';
import { RACK, rackLayout } from './rackSpec.js';

// SCENE 04 — ENTRENAMIENTO: la MÁQUINA del laboratorio (geometría 3D real, no un componente). Es la escena del capítulo y el instrumento opcional
// para configurar FRECUENCIA y COMBINAR 1:1 + grupo reducido; ya no es un peaje para elegir formato (la elección directa no la recorre).
// Piezas:
//   · armario de grafito y acero (misma materia que la máquina de 03; el rojo ya no es su identidad) sobre zócalo, con la BANDEJA DE SALIDA (4 huecos = capacidad física; con la frecuencia elegida se llenan N de ellos:
//     cada hueco toma el material de la modalidad: 1:1 aluminio · Parejas acero · Grupal grafito, con sus puntos);
//   · TAMBOR de eje horizontal (6 caras: 1:1 · PAREJAS · GRUPO REDUCIDO ×2) entre dos montantes, tras un cristal;
//   · ventana con marco, aguja de lectura (lee la frecuencia), tres pilotos (uno por modalidad) y un LED de clic;
//   · PALANCA lateral que baja al reservar. La física del tambor (reflejo, trinquete) vive en Experience/Slot/slotState.js.
// Presencia: la máquina se lee en reposo (luz técnica, tambor, cristal y acero propios de ESTE objeto); no se toca la luz de la escena.
const { N, R, LEN, DRUM_Y, WIN_H } = RACK; // cotas compartidas con la cámara y las placas DOM (rackSpec.js)
const LOOK = {
  '1-1': { c: '#eef1f4', e: 0.9, pips: 1 },
  duo: { c: '#aab1bb', e: 0.65, pips: 2 },
  grupo: { c: '#6b727c', e: 0.55, pips: 4 },
  empty: { c: '#0c0e11', e: 0, pips: 0 },
};
const PIPS = { 1: [[0, 0]], 2: [[-0.08, 0], [0.08, 0]], 4: [[-0.08, 0.08], [0.08, 0.08], [-0.08, -0.08], [0.08, -0.08]], 0: [] };
const LABEL = { '1-1': '1:1', duo: 'PAREJAS', grupo: 'GRUPO' };
const SUB = { '1-1': 'PRIVADO', duo: '2 PERSONAS', grupo: 'REDUCIDO' };
// Grabado técnico: el mismo que los módulos de la 03 (machinePaint.js: tinta gris fría, Inter Tight / JetBrains Mono, sin color).
const ink = (a = 1) => `rgba(214,220,230,${a})`;
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const SANS = "'Inter Tight', 'Helvetica Neue', Arial, sans-serif";
const smooth = (x) => x * x * (3 - 2 * x);

// Textura de la cara lateral del tambor: 6 paneles en la dirección u (alrededor del cilindro). El eje del cilindro es X,
// así que el texto se dibuja girado 90° para que se lea de izquierda a derecha en la ventana frontal.
// Si en pantalla el texto saliera espejado, es solo `MIRROR` (un valor).
const MIRROR = false;
function makeDrumTexture() {
  const S = 256, H = 360;
  const c = document.createElement('canvas');
  c.width = S * 6; c.height = H;
  const g = c.getContext('2d');
  FACES.forEach((id, k) => {
    const x = k * S, cx = x + S / 2;
    const grad = g.createLinearGradient(x, 0, x + S, H);
    grad.addColorStop(0, '#352515');
    grad.addColorStop(0.18, '#8c642e');
    grad.addColorStop(0.48, '#c49a50');
    grad.addColorStop(0.72, '#765126');
    grad.addColorStop(1, '#241a10');
    g.fillStyle = grad;
    g.fillRect(x, 0, S, H);
    // Pátina oscura y filetes de latón envejecido.
    g.fillStyle = 'rgba(16,12,8,.42)';
    g.fillRect(x + 5, 0, 5, H); g.fillRect(x + S - 10, 0, 5, H);
    g.strokeStyle = 'rgba(239,198,115,.8)'; g.lineWidth = 2;
    g.strokeRect(x + 14, 12, S - 28, H - 24);
    g.strokeStyle = 'rgba(45,29,13,.72)'; g.lineWidth = 1;
    g.strokeRect(x + 20, 18, S - 40, H - 36);
    // Roseta grabada y líneas radiales: cada cara parece una placa de un mecanismo antiguo.
    g.save(); g.translate(cx, H / 2);
    for (let a = 0; a < 16; a++) {
      g.save(); g.rotate(a * Math.PI / 8);
      g.strokeStyle = 'rgba(245,211,145,.28)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, -145); g.lineTo(0, -116); g.stroke();
      g.restore();
    }
    g.strokeStyle = 'rgba(245,211,145,.42)'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 0, 108, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, 101, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(22,15,8,.7)';
    [[-100,-145],[100,-145],[-100,145],[100,145]].forEach(([rx,ry]) => {
      g.beginPath(); g.arc(rx, ry, 5, 0, Math.PI*2); g.fill();
      g.strokeStyle = 'rgba(244,205,126,.9)'; g.lineWidth = 1.5; g.stroke();
    });
    g.restore();
    g.save(); g.translate(cx, H / 2); g.rotate(Math.PI / 2);
    if (MIRROR) g.scale(-1, 1);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 5; g.shadowOffsetY = 2;
    g.fillStyle = '#f4dfad';
    g.font = `600 ${id === 'duo' ? 58 : 88}px ${SANS}`;
    spaced(g, LABEL[id], 0, -10, id === 'duo' ? 7 : 9, H - 48);
    g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.strokeStyle = 'rgba(35,22,10,.85)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-28, 42); g.lineTo(28, 42); g.stroke();
    g.strokeStyle = 'rgba(250,220,157,.85)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(-25, 44); g.lineTo(25, 44); g.stroke();
    g.fillStyle = '#e6c786'; g.font = `500 22px ${MONO}`;
    spaced(g, SUB[id], 0, 78, 5, H - 68);
    g.restore();
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Texto con tracking (como machinePaint.js#spaced); si no cabe en maxW, se reduce el tracking.
function spaced(g, text, cx, y, gap, maxW) {
  const chars = [...text];
  const ws = chars.map((ch) => g.measureText(ch).width);
  const sum = ws.reduce((a, b) => a + b, 0);
  const gp = Math.max(0, Math.min(gap, (maxW - sum) / Math.max(1, chars.length - 1)));
  let x = cx - (sum + gp * (chars.length - 1)) / 2;
  g.textAlign = 'left';
  chars.forEach((ch, i) => { g.fillText(ch, x, y); x += ws[i] + gp; });
}

export default function HybridRack() {
  const root = useRef();
  const drum = useRef();
  const lever = useRef();
  const needle = useRef();
  const keyLight = useRef();
  const bays = useRef([]);
  const reveal = useRef(0);
  const size = useThree((s) => s.size);

  const geo = useMemo(() => ({
    plinth: new BoxGeometry(2.7, 0.12, 1.25),
    cabinet: new BoxGeometry(2.3, 0.74, 1.0),
    cabinetTop: new BoxGeometry(2.36, 0.05, 1.06),
    upright: new BoxGeometry(0.1, 1.55, 0.34),
    drum: (() => { const g = new CylinderGeometry(R, R, LEN, 72, 1, true); g.rotateZ(Math.PI / 2); return g; })(),
    hub: (() => { const g = new CylinderGeometry(0.16, 0.16, LEN + 0.16, 24); g.rotateZ(Math.PI / 2); return g; })(),
    flange: (() => { const g = new CylinderGeometry(R + 0.015, R + 0.015, 0.025, 72); g.rotateZ(Math.PI / 2); return g; })(),
    cowlTop: new BoxGeometry(LEN + 0.24, 0.5, 0.52),
    cowlBot: new BoxGeometry(LEN + 0.24, 0.5, 0.52),
    glass: new BoxGeometry(LEN + 0.06, WIN_H, 0.012),
    frameH: new BoxGeometry(LEN + 0.12, 0.035, 0.05),
    frameV: new BoxGeometry(0.035, WIN_H + 0.07, 0.05),
    pilot: new BoxGeometry(0.2, 0.045, 0.03),
    bayFrame: new BoxGeometry(0.4, 0.54, 0.02),
    bayWin: new PlaneGeometry(0.34, 0.48),
    bayLed: new BoxGeometry(0.26, 0.022, 0.02),
    pip: new SphereGeometry(0.035, 14, 10),
    needle: new BoxGeometry(0.03, 0.03, 0.03),
    leverArm: new BoxGeometry(0.045, 0.62, 0.045),
    leverKnob: new SphereGeometry(0.1, 20, 16),
    leverBase: (() => { const g = new CylinderGeometry(0.1, 0.1, 0.1, 20); g.rotateZ(Math.PI / 2); return g; })(),
    clickLed: new SphereGeometry(0.035, 12, 10),
    rivet: new SphereGeometry(0.018, 12, 10),
    shadow: new PlaneGeometry(3.4, 1.8),
  }), []);

  const tex = useMemo(() => makeDrumTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const gl = useThree((st) => st.gl);
  // Entorno de reflexión propio (el mismo que la máquina de 03: luminarias lineales del techo): el grafito y el acero brillan donde brillan ellas.
  const env = useMemo(() => makeStudioEnv(gl), [gl]);
  useEffect(() => () => env.dispose(), [env]);

  const mats = useMemo(() => {
    const fade = { transparent: true };
    const e = { envMap: env.texture, envMapIntensity: 1 };
    const lightC = new Color(PALETTE.light).multiplyScalar(0.9);
    return {
      plinth: new MeshStandardMaterial({ color: PALETTE.graphiteDark, metalness: 0.5, roughness: 0.55, ...e, ...fade }),
      body: new MeshStandardMaterial({ color: PALETTE.graphite, metalness: 0.65, roughness: 0.4, ...e, ...fade }),
      steel: new MeshStandardMaterial({ color: PALETTE.steel, metalness: 1, roughness: 0.3, ...e, ...fade }),
    brass: new MeshStandardMaterial({ color: '#b8873e', metalness: 0.92, roughness: 0.27, envMap: env.texture, envMapIntensity: 1.25, ...fade }),
    gold: new MeshStandardMaterial({ color: '#e0b866', metalness: 0.95, roughness: 0.2, envMap: env.texture, envMapIntensity: 1.35, ...fade }),
      aluminum: new MeshStandardMaterial({ color: PALETTE.aluminum, metalness: 0.9, roughness: 0.5, ...e, ...fade }),
      dark: new MeshStandardMaterial({ color: PALETTE.graphiteDark, metalness: 0.5, roughness: 0.55, ...e, ...fade }),
      drum: new MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new Color('#ffffff'), emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.5, ...fade }),
      glass: new MeshStandardMaterial({ color: '#9fb4cf', metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.22, depthWrite: false }),
      // «red» / «redDim» conservan su nombre pero ya no son rojo: son el filete de luz de la máquina (PALETTE.light), punto de lectura, no marca.
      red: new MeshBasicMaterial({ color: lightC, ...fade }),
      redDim: new MeshBasicMaterial({ color: lightC, ...fade }),
      pip: new MeshBasicMaterial({ color: '#0b0d10', ...fade }),
      pilots: ['1-1', 'duo', 'grupo'].map(() => new MeshBasicMaterial({ color: lightC, ...fade })),
      clickLed: new MeshBasicMaterial({ color: lightC, ...fade }),
      shadow: new MeshBasicMaterial({ color: '#000000', ...fade }),
      wins: Array.from({ length: N }, () => new MeshStandardMaterial({ color: '#0c0e11', emissive: '#000000', emissiveIntensity: 1, roughness: 0.6, ...fade })),
      leds: Array.from({ length: N }, () => new MeshBasicMaterial({ color: lightC, ...fade })),
    };
  }, [tex, env]);
  const tmp = useMemo(() => new Color(), []);

  useFrame((_, dt) => {
    // En el capítulo `slot` Slot.jsx pone show=true: la máquina se monta con el travelling 03→04 (getSlotGain) y no queda apagada en reposo.
    const want = slotState.show ? 1 : 0;
    reveal.current += (want - reveal.current) * Math.min(1, dt * 3);
    const g = getSlotGain() * smooth(Math.min(1, Math.max(0, reveal.current)));
    if (root.current) root.current.visible = g > 0.005;
    if (g <= 0.005) return;

    stepDrum(dt);
    const d = slotState.drum;

    [mats.plinth, mats.body, mats.steel, mats.brass, mats.gold, mats.aluminum, mats.dark, mats.drum, mats.pip, mats.clickLed, mats.red, mats.redDim].forEach((m) => { m.opacity = g; });
    mats.glass.opacity = 0.24 * g;
    mats.shadow.opacity = 0.55 * g;

    // Tambor: el ángulo sale de la física. Aguja: da un pequeño tirón con cada clic del trinquete.
    if (drum.current) drum.current.rotation.x = d.alpha;
    // La aguja además LEE la frecuencia elegida (reflejo de la UI, FRECUENCIA): 1 sesión/semana abajo · 2 al centro · 3 arriba; sin elegir, en reposo.
    if (needle.current) {
      const fy = slotState.freq === 1 ? -0.24 : slotState.freq === 3 ? 0.24 : 0;
      needle.current.position.y += (fy - needle.current.position.y) * Math.min(1, dt * 7);
      needle.current.rotation.z = Math.PI / 4 - 0.5 * d.click; needle.current.position.x = -0.02 * d.click;
    }
    // Palanca: baja al lanzar.
    if (lever.current) lever.current.rotation.x = 0.1 + 0.85 * d.lever;
    // Pilotos: el de la cara en ventana se enciende al asentarse; todos parpadean con los clics durante el giro.
    ['1-1', 'duo', 'grupo'].forEach((id, i) => {
      const on = d.result === id ? 1 : 0;
      mats.pilots[i].opacity = g * Math.min(1, 0.12 + on * (0.55 + 0.45 * d.settle) + (d.spinning ? 0.35 * d.click : 0));
    });
    mats.clickLed.opacity = g * (0.1 + 0.9 * d.click);
    mats.red.opacity = g * (0.55 + 0.45 * (d.spinning ? 1 : d.settle));
    if (keyLight.current) keyLight.current.intensity = (8 + 4 * d.click + 3 * d.settle) * g; // reposo > 0 (misma frialdad #cfdcf0 que las lineales de la nave): la máquina no depende del clic para leerse

    // Bandeja de salida: un hueco por sesión del plan (misma lógica de materiales que el bastidor anterior).
    for (let i = 0; i < N; i++) {
      const id = slotState.bays[i];
      const look = LOOK[id] || LOOK.empty;
      const w = mats.wins[i];
      tmp.set(look.c);
      w.color.lerp(tmp, 0.14);
      w.emissive.lerp(tmp, 0.14);
      w.emissiveIntensity += (look.e - w.emissiveIntensity) * 0.14;
      w.opacity = g;
      mats.leds[i].opacity = g * (id ? 1 : 0.1);
      const pips = bays.current[i];
      if (pips) {
        const layout = PIPS[look.pips];
        pips.forEach((mesh, k) => {
          const p = layout[k];
          mesh.visible = !!p;
          if (p) mesh.position.set(p[0], p[1], 0.02);
        });
      }
    }
  });

  // Responsive: en pantallas verticales la máquina se centra y baja un poco; en horizontales se desplaza a la derecha
  // para dejar la columna de texto libre. La escala sigue el ancho del viewport.
  const { scale, px } = rackLayout(size.width / Math.max(1, size.height));

  return (
    <group ref={root} position={[px, 0.006, 0]} scale={scale}>
      {/* sombra de contacto + zócalo + armario */}
      <mesh geometry={geo.shadow} material={mats.shadow} rotation-x={-Math.PI / 2} position={[0, 0.002, 0.05]} />
      <mesh geometry={geo.plinth} material={mats.plinth} position={[0, 0.06, 0]} />
      <mesh geometry={geo.cabinet} material={mats.body} position={[0, 0.12 + 0.37, 0]} />
      <mesh geometry={geo.cabinetTop} material={mats.steel} position={[0, 0.12 + 0.74 + 0.025, 0]} />

      {/* bandeja de salida: 4 huecos físicos (capacidad); el plan llena N = frecuencia */}
      {Array.from({ length: N }, (_, i) => (
        <group key={i} position={[(i - (N - 1) / 2) * 0.5, 0.12 + 0.37, 0.5]}>
          <mesh geometry={geo.bayFrame} material={mats.steel} />
          <group position={[0, 0, 0.012]}>
            <mesh geometry={geo.bayWin} material={mats.wins[i]} />
            {Array.from({ length: 4 }, (_, k) => (
              <mesh key={k} geometry={geo.pip} material={mats.pip} visible={false}
                ref={(el) => { (bays.current[i] ||= [])[k] = el; }} />
            ))}
          </group>
          <mesh geometry={geo.bayLed} material={mats.leds[i]} position={[0, 0.24, 0.016]} />
        </group>
      ))}

      {/* cuerpo del tambor: montantes, tambor, bridas, cubos, cubiertas y cristal */}
      <group position={[0, 0.12 + 0.74 + 0.05, 0]}>
        <mesh geometry={geo.upright} material={mats.body} position={[-(LEN / 2 + 0.17), 0.775, 0]} />
        <mesh geometry={geo.upright} material={mats.body} position={[LEN / 2 + 0.17, 0.775, 0]} />
        <group position={[0, DRUM_Y - 0.91, 0]}>
          <mesh ref={drum} geometry={geo.drum} material={mats.drum} />
          <mesh geometry={geo.flange} material={mats.brass} position={[-LEN / 2, 0, 0]} />
          <mesh geometry={geo.flange} material={mats.brass} position={[LEN / 2, 0, 0]} />
          <mesh geometry={geo.hub} material={mats.brass} />

          {/* cubiertas superior e inferior: dejan solo la ventana de lectura */}
          <mesh geometry={geo.cowlTop} material={mats.body} position={[0, WIN_H / 2 + 0.25, R - 0.14]} />
          <mesh geometry={geo.cowlBot} material={mats.body} position={[0, -(WIN_H / 2 + 0.25), R - 0.14]} />
          {/* ventana: cristal + marco + aguja */}
          <mesh geometry={geo.glass} material={mats.glass} position={[0, 0, R + 0.1]} />
          <mesh geometry={geo.frameH} material={mats.gold} position={[0, WIN_H / 2 + 0.0175, R + 0.1]} />
          <mesh geometry={geo.frameH} material={mats.gold} position={[0, -WIN_H / 2 - 0.0175, R + 0.1]} />
          <mesh geometry={geo.frameV} material={mats.gold} position={[-(LEN / 2 + 0.06), 0, R + 0.1]} />
          <mesh geometry={geo.frameV} material={mats.gold} position={[LEN / 2 + 0.06, 0, R + 0.1]} />
          {[-1, 1].map((side) => [-1, 1].map((vertical) => (
            <mesh key={`${side}-${vertical}`} geometry={geo.rivet} material={mats.gold}
              position={[side * (LEN / 2 + 0.06), vertical * (WIN_H / 2 + 0.0175), R + 0.135]} />
          )))}
          <mesh ref={needle} geometry={geo.needle} material={mats.red} position={[-(LEN / 2 + 0.01), 0, R + 0.12]} rotation-z={Math.PI / 4} />

          {/* tres pilotos (uno por modalidad) y LED de clic, sobre la cubierta superior */}
          {mats.pilots.map((m, i) => (
            <mesh key={i} geometry={geo.pilot} material={mats.brass} position={[(i - 1) * 0.26, WIN_H / 2 + 0.42, R + 0.125]} />
          ))}
          <mesh geometry={geo.clickLed} material={mats.clickLed} position={[LEN / 2 - 0.04, WIN_H / 2 + 0.42, R + 0.125]} />
        </group>

        {/* palanca lateral: base fija + brazo que baja al lanzar */}
        <group position={[LEN / 2 + 0.38, 0.55, 0.05]}>
          <mesh geometry={geo.leverBase} material={mats.steel} />
          <group ref={lever}>
            <mesh geometry={geo.leverArm} material={mats.steel} position={[0, 0.31, 0]} />
            <mesh geometry={geo.leverKnob} material={mats.aluminum} position={[0, 0.65, 0]} />
          </group>
        </group>
      </group>

      {/* luz técnica de la ventana (pulsa con los clics y al asentarse) */}
      <pointLight ref={keyLight} position={[0, 1.7, 1.4]} intensity={0} distance={6} decay={2} color="#cfdcf0" />
    </group>
  );
}
