import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ParticleEffects = ({ conflicts }) => {
  const particlesRef = useRef();
  const count = 200;
  
  // Initialize particles with random positions
  const initialPositions = () => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = Math.random() * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  };

  useEffect(() => {
    if (particlesRef.current) {
      const positions = initialPositions();
      particlesRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
    }
  }, []);

  useEffect(() => {
    if (particlesRef.current && conflicts > 0) {
      const positions = initialPositions();
      particlesRef.current.geometry.attributes.position.array = positions;
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [conflicts]);

  useFrame(() => {
    if (particlesRef.current && conflicts > 0) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        if (positions[i3 + 1] <= 0) {
          positions[i3] = (Math.random() - 0.5) * 10;
          positions[i3 + 1] = 5 + Math.random() * 5;
          positions[i3 + 2] = (Math.random() - 0.5) * 10;
        } else {
          positions[i3 + 1] -= 0.05 + Math.random() * 0.05;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (conflicts === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions()}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.1}
        color="#ff0000"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
};