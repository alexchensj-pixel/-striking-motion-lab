import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ORANGE = '#e05a2b';

function Corridor() {
  const group = useRef();
  const ribs = useMemo(() => Array.from({ length: 22 }, (_, i) => -i * 2.8), []);
  const particles = useMemo(() => {
    const points = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      points[i * 3] = (Math.random() - 0.5) * 12;
      points[i * 3 + 1] = Math.random() * 7 - 1;
      points[i * 3 + 2] = -Math.random() * 62;
    }
    return points;
  }, []);

  return (
    <group ref={group}>
      <mesh position={[0, -2.7, -30]} receiveShadow>
        <boxGeometry args={[12, 0.35, 72]} />
        <meshStandardMaterial color="#17191d" metalness={0.72} roughness={0.38} />
      </mesh>
      <mesh position={[0, 4.1, -30]}>
        <boxGeometry args={[12, 0.25, 72]} />
        <meshStandardMaterial color="#14161a" metalness={0.55} roughness={0.5} />
      </mesh>
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 0.6, -30]}>
          <boxGeometry args={[0.3, 6.4, 72]} />
          <meshStandardMaterial color="#202329" metalness={0.62} roughness={0.42} />
        </mesh>
      ))}
      {ribs.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh position={[-5.2, 0.55, 0]}>
            <boxGeometry args={[0.18, 6.2, 0.18]} />
            <meshStandardMaterial color="#3b4048" metalness={0.8} roughness={0.28} />
          </mesh>
          <mesh position={[5.2, 0.55, 0]}>
            <boxGeometry args={[0.18, 6.2, 0.18]} />
            <meshStandardMaterial color="#3b4048" metalness={0.8} roughness={0.28} />
          </mesh>
          <mesh position={[0, 3.55, 0]}>
            <boxGeometry args={[10.5, 0.18, 0.18]} />
            <meshStandardMaterial color="#3b4048" metalness={0.8} roughness={0.28} />
          </mesh>
          {i % 2 === 0 && <mesh position={[0, 3.35, 0]}>
            <boxGeometry args={[2.2, 0.035, 0.12]} />
            <meshBasicMaterial color={ORANGE} />
          </mesh>}
        </group>
      ))}
      {[-13, -29, -45].map((z, i) => (
        <group key={z} position={[0, -0.15, z]}>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[4.8, 5.9, 0.28]} />
            <meshStandardMaterial color="#252a31" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.0, 0.17]}>
            <boxGeometry args={[4.25, 5.35, 0.06]} />
            <meshBasicMaterial color="#101216" />
          </mesh>
          <mesh position={[0, 3.75, 0.23]}>
            <boxGeometry args={[4.6, 0.07, 0.08]} />
            <meshBasicMaterial color={ORANGE} />
          </mesh>
          <pointLight position={[0, 2.2, 1.6]} color={i === 1 ? '#d7dce4' : ORANGE} intensity={2.4} distance={9} />
        </group>
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d6d9de" size={0.025} transparent opacity={0.45} sizeAttenuation />
      </points>
      <pointLight position={[0, 2.5, -7]} color={ORANGE} intensity={8} distance={18} />
      <pointLight position={[0, 2.5, -25]} color="#687b91" intensity={5} distance={20} />
      <pointLight position={[0, 2.5, -43]} color={ORANGE} intensity={7} distance={20} />
    </group>
  );
}

function CameraRig({ progress }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const depth = progress.current * 42;
    target.current.set(0, 0.15 + Math.sin(progress.current * Math.PI * 2) * 0.08, 5.4 - depth);
    camera.position.lerp(target.current, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(0, 0.15, camera.position.z - 8);
  });
  return null;
}

export default function SpatialWorld({ progress }) {
  return (
    <div className="world" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.15, 5.4], fov: 58, near: 0.1, far: 110 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.setClearColor('#101114', 1); }}
      >
        <ambientLight intensity={0.7} />
        <hemisphereLight color="#c6d0dd" groundColor="#111216" intensity={0.55} />
        <fog attach="fog" args={['#101114', 10, 64]} />
        <Corridor />
        <CameraRig progress={progress} />
      </Canvas>
    </div>
  );
}