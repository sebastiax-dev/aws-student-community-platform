"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useRef } from "react";

import { useThreeScene } from "@/components/three/use-three-scene";

function ProgressAssembly(): React.ReactNode {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group === null) {
      return;
    }
    group.rotation.z += delta * 0.16;
    group.position.y = Math.sin(state.clock.elapsedTime * 0.75) * 0.08;
  });

  return <group ref={groupRef} rotation={[0.65, 0, 0]}><mesh><torusGeometry args={[1.15, 0.035, 8, 72]} /><meshBasicMaterial color="#4eabff" transparent opacity={0.75} /></mesh><mesh rotation={[0, 0, 2.1]}><torusGeometry args={[0.76, 0.026, 8, 56, Math.PI * 1.45]} /><meshBasicMaterial color="#a56bff" transparent opacity={0.82} /></mesh><mesh position={[0, 0, 0.12]}><octahedronGeometry args={[0.34, 1]} /><meshStandardMaterial color="#67c2ff" emissive="#128dff" emissiveIntensity={0.42} metalness={0.42} roughness={0.27} wireframe /></mesh><mesh position={[1.16, 0, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color="#75ceff" /></mesh><mesh position={[-0.68, 0.94, 0]}><sphereGeometry args={[0.08, 12, 12]} /><meshBasicMaterial color="#b181ff" /></mesh></group>;
}

export function DashboardProgressCanvas(): React.ReactNode {
  const { containerRef, enabled, isVisible } = useThreeScene();

  return <div aria-hidden="true" className="three-canvas three-canvas--dashboard" ref={containerRef}>{enabled ? <Canvas camera={{ fov: 38, position: [0, 0, 4.4] }} dpr={[1, 1.35]} frameloop={isVisible ? "always" : "never"} gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}><ambientLight intensity={0.8} /><pointLight color="#8f62ff" intensity={14} position={[1.5, 2, 3]} /><ProgressAssembly /></Canvas> : null}</div>;
}
