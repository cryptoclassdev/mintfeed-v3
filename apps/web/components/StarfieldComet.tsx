"use client";

import { useRef, useEffect } from "react";

interface Star {
  xPct: number;
  yPct: number;
  size: number;
  baseAlpha: number;
  speed: number;
  offset: number;
}

interface CometPoint {
  x: number;
  y: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: CometPoint[];
  life: number;
  maxLife: number;
}

const STAR_COUNT = 160;
const COMET_MIN_INTERVAL = 6000;
const COMET_MAX_INTERVAL = 11000;
const TRAIL_LENGTH = 55;

export default function StarfieldComet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // --- Stars (percentage-based for resize safety) ---
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      xPct: Math.random(),
      yPct: Math.random(),
      size: Math.random() * 1.2 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      speed: Math.random() * 0.015 + 0.004,
      offset: Math.random() * Math.PI * 2,
    }));

    // --- Comets ---
    const comets: Comet[] = [];
    let lastSpawn = performance.now() - COMET_MIN_INTERVAL + 2500; // first comet ~2.5s in

    function spawnComet() {
      const fromTop = Math.random() > 0.35;
      const sx = fromTop
        ? w * 0.2 + Math.random() * w * 0.6
        : w + 10;
      const sy = fromTop
        ? -10
        : Math.random() * h * 0.35;

      const angle = (Math.PI * 0.55) + Math.random() * Math.PI * 0.35;
      const speed = 2.8 + Math.random() * 1.8;

      comets.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.4 + Math.random() * 0.8,
        trail: [],
        life: 0,
        maxLife: 140 + Math.random() * 70,
      });
    }

    // --- Draw helpers ---
    function drawNebula() {
      // Faint blue cloud upper-right
      const g1 = ctx!.createRadialGradient(
        w * 0.72, h * 0.25, 0,
        w * 0.72, h * 0.25, w * 0.38
      );
      g1.addColorStop(0, "rgba(76, 139, 208, 0.025)");
      g1.addColorStop(0.6, "rgba(76, 139, 208, 0.008)");
      g1.addColorStop(1, "transparent");
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);

      // Faint mint lower-left
      const g2 = ctx!.createRadialGradient(
        w * 0.25, h * 0.75, 0,
        w * 0.25, h * 0.75, w * 0.28
      );
      g2.addColorStop(0, "rgba(0, 212, 170, 0.012)");
      g2.addColorStop(1, "transparent");
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);

      // Warm dust center
      const g3 = ctx!.createRadialGradient(
        w * 0.5, h * 0.45, 0,
        w * 0.5, h * 0.45, w * 0.3
      );
      g3.addColorStop(0, "rgba(120, 80, 100, 0.01)");
      g3.addColorStop(1, "transparent");
      ctx!.fillStyle = g3;
      ctx!.fillRect(0, 0, w, h);
    }

    function drawStars(frame: number) {
      for (const s of stars) {
        const x = s.xPct * w;
        const y = s.yPct * h;
        const twinkle = Math.sin(frame * s.speed + s.offset);
        const alpha = Math.max(0, s.baseAlpha + twinkle * 0.18);

        ctx!.beginPath();
        ctx!.arc(x, y, s.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(195, 210, 235, ${alpha})`;
        ctx!.fill();
      }
    }

    function drawComet(c: Comet) {
      const { x, y, size, trail } = c;

      // --- Tail: tapered line segments with fading opacity ---
      if (trail.length > 2) {
        ctx!.save();
        ctx!.globalCompositeOperation = "lighter";
        ctx!.lineCap = "round";

        for (let i = 1; i < trail.length; i++) {
          const prev = trail[i - 1]!;
          const cur = trail[i]!;
          const t = i / trail.length;
          const alpha = (1 - t) * 0.22;
          const lw = size * 2.5 * (1 - t * 0.85);

          ctx!.beginPath();
          ctx!.moveTo(prev.x, prev.y);
          ctx!.lineTo(cur.x, cur.y);
          ctx!.strokeStyle = `rgba(110, 165, 225, ${alpha})`;
          ctx!.lineWidth = lw;
          ctx!.stroke();
        }

        // Wide diffuse outer tail
        for (let i = 1; i < trail.length; i += 3) {
          const cur = trail[i]!;
          const t = i / trail.length;
          const alpha = (1 - t) * 0.04;
          const r = size * 6 * (1 - t * 0.7);

          const glow = ctx!.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, r);
          glow.addColorStop(0, `rgba(76, 139, 208, ${alpha})`);
          glow.addColorStop(1, "transparent");
          ctx!.fillStyle = glow;
          ctx!.fillRect(cur.x - r, cur.y - r, r * 2, r * 2);
        }

        ctx!.restore();
      }

      // --- Head ---
      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";

      // Outer bloom
      const bloom = ctx!.createRadialGradient(x, y, 0, x, y, size * 14);
      bloom.addColorStop(0, "rgba(76, 139, 208, 0.10)");
      bloom.addColorStop(0.3, "rgba(76, 139, 208, 0.03)");
      bloom.addColorStop(1, "transparent");
      ctx!.fillStyle = bloom;
      ctx!.fillRect(x - size * 14, y - size * 14, size * 28, size * 28);

      // Inner glow
      const inner = ctx!.createRadialGradient(x, y, 0, x, y, size * 5);
      inner.addColorStop(0, "rgba(220, 235, 255, 0.65)");
      inner.addColorStop(0.4, "rgba(150, 195, 240, 0.18)");
      inner.addColorStop(1, "transparent");
      ctx!.fillStyle = inner;
      ctx!.fillRect(x - size * 5, y - size * 5, size * 10, size * 10);

      // Core
      ctx!.beginPath();
      ctx!.arc(x, y, size * 0.55, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx!.fill();

      ctx!.restore();
    }

    // --- Animation loop ---
    let frame = 0;

    function loop() {
      frame++;
      ctx!.clearRect(0, 0, w, h);

      drawNebula();
      drawStars(frame);

      // Spawn
      const now = performance.now();
      const interval = COMET_MIN_INTERVAL + Math.random() * (COMET_MAX_INTERVAL - COMET_MIN_INTERVAL);
      if (comets.length === 0 && now - lastSpawn > interval) {
        spawnComet();
        lastSpawn = now;
      }

      // Update & draw comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]!;
        c.life++;
        c.x += c.vx;
        c.y += c.vy;

        c.trail.unshift({ x: c.x, y: c.y });
        if (c.trail.length > TRAIL_LENGTH) c.trail.pop();

        if (c.life > c.maxLife || c.x < -60 || c.x > w + 60 || c.y > h + 60) {
          comets.splice(i, 1);
          continue;
        }

        drawComet(c);
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
