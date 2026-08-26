"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "motion/react";

type Particle = Readonly<{
  radius: number;
  speedX: number;
  speedY: number;
  x: number;
  y: number;
}>;

type ParticlePosition = Readonly<{
  x: number;
  y: number;
}>;

function getSeededValue(index: number, offset: number): number {
  return (Math.sin(index * 78.233 + offset * 31.913) + 1) / 2;
}

function createParticles(width: number, height: number): readonly Particle[] {
  const count = Math.max(16, Math.min(34, Math.floor((width * height) / 18000)));

  return Array.from({ length: count }, (_, index) => ({
    radius: 1 + getSeededValue(index, 1) * 1.4,
    speedX: (getSeededValue(index, 2) - 0.5) * 0.22,
    speedY: (getSeededValue(index, 3) - 0.5) * 0.22,
    x: getSeededValue(index, 4) * width,
    y: getSeededValue(index, 5) * height,
  }));
}

function getNextPosition(particle: Particle, width: number, height: number): ParticlePosition {
  const nextX = particle.x + particle.speedX;
  const nextY = particle.y + particle.speedY;

  return {
    x: nextX < 0 ? width : nextX > width ? 0 : nextX,
    y: nextY < 0 ? height : nextY > height ? 0 : nextY,
  };
}

function drawParticles(context: CanvasRenderingContext2D, particles: readonly Particle[], width: number, height: number): readonly Particle[] {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(132, 211, 255, 0.66)";
  context.strokeStyle = "rgba(91, 182, 255, 0.16)";
  context.lineWidth = 0.7;

  particles.forEach((particle, index) => {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();

    particles.slice(index + 1).forEach((candidate) => {
      const distance = Math.hypot(particle.x - candidate.x, particle.y - candidate.y);
      if (distance > 108) {
        return;
      }
      context.globalAlpha = 1 - distance / 108;
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(candidate.x, candidate.y);
      context.stroke();
    });
  });
  context.globalAlpha = 1;

  return particles.map((particle) => ({ ...particle, ...getNextPosition(particle, width, height) }));
}

export function HomeParticlesCanvas(): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion() === true;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || reducedMotion) {
      return undefined;
    }
    const parent = canvas.parentElement;
    const context = canvas.getContext("2d");
    if (parent === null || context === null) {
      return undefined;
    }

    let frameId = 0;
    let isVisible = false;
    let dimensions = { height: 0, width: 0 };
    let particles: readonly Particle[] = [];

    const resize = (): void => {
      const bounds = parent.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      dimensions = { height: bounds.height, width: bounds.width };
      canvas.height = Math.round(bounds.height * pixelRatio);
      canvas.width = Math.round(bounds.width * pixelRatio);
      canvas.style.height = `${bounds.height}px`;
      canvas.style.width = `${bounds.width}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles = createParticles(bounds.width, bounds.height);
    };

    const render = (): void => {
      if (!isVisible) {
        return;
      }
      particles = drawParticles(context, particles, dimensions.width, dimensions.height);
      frameId = window.requestAnimationFrame(render);
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && frameId === 0) {
        render();
      }
      if (!isVisible && frameId !== 0) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }, { rootMargin: "160px" });
    const resizeObserver = new ResizeObserver(resize);

    resize();
    visibilityObserver.observe(parent);
    resizeObserver.observe(parent);

    return () => {
      window.cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [reducedMotion]);

  return <canvas aria-hidden="true" className="home-particles-canvas" ref={canvasRef} />;
}
