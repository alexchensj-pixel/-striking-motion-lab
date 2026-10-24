import { Canvas } from '@react-three/fiber';
import CameraRig from './Camera/index.jsx';
import Lighting from './Lighting/index.jsx';
import Environment from './Environment/index.jsx';
import { LENSES } from './Camera/waypoints.js';

// Un único Canvas persistente: el mundo 3D no se recarga entre experiencias, la cámara viaja por él.
export default function SceneCanvas() {
  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        fallback={
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, overflow: 'hidden', background: '#050608',
            backgroundImage: 'radial-gradient(ellipse at 50% 35%, rgba(185, 44, 31, 0.20), transparent 36%), radial-gradient(ellipse at 50% 100%, rgba(108, 119, 132, 0.14), transparent 48%), linear-gradient(180deg, #080a0e 0%, #050608 72%)',
          }}>
            <div style={{ position: 'absolute', width: 'min(64vw, 560px)', aspectRatio: '1', left: '50%', top: '48%', transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px solid rgba(230, 235, 240, 0.10)', boxShadow: '0 0 0 42px rgba(230, 235, 240, 0.025), 0 0 0 84px rgba(230, 235, 240, 0.018), inset 0 0 70px rgba(190, 42, 28, 0.06)' }} />
            <div style={{ position: 'absolute', inset: '0 0 auto', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(220, 55, 39, 0.5), transparent)' }} />
          </div>
        }
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: LENSES.nav.fov, near: 0.1, far: 220, position: [0, 1.6, 0] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050608']} />
        <fog attach="fog" args={['#050608', 12, 75]} />
        <CameraRig />
        <Lighting />
        <Environment />
      </Canvas>
    </div>
  );
}
