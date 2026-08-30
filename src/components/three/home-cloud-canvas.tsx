"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdditiveBlending, CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import type { Group } from "three";

import { useThreeScene } from "@/components/three/use-three-scene";

type Vector3Tuple = readonly [number, number, number];

type ServiceNode = Readonly<{
  href: string;
  icon: "community" | "dashboard" | "events";
  label: string;
  position: Vector3Tuple;
}>;

type HomeCloudCanvasProperties = Readonly<{
  onExplorationChange: (isExploring: boolean) => void;
}>;

type CloudAssemblyProperties = Readonly<{
  canActivateCloud: () => boolean;
  onExplorationChange: (isExploring: boolean) => void;
  orbitRotation: OrbitRotation;
}>;

type CloudCellProperties = Readonly<{
  position: Vector3Tuple;
  scale: Vector3Tuple;
}>;

type SatelliteSphereProperties = Readonly<{
  node: ServiceNode;
  onNavigate: (href: string) => void;
}>;

type OrbitRotation = Readonly<{
  x: number;
  y: number;
}>;

type PointerPosition = Readonly<{
  x: number;
  y: number;
}>;

const serviceNodes: readonly ServiceNode[] = [
  { href: "/#comunidad", icon: "community", label: "Comunidad", position: [-1.9, -0.76, 0.35] },
  { href: "/eventos", icon: "events", label: "Eventos", position: [1.9, -0.72, 0.18] },
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", position: [1.82, 0.98, -0.08] },
];

const initialOrbitRotation: OrbitRotation = { x: 0.08, y: -0.42 };

const fiberNodes: readonly Vector3Tuple[] = [
  [-1.88, 0.46, 0.15],
  [-1.3, 1.18, -0.22],
  [-0.14, 1.46, 0.05],
  [1.16, 1.18, -0.18],
  [1.9, 0.43, 0.2],
  [1.3, -1.16, -0.08],
  [0.05, -1.44, 0.12],
  [-1.22, -1.14, -0.11],
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createTexture(width: number, height: number, painter: (context: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("No fue posible crear el texto de la escena 3D.");
  }

  painter(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function useAwsTexture(): CanvasTexture {
  const texture = useMemo(() => createTexture(640, 310, (context) => {
    const gradient = context.createLinearGradient(0, 0, 640, 310);
    gradient.addColorStop(0, "#d8f3ff");
    gradient.addColorStop(0.52, "#5bc8ff");
    gradient.addColorStop(1, "#1587ff");
    context.fillStyle = gradient;
    context.shadowBlur = 28;
    context.shadowColor = "#168cff";
    context.font = "900 184px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("aws", 320, 176);
    context.lineWidth = 13;
    context.lineCap = "round";
    context.strokeStyle = "#72d7ff";
    context.beginPath();
    context.arc(318, 177, 100, 0.24, 2.52, false);
    context.stroke();
    context.beginPath();
    context.moveTo(402, 238);
    context.lineTo(429, 229);
    context.lineTo(415, 254);
    context.stroke();
  }), []);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function drawServiceIcon(context: CanvasRenderingContext2D, icon: ServiceNode["icon"]): void {
  context.strokeStyle = "#7bd4ff";
  context.fillStyle = "#7bd4ff";
  context.lineWidth = 13;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (icon === "community") {
    context.beginPath();
    context.arc(111, 116, 26, 0, Math.PI * 2);
    context.arc(172, 129, 21, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(111, 205, 56, Math.PI * 1.09, Math.PI * 1.9);
    context.arc(172, 206, 45, Math.PI * 1.1, Math.PI * 1.88);
    context.stroke();
    return;
  }

  if (icon === "events") {
    context.strokeRect(63, 75, 157, 154);
    context.beginPath();
    context.moveTo(63, 121);
    context.lineTo(220, 121);
    context.moveTo(105, 55);
    context.lineTo(105, 93);
    context.moveTo(177, 55);
    context.lineTo(177, 93);
    context.stroke();
    [95, 140, 185].forEach((x) => [151, 191].forEach((y) => context.fillRect(x, y, 13, 13)));
    return;
  }

  context.strokeRect(75, 77, 52, 52);
  context.strokeRect(157, 77, 52, 52);
  context.strokeRect(116, 165, 52, 52);
  context.beginPath();
  context.moveTo(127, 103);
  context.lineTo(157, 103);
  context.moveTo(142, 129);
  context.lineTo(142, 165);
  context.stroke();
}

function useServiceTexture(node: ServiceNode): CanvasTexture {
  const texture = useMemo(() => createTexture(280, 350, (context) => {
    const glow = context.createRadialGradient(140, 140, 12, 140, 140, 162);
    glow.addColorStop(0, "rgba(40, 160, 255, 0.24)");
    glow.addColorStop(1, "rgba(1, 18, 54, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 280, 350);
    drawServiceIcon(context, node.icon);
    context.shadowBlur = 15;
    context.shadowColor = "#1595ff";
    context.fillStyle = "#d7f1ff";
    context.font = "800 33px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(node.label, 140, 302);
  }), [node.icon, node.label]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function CameraParallax(): React.ReactNode {
  useFrame((state) => {
    state.camera.position.x += (state.pointer.x * 0.48 - state.camera.position.x) * 0.035;
    state.camera.position.y += (state.pointer.y * 0.28 + 0.15 - state.camera.position.y) * 0.035;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function CloudCell({ position, scale }: CloudCellProperties): React.ReactNode {
  return <group position={position} scale={scale}>
    <mesh>
      <sphereGeometry args={[1, 36, 24]} />
      <meshPhysicalMaterial color="#075dcc" emissive="#064eb8" emissiveIntensity={0.72} metalness={0.36} opacity={0.42} roughness={0.17} reflectivity={0.92} transparent transmission={0.32} />
    </mesh>
    <mesh scale={[1.026, 1.026, 1.026]}>
      <sphereGeometry args={[1, 30, 18]} />
      <meshBasicMaterial color="#52c5ff" opacity={0.76} transparent wireframe />
    </mesh>
    <mesh scale={[0.76, 0.76, 0.76]}>
      <icosahedronGeometry args={[1, 3]} />
      <meshBasicMaterial color="#187fea" opacity={0.25} transparent wireframe />
    </mesh>
  </group>;
}

function DatabaseCore(): React.ReactNode {
  const coreRef = useRef<Group>(null);

  useFrame((state) => {
    const core = coreRef.current;
    if (core !== null) {
      core.position.y = -1.12 + Math.sin(state.clock.elapsedTime * 1.2) * 0.055;
      core.rotation.y = state.clock.elapsedTime * 0.24;
    }
  });

  return <group ref={coreRef} position={[0, -1.12, 0]}>
    <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.54, 0.54, 0.22, 48]} /><meshStandardMaterial color="#064eb9" emissive="#0678ef" emissiveIntensity={0.8} metalness={0.64} roughness={0.2} /></mesh>
    <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.48, 0.48, 0.22, 48]} /><meshStandardMaterial color="#0b7ef2" emissive="#2cbaff" emissiveIntensity={1.12} metalness={0.5} roughness={0.15} /></mesh>
    <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.4, 0.4, 0.2, 48]} /><meshStandardMaterial color="#0e6fd8" emissive="#52cbff" emissiveIntensity={1.25} metalness={0.5} roughness={0.14} /></mesh>
    <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.025, 10, 48]} /><meshBasicMaterial color="#9ce7ff" /></mesh>
    <pointLight color="#159eff" distance={4} intensity={4.5} position={[0, 0.55, 0.5]} />
  </group>;
}

function OrbitingSatellite({ node, onNavigate }: SatelliteSphereProperties): React.ReactNode {
  const groupRef = useRef<Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const texture = useServiceTexture(node);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group === null) {
      return;
    }

    const targetScale = isHovered ? 1.15 : 1;
    const nextScale = group.scale.x + (targetScale - group.scale.x) * Math.min(delta * 8, 1);
    group.scale.setScalar(nextScale);
    group.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * 1.1 + node.position[0]) * 0.08;
    group.rotation.y += delta * (isHovered ? 0.8 : 0.19);
  });

  return <group
    onClick={(event) => { event.stopPropagation(); onNavigate(node.href); }}
    onPointerOut={(event) => { event.stopPropagation(); setIsHovered(false); }}
    onPointerOver={(event) => { event.stopPropagation(); setIsHovered(true); }}
    position={node.position}
    ref={groupRef}
  >
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[0.52, 32, 24]} />
      <meshPhysicalMaterial color={isHovered ? "#147fe8" : "#073c99"} emissive={isHovered ? "#118dff" : "#0755c1"} emissiveIntensity={isHovered ? 1.7 : 0.7} metalness={0.7} roughness={0.2} transparent opacity={0.9} />
    </mesh>
    <mesh scale={[1.035, 1.035, 1.035]}>
      <sphereGeometry args={[0.52, 26, 18]} />
      <meshBasicMaterial color="#64d1ff" opacity={isHovered ? 0.92 : 0.56} transparent wireframe />
    </mesh>
    <mesh rotation={[1.14, 0.34, 0.15]}>
      <torusGeometry args={[0.76, 0.025, 8, 72]} />
      <meshBasicMaterial color="#6ed4ff" opacity={isHovered ? 0.94 : 0.58} transparent />
    </mesh>
    <sprite position={[0, 0, 0.55]} scale={[0.78, 0.98, 1]}><spriteMaterial blending={AdditiveBlending} depthWrite={false} map={texture} transparent /></sprite>
    <pointLight color="#31b2ff" distance={3.2} intensity={isHovered ? 3.8 : 1.35} position={[0, 0.1, 0.86]} />
  </group>;
}

function FiberOpticOrbit(): React.ReactNode {
  const orbitRef = useRef<Group>(null);

  useFrame((state) => {
    const orbit = orbitRef.current;
    if (orbit !== null) {
      orbit.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.035;
    }
  });

  return <group ref={orbitRef}>
    <mesh rotation={[1.14, 0.12, 0.18]}><torusGeometry args={[2.12, 0.018, 8, 128]} /><meshBasicMaterial color="#51caff" opacity={0.58} transparent /></mesh>
    <mesh rotation={[0.92, 0.9, -0.24]}><torusGeometry args={[1.86, 0.012, 8, 128]} /><meshBasicMaterial color="#0879ef" opacity={0.48} transparent /></mesh>
    <mesh rotation={[1.62, -0.46, 0.08]}><torusGeometry args={[2.02, 0.009, 8, 128]} /><meshBasicMaterial color="#9ce7ff" opacity={0.32} transparent /></mesh>
    {fiberNodes.map((position) => <mesh key={position.join("-")} position={position}><sphereGeometry args={[0.045, 12, 12]} /><meshBasicMaterial color="#b8efff" /></mesh>)}
  </group>;
}

function CloudAssembly({ canActivateCloud, onExplorationChange, orbitRotation }: CloudAssemblyProperties): React.ReactNode {
  const groupRef = useRef<Group>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [isCloudHovered, setIsCloudHovered] = useState(false);
  const awsTexture = useAwsTexture();
  const router = useRouter();

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (group === null) {
      return;
    }

    group.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.11;
    group.rotation.y = orbitRotation.y;
    group.rotation.x = orbitRotation.x + Math.sin(state.clock.elapsedTime * 0.42) * 0.02;
    const targetScale = isCloudHovered ? 1.2 : 1.12;
    const nextScale = group.scale.x + (targetScale - group.scale.x) * Math.min(delta * 5, 1);
    group.scale.setScalar(nextScale);
  });

  const activateExploration = (): void => {
    const nextValue = !isExploring;
    setIsExploring(nextValue);
    onExplorationChange(nextValue);
  };

  const navigate = (href: string): void => {
    router.push(href);
  };

  return <group ref={groupRef} rotation={[orbitRotation.x, orbitRotation.y, 0]}>
    <group
      onClick={(event) => { event.stopPropagation(); if (canActivateCloud()) { activateExploration(); } }}
      onPointerOut={(event) => { event.stopPropagation(); setIsCloudHovered(false); }}
      onPointerOver={(event) => { event.stopPropagation(); setIsCloudHovered(true); }}
    >
      <CloudCell position={[0, 0.24, 0]} scale={[1.5, 0.78, 0.72]} />
      <CloudCell position={[-1.08, 0.06, 0.05]} scale={[0.76, 0.58, 0.56]} />
      <CloudCell position={[1.1, 0.06, 0.04]} scale={[0.72, 0.56, 0.54]} />
      <CloudCell position={[-0.43, 0.7, 0.02]} scale={[0.66, 0.66, 0.54]} />
      <CloudCell position={[0.48, 0.66, -0.03]} scale={[0.64, 0.62, 0.52]} />
      <sprite position={[0, 0.24, 0.96]} scale={[1.78, 0.86, 1]}><spriteMaterial blending={AdditiveBlending} depthTest={false} depthWrite={false} map={awsTexture} transparent /></sprite>
      <mesh position={[0, 0.22, -0.12]} rotation={[Math.PI / 2.2, 0, 0.25]}><torusGeometry args={[1.7, 0.014, 8, 96]} /><meshBasicMaterial color="#59c9ff" opacity={0.5} transparent /></mesh>
      <mesh position={[0, 0.22, -0.18]} rotation={[Math.PI / 2.2, 0.8, -0.32]}><torusGeometry args={[1.48, 0.012, 8, 96]} /><meshBasicMaterial color="#1689ee" opacity={0.44} transparent /></mesh>
      <pointLight color="#44bdff" distance={5.5} intensity={isCloudHovered ? 6.4 : 3.5} position={[0, 0.5, 1.8]} />
    </group>
    <FiberOpticOrbit />
    <DatabaseCore />
    {serviceNodes.map((node) => <OrbitingSatellite key={node.href} node={node} onNavigate={navigate} />)}
  </group>;
}

export function HomeCloudCanvas({ onExplorationChange }: HomeCloudCanvasProperties): React.ReactNode {
  const { containerRef, enabled, isVisible } = useThreeScene();
  const [orbitRotation, setOrbitRotation] = useState<OrbitRotation>(initialOrbitRotation);
  const pointerPositionRef = useRef<PointerPosition | null>(null);
  const didDragRef = useRef(false);

  const startRotation = (event: React.PointerEvent<HTMLDivElement>): void => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateRotation = (event: React.PointerEvent<HTMLDivElement>): void => {
    const previousPosition = pointerPositionRef.current;
    if (previousPosition === null) {
      return;
    }

    const horizontalDelta = event.clientX - previousPosition.x;
    const verticalDelta = event.clientY - previousPosition.y;
    if (Math.abs(horizontalDelta) + Math.abs(verticalDelta) > 1) {
      didDragRef.current = true;
    }
    setOrbitRotation((currentRotation) => ({
      x: clamp(currentRotation.x + verticalDelta * 0.008, -0.55, 0.55),
      y: currentRotation.y + horizontalDelta * 0.012,
    }));
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
  };

  const finishRotation = (): void => {
    pointerPositionRef.current = null;
  };

  const canActivateCloud = (): boolean => !didDragRef.current;

  return <div aria-label="Escena 3D interactiva de infraestructura cloud. Arrastra para rotar 360 grados." className="three-canvas three-canvas--home" onPointerCancel={finishRotation} onPointerDownCapture={startRotation} onPointerLeave={finishRotation} onPointerMoveCapture={updateRotation} onPointerUp={finishRotation} ref={containerRef} role="img">
    {enabled ? <Canvas camera={{ fov: 36, position: [0, 0.15, 8.2] }} dpr={[1, 1.5]} frameloop={isVisible ? "always" : "never"} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <ambientLight intensity={0.45} />
      <directionalLight color="#78cfff" intensity={1.5} position={[2.5, 4, 4]} />
      <pointLight color="#096ae8" distance={8} intensity={4.6} position={[-3, 1.5, 1.4]} />
      <CameraParallax />
      <CloudAssembly canActivateCloud={canActivateCloud} onExplorationChange={onExplorationChange} orbitRotation={orbitRotation} />
    </Canvas> : null}
  </div>;
}
