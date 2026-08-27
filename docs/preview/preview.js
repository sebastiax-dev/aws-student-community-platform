"use strict";

const canvas = document.querySelector("#cloud-canvas");

if (canvas instanceof HTMLCanvasElement && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const context = canvas.getContext("2d");

  if (context !== null) {
    const particles = Array.from({ length: 38 }, (_, index) => ({
      phase: index * 0.39,
      radius: 1 + (index % 3),
      speed: 0.0003 + ((index % 5) * 0.00008),
      x: ((index * 47) % 100) / 100,
      y: ((index * 71) % 100) / 100,
    }));

    function resizeCanvas() {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(bounds.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(bounds.height * devicePixelRatio));
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function drawFrame(now) {
      const bounds = canvas.getBoundingClientRect();
      context.clearRect(0, 0, bounds.width, bounds.height);

      particles.forEach((particle) => {
        const x = (particle.x + Math.sin((now * particle.speed) + particle.phase) * 0.045) * bounds.width;
        const y = (particle.y + Math.cos((now * particle.speed * 0.8) + particle.phase) * 0.055) * bounds.height;
        context.beginPath();
        context.fillStyle = "rgba(108, 192, 255, 0.72)";
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = "rgba(53, 154, 255, 0.16)";
      context.lineWidth = 1;
      for (let index = 0; index < particles.length; index += 1) {
        const current = particles[index];
        const next = particles[(index + 9) % particles.length];
        context.beginPath();
        context.moveTo(current.x * bounds.width, current.y * bounds.height);
        context.lineTo(next.x * bounds.width, next.y * bounds.height);
        context.stroke();
      }

      window.requestAnimationFrame(drawFrame);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.requestAnimationFrame(drawFrame);
  }
}
