"use client";

import { useRef, useEffect } from "react";

/* ──────────────────────────────────────────────
   Vertex shader — fullscreen quad passthrough
   ────────────────────────────────────────────── */
const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* ──────────────────────────────────────────────
   Fragment shader — Perplexity-style volumetric comet
   with starfield, nebula, scroll-driven effects
   ────────────────────────────────────────────── */
const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_scroll;   // 0 → 1 normalised page scroll

/* ── brand palette ── */
const vec3 COL_WHITE = vec3(1.0, 0.97, 0.92);
const vec3 COL_BLUE  = vec3(0.30, 0.545, 0.816);   // #4C8BD0
const vec3 COL_TEAL  = vec3(0.0, 0.50, 0.45);      // approx #008073
const vec3 COL_MINT  = vec3(0.0, 0.83, 0.667);      // #00D4AA

/* ── hash / noise ── */
float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8,0.6,-0.6,0.8);
  for(int i=0;i<4;i++){ v += a*noise(p); p = r*p*2.0; a *= 0.5; }
  return v;
}

/* ── procedural starfield (3 density layers) ── */
vec3 stars(vec2 uv, float t, float bright){
  vec3 c = vec3(0.0);
  for(float L = 0.0; L < 3.0; L++){
    float sc = 80.0 + L * 130.0;
    vec2 id = floor(uv * sc);
    vec2 gv = fract(uv * sc) - 0.5;
    float h = hash(id + L * 137.0);
    if(h > 0.88 - L * 0.02){
      vec2 o = vec2(hash(id*1.1+10.0), hash(id*1.1+20.0)) * 0.6 - 0.3;
      float d = length(gv - o);
      float tw = sin(t * (0.7 + h*3.0) + h*6.283) * 0.35 + 0.65;
      float sz = 0.04 + L * 0.008;
      float pt = smoothstep(sz, 0.0, d) * h * tw;
      float gl = smoothstep(0.14, 0.0, d) * h * tw * 0.12;
      vec3 sc2 = mix(vec3(0.75,0.82,1.0), vec3(1.0,0.92,0.8), h*h);
      c += (pt + gl) * sc2 * bright;
    }
  }
  return c;
}

/* ── main ── */
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 p  = (uv - 0.5) * vec2(ar, 1.0);     // aspect-corrected centered coords
  float scroll = u_scroll;

  /* background — near-black #030303 gradient */
  vec3 col = vec3(0.012) * (1.0 - 0.2 * p.y);

  /* ── nebula (subtle brand-coloured clouds) ── */
  vec2 nUV = p + vec2(0.0, scroll * 0.06);
  float n1 = fbm(nUV * 2.5 + u_time * 0.012);
  col += smoothstep(0.42, 0.78, n1) * 0.022 * COL_BLUE;
  float n2 = fbm(nUV * 3.0 + 7.0 - u_time * 0.009);
  col += smoothstep(0.46, 0.82, n2) * 0.012 * COL_MINT;

  /* ── stars with scroll parallax ── */
  col += stars(p + vec2(0.0, scroll * 0.07), u_time, 0.42);
  col += stars(p + vec2(0.0, scroll * 0.025) + 50.0, u_time * 0.55, 0.22);

  /* ════════════════════════════════════════════
     COMET — volumetric head + wide conical tail
     ════════════════════════════════════════════ */

  /* phase: time-based sweep + scroll advances the comet */
  float phase = fract(u_time * 0.035 + scroll * 0.35);
  float fade  = smoothstep(0.0, 0.13, phase) * smoothstep(1.0, 0.72, phase);

  /* "flyby" intensity curve — peaks near midpoint */
  float prox = sin(phase * 3.14159);
  float bloomScale = 1.0 + prox * 0.4;

  /* path: upper-left → lower-right diagonal */
  vec2 startP = vec2(-0.45 * ar, 0.55);
  vec2 endP   = vec2( 0.55 * ar,-0.40);
  vec2 headPos = mix(startP, endP, phase);
  vec2 dir     = normalize(endP - startP);

  vec2  delta = p - headPos;
  float dist  = length(delta);

  /* ── head bloom (4 concentric layers) ── */
  float core = exp(-dist * 110.0 / bloomScale) * 4.5 * (1.0 + prox * 0.6);
  float bl1  = exp(-dist * 22.0 / bloomScale)  * 1.5 * (1.0 + prox * 0.3);
  float bl2  = exp(-dist * 5.5  / bloomScale)  * 0.35;
  float bl3  = exp(-dist * 1.6)                * 0.09;

  col += core * COL_WHITE                      * fade;
  col += bl1  * mix(COL_WHITE, COL_BLUE, 0.3)  * fade;
  col += bl2  * COL_BLUE                       * fade;
  col += bl3  * vec3(0.15, 0.35, 0.60)         * fade;

  /* ── directional lens streak from head ── */
  float streakPerp = abs(dot(delta, vec2(-dir.y, dir.x)));
  float streak = exp(-streakPerp * 35.0) * exp(-abs(dot(delta,dir)) * 2.5) * 0.18;
  col += streak * COL_BLUE * fade;

  /* ── tail: 3-layer volumetric cone ── */
  vec2  tailDir = -dir;
  float along   = dot(delta, tailDir);
  float perp    = length(delta - along * tailDir);

  if(along > 0.0){
    /* noise for wispiness */
    float wisp = noise(vec2(along * 6.0, perp * 16.0 + u_time * 0.25)) * 0.3 + 0.7;

    /* Core — narrow, bright */
    float cw = 0.012 + along * 0.14;
    float ct = exp(-perp*perp/(2.0*cw*cw)) * exp(-along * 3.2) * 0.55;

    /* Body — medium width, slightly wispy */
    float bw = 0.035 + along * 0.32;
    float bt = exp(-perp*perp/(2.0*bw*bw)) * exp(-along * 1.7) * 0.32 * wisp;

    /* Atmosphere — very wide, dim halo */
    float aw = 0.07 + along * 0.52;
    float at = exp(-perp*perp/(2.0*aw*aw)) * exp(-along * 1.1) * 0.09;

    /* colour gradient along tail */
    float t = smoothstep(0.0, 0.45, along);
    vec3 coreC = mix(COL_WHITE * 0.85, COL_BLUE, t * 0.55);
    vec3 bodyC = mix(COL_BLUE, COL_TEAL, t);
    vec3 atmoC = mix(COL_BLUE * 0.6, COL_TEAL * 0.4, t);

    col += (ct * coreC + bt * bodyC + at * atmoC) * fade;
  }

  /* ── coma (forward glow) ── */
  if(along < 0.0 && along > -0.12){
    float coma = exp(-perp*perp/0.0025) * exp(along * 18.0) * 0.12;
    col += coma * mix(COL_WHITE, COL_BLUE, 0.4) * fade;
  }

  /* ── scroll-based brightness (dim gently at depth) ── */
  col *= 1.0 - scroll * 0.22;

  /* Reinhard tone-map to prevent blow-out */
  col = col / (col + 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ──────────────────────────────────────────────
   WebGL bootstrap — half-resolution, no deps
   ────────────────────────────────────────────── */
const RES_SCALE = 0.5;

export default function StarfieldComet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return; // graceful fallback — bg is already #030303

    /* compile helper */
    function compile(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(s));
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const pgm = gl.createProgram()!;
    gl.attachShader(pgm, vs);
    gl.attachShader(pgm, fs);
    gl.linkProgram(pgm);
    if (!gl.getProgramParameter(pgm, gl.LINK_STATUS)) return;
    gl.useProgram(pgm);

    /* fullscreen quad */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(pgm, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    /* uniforms */
    const uRes    = gl.getUniformLocation(pgm, "u_res");
    const uTime   = gl.getUniformLocation(pgm, "u_time");
    const uScroll = gl.getUniformLocation(pgm, "u_scroll");

    /* resize */
    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const rw = Math.floor(w * RES_SCALE);
      const rh = Math.floor(h * RES_SCALE);
      canvas!.width = rw;
      canvas!.height = rh;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      gl!.viewport(0, 0, rw, rh);
      gl!.uniform2f(uRes, rw, rh);
    }
    resize();
    window.addEventListener("resize", resize);

    /* animation loop */
    let raf: number;
    const t0 = performance.now();

    function loop() {
      const elapsed = (performance.now() - t0) * 0.001;
      gl!.uniform1f(uTime, elapsed);

      /* normalised scroll 0 → 1 */
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const scroll = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      gl!.uniform1f(uScroll, scroll);

      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
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
