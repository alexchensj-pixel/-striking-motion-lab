import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, MathUtils, ShaderMaterial, TextureLoader, Vector2 } from 'three';
import { useStore } from '../../App/store.js';
import { getCharactersReveal } from '../Transitions/scrollState.js';
import { disciplines } from '../../Data/Disciplines.js';
import { CELL, cellX, layoutK, exploreLayoutAspect } from './cells.js';

// La misma imagen individual alimenta el overview y el estado enfocado.
// Así no hay recorte de un vídeo de grupo ni salto de identidad al seleccionar.
const GAIN_IDLE = 1.0;
const GAIN_DIM = 0.68;
const APPROACH_Z = 14;

const VERT = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = `uniform sampler2D uStill;
uniform float uGain;
uniform float uReflect;
uniform vec2 uRange;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(mix(uRange.x, uRange.y, vUv.x), vUv.y);
  vec3 c = pow(max(texture2D(uStill, uv).rgb, vec3(0.0)), vec3(0.82));
  float f = 1.0;
  if (uReflect > 0.5) f = (1.0 - smoothstep(0.0, 0.42, vUv.y)) * 0.35;
  gl_FragColor = vec4(c * uGain * f, 1.0);
}`;

function makeMaterial(still, reflect) {
  return new ShaderMaterial({
    uniforms: {
      uStill: { value: still }, uGain: { value: 0 },
      uReflect: { value: reflect ? 1 : 0 }, uRange: { value: new Vector2(0, 1) },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
  });
}

export default function RosterGroup() {
  const state = useRef({ gain: disciplines.map(() => 0) });
  const approach = useRef(null);
  const mainGroups = useRef([]);
  const reflGroups = useRef([]);
  const mainMeshes = useRef([]);
  const reflMeshes = useRef([]);

  const entries = useMemo(() => disciplines.map((discipline, index) => {
    const still = new TextureLoader().load(discipline.poster);
    const h = CELL.fighterHeight / (discipline.stage.bot - discipline.stage.top);
    const w = h * discipline.stage.ar;
    const cy = (discipline.stage.bot - 0.5) * h;
    const x = (0.5 - discipline.stage.cx) * w;
    return {
      id: discipline.id,
      index,
      w, h, cy, x,
      main: makeMaterial(still, false),
      refl: makeMaterial(still, true),
    };
  }), []);

  useFrame(({ size }, dt) => {
    const focused = useStore.getState().selectedDiscipline;
    const focusedIdx = disciplines.findIndex((d) => d.id === focused);
    const reveal = getCharactersReveal();
    const aspect = exploreLayoutAspect(size.width, size.height);
    const horizontalScale = layoutK(aspect);

    if (approach.current) approach.current.position.z = APPROACH_Z * (1 - reveal);

    entries.forEach((entry, i) => {
      const isFocused = focusedIdx === i;
      const targetGain = focusedIdx < 0 ? GAIN_IDLE : isFocused ? 0 : GAIN_DIM;
      state.current.gain[i] = MathUtils.damp(state.current.gain[i], targetGain, 4, dt);
      entry.main.uniforms.uGain.value = state.current.gain[i] * reveal;
      entry.refl.uniforms.uGain.value = state.current.gain[i] * reveal;

      const x = cellX(i) * horizontalScale * reveal;
      if (mainGroups.current[i]) mainGroups.current[i].position.x = x;
      if (reflGroups.current[i]) reflGroups.current[i].position.x = x;
    });
  });

  return (
    <group ref={approach}>
      <group position={[0, CELL.feetY, 0]}>
        {entries.map((entry, i) => (
          <group key={entry.id} ref={(el) => (mainGroups.current[i] = el)}>
            <mesh ref={(el) => (mainMeshes.current[i] = el)} position={[entry.x, entry.cy, 0]} material={entry.main}>
              <planeGeometry args={[entry.w, entry.h]} />
            </mesh>
          </group>
        ))}
      </group>
      <group scale={[1, -1, 1]}>
        {entries.map((entry, i) => (
          <group key={entry.id} ref={(el) => (reflGroups.current[i] = el)}>
            <mesh ref={(el) => (reflMeshes.current[i] = el)} position={[entry.x, CELL.feetY + entry.cy, 0]} material={entry.refl}>
              <planeGeometry args={[entry.w, entry.h]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
