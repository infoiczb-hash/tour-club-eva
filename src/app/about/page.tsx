"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ============================================================
   PALETTE — conifer dawn
   #040810  pre-dawn void
   #0a1520  deep canopy shadow
   #0f2218  dark spruce
   #1a3320  young fir
   #8fb5a0  mist light
   #c8b896  dawn gold (cold)
   #f0ebe0  first ray white
   #2a4a2a  moss foreground
============================================================ */

const CHAPTERS = [
  {
    year: "2022",
    tag: "Начало",
    headline: "С маленькой идеи",
    sub: "и большой реки",
    body: "Всё началось с простой идеи — дарить людям живые впечатления. Байдарки чинили своими руками. Сидушки делали сами. Главным была атмосфера: доверие, открытость, природа.",
    pull: "«Участники учились просто быть живыми.»",
    accent: "#c8b896",
  },
  {
    year: "2023",
    tag: "Рост",
    headline: "Тишина лечит",
    sub: "городскую усталость",
    body: "Семьи с детьми, подростки, люди боявшиеся воды — каждый находил своё. Летние сплавы сменялись походами. Каждый выезд становился отдельной историей, которую помнят годами.",
    pull: "«Совместные выходы — момент когда семьи становятся ближе.»",
    accent: "#8fb5a0",
  },
  {
    year: "2024",
    tag: "Новый уровень",
    headline: "Десять байдарок",
    sub: "один гараж, новый сезон",
    body: "Благодаря поддержке — 10 трёхместных байдарок, вёсла, жилеты, гермомешки. Вышли на правый берег Днестра. Теперь планируем сезон заранее и развиваем команду инструкторов.",
    pull: "«Главное изменение — чувство устойчивости.»",
    accent: "#c8b896",
  },
  {
    year: "2025+",
    tag: "Впереди",
    headline: "Больше вдохновения",
    sub: "для всех кто идёт с нами",
    body: "Детские программы, новые маршруты, развитие инструкторов. Экология — часть ДНК клуба: многоразовая посуда, уборка берегов после каждого выезда, уважение к природе.",
    pull: "«Вроде у нас это неплохо получается.»",
    accent: "#8fb5a0",
  },
];

/* ============================================================
   PARTICLE TEXT ENGINE
   Each letter is an attractor. Particles float as forest dust,
   then snap to letter shapes when triggered.
============================================================ */
class ParticleTextEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Particle[] = [];
  targets: { x: number; y: number; active: boolean }[] = [];
  width = 0;
  height = 0;
  raf = 0;
  phase: "float" | "assemble" | "hold" | "dissolve" = "float";
  onAssembled?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    this.width = this.canvas.width = this.canvas.offsetWidth;
    this.height = this.canvas.height = this.canvas.offsetHeight;
  }

  // Sample letter pixels from offscreen canvas
  sampleText(text: string, fontSize: number, x: number, y: number): { x: number; y: number }[] {
    const off = document.createElement("canvas");
    off.width = this.width;
    off.height = this.height;
    const octx = off.getContext("2d")!;
    octx.font = `300 ${fontSize}px 'Cormorant Garamond', serif`;
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.fillText(text, x, y);

    const data = octx.getImageData(0, 0, off.width, off.height).data;
    const pts: { x: number; y: number }[] = [];
    const step = 4;
    for (let py = 0; py < off.height; py += step) {
      for (let px = 0; px < off.width; px += step) {
        const i = (py * off.width + px) * 4;
        if (data[i + 3] > 128) pts.push({ x: px, y: py });
      }
    }
    // shuffle
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    return pts;
  }

  init(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.width, this.height));
    }
  }

  assemble(text: string, fontSize: number, cx: number, cy: number, cb?: () => void) {
    this.phase = "assemble";
    this.onAssembled = cb;
    const pts = this.sampleText(text, fontSize, cx, cy);
    const count = Math.min(pts.length, this.particles.length);

    for (let i = 0; i < this.particles.length; i++) {
      if (i < count) {
        this.particles[i].setTarget(pts[i].x, pts[i].y);
      } else {
        this.particles[i].setTarget(
          cx + (Math.random() - 0.5) * this.width * 0.8,
          cy + (Math.random() - 0.5) * this.height * 0.5
        );
      }
    }

    // check assembly completion
    let assembled = false;
    const checkTimer = setInterval(() => {
      if (assembled) return;
      const allClose = this.particles.slice(0, count).every(p => {
        const dx = p.x - p.tx;
        const dy = p.y - p.ty;
        return Math.sqrt(dx * dx + dy * dy) < 6;
      });
      if (allClose) {
        assembled = true;
        clearInterval(checkTimer);
        this.phase = "hold";
        this.onAssembled?.();
      }
    }, 100);
  }

  dissolve() {
    this.phase = "dissolve";
    this.particles.forEach(p => p.dissolve(this.width, this.height));
    setTimeout(() => { this.phase = "float"; }, 1200);
  }

  tick() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.particles.forEach(p => {
      p.update(this.phase);
      p.draw(this.ctx);
    });
  }

  start() {
    const loop = () => {
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

class Particle {
  x: number; y: number;
  tx: number; ty: number;
  vx = 0; vy = 0;
  size: number;
  baseOpacity: number;
  opacity: number;
  color: string;
  floatAngle: number;
  floatRadius: number;
  floatSpeed: number;
  originX: number; originY: number;

  constructor(w: number, h: number) {
    this.x = this.originX = Math.random() * w;
    this.y = this.originY = Math.random() * h;
    this.tx = this.x; this.ty = this.y;
    this.size = Math.random() * 1.8 + 0.4;
    this.baseOpacity = Math.random() * 0.5 + 0.1;
    this.opacity = this.baseOpacity;
    this.floatAngle = Math.random() * Math.PI * 2;
    this.floatRadius = Math.random() * 2.5 + 0.5;
    this.floatSpeed = Math.random() * 0.008 + 0.003;

    // forest dust colours — gold, mist, pale green
    const palette = ["#c8b896", "#8fb5a0", "#f0ebe0", "#d4c8a8", "#a8c8b0"];
    this.color = palette[Math.floor(Math.random() * palette.length)];
  }

  setTarget(tx: number, ty: number) {
    this.tx = tx; this.ty = ty;
  }

  dissolve(w: number, h: number) {
    this.tx = Math.random() * w;
    this.ty = Math.random() * h;
  }

  update(phase: string) {
    if (phase === "float") {
      // gentle drift — forest dust in still air
      this.floatAngle += this.floatSpeed;
      const fx = Math.cos(this.floatAngle) * this.floatRadius;
      const fy = Math.sin(this.floatAngle * 0.7) * this.floatRadius * 0.4 - 0.08; // very slow rise
      this.x += (this.originX + fx - this.x) * 0.012;
      this.y += (this.originY + fy - this.y) * 0.012;
      this.opacity += (this.baseOpacity - this.opacity) * 0.05;

    } else if (phase === "assemble") {
      // spring toward target with damping
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      this.vx += dx * 0.07;
      this.vy += dy * 0.07;
      this.vx *= 0.72;
      this.vy *= 0.72;
      this.x += this.vx;
      this.y += this.vy;
      // brighten as they converge
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.opacity = this.baseOpacity + (1 - Math.min(dist / 80, 1)) * 0.85;

    } else if (phase === "hold") {
      // micro-tremble — particles breathe in place
      this.x += (this.tx - this.x) * 0.15 + (Math.random() - 0.5) * 0.3;
      this.y += (this.ty - this.y) * 0.15 + (Math.random() - 0.5) * 0.3;
      this.opacity += (0.9 - this.opacity) * 0.05;

    } else if (phase === "dissolve") {
      const dx = this.tx - this.x;
      const dy = this.ty - this.y;
      this.vx += dx * 0.04;
      this.vy += dy * 0.04;
      this.vx *= 0.88;
      this.vy *= 0.88;
      this.x += this.vx;
      this.y += this.vy;
      this.opacity *= 0.97;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity < 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(this.opacity, 1);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ============================================================
   MAIN PAGE
============================================================ */
export default function EvaParticleForest() {
  const glCanvasRef   = useRef<HTMLCanvasElement>(null);   // WebGL forest
  const ptCanvasRef   = useRef<HTMLCanvasElement>(null);   // Particle text hero
  const engineRef     = useRef<ParticleTextEngine | null>(null);
  const [ready, setReady]           = useState(false);
  const [audioOn, setAudioOn]       = useState(false);
  const [activeChapter, setActive]  = useState(0);
  const scrollVel   = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef     = useRef<GainNode | null>(null);

  /* ----------------------------------------------------------
     FOREST WEBGL — conifer pre-dawn
  ---------------------------------------------------------- */
  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl") as WebGLRenderingContext;
    if (!gl) return;

    let W = 0, H = 0, time = 0, raf = 0;
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      gl.viewport(0, 0, W, H);
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => {
      tmx = e.clientX / window.innerWidth;
      tmy = 1 - e.clientY / window.innerHeight;
    });

    const vert = `attribute vec2 p; void main(){ gl_Position=vec4(p,0,1); }`;
    const frag = `
precision highp float;
uniform float t;
uniform vec2 res;
uniform vec2 mouse;
uniform float vel;

float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }
float h1(float p){ return fract(sin(p*127.1)*43758.5); }

float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),
             mix(h(i+vec2(0,1)),h(i+vec2(1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.08+vec2(.9,1.4); a*=.5; }
  return v;
}

// conifer tree SDF — narrow spire shape
float spruce(vec2 p, float h, float w){
  // multiple stacked cones
  float d = 1.;
  float layers = 4.;
  for(float i=0.; i<4.; i++){
    float ly = i/layers;
    float lh = (1.-ly)*h;
    float lw = w*(1.-ly*0.5)*(1.+(i*0.15));
    vec2 lp = vec2(p.x, p.y - ly*h*0.75);
    // cone: |x| < w*(h-y)/h
    float cone = abs(lp.x)*layers - lw*(lh-max(lp.y,0.))/lh;
    float capH = lh/layers;
    float cap  = max(lp.y - lh/layers, -lp.y);
    d = min(d, max(cone, cap));
  }
  // trunk
  float trunk = max(abs(p.x)-w*.08, max(-p.y, p.y-h*.15));
  return min(d, trunk);
}

float forest(vec2 uv){
  float d=1.;
  for(int i=0;i<16;i++){
    float fi=float(i);
    float x = (fi/15.)*1.1 - 0.05 + h1(fi)*0.01;
    float hh = h1(fi+1.)*.35+0.3;
    float ww = h1(fi+2.)*.04+0.025;
    float yb = h1(fi+3.)*.08;
    d = min(d, spruce(vec2(uv.x-x, uv.y-yb)*vec2(1.,1./hh), 1., ww));
  }
  return d;
}

// god ray — cold pre-dawn
float ray(vec2 uv, vec2 src, float ang, float w){
  vec2 dir=vec2(sin(ang),-cos(ang));
  vec2 perp=vec2(-dir.y,dir.x);
  vec2 d=uv-src;
  float along=dot(d,dir);
  float across=dot(d,perp);
  if(along<0.) return 0.;
  float spread=w+along*.3;
  float r=smoothstep(spread,spread*.3,abs(across));
  return r*exp(-along*1.4)*smoothstep(0.,.06,along);
}

void main(){
  vec2 uv=gl_FragCoord.xy/res;
  uv.y=1.-uv.y;

  // ---- PRE-DAWN SKY — cold blue-purple ----
  vec3 void_   = vec3(0.016, 0.031, 0.063);  // #040810
  vec3 deepSky = vec3(0.025, 0.072, 0.10);   // dark blue
  vec3 horizon = vec3(0.10, 0.16, 0.10);     // cold grey-green
  vec3 dawn    = vec3(0.30, 0.22, 0.12);     // very muted gold at horizon
  vec3 firstRay= vec3(0.65, 0.58, 0.42);     // pale first light

  float hz = 0.42;
  float skyT = smoothstep(hz+0.3, hz-0.1, uv.y);
  float glowT = exp(-abs(uv.y-hz)*7.) * 0.55;
  float riseT = exp(-abs(uv.y-(hz-0.04))*14.) * pow(mouse.x, 1.5) * 0.4;

  vec3 sky = mix(void_, deepSky, skyT);
  sky = mix(sky, horizon, glowT);
  sky = mix(sky, dawn, glowT*0.5);
  sky = mix(sky, firstRay, riseT);

  // ---- MIST — ground-hugging, cold ----
  float mt = t*0.025;
  float mist = fbm(vec2(uv.x*2.2+mt, uv.y*1.8))*0.6 + fbm(vec2(uv.x*1.4-mt*.7, uv.y*2.3+0.3))*0.4;
  float mistMask = smoothstep(0.72,0.3,uv.y) * smoothstep(0.0,0.45,uv.y);
  mistMask *= 0.7 + fbm(vec2(uv.x*3.+mt,0.5))*0.3;
  vec3 mistCol = vec3(0.52,0.60,0.52);
  sky = mix(sky, mistCol, mist*mistMask*0.5);

  // ---- VOLUMETRIC RAYS — cold, narrow ----
  vec2 sun = vec2(mix(0.35,0.65,mouse.x), hz-0.06);
  float rays=0.;
  for(int r=0;r<9;r++){
    float fi=float(r)/8.;
    float ang=(fi-.5)*.35 + sin(t*.06+fi*3.1)*.015;
    float w=mix(.006,.018,h1(float(r)));
    rays += ray(uv, sun, ang, w) * mix(.3,.9,h1(float(r)+.5));
  }
  rays += ray(uv, sun, (mouse.x-.5)*.6, .008)*.5;
  rays *= 1. + vel*.35;
  vec3 rayCol = vec3(0.80,0.75,0.58);
  sky = mix(sky, rayCol, rays*.4);

  // ---- FOREST LAYERS ----
  vec3 col = sky;

  // far — blue-grey silhouettes
  vec2 uv3 = vec2(uv.x*1.02+t*.002, (uv.y-.03)*1.22);
  float f3 = forest(uv3);
  float t3 = smoothstep(.006,-.002,f3)*smoothstep(.0,.6,1.-uv.y);
  vec3 far = vec3(0.04,0.08,0.07); // cold dark blue-green
  col = mix(col,far,t3*.7);

  // mid — darker spruce
  vec2 uv2 = vec2(uv.x*.96+t*.005+.1,(uv.y-.07)*1.38);
  float f2 = forest(uv2);
  float t2 = smoothstep(.008,-.003,f2)*smoothstep(.0,.65,1.-uv.y);
  vec3 mid = vec3(0.025,0.055,0.04);
  col = mix(col,mid,t2*.85);

  // near — near black
  vec2 uv1 = vec2(uv.x*.91-t*.003+.05,(uv.y-.13)*1.58);
  float f1 = forest(uv1);
  float t1 = smoothstep(.010,-.004,f1)*smoothstep(.0,.68,1.-uv.y);
  vec3 fore = vec3(0.012,0.028,0.018);
  col = mix(col,fore,t1*.95);

  // ---- MOSS/GROUND — dark green ----
  float ground = smoothstep(.75,1.,uv.y);
  float moss = fbm(vec2(uv.x*5.+t*.01,uv.y*3.));
  vec3 mossCol = mix(vec3(0.03,0.08,0.03), vec3(0.06,0.14,0.05), moss);
  col = mix(col, mossCol*0.7, ground*(1.-t1)*0.8);

  // ---- DUST PARTICLES — tiny specks of light ----
  float dust=0.;
  for(int i=0;i<12;i++){
    float fi=float(i);
    vec2 dp=vec2(
      fract(h1(fi)*.7 + t*mix(.004,.012,h1(fi+1.))),
      fract(h1(fi+2.)*.8 + t*mix(.003,.008,h1(fi+3.)))
    );
    float dd=length(uv-dp);
    dust+=exp(-dd*dd*18000.)*mix(.3,.9,h1(fi+4.));
  }
  col = mix(col, vec3(.9,.85,.6), dust*.5*(1.-t1*.8));

  // ---- VIGNETTE ----
  vec2 vu=uv*2.-1.;
  float vig=1.-dot(vu*vec2(.55,.75),vu*vec2(.55,.75));
  col*=pow(max(vig,0.),.18);

  // cold colour grade — desaturate slightly, push blue in shadows
  float lum=dot(col,vec3(.299,.587,.114));
  col=mix(col,vec3(lum)*vec3(.9,.95,1.05),.15);

  gl_FragColor=vec4(col,1.);
}`;

    const mkS=(type:number,src:string)=>{ const s=gl.createShader(type)!; gl.shaderSource(s,src); gl.compileShader(s); return s; };
    const prog=gl.createProgram()!;
    gl.attachShader(prog,mkS(gl.VERTEX_SHADER,vert));
    gl.attachShader(prog,mkS(gl.FRAGMENT_SHADER,frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,"p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    const uT=gl.getUniformLocation(prog,"t");
    const uR=gl.getUniformLocation(prog,"res");
    const uM=gl.getUniformLocation(prog,"mouse");
    const uV=gl.getUniformLocation(prog,"vel");

    const tick=()=>{
      time+=0.016;
      mx+=(tmx-mx)*0.035; // slower — forest doesn't rush
      my+=(tmy-my)*0.035;
      gl.uniform1f(uT,time);
      gl.uniform2f(uR,W,H);
      gl.uniform2f(uM,mx,my);
      gl.uniform1f(uV,Math.min(Math.abs(scrollVel.current)*0.25,1));
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      raf=requestAnimationFrame(tick);
    };
    tick();

    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);

  /* ----------------------------------------------------------
     PARTICLE TEXT — hero
  ---------------------------------------------------------- */
  useEffect(() => {
    const canvas = ptCanvasRef.current;
    if (!canvas) return;

    const engine = new ParticleTextEngine(canvas);
    engineRef.current = engine;
    engine.init(1800);
    engine.start();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // sequence: line1 assembles → pause → line2 → pause → subtext → hold
    const seq = async () => {
      await sleep(900);
      await assembleAsync(engine, "Опыт,", clamp(W() * 0.12, 52, 90), W() * 0.38, H() * 0.38);
      await sleep(600);
      await assembleAsync(engine, "который вдохновляет", clamp(W() * 0.065, 36, 58), W() * 0.38, H() * 0.56);
      await sleep(500);
      // reveal subtext via CSS
      const sub = document.querySelector<HTMLElement>(".hero-sub-reveal");
      if (sub) { sub.style.opacity = "1"; sub.style.filter = "blur(0px)"; }
    };
    seq();

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => { engine.stop(); window.removeEventListener("resize", onResize); };
  }, []);

  /* ----------------------------------------------------------
     LENIS + GSAP
  ---------------------------------------------------------- */
  useEffect(() => {
    let destroy: (() => void) | undefined;
    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("@studio-freight/lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);

      // Forest breathes — very slow inertia
      const lenis = new Lenis({ lerp: 0.038, smoothWheel: true });

      lenis.on("scroll", ({ velocity }: { velocity: number }) => {
        scrollVel.current = velocity;
        document.querySelectorAll<HTMLElement>("[data-breathe]").forEach(el => {
          el.style.transform = `skewY(${velocity * -0.12}deg)`;
        });
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time: number) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);

      // ---- OPENING QUOTE — fog dissolve ----
      ScrollTrigger.create({
        trigger: ".opening-quote",
        start: "top 70%",
        onEnter: () => {
          gsap.fromTo(".quote-word",
            { opacity: 0, filter: "blur(20px)", y: 5 },
            { opacity: 1, filter: "blur(0px)", y: 0, stagger: 0.1, duration: 2.2, ease: "power1.out" }
          );
        },
        once: true,
      });

      // ---- PINNED HORIZONTAL CHAPTERS ----
      const track = document.querySelector<HTMLElement>(".ch-track");
      const panels = document.querySelectorAll<HTMLElement>(".ch-panel");

      if (track && panels.length) {
        const total = (panels.length - 1) * window.innerWidth;

        gsap.to(track, {
          x: -total, ease: "none",
          scrollTrigger: {
            trigger: ".ch-pin", start: "top top",
            end: `+=${total + window.innerHeight * 0.6}`,
            scrub: 2, pin: true, anticipatePin: 1,
            onUpdate: (self: any) => setActive(Math.round(self.progress * (panels.length - 1))),
          },
        });

        panels.forEach((panel, i) => {
          const words = panel.querySelectorAll<HTMLElement>(".ch-word");
          const sub   = panel.querySelector<HTMLElement>(".ch-sub");
          const body  = panel.querySelector<HTMLElement>(".ch-body");
          const pull  = panel.querySelector<HTMLElement>(".ch-pull");
          const yr    = panel.querySelector<HTMLElement>(".ch-yr");

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: ".ch-pin",
              start: `${(i / panels.length) * 100 + 1}% top`,
              end:   `${((i + 0.9) / panels.length) * 100}% top`,
              scrub: true,
            },
          });

          // words materialise from dust — blur + opacity + slight Y
          words.forEach((w, wi) => {
            tl.fromTo(w,
              { opacity: 0, filter: "blur(22px)", y: 10 },
              { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.35 },
              wi * 0.14
            );
          });

          if (sub)  tl.fromTo(sub,  { opacity:0, filter:"blur(14px)" }, { opacity:1, filter:"blur(0px)", duration:0.35 }, 0.3);
          if (yr)   tl.fromTo(yr,   { opacity:0, x:-50 },               { opacity:1, x:0, duration:0.4 },                0.0);
          if (body) tl.fromTo(body, { opacity:0, filter:"blur(8px)", y:16 }, { opacity:1, filter:"blur(0px)", y:0, duration:0.5 }, 0.45);
          if (pull) tl.fromTo(pull, { opacity:0, x:-16 },               { opacity:1, x:0, duration:0.4 },                0.65);
        });
      }

      // ---- FOUNDER — particle-style word by word ----
      ScrollTrigger.create({
        trigger: ".founder-section",
        start: "top 62%",
        onEnter: () => {
          gsap.fromTo(".founder-word",
            { opacity: 0, filter: "blur(18px)", scale: 0.92 },
            { opacity: 1, filter: "blur(0px)", scale: 1, stagger: 0.07, duration: 1.6, ease: "power2.out" }
          );
        },
        once: true,
      });

      // ---- CTA — emerge from darkness ----
      gsap.fromTo(".cta-inner",
        { opacity: 0, scale: 0.9, filter: "blur(24px)" },
        {
          opacity: 1, scale: 1, filter: "blur(0px)", ease: "power2.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 72%", end: "top 28%", scrub: true },
        }
      );

      // ---- BRANCH SVGs ----
      document.querySelectorAll<SVGPathElement>(".branch-path").forEach(path => {
        const len = path.getTotalLength?.() || 600;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: path.closest("svg"), start: "top 85%", end: "top 25%", scrub: true },
        });
      });

      setReady(true);
      destroy = () => { lenis.destroy(); ScrollTrigger.killAll(); };
    })();
    return () => destroy?.();
  }, []);

  /* ----------------------------------------------------------
     AMBIENT — conifer dawn soundscape
  ---------------------------------------------------------- */
  const toggleAudio = useCallback(() => {
    if (!audioOn) {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      gainRef.current = master;

      // Wind in pines — shaped noise
      const mkNoise = (lo: number, hi: number, gain: number) => {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < d.length; i++) {
          const w = Math.random() * 2 - 1;
          d[i] = last = (last + 0.02 * w) / 1.02;
          d[i] *= 3.5;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = (lo + hi) / 2;
        bp.Q.value = (lo + hi) / (hi - lo) * 0.5;
        const g = ctx.createGain(); g.gain.value = gain;
        src.connect(bp); bp.connect(g); g.connect(master);
        src.start();
      };

      mkNoise(80, 200, 0.35);   // deep pine wind
      mkNoise(400, 900, 0.10);  // mid rustle
      mkNoise(1800, 3500, 0.04); // high needle hiss

      // Birds — sparse, realistic
      // Silence IS the design. Long gaps between calls.
      const BIRD_CALLS = [
        [880, 1047, 1319],   // 3-note ascending
        [1319, 1047],        // 2-note descending
        [1047, 1047, 880],   // repeat-fall
        [659, 784, 1047, 784], // 4-note trill
      ];

      const schedBird = () => {
        const call = BIRD_CALLS[Math.floor(Math.random() * BIRD_CALLS.length)];
        let offset = 0;
        call.forEach(freq => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          const env = ctx.createGain();
          env.gain.value = 0;
          osc.connect(env); env.connect(master);
          const now = ctx.currentTime + offset;
          env.gain.linearRampToValueAtTime(0.008, now + 0.04);
          env.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
          osc.start(now); osc.stop(now + 0.5);
          offset += 0.18;
        });
        // Long silence — 4 to 12 seconds. Silence is intentional.
        setTimeout(schedBird, 4000 + Math.random() * 8000);
      };
      setTimeout(schedBird, 3000);

      master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 4);
      setAudioOn(true);
    } else {
      gainRef.current?.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 2);
      setTimeout(() => audioCtxRef.current?.close(), 2100);
      setAudioOn(false);
    }
  }, [audioOn]);

  /* ----------------------------------------------------------
     WORD SPLITTER
  ---------------------------------------------------------- */
  const dustWords = (text: string, cls: string, style?: React.CSSProperties) =>
    text.split(" ").map((w, i) => (
      <span key={i} className={`${cls} inline-block`} style={{ marginRight: "0.3em", ...style }}>{w}</span>
    ));

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Unbounded:wght@300;400;700;900&display=swap');

        *,*::before,*::after{ margin:0;padding:0;box-sizing:border-box;cursor:none!important; }
        html{ background:#040810; }
        body{ overflow-x:hidden; }
        ::selection{ background:rgba(200,184,150,0.28); color:#f0ebe0; }
        ::-webkit-scrollbar{ width:2px; }
        ::-webkit-scrollbar-thumb{ background:rgba(200,184,150,0.2); }

        [data-breathe]{ will-change:transform; transition:transform 0.55s cubic-bezier(.25,.46,.45,.94); }

        #loader{ position:fixed;inset:0;z-index:10000;background:#040810;
          display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;
          transition:opacity 1.4s ease,visibility 1.4s ease; }
        #loader.out{ opacity:0;visibility:hidden;pointer-events:none; }

        #cdot,#cring{ position:fixed;top:0;left:0;border-radius:50%;
          pointer-events:none;z-index:9999;transform:translate(-50%,-50%); }
        #cdot{ width:6px;height:6px;background:#c8b896;mix-blend-mode:screen;transition:width .3s,height .3s; }
        #cring{ width:30px;height:30px;border:1px solid rgba(200,184,150,0.35);transition:all .3s; }

        #pbar{ position:fixed;top:0;left:0;height:1px;z-index:500;
          background:linear-gradient(90deg,#c8b896,#8fb5a0);
          box-shadow:0 0 5px rgba(200,184,150,0.5);transition:width .1s linear; }

        .ch-panel{ width:100vw;height:100vh;flex-shrink:0;
          display:flex;align-items:center;padding:0 8vw;position:relative;overflow:hidden; }

        .grain::after{ content:'';position:fixed;inset:0;pointer-events:none;z-index:9990;
          opacity:.036;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:160px; }

        .audio-btn{ position:fixed;bottom:32px;right:32px;z-index:300;
          width:42px;height:42px;border-radius:50%;border:1px solid rgba(200,184,150,0.28);
          background:rgba(4,8,16,0.8);display:flex;align-items:center;justify-content:center;
          color:#c8b896;font-size:.9rem;backdrop-filter:blur(8px);
          transition:border-color .3s,background .3s; }
        .audio-btn:hover{ border-color:rgba(200,184,150,0.6); }

        .hero-sub-reveal{
          opacity:0; filter:blur(14px);
          transition:opacity 2s ease, filter 2s ease;
        }

        @keyframes breathe{ 0%,100%{opacity:.25} 50%{opacity:.45} }
      `}</style>

      {/* LOADER */}
      <div id="loader" className={ready ? "out" : ""}>
        <div style={{ fontFamily:"'Unbounded',sans-serif",color:"#c8b896",fontSize:"1rem",fontWeight:700,letterSpacing:"0.35em" }}>ЭВА</div>
        <div style={{ width:100,height:1,background:"linear-gradient(90deg,transparent,#c8b896,transparent)",animation:"breathe 2s infinite" }} />
      </div>

      <div id="cdot" /><div id="cring" /><div id="pbar" />

      <button className="audio-btn" onClick={toggleAudio} title={audioOn?"Тишина":"Звуки рассвета"}>
        {audioOn ? "◼" : "♪"}
      </button>

      {/* Chapter dots */}
      <div style={{ position:"fixed",right:28,top:"50%",transform:"translateY(-50%)",zIndex:300,display:"flex",flexDirection:"column",gap:10 }}>
        {CHAPTERS.map((ch,i)=>(
          <div key={i} style={{
            height:6,borderRadius:3,
            background: i===activeChapter ? ch.accent : "rgba(255,255,255,0.12)",
            width: i===activeChapter ? 20 : 6,
            transition:"all 0.6s cubic-bezier(.25,.46,.45,.94)",
            boxShadow: i===activeChapter ? `0 0 8px ${ch.accent}88` : "none",
          }}/>
        ))}
      </div>

      {/* NAV */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"28px 56px",
        background:"linear-gradient(to bottom,rgba(4,8,16,0.9),transparent)",
      }}>
        <span style={{ fontFamily:"'Unbounded',sans-serif",color:"#c8b896",letterSpacing:"0.3em",fontSize:"0.88rem",fontWeight:700 }}>ЭВА</span>
        <a href="#cta" style={{
          fontFamily:"'Unbounded',sans-serif",fontSize:"0.6rem",letterSpacing:"0.2em",
          textTransform:"uppercase",color:"#040810",background:"#c8b896",
          padding:"10px 24px",borderRadius:100,textDecoration:"none",fontWeight:700,
        }}>Записаться</a>
      </nav>

      <main className="grain" style={{ background:"#040810",color:"#f0ebe0",overflowX:"hidden" }}>

        {/* =============================================
            HERO — WebGL forest + Particle text
        ============================================= */}
        <section style={{ position:"relative",height:"100vh",overflow:"hidden" }}>
          {/* WebGL background */}
          <canvas ref={glCanvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%" }} />

          {/* Particle text canvas */}
          <canvas
            ref={ptCanvasRef}
            style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}
          />

          {/* Bottom fade */}
          <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"45%",
            background:"linear-gradient(to top,#040810,transparent)",pointerEvents:"none" }} />

          {/* Static content — eyebrow + subtitle (particle canvas handles title) */}
          <div style={{ position:"relative",zIndex:10,padding:"0 56px",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:80 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:280 }}>
              <div style={{ width:32,height:1,background:"#c8b896",opacity:.6 }} />
              <span style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.56rem",letterSpacing:"0.4em",color:"#c8b896",textTransform:"uppercase",opacity:.7 }}>
                Турклуб · Приднестровье · Молдова
              </span>
            </div>

            <p className="hero-sub-reveal" style={{
              fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
              fontSize:"1.1rem",color:"rgba(240,235,224,0.45)",
              maxWidth:380,lineHeight:1.8,
            }}>
              Тишина, которой не хватает в городе, уже ждёт тебя.
            </p>
          </div>

          {/* Scroll breath */}
          <div style={{ position:"absolute",right:56,bottom:56,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",gap:8,opacity:.32 }}>
            <div style={{ width:1,height:56,background:"linear-gradient(to bottom,transparent,#c8b896)",animation:"breathe 3s ease infinite" }} />
            <span style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.48rem",letterSpacing:"0.3em",color:"#c8b896",writingMode:"vertical-lr" }}>ВОЙТИ</span>
          </div>
        </section>

        {/* =============================================
            OPENING QUOTE
        ============================================= */}
        <section data-breathe className="opening-quote" style={{ padding:"140px 56px",position:"relative",display:"flex",justifyContent:"center" }}>
          <div style={{ width:1,height:"58%",background:"linear-gradient(to bottom,transparent,#c8b896,transparent)",position:"absolute",left:56,top:"21%",opacity:.4 }} />
          <div style={{ maxWidth:900,paddingLeft:72 }}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontWeight:300,fontSize:"clamp(1.9rem,4vw,3.1rem)",lineHeight:1.45,color:"rgba(240,235,224,0.88)" }}>
              {dustWords("Я с детства занимался туризмом и видел, как путешествия меняют людей —", "quote-word")}
              {" "}
              {["делают", "их"].map((w,i) => (
                <span key={i} className="quote-word" style={{ display:"inline-block",marginRight:"0.3em",fontStyle:"normal",fontWeight:600,color:"#f0ebe0" }}>{w}</span>
              ))}
              {" "}
              {dustWords("смелее, открытее, внимательнее к себе и к тем, кто рядом.", "quote-word")}
            </p>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginTop:36 }}>
              <div style={{ width:26,height:1,background:"#c8b896" }} />
              <span style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.56rem",letterSpacing:"0.3em",color:"#c8b896",textTransform:"uppercase" }}>
                Роман Санду, основатель ЭВА
              </span>
            </div>
          </div>
        </section>

        <BranchDivider />

        {/* =============================================
            STORY HEADER
        ============================================= */}
        <div data-breathe style={{ padding:"60px 56px 0",maxWidth:860 }}>
          <span style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.56rem",letterSpacing:"0.4em",color:"#c8b896",textTransform:"uppercase",display:"block",marginBottom:18 }}>
            История клуба
          </span>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(3rem,7vw,6rem)",lineHeight:0.92,letterSpacing:"-0.02em" }}>
            Три года.<br />
            <em style={{ color:"rgba(240,235,224,0.28)",fontStyle:"italic" }}>Один лес.</em><br />
            Тысячи шагов.
          </h2>
        </div>

        {/* =============================================
            PINNED CHAPTERS
        ============================================= */}
        <section className="ch-pin">
          <div style={{ height:`${CHAPTERS.length * 100 + 60}vh`,position:"relative" }}>
            <div style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden" }}>
              <div className="ch-track" style={{ display:"flex",width:`${CHAPTERS.length*100}vw`,height:"100vh",willChange:"transform" }}>
                {CHAPTERS.map((ch,i) => (
                  <div key={ch.year} className="ch-panel">
                    {/* BG glow */}
                    <div style={{ position:"absolute",top:"25%",left:"35%",width:"55vw",height:"55vw",borderRadius:"50%",
                      background:`radial-gradient(circle,${ch.accent}09,transparent 65%)`,pointerEvents:"none" }} />

                    {/* Giant year */}
                    <div className="ch-yr" style={{ position:"absolute",right:"3vw",top:"50%",transform:"translateY(-50%)",
                      fontFamily:"'Unbounded',sans-serif",fontWeight:900,
                      fontSize:"clamp(7rem,17vw,17rem)",color:"rgba(255,255,255,0.022)",
                      lineHeight:1,userSelect:"none",pointerEvents:"none" }}>
                      {ch.year}
                    </div>

                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6vw",alignItems:"center",width:"100%",position:"relative",zIndex:1 }}>

                      {/* TEXT */}
                      <div>
                        <span style={{ display:"inline-block",fontFamily:"'Unbounded',sans-serif",
                          fontSize:"0.54rem",letterSpacing:"0.25em",textTransform:"uppercase",
                          color:ch.accent,border:`1px solid ${ch.accent}40`,
                          padding:"4px 13px",borderRadius:100,marginBottom:26 }}>
                          {ch.tag}
                        </span>

                        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:300,
                          fontSize:"clamp(2.8rem,5vw,5.2rem)",lineHeight:0.95,letterSpacing:"-0.015em",marginBottom:10 }}>
                          {ch.headline.split(" ").map((w,wi) => (
                            <span key={wi} className="ch-word" style={{ display:"inline-block",marginRight:"0.28em" }}>{w}</span>
                          ))}
                        </div>

                        <div className="ch-sub" style={{ fontFamily:"'Cormorant Garamond',serif",
                          fontStyle:"italic",fontSize:"1.25rem",color:`${ch.accent}bb`,marginBottom:26 }}>
                          {ch.sub}
                        </div>

                        <p className="ch-body" style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:300,
                          fontSize:"1.02rem",lineHeight:1.88,color:"rgba(240,235,224,0.50)",maxWidth:400 }}>
                          {ch.body}
                        </p>

                        <div className="ch-pull" style={{ marginTop:26,paddingLeft:16,paddingTop:10,paddingBottom:10,
                          borderLeft:`2px solid ${ch.accent}`,background:`${ch.accent}07` }}>
                          <p style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
                            fontSize:"1.02rem",color:"rgba(240,235,224,0.75)",lineHeight:1.6 }}>
                            {ch.pull}
                          </p>
                        </div>
                      </div>

                      {/* CARD */}
                      <div>
                        <div style={{ background:"rgba(240,235,224,0.022)",border:`1px solid ${ch.accent}1a`,padding:"48px 42px" }}>
                          <div style={{ fontFamily:"'Unbounded',sans-serif",fontWeight:900,
                            fontSize:"5rem",color:ch.accent,opacity:.09,lineHeight:1 }}>
                            {String(i+1).padStart(2,"0")}
                          </div>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
                            fontSize:"1.5rem",color:"rgba(240,235,224,0.6)",marginTop:18,lineHeight:1.4,fontWeight:300 }}>
                            {ch.headline}<br />
                            <span style={{ color:ch.accent,fontSize:"1rem" }}>{ch.sub}</span>
                          </div>
                          <div style={{ marginTop:32,fontFamily:"'Unbounded',sans-serif",
                            fontSize:"2rem",fontWeight:900,color:ch.accent,letterSpacing:"-0.02em" }}>
                            {ch.year}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =============================================
            FOUNDER VOICE
        ============================================= */}
        <section className="founder-section" data-breathe style={{
          position:"relative",minHeight:"88vh",display:"flex",alignItems:"center",
          overflow:"hidden",padding:"120px 56px",background:"#040810",
        }}>
          <div style={{ position:"absolute",inset:0,
            background:"radial-gradient(ellipse at 58% 48%, rgba(200,184,150,0.055), transparent 62%)",
            pointerEvents:"none" }} />

          <div style={{ maxWidth:860,position:"relative",zIndex:1 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"5.5rem",
              lineHeight:.4,color:"#c8b896",opacity:.15,marginBottom:18,userSelect:"none" }}>"</div>

            <p style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontWeight:300,
              fontSize:"clamp(1.7rem,3.5vw,2.7rem)",lineHeight:1.45,color:"rgba(240,235,224,0.88)" }}>
              {("Меня вдохновляет момент, когда усталость от пройденных километров сменяется улыбками, смехом и ощущением силы — когда участники открывают в себе новые возможности и видят, что способны на большее.").split(" ").map((w,i) => {
                const bold = ["улыбками,","смехом","силы","ощущением","новые","возможности"].includes(w);
                return (
                  <span key={i} className="founder-word" style={{ display:"inline-block",marginRight:"0.28em" }}>
                    {bold ? <strong style={{ fontStyle:"normal",fontWeight:600,color:"#f0ebe0" }}>{w}</strong> : w}
                  </span>
                );
              })}
            </p>

            <div style={{ display:"flex",alignItems:"center",gap:18,marginTop:48 }}>
              <div style={{ width:50,height:50,borderRadius:"50%",flexShrink:0,
                border:"2px solid rgba(200,184,150,0.38)",
                backgroundImage:"url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80)",
                backgroundSize:"cover" }} />
              <div>
                <div style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.68rem",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase" }}>
                  Роман Санду
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
                  color:"rgba(240,235,224,0.32)",fontSize:"0.92rem",marginTop:4 }}>
                  Основатель и руководитель ТурКлуба «ЭВА»
                </div>
              </div>
            </div>
          </div>
        </section>

        <BranchDivider />

        {/* =============================================
            CTA
        ============================================= */}
        <section id="cta" className="cta-section" data-breathe style={{
          position:"relative",minHeight:"88vh",display:"flex",alignItems:"center",
          justifyContent:"center",textAlign:"center",overflow:"hidden",padding:"120px 24px",
        }}>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:640,height:640,borderRadius:"50%",pointerEvents:"none",
            background:"radial-gradient(circle,rgba(200,184,150,0.07),transparent 62%)" }} />

          <div className="cta-inner" style={{ maxWidth:700,position:"relative",zIndex:1 }}>
            <span style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.56rem",letterSpacing:"0.4em",
              color:"#c8b896",textTransform:"uppercase",display:"block",marginBottom:32 }}>
              Начни прямо сейчас
            </span>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontWeight:300,
              fontSize:"clamp(3.5rem,9vw,8rem)",lineHeight:0.92,letterSpacing:"-0.02em" }}>
              Войди<br /><em style={{ color:"#c8b896" }}>в лес</em><br />своей жизни
            </h2>
            <p style={{ fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
              fontSize:"1.1rem",color:"rgba(240,235,224,0.38)",maxWidth:400,margin:"26px auto 0",lineHeight:1.85 }}>
              Тишина, которую ты ищешь, уже ждёт. Первый шаг — записаться.
            </p>
            <a href="tel:+373000000000" style={{
              display:"inline-block",marginTop:52,
              fontFamily:"'Unbounded',sans-serif",fontSize:"0.7rem",fontWeight:700,
              letterSpacing:"0.2em",textTransform:"uppercase",
              color:"#040810",background:"#c8b896",
              padding:"20px 58px",borderRadius:100,textDecoration:"none",
              transition:"transform .3s,box-shadow .3s",
            }}
              onMouseEnter={e=>{(e.target as HTMLElement).style.transform="scale(1.05)";(e.target as HTMLElement).style.boxShadow="0 0 55px rgba(200,184,150,0.4)";}}
              onMouseLeave={e=>{(e.target as HTMLElement).style.transform="scale(1)";(e.target as HTMLElement).style.boxShadow="none";}}
            >
              Записаться на поход
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:"1px solid rgba(255,255,255,0.04)",padding:"40px 56px",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16 }}>
          <span style={{ fontFamily:"'Unbounded',sans-serif",color:"#c8b896",letterSpacing:"0.3em",fontSize:"0.82rem" }}>ЭВА</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",color:"rgba(240,235,224,0.18)",fontSize:"0.82rem" }}>
            © 2025 ТурКлуб ЭВА — Опыт, который вдохновляет
          </span>
          <div style={{ display:"flex",gap:28 }}>
            {["Instagram","ВКонтакте","Telegram"].map(s=>(
              <a key={s} href="#" style={{ fontFamily:"'Unbounded',sans-serif",fontSize:"0.52rem",
                letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(240,235,224,0.2)",
                textDecoration:"none",transition:"color .3s" }}
                onMouseEnter={e=>(e.target as HTMLElement).style.color="#c8b896"}
                onMouseLeave={e=>(e.target as HTMLElement).style.color="rgba(240,235,224,0.2)"}
              >{s}</a>
            ))}
          </div>
        </footer>

      </main>

      <CursorProgress />
    </>
  );
}

/* ============================================================
   BRANCH DIVIDER
============================================================ */
function BranchDivider() {
  return (
    <div style={{ width:"100%",padding:"8px 0",overflow:"hidden",opacity:.3,background:"#040810" }}>
      <svg viewBox="0 0 1400 70" style={{ width:"100%",height:70 }} preserveAspectRatio="none">
        <path className="branch-path" d="M0,35 Q200,12 400,35 T800,30 T1200,38 T1400,33"
          fill="none" stroke="#c8b896" strokeWidth=".8"/>
        <path className="branch-path" d="M80,50 Q300,28 520,48 T900,44 T1300,50"
          fill="none" stroke="#8fb5a0" strokeWidth=".5" strokeOpacity=".55"/>
        <path className="branch-path" d="M400,35 Q418,16 440,6" fill="none" stroke="#c8b896" strokeWidth=".5" strokeOpacity=".45"/>
        <path className="branch-path" d="M800,30 Q820,12 848,3 M800,30 Q778,16 756,10"
          fill="none" stroke="#c8b896" strokeWidth=".4" strokeOpacity=".38"/>
        <path className="branch-path" d="M1200,38 Q1222,18 1250,8"
          fill="none" stroke="#8fb5a0" strokeWidth=".4" strokeOpacity=".38"/>
      </svg>
    </div>
  );
}

/* ============================================================
   CURSOR + PROGRESS
============================================================ */
function CursorProgress() {
  useEffect(() => {
    const dot = document.getElementById("cdot")!;
    const ring = document.getElementById("cring")!;
    const bar = document.getElementById("pbar")!;
    let mx=0,my=0,rx=0,ry=0;

    const onMove=(e:MouseEvent)=>{ mx=e.clientX; my=e.clientY; };
    document.addEventListener("mousemove",onMove);

    const anim=()=>{
      rx+=(mx-rx)*.088; ry+=(my-ry)*.088;
      dot.style.left=mx+"px"; dot.style.top=my+"px";
      ring.style.left=rx+"px"; ring.style.top=ry+"px";
      requestAnimationFrame(anim);
    };
    anim();

    const onScroll=()=>{
      const p=window.scrollY/(document.body.scrollHeight-innerHeight)*100;
      bar.style.width=p+"%";
    };
    window.addEventListener("scroll",onScroll,{passive:true});

    const onOver=(e:MouseEvent)=>{
      const t=e.target as HTMLElement;
      const big=!!t.closest("a,button");
      dot.style.width=big?"38px":"6px";
      dot.style.height=big?"38px":"6px";
      ring.style.opacity=big?"0":"1";
    };
    document.addEventListener("mouseover",onOver);

    return ()=>{
      document.removeEventListener("mousemove",onMove);
      window.removeEventListener("scroll",onScroll);
      document.removeEventListener("mouseover",onOver);
    };
  },[]);
  return null;
}

/* ============================================================
   HELPERS
============================================================ */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const assembleAsync = (engine: ParticleTextEngine, text: string, fontSize: number, cx: number, cy: number) =>
  new Promise<void>(resolve => engine.assemble(text, fontSize, cx, cy, resolve));
