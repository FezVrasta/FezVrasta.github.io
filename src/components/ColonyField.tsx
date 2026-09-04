import React from 'react';

type Pattern = 'colonies' | 'swarm' | 'film';
type Colorway = 'lime' | 'copper' | 'ice';

interface ColonyFieldProps {
	pattern?: Pattern;
	colorway?: Colorway;
	/** Whether the pointer drops "food" that the colonies grow toward. */
	attract?: boolean;
}

interface Food {
	x: number;
	y: number;
	s: number;
}

interface Colony {
	wx: number;
	wy: number;
	r: number;
	ax: number;
	ay: number;
	fx: number;
	fy: number;
	ph: number;
	rot: number;
	rotV: number;
	px: number;
	py: number;
	pvx: number;
	pvy: number;
	off: Float32Array;
	used: number;
	growAcc: number;
	lod: number;
	base: number;
}

interface Stray {
	x: number;
	y: number;
	vx: number;
	vy: number;
	s: number;
}

interface Phantom {
	x: number;
	y: number;
	ang: number;
	sp: number;
	ph: number;
	lx: number;
	ly: number;
}

/**
 * WebGL "ant colony" particle field. Ported 1:1 from the Claude Design
 * component (Home.dc.html, a DCLogic class component) into a plain
 * React class component so it can run as an Astro client island.
 */
export default class ColonyField extends React.Component<ColonyFieldProps> {
	static defaultProps = {
		pattern: 'colonies' as Pattern,
		colorway: 'lime' as Colorway,
		attract: true,
	};

	private canvas = React.createRef<HTMLCanvasElement>();
	private mouse = { x: -1e5, y: -1e5, vx: 0, vy: 0, on: 0 };
	private t = 0;
	private foods: Food[] = [];
	private readonly MAX = 20000;

	private raf = 0;
	private gl: WebGL2RenderingContext | null = null;
	private scale = 1;
	private W = 0;
	private H = 0;
	private prog: WebGLProgram | null = null;
	private glowProg: WebGLProgram | null = null;
	private u!: Record<string, WebGLUniformLocation | null>;
	private gu!: Record<string, WebGLUniformLocation | null>;
	private vao: WebGLVertexArrayObject | null = null;
	private texN = 0;
	private data!: Float32Array;
	private disp!: Float32Array;
	private vel!: Float32Array;
	private wpos!: Float32Array;
	private size!: Float32Array;
	private srcIdx!: Int32Array;
	private cellTex: WebGLTexture | null = null;

	private colonies: Colony[] = [];
	private strays: Stray[] = [];
	private phantoms: Phantom[] | null = null;
	private lastMouseFood: { x: number; y: number } | null = null;
	private zoom = 1;
	private zoomTarget = 1;
	private zoomFrom = 1;
	private zoomProg = 1;
	private zoomCool = 0;
	private level = 0;
	private levelBase = 0;
	private last = 0;
	private strayBase = 0;

	private onResize: () => void = () => {};
	private onMove: (e: PointerEvent) => void = () => {};
	private onLeave: () => void = () => {};
	private _rt: ReturnType<typeof setTimeout> | undefined;

	render() {
		return (
			<canvas
				ref={this.canvas}
				style={{
					position: 'fixed',
					inset: 0,
					width: '100%',
					height: '100%',
					display: 'block',
					zIndex: 0,
				}}
			/>
		);
	}

	componentDidMount() {
		this.setup();
		this.onResize = () => {
			clearTimeout(this._rt);
			this._rt = setTimeout(() => this.setup(), 240);
		};
		window.addEventListener('resize', this.onResize);
		this.onMove = (e: PointerEvent) => {
			const c = this.canvas.current;
			if (!c) return;
			const r = c.getBoundingClientRect();
			const nx = (e.clientX - r.left) * this.scale;
			const ny = (r.height - (e.clientY - r.top)) * this.scale;
			if (this.mouse.on) {
				this.mouse.vx = this.mouse.vx * 0.6 + (nx - this.mouse.x) * 0.4;
				this.mouse.vy = this.mouse.vy * 0.6 + (ny - this.mouse.y) * 0.4;
			}
			this.mouse.x = nx;
			this.mouse.y = ny;
			this.mouse.on = 1;
			if (this.props.attract !== false && this.zoom) {
				const w = this.toWorld(nx, ny);
				const last = this.lastMouseFood;
				const step = 26 / this.zoom;
				if (!last || Math.hypot(w.x - last.x, w.y - last.y) > step) {
					this.lastMouseFood = w;
					this.dropFood(w.x, w.y);
				}
			}
		};
		this.onLeave = () => {
			this.mouse.on = 0;
		};
		window.addEventListener('pointermove', this.onMove, { passive: true });
		window.addEventListener('pointerdown', this.onMove, { passive: true });
		document.addEventListener('pointerleave', this.onLeave);
	}

	componentWillUnmount() {
		cancelAnimationFrame(this.raf);
		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('pointermove', this.onMove as EventListener);
		window.removeEventListener('pointerdown', this.onMove as EventListener);
		document.removeEventListener('pointerleave', this.onLeave);
	}

	morph() {
		const p = this.props.pattern || 'colonies';
		const table = {
			colonies: { count: 7, rMin: 30, rMax: 92, spacing: 6.8, cell: 3.3, strays: 0.06, lobes: 4, grow: 0.075 },
			swarm: { count: 14, rMin: 14, rMax: 48, spacing: 6.4, cell: 3.0, strays: 0.14, lobes: 3, grow: 0.05 },
			film: { count: 4, rMin: 80, rMax: 165, spacing: 7.2, cell: 3.6, strays: 0.03, lobes: 6, grow: 0.11 },
		};
		return table[p] || table.colonies;
	}

	colorway() {
		const c = this.props.colorway || 'lime';
		const table = { lime: [0.52, 0.95, 0.33], copper: [1.0, 0.6, 0.28], ice: [0.44, 0.8, 1.0] };
		return table[c] || table.lime;
	}

	toWorld(sx: number, sy: number) {
		return { x: (sx - this.W / 2) / this.zoom, y: (sy - this.H / 2) / this.zoom };
	}

	dropFood(x: number, y: number) {
		this.foods.push({ x, y, s: 1 });
		if (this.foods.length > 24) this.foods.shift();
	}

	setup() {
		const canvas = this.canvas.current;
		if (!canvas) return;
		cancelAnimationFrame(this.raf);

		const gl =
			this.gl ||
			(canvas.getContext('webgl2', {
				antialias: true,
				alpha: false,
				preserveDrawingBuffer: true,
			}) as WebGL2RenderingContext | null);
		if (!gl) {
			canvas.style.display = 'none';
			return;
		}
		this.gl = gl;

		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const cssW = canvas.clientWidth || window.innerWidth;
		const cssH = canvas.clientHeight || window.innerHeight;
		canvas.width = Math.floor(cssW * dpr);
		canvas.height = Math.floor(cssH * dpr);
		this.scale = dpr * 0.8;
		this.W = Math.max(360, Math.floor(cssW * this.scale));
		this.H = Math.max(360, Math.floor(cssH * this.scale));

		if (!this.prog) this.build(gl);
		this.reset();
		this.last = 0;
		this.startLoop();
	}

	build(gl: WebGL2RenderingContext) {
		const vs = `#version 300 es
    uniform sampler2D uCells;
    uniform vec2 uTexSize, uRes;
    uniform float uRadius;
    out vec2 vLocal;
    out float vSeed;
    void main(){
      int w = int(uTexSize.x);
      ivec2 c = ivec2(gl_InstanceID % w, gl_InstanceID / w);
      vec4 st = texelFetch(uCells, c, 0);
      if (st.w < 0.01) { gl_Position = vec4(4.0, 4.0, 0.0, 1.0); return; }
      vec2 corner = vec2(float((gl_VertexID & 1) * 2 - 1), float(((gl_VertexID >> 1) & 1) * 2 - 1));
      vLocal = corner;
      vSeed = st.z;
      gl_Position = vec4((st.xy + corner * uRadius * st.w) / uRes * 2.0 - 1.0, 0.0, 1.0);
    }`;

		const fs = `#version 300 es
    precision highp float;
    in vec2 vLocal;
    in float vSeed;
    uniform vec3 uC1;
    out vec4 o;
    void main(){
      float d = length(vLocal);
      float a = 1.0 - smoothstep(0.62, 1.0, d);
      if (a <= 0.003) discard;
      float shade = 0.40 + 0.60 * vSeed;
      float rim = 1.0 - 0.30 * smoothstep(0.05, 0.9, d);
      vec3 core = mix(uC1 * 0.34, mix(uC1, vec3(1.0), 0.26), shade);
      o = vec4(core * rim, a * (0.70 + 0.30 * shade));
    }`;

		const glowVS = `#version 300 es
    void main(){
      vec2 q = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      gl_Position = vec4(q * 2.0 - 1.0, 0.0, 1.0);
    }`;

		const glowFS = `#version 300 es
    precision highp float;
    uniform vec2 uPos[8];
    uniform vec3 uStr[8];
    uniform vec3 uC1;
    uniform int uCount;
    out vec4 o;
    void main(){
      float g = 0.0;
      for (int i = 0; i < 8; i++) {
        if (i >= uCount) break;
        float d = length(gl_FragCoord.xy - uPos[i]);
        float r = uStr[i].y;
        g += uStr[i].x * exp(-(d * d) / (2.0 * r * r));
      }
      o = vec4(uC1 * g, 1.0);
    }`;

		const mk = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader compile error');
			return s;
		};
		const link = (v: string, f: string) => {
			const p = gl.createProgram()!;
			gl.attachShader(p, mk(gl.VERTEX_SHADER, v));
			gl.attachShader(p, mk(gl.FRAGMENT_SHADER, f));
			gl.linkProgram(p);
			if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program link error');
			return p;
		};

		this.prog = link(vs, fs);
		this.glowProg = link(glowVS, glowFS);
		this.u = {
			cells: gl.getUniformLocation(this.prog, 'uCells'),
			texSize: gl.getUniformLocation(this.prog, 'uTexSize'),
			res: gl.getUniformLocation(this.prog, 'uRes'),
			radius: gl.getUniformLocation(this.prog, 'uRadius'),
			c1: gl.getUniformLocation(this.prog, 'uC1'),
		};
		this.gu = {
			pos: gl.getUniformLocation(this.glowProg, 'uPos'),
			str: gl.getUniformLocation(this.glowProg, 'uStr'),
			c1: gl.getUniformLocation(this.glowProg, 'uC1'),
			count: gl.getUniformLocation(this.glowProg, 'uCount'),
		};
		this.vao = gl.createVertexArray();

		const N = Math.ceil(Math.sqrt(this.MAX));
		this.texN = N;
		this.data = new Float32Array(N * N * 4);
		this.disp = new Float32Array(this.MAX * 2);
		this.vel = new Float32Array(this.MAX * 2);
		this.wpos = new Float32Array(this.MAX * 2);
		this.size = new Float32Array(this.MAX);
		this.srcIdx = new Int32Array(this.MAX);
		const t = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, N, N, 0, gl.RGBA, gl.FLOAT, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.cellTex = t;
	}

	makeColony(m: ReturnType<ColonyField['morph']>, k: number, cx: number, cy: number): Colony {
		const rnd = (a: number, b: number) => a + Math.random() * (b - a);
		const rBase = rnd(m.rMin, m.rMax) * k;
		const lobes: { x: number; y: number; r: number }[] = [];
		const nl = 2 + ((Math.random() * m.lobes) | 0);
		for (let j = 0; j < nl; j++) {
			const th = Math.random() * Math.PI * 2;
			const off = rnd(0, rBase * 0.85);
			lobes.push({ x: Math.cos(th) * off, y: Math.sin(th) * off, r: rBase * rnd(0.42, 0.86) });
		}
		const sp = m.spacing * k;
		const rowH = sp * 0.866;
		const ext = rBase * 2.0;
		const pts: { x: number; y: number; s: number; rank: number }[] = [];
		for (let y = -ext; y <= ext; y += rowH) {
			const shift = Math.round(y / rowH) % 2 ? sp * 0.5 : 0;
			for (let x = -ext; x <= ext; x += sp) {
				const px = x + shift,
					py = y;
				let best = 9e9;
				for (const l of lobes) {
					const dx = px - l.x,
						dy = py - l.y;
					const wob = 1 + 0.16 * Math.sin(Math.atan2(dy, dx) * 3.0 + l.r);
					const rr = Math.hypot(dx, dy) / (l.r * wob);
					if (rr < best) best = rr;
				}
				if (best > 1.75) continue;
				pts.push({ x: px + rnd(-0.22, 0.22) * sp, y: py + rnd(-0.22, 0.22) * sp, s: Math.random(), rank: best });
			}
		}
		pts.sort((a, b) => a.rank - b.rank);
		const off = new Float32Array(pts.length * 3);
		let used = 0;
		for (let i = 0; i < pts.length; i++) {
			off[i * 3] = pts[i].x;
			off[i * 3 + 1] = pts[i].y;
			off[i * 3 + 2] = pts[i].s;
			if (pts[i].rank <= 1) used = i + 1;
		}
		return {
			wx: cx,
			wy: cy,
			r: rBase,
			ax: rnd(20, 90) * k,
			ay: rnd(20, 80) * k,
			fx: rnd(0.003, 0.009),
			fy: rnd(0.002, 0.008),
			ph: Math.random() * 6.283,
			rot: Math.random() * 6.283,
			rotV: rnd(-0.004, 0.004),
			px: 0,
			py: 0,
			pvx: 0,
			pvy: 0,
			off,
			used: Math.max(24, used),
			growAcc: 0,
			lod: 1,
			base: 0,
		};
	}

	allocate() {
		const strayBlock = 1400;
		let base = 0;
		this.colonies = this.colonies.filter((c) => {
			const cap = c.off.length / 3;
			if (base + cap > this.MAX - strayBlock) return false;
			c.base = base;
			base += cap;
			return true;
		});
		this.strayBase = this.MAX - strayBlock;
	}

	reset() {
		const W = this.W,
			H = this.H,
			m = this.morph();
		const k = Math.min(1, W / 1400);
		const rnd = (a: number, b: number) => a + Math.random() * (b - a);
		this.zoom = 1;
		this.zoomTarget = 1;
		this.zoomFrom = 1;
		this.zoomProg = 1;
		this.level = 0;
		this.foods = [];
		this.lastMouseFood = null;
		this.phantoms = null;
		this.colonies = [];
		for (let i = 0; i < m.count; i++) {
			this.colonies.push(this.makeColony(m, k, rnd(-0.02, 0.58) * W, rnd(-0.46, 0.46) * H));
		}
		const total = this.colonies.reduce((s, c) => s + c.used, 0);
		this.strays = [];
		const nStray = Math.round(total * m.strays);
		for (let i = 0; i < nStray; i++) {
			this.strays.push({
				x: rnd(-0.2, 0.5) * W,
				y: rnd(-0.5, 0.5) * H,
				vx: rnd(-0.09, 0.09),
				vy: rnd(-0.09, 0.09),
				s: Math.random(),
			});
		}
		this.levelBase = total;
		this.disp.fill(0);
		this.vel.fill(0);
		this.allocate();
		this.zoomCool = 0;
	}

	zoomOut() {
		if (this.level >= 6) return;
		const m = this.morph(),
			W = this.W,
			H = this.H;
		const k = Math.min(1, W / 1400);
		const rnd = (a: number, b: number) => a + Math.random() * (b - a);
		this.level++;
		this.zoomFrom = this.zoom;
		this.zoomTarget = this.zoom * 0.78;
		this.zoomProg = 0;
		for (const c of this.colonies) c.lod = Math.min(8, c.lod * 2);
		const halfW = W / (2 * this.zoomTarget),
			halfH = H / (2 * this.zoomTarget);
		const prevW = halfW * 0.78,
			prevH = halfH * 0.78;
		let live = this.colonies.reduce((s, c) => s + c.off.length / 3, 0);
		for (let i = 0; i < 4 + this.level; i++) {
			if (live > this.MAX * 0.8) break;
			let x = 0,
				y = 0,
				tries = 0;
			do {
				x = rnd(-halfW * 0.9, halfW * 0.9);
				y = rnd(-halfH * 0.9, halfH * 0.9);
				tries++;
			} while (tries < 40 && Math.abs(x) < prevW && Math.abs(y) < prevH);
			const c = this.makeColony(m, k, x, y);
			this.colonies.push(c);
			live += c.off.length / 3;
		}
		this.allocate();
		this.levelBase = this.colonies.reduce((s, c) => s + c.used / c.lod, 0);
		this.zoomCool = 6;
	}

	glows(dt: number) {
		const W = this.W,
			H = this.H,
			k = Math.min(1, W / 1400),
			t = this.t;
		if (!this.phantoms) {
			this.phantoms = [];
			for (let i = 0; i < 3; i++) {
				this.phantoms.push({
					x: (0.5 + 0.5 * Math.random()) * W,
					y: Math.random() * H,
					ang: Math.random() * 6.283,
					sp: (0.55 + 0.4 * Math.random()) * k,
					ph: Math.random() * 20,
					lx: -1e5,
					ly: -1e5,
				});
			}
		}
		const out: { x: number; y: number; s: number; r: number }[] = [];
		const mgn = 60 * k;
		for (const p of this.phantoms) {
			p.ang += (Math.sin(t * 0.21 + p.ph) * 0.6 + Math.sin(t * 0.073 + p.ph * 2.3) * 0.9) * 0.02 * dt;
			p.x += Math.cos(p.ang) * p.sp * dt;
			p.y += Math.sin(p.ang) * p.sp * dt;
			if (p.x < mgn) {
				p.x = mgn;
				p.ang = Math.PI - p.ang + 0.3;
			}
			if (p.x > W - mgn) {
				p.x = W - mgn;
				p.ang = Math.PI - p.ang - 0.3;
			}
			if (p.y < mgn) {
				p.y = mgn;
				p.ang = -p.ang + 0.3;
			}
			if (p.y > H - mgn) {
				p.y = H - mgn;
				p.ang = -p.ang - 0.3;
			}
			const step = 26 * k;
			if (Math.hypot(p.x - p.lx, p.y - p.ly) > step) {
				p.lx = p.x;
				p.ly = p.y;
				const w = this.toWorld(p.x, p.y);
				this.dropFood(w.x, w.y);
			}
			out.push({ x: p.x, y: p.y, s: 0.1, r: 105 * k });
		}
		return out;
	}

	frame(now?: number) {
		const gl = this.gl;
		if (!gl || !this.colonies) return;
		const W = this.W,
			H = this.H,
			m = this.morph(),
			d = this.data;
		const nowMs = now || performance.now();
		let dt = this.last ? (nowMs - this.last) / 16.667 : 1;
		this.last = nowMs;
		dt = Math.max(0.2, Math.min(dt, 2.0));
		const damp = (v: number) => Math.pow(v, dt);
		this.t += 0.016 * dt;
		const t = this.t;
		const k = Math.min(1, W / 1400);

		if (this.zoomProg < 1) {
			this.zoomProg = Math.min(1, this.zoomProg + (0.016 * dt) / 4.2);
			const e = this.zoomProg * this.zoomProg * (3 - 2 * this.zoomProg);
			this.zoom = this.zoomFrom + (this.zoomTarget - this.zoomFrom) * e;
		}
		const zoom = this.zoom;

		const mo = this.mouse;
		mo.vx *= damp(0.9);
		mo.vy *= damp(0.9);
		const act = this.props.attract !== false;
		void act;
		const foods = this.foods;
		for (let i = foods.length - 1; i >= 0; i--) {
			foods[i].s *= damp(0.9965);
			if (foods[i].s < 0.06) foods.splice(i, 1);
		}
		const amb = this.glows(dt);

		const dsp = this.disp,
			vel = this.vel,
			wp = this.wpos,
			sz = this.size,
			src = this.srcIdx;
		const reach = 210;
		const minD = m.spacing * k * 0.92;
		const growCap = this.MAX * 0.92;

		let i = 0;
		let totalUsed = 0;
		for (const c of this.colonies) {
			const nCells = c.off.length / 3;
			if (i + c.used > this.MAX) break;
			const bx = c.wx + c.ax * Math.sin(t * c.fx + c.ph);
			const by = c.wy + c.ay * Math.sin(t * c.fy + c.ph * 1.7);

			const near: Food[] = [];
			for (let fi = 0; fi < foods.length; fi++) {
				const fd = foods[fi];
				if (Math.hypot(fd.x - (bx + c.px), fd.y - (by + c.py)) < c.r + reach) near.push(fd);
			}

			for (let fi = 0; fi < foods.length; fi++) {
				const fd = foods[fi];
				const vx = fd.x - (bx + c.px),
					vy = fd.y - (by + c.py);
				const dm = Math.hypot(vx, vy);
				const far = 640;
				if (dm < far && dm > 4) {
					const pull = 0.0035 * (1 - dm / far) * fd.s * dt;
					c.pvx += (vx / dm) * pull;
					c.pvy += (vy / dm) * pull;
				}
			}
			c.pvx *= damp(0.9);
			c.pvy *= damp(0.9);
			const cv = Math.hypot(c.pvx, c.pvy);
			if (cv > 0.22) {
				c.pvx = (c.pvx / cv) * 0.22;
				c.pvy = (c.pvy / cv) * 0.22;
			}
			c.px += c.pvx * dt;
			c.py += c.pvy * dt;

			if (totalUsed < growCap * c.lod && c.used < nCells) {
				c.growAcc += m.grow * dt * (0.35 + 0.65 * Math.min(1, near.length * 0.5));
				while (c.growAcc >= 1 && c.used < nCells) {
					c.growAcc -= 1;
					c.used++;
				}
			}

			const cx = bx + c.px,
				cy = by + c.py;
			const ang = c.rot + t * c.rotV;
			const ca = Math.cos(ang),
				sa = Math.sin(ang);
			const scale = 1 + 0.035 * Math.sin(t * 0.09 + c.ph);
			const off = c.off;

			for (let j = 0; j < c.used; j += c.lod) {
				const o3 = j * 3;
				const ox = off[o3] * scale,
					oy = off[o3 + 1] * scale,
					sd = off[o3 + 2];
				const wob = 0.55;
				const bxw = cx + ox * ca - oy * sa + Math.sin(t * 0.22 + sd * 12.0) * wob;
				const byw = cy + ox * sa + oy * ca + Math.cos(t * 0.19 + sd * 9.0) * wob;
				const q2 = (c.base + j) * 2;
				const px2 = bxw + dsp[q2],
					py2 = byw + dsp[q2 + 1];
				for (let fi = 0; fi < near.length; fi++) {
					const fd = near[fi];
					const ddx = fd.x - px2,
						ddy = fd.y - py2;
					const dm = Math.hypot(ddx, ddy);
					if (dm < reach && dm > 3) {
						const f = (1 - dm / reach) * fd.s;
						vel[q2] += (ddx / dm) * 0.018 * f * dt;
						vel[q2 + 1] += (ddy / dm) * 0.018 * f * dt;
					}
				}
				vel[q2] *= damp(0.8);
				vel[q2 + 1] *= damp(0.8);
				const vv = Math.hypot(vel[q2], vel[q2 + 1]);
				if (vv > 0.3) {
					vel[q2] = (vel[q2] / vv) * 0.3;
					vel[q2 + 1] = (vel[q2 + 1] / vv) * 0.3;
				}
				dsp[q2] += vel[q2] * dt;
				dsp[q2 + 1] += vel[q2 + 1] * dt;
				wp[i * 2] = bxw + dsp[q2];
				wp[i * 2 + 1] = byw + dsp[q2 + 1];
				d[i * 4 + 2] = sd;
				sz[i] = Math.sqrt(c.lod);
				src[i] = c.base + j;
				i++;
			}
			totalUsed += c.used / c.lod;
		}

		const halfW = W / (2 * zoom),
			halfH = H / (2 * zoom);
		let sn = 0;
		for (const s of this.strays) {
			if (i >= this.MAX || sn >= 1400) break;
			sn++;
			s.x += s.vx * dt;
			s.y += s.vy * dt;
			if (s.x < -halfW) s.x = halfW;
			else if (s.x > halfW) s.x = -halfW;
			if (s.y < -halfH) s.y = halfH;
			else if (s.y > halfH) s.y = -halfH;
			wp[i * 2] = s.x;
			wp[i * 2 + 1] = s.y;
			d[i * 4 + 2] = s.s;
			sz[i] = 1;
			src[i] = -1;
			i++;
		}
		const count = i;

		const gsz = minD * 2.9;
		const buckets = new Map<number, number[]>();
		for (let n = 0; n < count; n++) {
			const q2 = n * 2;
			const key = ((wp[q2] / gsz) | 0) * 100003 + ((wp[q2 + 1] / gsz) | 0);
			const arr = buckets.get(key);
			if (arr) arr.push(n);
			else buckets.set(key, [n]);
		}
		for (let n = 0; n < count; n++) {
			const q2 = n * 2;
			const gx = (wp[q2] / gsz) | 0,
				gy = (wp[q2 + 1] / gsz) | 0;
			for (let a = -1; a <= 1; a++) {
				for (let b = -1; b <= 1; b++) {
					const arr = buckets.get((gx + a) * 100003 + (gy + b));
					if (!arr) continue;
					for (let ai = 0; ai < arr.length; ai++) {
						const o = arr[ai];
						if (o <= n) continue;
						const p2 = o * 2;
						let ddx = wp[p2] - wp[q2],
							ddy = wp[p2 + 1] - wp[q2 + 1];
						const md = minD * 0.5 * (sz[n] + sz[o]);
						let dm = Math.hypot(ddx, ddy);
						if (dm >= md) continue;
						if (dm < 0.0001) {
							ddx = n % 2 ? 0.3 : -0.3;
							ddy = 0.17;
							dm = 0.35;
						}
						const push = (md - dm) * 0.5;
						const ux = (ddx / dm) * push,
							uy = (ddy / dm) * push;
						wp[q2] -= ux;
						wp[q2 + 1] -= uy;
						wp[p2] += ux;
						wp[p2 + 1] += uy;
						if (src[n] >= 0) {
							const a2 = src[n] * 2;
							dsp[a2] -= ux;
							dsp[a2 + 1] -= uy;
						}
						if (src[o] >= 0) {
							const b2 = src[o] * 2;
							dsp[b2] += ux;
							dsp[b2 + 1] += uy;
						}
					}
				}
			}
		}

		const cxs = W / 2,
			cys = H / 2;
		for (let n = 0; n < count; n++) {
			const q2 = n * 2,
				b = n * 4;
			d[b] = cxs + wp[q2] * zoom;
			d[b + 1] = cys + wp[q2 + 1] * zoom;
			d[b + 3] = sz[n];
		}
		for (let n = count; n < this.texN * this.texN; n++) d[n * 4 + 3] = 0;

		this.zoomCool = Math.max(0, this.zoomCool - 0.016 * dt);
		if (this.zoomCool === 0 && this.zoomProg >= 1 && totalUsed > this.levelBase * 1.16 && this.level < 6) this.zoomOut();

		const N = this.texN,
			c1 = this.colorway();
		gl.bindVertexArray(this.vao);
		gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RGBA, gl.FLOAT, d);

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clearColor(0.051, 0.055, 0.071, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.enable(gl.BLEND);

		const gsc = gl.drawingBufferWidth / W;
		const fixed = amb.map((g) => ({ x: g.x * gsc, y: g.y * gsc, s: g.s, r: g.r * gsc }));
		if (mo.on > 0.5) fixed.push({ x: mo.x * gsc, y: mo.y * gsc, s: 0.16, r: 130 * gsc });
		const extra: { x: number; y: number; s: number; r: number }[] = [];
		for (let fi = 0; fi < foods.length; fi++) {
			const fd = foods[fi];
			if (fd.s > 0.4) extra.push({ x: (cxs + fd.x * zoom) * gsc, y: (cys + fd.y * zoom) * gsc, s: 0.022 * fd.s, r: 60 * gsc });
		}
		const list = fixed.concat(extra.slice(-(8 - fixed.length)));
		if (list.length) {
			const pos = new Float32Array(16),
				str = new Float32Array(24);
			for (let n = 0; n < list.length; n++) {
				pos[n * 2] = list[n].x;
				pos[n * 2 + 1] = list[n].y;
				str[n * 3] = list[n].s;
				str[n * 3 + 1] = list[n].r;
			}
			gl.blendFunc(gl.ONE, gl.ONE);
			gl.useProgram(this.glowProg);
			gl.uniform2fv(this.gu.pos, pos);
			gl.uniform3fv(this.gu.str, str);
			gl.uniform3f(this.gu.c1, c1[0], c1[1], c1[2]);
			gl.uniform1i(this.gu.count, list.length);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
		gl.uniform1i(this.u.cells, 0);
		gl.uniform2f(this.u.texSize, N, N);
		gl.uniform2f(this.u.res, W, H);
		gl.uniform1f(this.u.radius, Math.max(1.25, m.cell * k * zoom));
		gl.uniform3f(this.u.c1, c1[0], c1[1], c1[2]);
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
		gl.disable(gl.BLEND);
	}

	startLoop() {
		const loop = (now: number) => {
			this.frame(now);
			this.raf = requestAnimationFrame(loop);
		};
		this.raf = requestAnimationFrame(loop);
	}
}
