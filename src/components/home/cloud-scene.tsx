"use client";

import { Cloud, Database, Workflow } from "lucide-react";
import dynamic from "next/dynamic";

import { HomeParticlesCanvas } from "@/components/canvas/home-particles-canvas";

const HomeCloudCanvas = dynamic(
  () => import("@/components/three/home-cloud-canvas").then((module) => module.HomeCloudCanvas),
  { loading: () => null, ssr: false },
);

export function CloudScene(): React.ReactNode {
  return (
    <div aria-label="Ilustración abstracta de servicios cloud" className="cloud-scene grid-pattern" role="img">
      <HomeParticlesCanvas />
      <HomeCloudCanvas />
      <div className="cloud-scene__cloud" />
      <span className="cloud-scene__word">aws</span>
      <span className="cloud-scene__node cloud-scene__node--one"><Database /></span>
      <span className="cloud-scene__node cloud-scene__node--two"><Workflow /></span>
      <span className="cloud-scene__node cloud-scene__node--three"><Cloud /></span>
    </div>
  );
}
