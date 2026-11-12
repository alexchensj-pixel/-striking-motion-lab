import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, MathUtils, ShaderMaterial, TextureLoader } from 'three';
import { useStore } from '../../App/store.js';
import { getCharactersReveal } from '../Transitions/scrollState.js';
import { CELL } from './cells.js';

const VERT = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = `uniform sampler2D uStill;
uniform float uGain;
uniform float uReflect;
varying vec2 vUv;
void main() {
  vec3 c = pow(max(texture2D(uStill, vUv).rgb, vec3(0.0)), vec3(0.82));
  float f = 1.0;
  if (uReflect > 0.5) f = (1.0 - smoothstep(0.0, 0.42, vUv.y)) * 0.35;
  gl_FragColor = vec4(c * uGain * f, 1.0);
}`;

function makeMaterial(still, reflect) {
  return new ShaderMaterial({
    uniforms: { uStill: { value: still }, uGain: { value: 0 }, uReflect: { value: reflect ? 1 : 0 } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
  });
}

export default function Fighter({ discipline }) {
  const { id, poster, stage } = discipline;
  const group = useRef(null);
  const mirror = useRef(null);
  const state = useRef({ gain: 0, scale: 1 });

  const media = useMemo(() => {
    const still = new TextureLoader().load(poster);
    return { main: makeMaterial(still, false), refl: makeMaterial(still, true) };
  }, [poster]);

  const geo = useMemo(() => {
    const h = CELL.fighterHeight / (stage.bot - stage.top);
    const w = h * stage.ar;
    return { w, h, x: (0.5 - stage.cx) * w, cy: (stage.bot - 0.5) * h };
  }, [stage]);

  useFrame((_, dt) => {
    const focused = useStore.getState().selectedDiscipline;
    const isFocus = focused === id;
    const s = state.current;
    s.gain = MathUtils.damp(s.gain, isFocus ? 1 : 0, 4, dt);
    s.scale = MathUtils.damp(s.scale, focused ? (isFocus ? 1.12 : 0.95) : 1, 4, dt);
    if (group.current) group.current.scale.set(s.scale, s.scale, 1);
    if (mirror.current) mirror.current.scale.set(s.scale, -s.scale, 1);
    const gain = s.gain * getCharactersReveal();
    media.main.uniforms.uGain.value = gain;
    media.refl.uniforms.uGain.value = gain;
  });

  return (
    <group>
      <group ref={group} position={[0, CELL.feetY, 0]}>
        <mesh position={[geo.x, geo.cy, 0]} material={media.main}>
          <planeGeometry args={[geo.w, geo.h]} />
        </mesh>
      </group>
      <group ref={mirror} position={[0, 0, 0]} scale={[1, -1, 1]}>
        <mesh position={[geo.x, CELL.feetY + geo.cy, 0]} material={media.refl}>
          <planeGeometry args={[geo.w, geo.h]} />
        </mesh>
      </group>
    </group>
  );
}
