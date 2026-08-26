"use client";

import dynamic from "next/dynamic";

const DashboardProgressCanvas = dynamic(
  () => import("@/components/three/dashboard-progress-canvas").then((module) => module.DashboardProgressCanvas),
  { loading: () => null, ssr: false },
);

export function DashboardFutureVisual(): React.ReactNode {
  return <DashboardProgressCanvas />;
}
