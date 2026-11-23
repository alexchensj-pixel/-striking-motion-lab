import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace, TextureLoader } from 'three';
import heroLab from '../../../Assets/Images/hero-lab.jpg';

// La fotografía vive como telón físico al fondo del corredor, no como una capa HTML
// sobre el hero. La estructura 3D original queda delante y la oculta por perspectiva.
export default function EntradaBackdrop() {
  const texture = useLoader(TextureLoader, heroLab);
  texture.colorSpace = SRGBColorSpace;
  const aspect = texture.image?.width && texture.image?.height
    ? texture.image.width / texture.image.height
    : 1.5;
  const height = 16;
  const width = height * aspect;
  const photoMaterial = useMemo(
    () => new MeshBasicMaterial({ map: texture, toneMapped: true, fog: true, color: '#c5cbd2' }),
    [texture]
  );
  const wallMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#111820', roughness: 0.84, metalness: 0.22 }),
    []
  );
  const frameMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#3b4652', roughness: 0.42, metalness: 0.68, emissive: '#101820', emissiveIntensity: 0.35 }),
    []
  );

  return (
    <group>
      {/* Muro de acero que cierra el corredor y evita que la foto parezca flotar. */}
      <mesh position={[0, 8, -53.55]} material={wallMaterial}>
        <planeGeometry args={[width + 2.4, 18.4]} />
      </mesh>
      {/* La foto conserva su proporción original y queda detrás de la arquitectura. */}
      <mesh position={[0, 8, -53.35]} material={photoMaterial}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Marco metálico empotrado: laterales y travesaños visibles en perspectiva. */}
      <mesh position={[-width / 2 - 0.12, 8, -53.12]} material={frameMaterial}>
        <boxGeometry args={[0.2, height + 0.32, 0.24]} />
      </mesh>
      <mesh position={[width / 2 + 0.12, 8, -53.12]} material={frameMaterial}>
        <boxGeometry args={[0.2, height + 0.32, 0.24]} />
      </mesh>
      <mesh position={[0, 8 + height / 2 + 0.12, -53.12]} material={frameMaterial}>
        <boxGeometry args={[width + 0.44, 0.2, 0.24]} />
      </mesh>
      <mesh position={[0, 8 - height / 2 - 0.12, -53.12]} material={frameMaterial}>
        <boxGeometry args={[width + 0.44, 0.2, 0.24]} />
      </mesh>
    </group>
  );
}
