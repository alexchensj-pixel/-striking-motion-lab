import { anchorZ } from '../legacy/Scene/Camera/waypoints.js';
import { chapters } from '../legacy/Data/Content.js';
import { Pillars, Room, Reels, Archive, Door } from '../legacy/Scene/Environment/blockouts.jsx';
import EntradaWorld from '../legacy/Scene/Environment/Entrada/EntradaWorld.jsx';
import { useStore } from '../legacy/App/store.js';

const blockouts = {
  entrada: EntradaWorld,
  'character-select': Pillars,
  'asesoria-lab': Room,
  slot: Reels,
  'proof-chen': Archive,
  reserva: Door,
};

// Keep the active chapter and its two transition neighbors. Unmounting distant
// chapters lets React Three Fiber dispose their geometries, materials and textures.
export default function MemoryEnvironment() {
  const activeChapter = useStore((state) => state.activeChapter);
  const activeIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === activeChapter));
  const mounted = chapters
    .map((chapter, index) => ({ chapter, index }))
    .filter(({ index }) => Math.abs(index - activeIndex) <= 1);

  return (
    <>
      <gridHelper args={[300, 150, '#1b2233', '#0e1320']} position={[0, 0, -200]} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -200]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#07090d" roughness={1} />
      </mesh>
      {mounted.map(({ chapter, index }) => {
        const Blockout = blockouts[chapter.id];
        if (!Blockout) return null;
        return (
          <group key={chapter.id} position={[0, 0, anchorZ(index)]}>
            <Blockout />
          </group>
        );
      })}
    </>
  );
}
