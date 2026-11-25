import React from 'react';
import { anchorZ } from '../Scene/Camera/waypoints.js';
import { chapters } from '../Data/Content.js';

const MAT = { frame: '#252d38', dark: '#111720', rail: '#d85b32', light: '#8aa9bd', glass: '#1c2934' };

function Beam({ position, size, material = MAT.frame, emissive = '#080d13' }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={material} metalness={0.62} roughness={0.42} emissive={emissive} emissiveIntensity={0.42} />
  </mesh>;
}

function SpineBay({ z, index, width }) {
  const h = 7.2;
  const x = width / 2;
  return <group position={[0, 0, z]}>
    {[-1, 1].map(side => <group key={side} position={[side * x, 0, 0]}>
      <Beam position={[0, h / 2, 0]} size={[0.34, h, 0.42]} />
      <Beam position={[-side * 0.58, h - 0.16, 0]} size={[1.5, 0.28, 0.42]} />
      <Beam position={[-side * 0.58, 0.18, 0]} size={[1.5, 0.26, 0.6]} material={MAT.dark} />
      <mesh position={[-side * 0.58, 3.6, 0]}><boxGeometry args={[0.045, 6.4, 0.05]} /><meshBasicMaterial color={MAT.light} /></mesh>
    </group>)}
    <Beam position={[0, h, 0]} size={[width * 2 + 0.7, 0.32, 0.48]} />
    <Beam position={[0, h - 0.42, 0]} size={[width * 1.65, 0.045, 0.06]} material={MAT.light} emissive={MAT.light} />
    <Beam position={[0, 0.12, 0]} size={[width * 2 - 0.8, 0.16, 0.34]} material={MAT.dark} />
    {index % 2 === 0 && <pointLight position={[0, h - 0.8, 0]} color="#b8cbd9" intensity={18} distance={13} decay={2} />}
  </group>;
}

function SideRail({ side, zMid, span }) {
  return <group position={[side * 6.35, 0, zMid]}>
    <Beam position={[0, 0.12, 0]} size={[0.12, 0.24, span]} material={MAT.rail} emissive={MAT.rail} />
    <Beam position={[0, 1.05, 0]} size={[0.16, 0.16, span]} material={MAT.frame} />
    {[-1, 1].map(end => <Beam key={end} position={[0, 0.58, end * span / 2]} size={[0.18, 1.1, 0.2]} />)}
  </group>;
}

export default function SpatialSpine() {
  const width = 8.2;
  const startZ = -18;
  const endZ = anchorZ(chapters.length - 1) - 18;
  const span = Math.abs(endZ - startZ);
  const mid = (startZ + endZ) / 2;
  const bays = [];
  for (let z = startZ; z >= endZ; z -= 8) bays.push(z);
  return <group>
    {bays.map((z, i) => <SpineBay key={z} z={z} index={i} width={width} />)}
    <SideRail side={-1} zMid={mid} span={span} />
    <SideRail side={1} zMid={mid} span={span} />
    {chapters.slice(1).map((chapter, i) => {
      const z = anchorZ(i + 1) - 1.2;
      return <group key={chapter.id} position={[0, 0, z]}>
        <Beam position={[0, 3.15, 0]} size={[width * 1.9, 0.12, 0.22]} material={MAT.glass} />
        <Beam position={[-width, 1.55, 0]} size={[0.16, 3.1, 0.24]} material={MAT.rail} emissive={MAT.rail} />
        <Beam position={[width, 1.55, 0]} size={[0.16, 3.1, 0.24]} material={MAT.rail} emissive={MAT.rail} />
      </group>;
    })}
  </group>;
}
