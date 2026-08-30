"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, LayoutDashboard, UsersRound } from "lucide-react";

import { HomeParticlesCanvas } from "@/components/canvas/home-particles-canvas";
import { HomeCloudCanvas } from "@/components/three/home-cloud-canvas";

export function CloudScene(): React.ReactNode {
  const [isExploring, setIsExploring] = useState(false);

  return <div className="cloud-scene__experience">
    <section aria-label="Escena 3D interactiva de AWS" className="cloud-scene cloud-scene--infrastructure grid-pattern" data-expanded={isExploring}>
      <HomeParticlesCanvas />
      <HomeCloudCanvas onExplorationChange={setIsExploring} />
      <p aria-live="polite" className="cloud-scene__hint">{isExploring ? "Modo exploración activo" : "Arrastra la nube para girarla en 360°"}</p>
    </section>

    <nav aria-label="Explora las secciones de la comunidad" className="cloud-scene__objects">
      <Link className="cloud-scene__section-object cloud-scene__section-object--community" href="/#comunidad">
        <span aria-hidden="true" className="cloud-scene__section-object-orb"><UsersRound size={23} strokeWidth={1.8} /></span>
        <span><strong>Comunidad</strong><small>Conecta y participa</small></span>
      </Link>
      <Link className="cloud-scene__section-object cloud-scene__section-object--events" href="/eventos">
        <span aria-hidden="true" className="cloud-scene__section-object-orb"><CalendarDays size={23} strokeWidth={1.8} /></span>
        <span><strong>Eventos</strong><small>Explora el ciclo</small></span>
      </Link>
      <Link className="cloud-scene__section-object cloud-scene__section-object--dashboard" href="/dashboard">
        <span aria-hidden="true" className="cloud-scene__section-object-orb"><LayoutDashboard size={23} strokeWidth={1.8} /></span>
        <span><strong>Dashboard</strong><small>Consulta tu avance</small></span>
      </Link>
    </nav>
  </div>;
}
