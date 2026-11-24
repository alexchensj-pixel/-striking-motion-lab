import { anchorZ, chapterOrder } from '../Camera/waypoints.js';

const FROM_Z = anchorZ(chapterOrder.indexOf('character-select')) - 2;
const TO_Z = anchorZ(chapterOrder.indexOf('asesoria-lab')) + 3;
const LENGTH = FROM_Z - TO_Z;
const FRAME_COUNT = 7;
const FRAME_SPACING = LENGTH / (FRAME_COUNT - 1);

function PortalFrame({ z, index }) {
  const steel = index % 2 ? '#343b46' : '#414955';
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 6.8, 0, 0]}>
          <mesh position={[0, 4.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 8.2, 0.62]} />
            <meshStandardMaterial color={steel} metalness={0.72} roughness={0.42} />
          </mesh>
          <mesh position={[-side * 0.34, 3.4, 0]} castShadow>
            <boxGeometry args={[0.16, 0.16, 1.25]} />
            <meshStandardMaterial color="#202630" metalness={0.65} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.16, 0]} receiveShadow>
            <boxGeometry args={[0.9, 0.32, 1.05]} />
            <meshStandardMaterial color="#171c24" metalness={0.55} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 8.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[14.05, 0.48, 0.72]} />
        <meshStandardMaterial color={steel} metalness={0.72} roughness={0.42} />
      </mesh>
      <mesh position={[0, 7.76, 0.39]}>
        <boxGeometry args={[11.4, 0.035, 0.045]} />
        <meshBasicMaterial color="#8fa8d6" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 7.25, 0]} color="#a9bad8" intensity={index === 3 ? 18 : 11} distance={13} decay={2} />
    </group>
  );
}

export default function TransitionSpine() {
  return (
    <group>
      <mesh position={[0, 0.025, (FROM_Z + TO_Z) / 2]} receiveShadow>
        <boxGeometry args={[14, 0.12, LENGTH + 2]} />
        <meshStandardMaterial color="#111720" metalness={0.32} roughness={0.82} />
      </mesh>
      <mesh position={[-6.72, 0.22, (FROM_Z + TO_Z) / 2]}>
        <boxGeometry args={[0.08, 0.32, LENGTH]} />
        <meshStandardMaterial color="#596577" metalness={0.65} roughness={0.48} />
      </mesh>
      <mesh position={[6.72, 0.22, (FROM_Z + TO_Z) / 2]}>
        <boxGeometry args={[0.08, 0.32, LENGTH]} />
        <meshStandardMaterial color="#596577" metalness={0.65} roughness={0.48} />
      </mesh>
      {Array.from({ length: FRAME_COUNT }, (_, i) => (
        <PortalFrame key={i} index={i} z={FROM_Z - i * FRAME_SPACING} />
      ))}
      {[-5.9, 5.9].map((x) => (
        <mesh key={x} position={[x, 0.092, (FROM_Z + TO_Z) / 2]}>
          <boxGeometry args={[0.045, 0.018, LENGTH - 1]} />
          <meshBasicMaterial color="#657b9d" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
