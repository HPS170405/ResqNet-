import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Rotating Sphere component representing Earth/Node
const GlobeMesh = () => {
  const meshRef = useRef();
  const wireRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.x += delta * 0.01;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.03;
    }
  });

  return (
    <group>
      {/* Glow / Distortion core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#0d1b2a"
          roughness={0.8}
          metalness={0.5}
          emissive="#06b6d4"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Wireframe outer sphere */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.02, 24, 24]} />
        <meshBasicMaterial
          color="#f97316"
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </mesh>
    </group>
  );
};

// Orbiting satellites representing network nodes
const Satellite = ({ radius, speed, color }) => {
  const satRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime() * speed;
    if (satRef.current) {
      satRef.current.position.x = Math.cos(time) * radius;
      satRef.current.position.z = Math.sin(time) * radius;
      satRef.current.position.y = Math.sin(time * 0.5) * (radius * 0.3);
    }
  });

  return (
    <mesh ref={satRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

// Orbital Rings
const OrbitRing = ({ radius, color }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={color} transparent={true} opacity={0.1} />
    </line>
  );
};

// Particle debris / data packet nodes
const DataParticles = () => {
  const count = 150;
  const meshRef = useRef();

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random coordinates around sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.5 + Math.random() * 1.5;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a855f7"
        size={0.03}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.6}
      />
    </points>
  );
};

// Main Scene Component
const AnimatedGlobe = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#06b6d4" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#f97316" />

        <GlobeMesh />
        
        {/* Orbital links */}
        <OrbitRing radius={2.8} color="#06b6d4" />
        <OrbitRing radius={3.4} color="#f97316" />

        {/* Satellites */}
        <Satellite radius={2.8} speed={0.4} color="#06b6d4" />
        <Satellite radius={3.4} speed={-0.3} color="#f97316" />

        {/* Data field */}
        <DataParticles />

        {/* Background stars */}
        <Stars radius={100} depth={50} count={1200} factor={4} saturation={0.5} fade speed={1} />

        {/* Interactive camera control */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3.5}
          maxDistance={8}
          rotateSpeed={0.5}
          autoRotate={true}
          autoRotateSpeed={0.15}
        />
      </Canvas>
      
      {/* 3D scene hint overlays */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px', fontSize: '9px', color: '#64748b', pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', zIndex: 10 }}>
        🖱️ Left-Click + Drag to Rotate / Scroll to Zoom
      </div>
    </div>
  );
};

export default AnimatedGlobe;
