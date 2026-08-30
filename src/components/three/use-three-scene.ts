"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type ThreeSceneState = Readonly<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  isVisible: boolean;
}>;

function supportsWebGl(): boolean {
  const canvas = document.createElement("canvas");
  return canvas.getContext("webgl2") !== null || canvas.getContext("webgl") !== null;
}

export function useThreeScene(): ThreeSceneState {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() === true;
  const [hasWebGl, setHasWebGl] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasWebGl(supportsWebGl()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || reducedMotion || !hasWebGl) {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin: "160px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasWebGl, reducedMotion]);

  return { containerRef, enabled: hasWebGl && !reducedMotion, isVisible };
}
