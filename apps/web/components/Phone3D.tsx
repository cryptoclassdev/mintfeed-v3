"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";

/* ─── Smooth interpolation between scroll keyframes ─── */
function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

interface KF {
  at: number;
  ry: number;
  rx: number;
  y: number;
  s: number;
}

const KEYFRAMES: KF[] = [
  { at: 0.0, ry: -0.22, rx: 0.06, y: 0, s: 1 }, // hero: tilted left
  { at: 0.12, ry: -0.22, rx: 0.06, y: 0, s: 1 }, // hero hold
  { at: 0.28, ry: 0, rx: 0, y: 0, s: 1 }, // face forward (feed)
  { at: 0.48, ry: 0, rx: 0, y: 0, s: 1 }, // prediction (still forward)
  { at: 0.62, ry: 0.18, rx: -0.04, y: 0, s: 1 }, // tilt right (market)
  { at: 0.78, ry: 0.18, rx: -0.04, y: 0, s: 1 }, // market hold
  { at: 0.92, ry: 0, rx: 0, y: 2.0, s: 0.55 }, // shrink + rise for CTA
  { at: 1.0, ry: 0, rx: 0, y: 2.0, s: 0.55 }, // hold
];

function interpolate(progress: number): {
  ry: number;
  rx: number;
  y: number;
  s: number;
} {
  let prev = KEYFRAMES[0]!;
  let next = KEYFRAMES[KEYFRAMES.length - 1]!;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (progress <= KEYFRAMES[i + 1]!.at) {
      prev = KEYFRAMES[i]!;
      next = KEYFRAMES[i + 1]!;
      break;
    }
  }
  const range = next.at - prev.at;
  const t =
    range === 0
      ? 1
      : smoothstep(Math.max(0, Math.min(1, (progress - prev.at) / range)));
  return {
    ry: prev.ry + (next.ry - prev.ry) * t,
    rx: prev.rx + (next.rx - prev.rx) * t,
    y: prev.y + (next.y - prev.y) * t,
    s: prev.s + (next.s - prev.s) * t,
  };
}

/* ─── Component ─── */
interface Props {
  scrollProgress: React.RefObject<number>;
  children: React.ReactNode;
}

export default function Phone3D({ scrollProgress, children }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = scrollProgress.current ?? 0;
    const { ry, rx, y, s } = interpolate(p);
    groupRef.current.rotation.y = ry;
    groupRef.current.rotation.x = rx;
    groupRef.current.position.y = y;
    groupRef.current.scale.setScalar(s);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={0.7} />
      <spotLight
        position={[-4, 4, 3]}
        intensity={0.25}
        angle={0.4}
        penumbra={0.6}
      />

      <group ref={groupRef} position={[1.8, 0, 0]}>
        {/* Phone body — metallic dark shell */}
        <RoundedBox args={[2.4, 5.0, 0.15]} radius={0.28} smoothness={4}>
          <meshStandardMaterial
            color="#1a1a1e"
            metalness={0.85}
            roughness={0.15}
          />
        </RoundedBox>

        {/* Screen base (dark plane behind HTML) */}
        <mesh position={[0, 0, 0.076]}>
          <planeGeometry args={[2.15, 4.6]} />
          <meshBasicMaterial color="#030303" />
        </mesh>

        {/* Dynamic Island */}
        <mesh position={[0, 2.12, 0.077]}>
          <planeGeometry args={[0.55, 0.14]} />
          <meshBasicMaterial color="#0a0a0a" />
        </mesh>

        {/* Side buttons */}
        {/* Volume up */}
        <mesh position={[-1.22, 0.8, 0]}>
          <boxGeometry args={[0.03, 0.22, 0.05]} />
          <meshStandardMaterial
            color="#222"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Volume down */}
        <mesh position={[-1.22, 0.35, 0]}>
          <boxGeometry args={[0.03, 0.22, 0.05]} />
          <meshStandardMaterial
            color="#222"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Power button */}
        <mesh position={[1.22, 0.6, 0]}>
          <boxGeometry args={[0.03, 0.4, 0.05]} />
          <meshStandardMaterial
            color="#222"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* HTML screen content — rendered as DOM overlay tracking 3D transform */}
        <Html
          transform
          distanceFactor={1.9}
          position={[0, 0, 0.078]}
          style={{
            width: 340,
            height: 728,
            overflow: "hidden",
            borderRadius: 24,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {children}
        </Html>
      </group>
    </>
  );
}
