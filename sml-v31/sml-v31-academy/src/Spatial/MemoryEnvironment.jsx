import { anchorZ } from '../Scene/Camera/waypoints.js';
import { chapters } from '../Data/Content.js';
import {
  Pillars,
  Room,
  Reels,
  Archive,
  Door,
} from '../Scene/Environment/blockouts.jsx';
import EntradaWorld from '../Scene/Environment/Entrada/EntradaWorld.jsx';

// Keep every original spatial room mounted throughout the camera journey.
// The previous active-chapter window caused rooms to disappear at transitions
// and exposed empty stretches whenever scroll/camera progress got ahead of the
// active chapter observer. The original SML environment keeps these rooms alive.
const blockouts = {
  entrada: EntradaWorld,
  'character-select': Pillars,
  'asesoria-lab': Room,
  slot: Reels,
  'proof-chen': Archive,
  reserva: Door,
};

export default function MemoryEnvironment() {
  return (
    <>
      <gridHelper args={[300, 150, '#1b2233', '#0e1320']} position={[0, 0, -200]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -200]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#07090d" roughness={1} />
      </mesh>
      {chapters.map(({ id }, index) => {
        const Blockout = blockouts[id];
        if (!Blockout) return null;
        return (
          <group key={id} position={[0, 0, anchorZ(index)]}>
            <Blockout />
          </group>
        );
      })}
    </>
  );
}
