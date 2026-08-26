"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useRef } from "react";

import { useThreeScene } from "@/components/three/use-three-scene";

function CloudAssembly(): React.ReactNode {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group === null) {
      return;
    }
    group.rotation.y += delta * 0.13;
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.24) * 0.08;
  });

  return <group ref={groupRef} rotation={[0.2, -0.5, 0]}><mesh><icosahedronGeometry args={[1.42, 2]} /><meshStandardMaterial color="#0c6ee8" emissive="#0569ed" emissiveIntensity={0.24} metalness={0.45} roughness={0.32} wireframe /></mesh><mesh position={[-1.45, -0.55, 0.1]}><sphereGeometry args={[0.56, 24, 24]} /><meshStandardMaterial color="#168dff" emissive="#117bea" emissiveIntensity={0.18} metalness={0.3} roughness={0.3} wireframe /></mesh><mesh position={[1.45, -0.5, 0.15]}><sphereGeometry args={[0.5, 24, 24]} /><meshStandardMaterial color="#5ec5ff" emissive="#229cff" emissiveIntensity={0.18} metalness={0.3} roughness={0.3} wireframe /></mesh><mesh position={[0, 1.18, -0.2]} rotation={[1.25, 0, 0.5]}><torusGeometry args={[0.62, 0.018, 8, 48]} /><meshBasicMaterial color="#66c9ff" transparent opacity={0.8} /></mesh><mesh position={[0, -0.1, -0.7]} rotation={[0.2, 0.4, 0]}><boxGeometry args={[3.6, 0.018, 0.018]} /><meshBasicMaterial color="#298efb" transparent opacity={0.42} /></mesh><mesh position={[0.2, -0.3, 0.65]} rotation={[0.1, 0.9, 0.4]}><boxGeometry args={[3.15, 0.018, 0.018]} /><meshBasicMaterial color="#42a6ff" transparent opacity={0.3} /></mesh></group>;
}

export function HomeCloudCanvas(): React.ReactNode {
  const { containerRef, enabled, isVisible } = useThreeScene();

  return <div aria-hidden="true" className="three-canvas three-canvas--home" ref={containerRef}>{enabled ? <Canvas camera={{ fov: 42, position: [0, 0, 5.4] }} dpr={[1, 1.5]} frameloop={isVisible ? "always" : "never"} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}><ambientLight intensity={0.75} /><pointLight color="#3da4ff" intensity={18} position={[2.5, 3, 4]} /><CloudAssembly /></Canvas> : null}</div>;
}
