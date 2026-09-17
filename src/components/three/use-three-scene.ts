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

function isLowPowerMobileDevice(): boolean {
  const navigatorWithMemory = navigator as Navigator & Readonly<{ deviceMemory?: number }>;
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasLimitedMemory = navigatorWithMemory.deviceMemory !== undefined && navigatorWithMemory.deviceMemory <= 2;
  const hasLimitedCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
  return hasCoarsePointer && (hasLimitedMemory || hasLimitedCpu);
}

export function useThreeScene(): ThreeSceneState {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() === true;
  const [hasWebGl, setHasWebGl] = useState(false);
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasWebGl(supportsWebGl());
      setIsLowPowerDevice(isLowPowerMobileDevice());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || reducedMotion || !hasWebGl || isLowPowerDevice) {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin: "160px" });
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasWebGl, isLowPowerDevice, reducedMotion]);

  return { containerRef, enabled: hasWebGl && !isLowPowerDevice && !reducedMotion, isVisible };
}
