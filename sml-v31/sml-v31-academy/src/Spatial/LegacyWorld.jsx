import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import CameraRig from '../Scene/Camera/index.jsx';
import Lighting from '../Scene/Lighting/index.jsx';
import Environment from './MemoryEnvironment.jsx';

// One persistent SML 3D world. Camera progress is driven only by the original Chapter/Threshold hooks.
export default function LegacyWorld() {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return (
    <div className="world" aria-hidden="true">
      <Canvas shadows={!mobile} dpr={mobile ? 1 : [1, 1.5]} camera={{ fov: 50, near: 0.1, far: 220, position: [0, 1.6, 0] }} gl={{ antialias: !mobile, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#050608']} />
        <fog attach="fog" args={['#050608', 12, 75]} />
        <CameraRig />
        <Suspense fallback={null}><Lighting /><Environment /></Suspense>
      </Canvas>
    </div>
  );
}
