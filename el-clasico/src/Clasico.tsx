// EL CLÁSICO — THE WORLD STOPS · 60 s · 9:16 · rendered at 4K (scale 2)
// Script: the user's 7-part trailer. Motion language from "Look 00" (whatships.com/videos/look-00):
// HUD brackets, mono labels that decode, tag cards with barcodes, red index numbers,
// condensed heavy type, tracking boxes, grain. Music: "Another Side" (Bensound).
// VO: the user's file, cut into its 13 phrases and placed on the timeline below.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, EXPO, IN_OUT, WHIP, display, inter, mono, pop, rand, tween} from './kit/theme';

export const CLASICO_TOTAL = 3600;
const s = (sec: number) => Math.round(sec * 60);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------------------------------------------------------------- VO placement (file phrase → video second)
const VO: {from: number; to: number; at: number; text: string}[] = [
	{from: 0.15, to: 0.95, at: 32.0, text: 'FOR SOME,'},
	{from: 1.3, to: 1.98, at: 33.0, text: "IT'S A GAME."},
	{from: 2.82, to: 3.5, at: 35.0, text: 'FOR THEM…'},
	{from: 4.11, to: 5.2, at: 36.0, text: "IT'S EVERYTHING."},
	{from: 6.23, to: 7.18, at: 38.4, text: 'TWO GIANTS.'},
	{from: 7.5, to: 8.58, at: 39.6, text: 'TWO LEGACIES.'},
	{from: 9.07, to: 10.5, at: 41.0, text: 'ONE BATTLEFIELD.'},
	{from: 11.24, to: 12.2, at: 44.0, text: 'BARCELONA.'},
	{from: 12.5, to: 13.5, at: 45.6, text: 'REAL MADRID.'},
	{from: 14.36, to: 15.46, at: 47.6, text: 'NINETY MINUTES.'},
	{from: 15.91, to: 17.16, at: 49.0, text: 'ETERNAL PRIDE.'},
	{from: 17.72, to: 19.8, at: 51.2, text: 'THIS IS NOT JUST FOOTBALL.'},
	{from: 20.18, to: 22.2, at: 54.6, text: 'THIS IS EL CLÁSICO.'},
];

// ---------------------------------------------------------------- players (face centre as fraction of the image, crop width fraction)
type P = {src: string; iw: number; ih: number; fx: number; fy: number; cw: number; name: string; role: string; by: string};
const PL: Record<string, P> = {
	yamal: {src: 'yamal.jpg', iw: 2228, ih: 3403, fx: 0.625, fy: 0.16, cw: 0.3, name: 'LAMINE YAMAL', role: 'RW', by: 'Biso'},
	pedri: {src: 'pedri.jpg', iw: 3333, ih: 5000, fx: 0.47, fy: 0.27, cw: 0.55, name: 'PEDRI', role: 'CM', by: 'Bryan Berlin'},
	raphinha: {src: 'raphinha.jpg', iw: 3333, ih: 5000, fx: 0.54, fy: 0.25, cw: 0.42, name: 'RAPHINHA', role: 'LW', by: 'Bryan Berlin'},
	mbappe: {src: 'mbappe.jpeg', iw: 543, ih: 883, fx: 0.68, fy: 0.15, cw: 0.34, name: 'KYLIAN MBAPPÉ', role: 'ST', by: 'SdHb'},
	bellingham: {src: 'bellingham.jpg', iw: 1280, ih: 2530, fx: 0.5, fy: 0.11, cw: 0.36, name: 'JUDE BELLINGHAM', role: 'AM', by: 'MohaESP88'},
	valverde: {src: 'valverde.jpg', iw: 960, ih: 540, fx: 0.6, fy: 0.27, cw: 0.36, name: 'FEDE VALVERDE', role: 'CM', by: 'Real Madrid'},
};

// ---------------------------------------------------------------- small building blocks
const Mono: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 22, color = C.ink, style}) => (
	<span style={{fontFamily: mono, fontSize: size, color, letterSpacing: size * 0.06, textTransform: 'uppercase', whiteSpace: 'nowrap', ...style}}>{children}</span>
);

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/%';
// text that decodes out of random glyphs (reference: "50D2RAH…" → "18 MONTHS TO ESCAPE")
const Scramble: React.FC<{text: string; at: number; dur?: number; size?: number; color?: string; font?: string; style?: React.CSSProperties}> = ({text, at, dur = 30, size = 26, color = C.ink, font = mono, style}) => {
	const f = useCurrentFrame();
	if (f < at) return null;
	const p = (f - at) / dur;
	const chars = Array.from(text).map((ch, i) => {
		if (ch === ' ') return ' ';
		const done = p * text.length * 1.2 > i + rand(i, 3) * 3;
		return done ? ch : GLYPHS[Math.floor(rand(i, Math.floor(f / 2)) * GLYPHS.length)];
	});
	return <span style={{fontFamily: font, fontSize: size, color, letterSpacing: font === mono ? size * 0.06 : 0, whiteSpace: 'pre', ...style}}>{chars.join('')}</span>;
};

const Big: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = C.ink, style}) => (
	<div style={{fontFamily: display, fontSize: size, lineHeight: 0.95, color, letterSpacing: size * 0.005, textTransform: 'uppercase', ...style}}>{children}</div>
);

const Brackets: React.FC<{x: number; y: number; w: number; h: number; p?: number; color?: string; len?: number}> = ({x, y, w, h, p = 1, color = C.hair, len = 34}) => {
	const l = len * p;
	const d = `M${x} ${y + l}V${y}H${x + l} M${x + w - l} ${y}H${x + w}V${y + l} M${x + w} ${y + h - l}V${y + h}H${x + w - l} M${x + l} ${y + h}H${x}V${y + h - l}`;
	return <path d={d} fill="none" stroke={color} strokeWidth={2} opacity={p} />;
};

const Full: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
		{children}
	</svg>
);

// duotone portrait framed on the face, slow push-in
const Portrait: React.FC<{p: P; x: number; y: number; w: number; h: number; from: number; tint: [string, string]; zoom?: [number, number]; reveal?: number; side?: number}> = ({p, x, y, w, h, from, tint, zoom = [1, 1.08], reveal = 1, side}) => {
	const f = useCurrentFrame();
	const z = interpolate(f, [from, from + 300], zoom, clamp);
	const Wd = (w / p.cw) * z;
	const Hd = (Wd * p.ih) / p.iw;
	const left = w / 2 - p.fx * Wd;
	const top = h * 0.42 - p.fy * Hd;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', clipPath: `inset(${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}% 0)`, background: '#000'}}>
			<Img src={staticFile(`clasico/players/${p.src}`)} style={{position: 'absolute', left, top, width: Wd, height: Hd, filter: 'grayscale(1) contrast(1.3) brightness(1.25)'}} />
			<div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${tint[0]}, ${tint[1]})`, mixBlendMode: 'multiply'}} />
			<div style={{position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${tint[0]}55, transparent 60%)`, mixBlendMode: 'screen'}} />
			{side !== undefined ? <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${0.95 - side * 0.95}) ${side * 60}%, rgba(0,0,0,0.92))`}} /> : null}
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.75))'}} />
		</div>
	);
};

// tag card like the reference's "TITLE CARD · ESCAPE VELOCITY"
const Tag: React.FC<{x: number; y: number; at: number; title: string; rows: [string, string][]; accent?: string; index?: string}> = ({x, y, at, title, rows, accent = C.red, index = '01'}) => {
	const f = useCurrentFrame();
	const p = tween(f, at, 26);
	if (f < at) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: 330, background: '#F2F0EA', borderRadius: 6, padding: '16px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transform: `translateY(${(1 - p) * 30}px) rotate(${(1 - p) * -3}deg)`, opacity: p}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<Mono size={13} color="#555">EL CLÁSICO / {index}</Mono>
				<span style={{background: accent, color: '#fff', fontFamily: mono, fontSize: 13, padding: '2px 6px'}}>MD10</span>
			</div>
			<div style={{fontFamily: inter, fontWeight: 800, fontSize: 30, color: '#111', marginTop: 8, letterSpacing: -0.5}}>{title}</div>
			<div style={{height: 1, background: '#bbb', margin: '10px 0'}} />
			{rows.map(([k, v], i) => (
				<div key={i} style={{display: 'flex', justifyContent: 'space-between', marginTop: 4}}>
					<Mono size={14} color="#666">{k}</Mono>
					<Mono size={14} color="#111">{v}</Mono>
				</div>
			))}
			<div style={{display: 'flex', gap: 2, marginTop: 14, height: 34}}>
				{Array.from({length: 46}).map((_, i) => (
					<div key={i} style={{width: rand(i, 7) > 0.6 ? 4 : 2, background: '#111', opacity: rand(i, 9) > 0.15 ? 1 : 0}} />
				))}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- persistent overlays
const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.14, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<filter id="grain">
				<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 24} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#grain)" />
		</svg>
	);
};

const HUD: React.FC = () => {
	const f = useCurrentFrame();
	const on = tween(f, 40, 40);
	const sec = Math.floor(f / 60);
	const fr = f % 60;
	const tc = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
	const ticker = '  FC BARCELONA  ·  REAL MADRID  ·  LALIGA MATCHDAY 10  ·  SUN 25.10.2026  ·  21:00 CET  ·  SPOTIFY CAMP NOU  ·  BARCELONA  ·';
	const fadeEnd = 1 - tween(f, 3480, 90, 0, 1, IN_OUT);
	return (
		<AbsoluteFill style={{opacity: on * fadeEnd, pointerEvents: 'none'}}>
			<Full>
				<Brackets x={36} y={36} w={1008} h={1848} len={46} color="rgba(244,242,238,0.45)" />
			</Full>
			<div style={{position: 'absolute', top: 62, left: 70}}>
				<Mono size={18} color={C.muted}>EL CLÁSICO // 26-27 // MD10</Mono>
			</div>
			<div style={{position: 'absolute', top: 62, right: 70, display: 'flex', gap: 14, alignItems: 'center'}}>
				<div style={{width: 12, height: 12, borderRadius: 6, background: C.red, opacity: Math.floor(f / 30) % 2 ? 1 : 0.25}} />
				<Mono size={18} color={C.muted}>REC {tc}</Mono>
			</div>
			<div style={{position: 'absolute', bottom: 54, left: 60, right: 60, overflow: 'hidden', height: 30, borderTop: `1px solid rgba(244,242,238,0.25)`}}>
				<div style={{position: 'absolute', top: 6, left: -((f * 1.4) % 1500), whiteSpace: 'nowrap'}}>
					<Mono size={16} color={C.muted}>
						{ticker}
						{ticker}
						{ticker}
					</Mono>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- shared scenery
const Fog: React.FC<{o?: number; tint?: string}> = ({o = 1, tint = '200,210,230'}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: o, pointerEvents: 'none'}}>
			{[0, 1, 2].map((i) => (
				<div key={i} style={{position: 'absolute', left: -300 + i * 300 + Math.sin(f / 140 + i) * 120, top: 900 + i * 220, width: 1200, height: 700, background: `radial-gradient(ellipse at center, rgba(${tint},0.10), transparent 70%)`}} />
			))}
		</AbsoluteFill>
	);
};

// stadium bowl drawn in light: tiers + pitch + floodlights that ignite one by one
const Stadium: React.FC<{lights: number; z: number; ty: number; pitch?: number}> = ({lights, z, ty, pitch = 1}) => {
	const cx = 540;
	const cy = 1080;
	const N = 14;
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateY(${ty}px) scale(${z})`, transformOrigin: '50% 56%'}}>
			<Full>
				<defs>
					<radialGradient id="flood">
						<stop offset="0%" stopColor="rgba(255,250,235,1)" />
						<stop offset="30%" stopColor="rgba(255,250,235,0.35)" />
						<stop offset="100%" stopColor="rgba(255,250,235,0)" />
					</radialGradient>
					<radialGradient id="turf" cx="50%" cy="50%" r="60%">
						<stop offset="0%" stopColor="#1f5a2c" />
						<stop offset="100%" stopColor="#06180b" />
					</radialGradient>
				</defs>
				{[0, 1, 2, 3].map((i) => (
					<ellipse key={i} cx={cx} cy={cy} rx={330 + i * 120} ry={120 + i * 52} fill="none" stroke="rgba(244,242,238,0.35)" strokeWidth={1.6} />
				))}
				{/* stand ribs */}
				{Array.from({length: 36}).map((_, i) => {
					const a = (i / 36) * Math.PI * 2;
					return <line key={i} x1={cx + Math.cos(a) * 330} y1={cy + Math.sin(a) * 120} x2={cx + Math.cos(a) * 690} y2={cy + Math.sin(a) * 276} stroke="rgba(244,242,238,0.12)" strokeWidth={1} />;
				})}
				<g opacity={pitch}>
					<polygon points={`${cx - 250},${cy - 70} ${cx + 250},${cy - 70} ${cx + 300},${cy + 80} ${cx - 300},${cy + 80}`} fill="url(#turf)" stroke="rgba(244,242,238,0.6)" strokeWidth={1.5} />
					<line x1={cx} y1={cy - 70} x2={cx} y2={cy + 80} stroke="rgba(244,242,238,0.5)" strokeWidth={1.2} />
					<ellipse cx={cx} cy={cy + 3} rx={46} ry={22} fill="none" stroke="rgba(244,242,238,0.5)" strokeWidth={1.2} />
				</g>
				{Array.from({length: N}).map((_, i) => {
					const a = (i / N) * Math.PI * 2 + 0.2;
					const x = cx + Math.cos(a) * 700;
					const y = cy + Math.sin(a) * 284 - 70;
					const on = Math.max(0, Math.min(1, lights * N - i));
					return (
						<g key={i}>
							<line x1={x} y1={y} x2={x} y2={y + 70} stroke="rgba(244,242,238,0.3)" strokeWidth={2} />
							<circle cx={x} cy={y} r={70 * on} fill="url(#flood)" />
							<circle cx={x} cy={y} r={6} fill={on > 0.5 ? '#FFF8E6' : '#333'} />
						</g>
					);
				})}
			</Full>
			<div style={{position: 'absolute', left: 0, right: 0, top: 820, height: 500, background: `radial-gradient(ellipse at 50% 60%, rgba(255,250,235,${0.16 * lights}), transparent 65%)`}} />
		</div>
	);
};

// ---------------------------------------------------------------- S1 · 0–6 s · before the storm
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const lights = tween(f, 90, 210, 0, 1, (x) => x);
	const z = interpolate(f, [30, 360], [0.55, 1.25], {...clamp, easing: IN_OUT});
	const ty = interpolate(f, [30, 360], [-260, 120], {...clamp, easing: IN_OUT});
	const on = tween(f, 30, 60);
	return (
		<AbsoluteFill style={{opacity: on}}>
			<Stadium lights={lights} z={z} ty={ty} />
			<Fog o={0.8 + 0.2 * lights} />
			<div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center'}}>
				<Scramble text="ONE CITY. TWO GIANTS." at={200} dur={50} size={46} />
			</div>
			<div style={{position: 'absolute', top: 590, width: '100%', textAlign: 'center', opacity: tween(f, 240, 30)}}>
				<Mono size={16} color={C.muted}>41.3809° N · 2.1228° E · SPOTIFY CAMP NOU</Mono>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S2 · 6–13 s · the war begins
const Grass: React.FC<{f: number}> = ({f}) => (
	<Full>
		{Array.from({length: 220}).map((_, i) => {
			const x = rand(i, 1) * 1080;
			const h = 320 + rand(i, 2) * 520;
			const sway = Math.sin(f / 40 + i) * 10;
			return <path key={i} d={`M${x} 1920 Q${x + sway} ${1920 - h / 2} ${x + sway * 2} ${1920 - h}`} stroke={`rgba(${60 + rand(i, 3) * 40},${130 + rand(i, 4) * 60},${70 + rand(i, 5) * 30},0.9)`} strokeWidth={3 + rand(i, 6) * 5} fill="none" />;
		})}
	</Full>
);

const Droplets: React.FC<{f: number; at: number}> = ({f, at}) => {
	const t = Math.max(0, f - at) * 0.35; // slow motion
	if (f < at) return null;
	return (
		<Full>
			{Array.from({length: 40}).map((_, i) => {
				const vx = (rand(i, 11) - 0.5) * 14;
				const vy = -6 - rand(i, 12) * 12;
				const x = 540 + vx * t;
				const y = 1560 + vy * t + 0.18 * t * t;
				const r = 6 + rand(i, 13) * 14;
				return <circle key={i} cx={x} cy={y} r={r} fill="rgba(220,235,255,0.85)" opacity={Math.max(0, 1 - t / 90)} />;
			})}
		</Full>
	);
};

const Tunnel: React.FC<{p: number; f: number}> = ({p, f}) => (
	<AbsoluteFill>
		<Full>
			{Array.from({length: 9}).map((_, i) => {
				const k = ((i + p * 3) % 9) / 9;
				const sc = 0.12 + k * k * 1.5;
				const w = 1080 * sc;
				const h = 1500 * sc;
				return <rect key={i} x={540 - w / 2} y={980 - h / 2} width={w} height={h} fill="none" stroke={`rgba(244,242,238,${0.08 + k * 0.3})`} strokeWidth={2} />;
			})}
			{/* light strips on the ceiling */}
			{[0, 1, 2, 3, 4].map((i) => {
				const k = ((i + p * 2.2) % 5) / 5;
				const sc = 0.15 + k * k * 1.4;
				return <rect key={i} x={540 - 120 * sc} y={980 - 750 * sc} width={240 * sc} height={8 + 14 * sc} fill={`rgba(255,250,235,${0.2 + k * 0.6})`} />;
			})}
		</Full>
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.10), rgba(0,0,0,0.9) 70%)'}} />
		{/* anonymous player silhouette walking away */}
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<g transform={`translate(540 ${1180 + Math.sin(f / 9) * 6}) scale(${1.2 - p * 0.3})`}>
				<circle cx={0} cy={-330} r={44} fill="#000" />
				<path d="M-70 -280 Q0 -300 70 -280 L95 -60 L60 -50 L50 0 L-50 0 L-60 -50 L-95 -60 Z" fill="#000" />
				<path d={`M-45 0 L${-40 + Math.sin(f / 9) * 20} 260 L${-5 + Math.sin(f / 9) * 20} 260 L0 20 L5 260 L${40 - Math.sin(f / 9) * 20} 260 L45 0 Z`} fill="#000" />
			</g>
		</svg>
	</AbsoluteFill>
);

const S2: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 6.0 s
	// 0–150: macro turf + droplets · 150–420: tunnel
	const tunnel = f >= 150;
	const crestFlash = (at: number, src: string) => (f >= at && f < at + 7 ? <Img src={staticFile(`clasico/crest/${src}`)} style={{position: 'absolute', left: 140, top: 560, width: 800, height: 800, objectFit: 'contain', clipPath: 'inset(20% 0 35% 0)', filter: 'brightness(1.4)', opacity: 0.9}} /> : null);
	return (
		<AbsoluteFill>
			{!tunnel ? (
				<AbsoluteFill style={{transform: `scale(${interpolate(f, [0, 150], [1.15, 1.25])})`}}>
					<AbsoluteFill style={{background: 'linear-gradient(180deg, #000 0%, #04110a 55%, #0b2a14 100%)'}} />
					<Grass f={f} />
					<Droplets f={f} at={20} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 1380, height: 300, background: 'radial-gradient(ellipse at 50% 70%, rgba(255,255,255,0.18), transparent 60%)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 500, background: 'radial-gradient(ellipse at 50% 60%, rgba(200,230,255,0.10), transparent 60%)'}} />
					<div style={{position: 'absolute', top: 1160, width: '100%', textAlign: 'center', opacity: tween(f, 30, 30)}}>
						<Mono size={16} color={C.muted}>TURF · 8°C · RAIN 92%</Mono>
					</div>
				</AbsoluteFill>
			) : (
				<Tunnel p={tween(f, 150, 270, 0, 1, (x) => x)} f={f} />
			)}
			{tunnel ? (
				<Full>
					<Brackets x={380} y={780} w={320} h={720} p={tween(f, 180, 20)} color={C.red} len={28} />
				</Full>
			) : null}
			{tunnel ? (
				<div style={{position: 'absolute', left: 380, top: 744, opacity: tween(f, 190, 15)}}>
					<Mono size={16} color={C.red}>SUBJECT // UNKNOWN · 0.97</Mono>
				</div>
			) : null}
			{crestFlash(300, 'fcb.svg')}
			{crestFlash(330, 'rma.svg')}
			<div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center'}}>
				{f >= 230 && f < 330 ? <Big size={170}>NO FEAR.</Big> : null}
				{f >= 345 ? <Big size={170} color={C.red}>NO MERCY.</Big> : null}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S3 · 13–22 s · Barça: art & rebellion
const Stripes: React.FC<{f: number; o: number}> = ({f, o}) => (
	<AbsoluteFill style={{opacity: o}}>
		<AbsoluteFill style={{background: `repeating-linear-gradient(90deg, ${C.fcbBlue} 0 120px, ${C.fcbGarnet} 120px 240px)`, transform: `translateX(${-(f * 0.6) % 240}px)`, filter: 'brightness(0.35) saturate(1.2)', width: 1400}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 20%, rgba(0,0,0,0.85) 75%)'}} />
	</AbsoluteFill>
);

const PlayerBeat: React.FC<{p: P; at: number; dur: number; tint: [string, string]; idx: string; club: string; freeze?: number}> = ({p, at, dur, tint, idx, club, freeze}) => {
	const f = useCurrentFrame();
	if (f < at || f >= at + dur) return null;
	const rv = tween(f, at, 18, 0, 1, WHIP);
	const fr = freeze !== undefined && f >= freeze && f < freeze + 14;
	return (
		<AbsoluteFill style={{transform: fr ? 'scale(1.06)' : undefined}}>
			<Portrait p={p} x={90} y={300} w={900} h={1240} from={at} tint={tint} reveal={rv} />
			<Full>
				<Brackets x={90} y={300} w={900} h={1240} p={tween(f, at + 6, 20)} color="rgba(244,242,238,0.7)" />
			</Full>
			<div style={{position: 'absolute', left: 110, top: 1420}}>
				<span style={{background: C.red, color: '#fff', fontFamily: mono, fontSize: 22, padding: '2px 10px', marginRight: 14}}>{idx}</span>
				<Scramble text={p.name} at={at + 10} dur={24} size={30} />
			</div>
			<div style={{position: 'absolute', left: 110, top: 1470}}>
				<Mono size={16} color={C.muted}>
					{club} · {p.role} · PHOTO {p.by}
				</Mono>
			</div>
			{fr ? <AbsoluteFill style={{background: 'rgba(255,255,255,0.12)'}} /> : null}
		</AbsoluteFill>
	);
};

const KitCard: React.FC<{src: string; at: number; title: string; rows: [string, string][]; accent: string; bg: string}> = ({src, at, title, rows, accent, bg}) => {
	const f = useCurrentFrame();
	if (f < at) return null;
	const p = tween(f, at, 30);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 140, top: 420, width: 800, height: 900, background: bg, overflow: 'hidden', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>
				<Img src={staticFile(`clasico/kit/${src}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(f, [at, at + 240], [1.05, 1.12], clamp)})`}} />
			</div>
			<Full>
				<Brackets x={140} y={420} w={800} h={900} p={p} color="rgba(244,242,238,0.8)" />
			</Full>
			<Tag x={640} y={1200} at={at + 18} title={title} rows={rows} accent={accent} index="KIT" />
		</AbsoluteFill>
	);
};

const S3: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 13.0 s
	const bar = tween(f, 450, 50, 0, 1, (x) => x);
	return (
		<AbsoluteFill>
			<Stripes f={f} o={tween(f, 0, 20)} />
			<PlayerBeat p={PL.yamal} at={0} dur={130} tint={[C.fcbBlue, '#0a0a1a']} idx="01" club="FC BARCELONA" freeze={95} />
			<PlayerBeat p={PL.pedri} at={130} dur={120} tint={[C.fcbGarnet, '#120208']} idx="02" club="FC BARCELONA" />
			<PlayerBeat p={PL.raphinha} at={250} dur={110} tint={[C.fcbBlue, C.fcbGarnet]} idx="03" club="FC BARCELONA" freeze={320} />
			{f >= 360 ? <KitCard src="fcb-golf.jpg" at={360} title="BARÇA × GOLF WANG" rows={[['SEASON', '26/27'], ['EDITION', 'LIMITED · 1,899'], ['CHEST', 'GOLF']]} accent={C.fcbGarnet} bg="#0b1220" /> : null}
			<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', opacity: tween(f, 400, 20)}}>
				{f >= 400 ? <Big size={130} color={C.fcbGold}>MÉS QUE UN CLUB.</Big> : null}
			</div>
			{f >= 440 ? (
				<div style={{position: 'absolute', left: 140, right: 140, top: 1360, height: 6, background: 'rgba(244,242,238,0.2)'}}>
					<div style={{width: `${bar * 100}%`, height: '100%', background: C.red}} />
				</div>
			) : null}
			{/* the ball flies at the lens and whites out */}
			{f >= 500 ? (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: 540, top: 960, width: 10, height: 10, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #bbb 60%, #555)', transform: `translate(-50%,-50%) scale(${interpolate(f, [500, 540], [2, 400], {...clamp, easing: (x) => x * x * x})})`}} />
					<AbsoluteFill style={{background: '#fff', opacity: tween(f, 528, 12, 0, 1, (x) => x)}} />
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S4 · 22–31 s · Madrid: kings' mentality
const GoldStreaks: React.FC<{f: number; o: number}> = ({f, o}) => (
	<Full style={{opacity: o}}>
		{Array.from({length: 22}).map((_, i) => {
			const y = rand(i, 21) * 1920;
			const sp = 6 + rand(i, 22) * 14;
			const x = ((f * sp + rand(i, 23) * 2000) % 2400) - 600;
			const len = 200 + rand(i, 24) * 500;
			return <line key={i} x1={x} y1={y} x2={x + len} y2={y - len * 0.35} stroke={C.rmaGold} strokeWidth={1 + rand(i, 25) * 2} opacity={0.25 + rand(i, 26) * 0.5} />;
		})}
	</Full>
);

const S4: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 22.0 s
	const whiteIn = 1 - tween(f, 0, 30, 0, 1, IN_OUT);
	const sideLight = tween(f, 20, 120, 0, 1, IN_OUT);
	const tintRM: [string, string] = ['#E9E2CF', '#141006'];
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #1a160c, #030304 70%)'}} />
			<GoldStreaks f={f} o={tween(f, 150, 40)} />
			{f < 170 ? (
				<AbsoluteFill>
					<Portrait p={PL.mbappe} x={90} y={300} w={900} h={1240} from={0} tint={tintRM} zoom={[1.0, 1.1]} side={sideLight} />
					<Full>
						<Brackets x={90} y={300} w={900} h={1240} p={tween(f, 60, 20)} color="rgba(212,175,55,0.8)" />
					</Full>
					<div style={{position: 'absolute', left: 110, top: 1420}}>
						<span style={{background: C.rmaGold, color: '#000', fontFamily: mono, fontSize: 22, padding: '2px 10px', marginRight: 14}}>04</span>
						<Scramble text={PL.mbappe.name} at={70} dur={24} size={30} />
					</div>
					<div style={{position: 'absolute', left: 110, top: 1470, opacity: tween(f, 80, 20)}}>
						<Mono size={16} color={C.muted}>REAL MADRID · ST · PHOTO SdHb</Mono>
					</div>
				</AbsoluteFill>
			) : null}
			<PlayerBeat p={PL.bellingham} at={170} dur={110} tint={tintRM} idx="05" club="REAL MADRID" />
			<PlayerBeat p={PL.valverde} at={280} dur={90} tint={tintRM} idx="06" club="REAL MADRID" freeze={340} />
			{f >= 370 ? <KitCard src="rma-home.jpg" at={370} title="REAL MADRID HOME" rows={[['SEASON', '26/27'], ['COLLAR', 'DARK GREEN'], ['STRIPES', 'PINK']]} accent={C.rmaGold} bg="#ECEAE4" /> : null}
			<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
				{f >= 420 ? <Big size={118} color={C.rmaGold}>HISTORY DOESN'T BOW.</Big> : null}
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: whiteIn}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S5 · 31–43 s · the face-off (VO)
const Crest: React.FC<{src: string; size: number; style?: React.CSSProperties}> = ({src, size, style}) => <Img src={staticFile(`clasico/crest/${src}`)} style={{width: size, height: size, objectFit: 'contain', ...style}} />;

const VOCaption: React.FC<{base: number}> = ({base}) => {
	const f = useCurrentFrame() + base; // global frame
	const cur = VO.filter((v) => f >= s(v.at) && f < s(v.at) + s(v.to - v.from) + 40);
	return (
		<>
			{cur.map((v, i) => {
				const a = s(v.at);
				const p = tween(f, a, 18);
				const out = tween(f, a + s(v.to - v.from) + 18, 22, 0, 1, IN_OUT);
				return (
					<div key={i} style={{position: 'absolute', left: 60, right: 60, top: 1580, textAlign: 'center', opacity: p * (1 - out), transform: `translateY(${(1 - p) * 20}px)`}}>
						<Scramble text={v.text} at={a - base} dur={14} size={54} />
					</div>
				);
			})}
		</>
	);
};

const S5: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 31.0 s
	const black = f < 50; // the sudden silence
	const split = tween(f, 50, 50, 0, 1, WHIP);
	const orbit = interpolate(f, [60, 420], [0, 1], clamp);
	const wide = tween(f, 430, 60, 0, 1, IN_OUT); // 38.2 s: two giants → wide stadium
	return (
		<AbsoluteFill>
			{black ? null : (
				<AbsoluteFill style={{opacity: 1 - wide}}>
					{/* left: Barça light · right: Madrid light */}
					<div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, transform: `translateX(${-(1 - split) * 540}px)`, background: `linear-gradient(180deg, ${C.fcbBlue}66, ${C.fcbGarnet}88)`}} />
					<div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, transform: `translateX(${(1 - split) * 540}px)`, background: 'linear-gradient(180deg, rgba(247,245,240,0.25), rgba(212,175,55,0.3))'}} />
					<div style={{position: 'absolute', left: 538, top: 0, width: 4, height: 1920 * split, background: C.ink}} />
					<Crest src="fcb.svg" size={360} style={{position: 'absolute', left: 90 + Math.sin(orbit * Math.PI) * 20, top: 760, transform: `scale(${0.9 + orbit * 0.1}) rotateY(${(1 - orbit) * 30}deg)`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7))'}} />
					<Crest src="rma.svg" size={360} style={{position: 'absolute', left: 630 - Math.sin(orbit * Math.PI) * 20, top: 760, transform: `scale(${0.9 + orbit * 0.1}) rotateY(${-(1 - orbit) * 30}deg)`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7))'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'space-around', opacity: tween(f, 120, 30)}}>
						<Mono size={18} color={C.ink}>FCB · HOME</Mono>
						<Mono size={18} color={C.ink}>RMA · AWAY</Mono>
					</div>
				</AbsoluteFill>
			)}
			{wide > 0 ? (
				<AbsoluteFill style={{opacity: wide}}>
					<Stadium lights={1} z={interpolate(f, [430, 720], [1.0, 1.35], clamp)} ty={60} />
					<Fog />
					{/* flags rising in the stands */}
					<Full>
						{Array.from({length: 18}).map((_, i) => {
							const x = 120 + i * 50;
							const rise = tween(f, 470 + i * 4, 40);
							const wave = Math.sin(f / 8 + i) * 8;
							const col = i % 2 ? C.fcbBlue : C.fcbGarnet;
							return <path key={i} d={`M${x} ${1420 - rise * 120} l0 120 M${x} ${1420 - rise * 120} q30 ${wave} 60 0 l0 40 q-30 ${-wave} -60 0z`} fill={col} stroke="rgba(244,242,238,0.5)" strokeWidth={1.5} opacity={rise} />;
						})}
					</Full>
					{/* the match ball settles at the centre spot */}
					<div style={{position: 'absolute', left: 540, top: 1110, width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #ccc 55%, #444)', transform: `translateY(${-(1 - tween(f, 600, 60, 0, 1, EXPO)) * 200}px) rotate(${f * 4}deg)`, opacity: tween(f, 600, 10)}} />
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S6 · 43–53 s · the explosion
const Shake: React.FC<{hits: number[]; children: React.ReactNode}> = ({hits, children}) => {
	const f = useCurrentFrame();
	let dx = 0;
	let dy = 0;
	for (const h of hits) {
		const k = f - h;
		if (k >= 0 && k < 14) {
			const a = (1 - k / 14) * 16;
			dx += (rand(k, h) - 0.5) * a;
			dy += (rand(k, h + 1) - 0.5) * a;
		}
	}
	return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px)`}}>{children}</AbsoluteFill>;
};

const S6: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 43.0 s
	// beats (local frames): flashes of players / crests, then counter and words
	const cuts: {at: number; kind: 'p' | 'c'; key: string; tint?: [string, string]}[] = [
		{at: 0, kind: 'p', key: 'yamal', tint: [C.fcbBlue, '#05050f']},
		{at: 30, kind: 'p', key: 'mbappe', tint: ['#E9E2CF', '#141006']},
		{at: 60, kind: 'c', key: 'fcb.svg'},
		{at: 156, kind: 'c', key: 'rma.svg'},
		{at: 240, kind: 'p', key: 'pedri', tint: [C.fcbGarnet, '#120208']},
		{at: 262, kind: 'p', key: 'bellingham', tint: ['#E9E2CF', '#141006']},
		{at: 284, kind: 'p', key: 'raphinha', tint: [C.fcbBlue, '#05050f']},
		{at: 306, kind: 'p', key: 'valverde', tint: ['#E9E2CF', '#141006']},
	];
	const active = [...cuts].reverse().find((c) => f >= c.at && f < 330);
	const minute = Math.round(interpolate(f, [276, 350], [0, 90], clamp));
	return (
		<Shake hits={[60, 156, 276, 360]}>
			<AbsoluteFill style={{background: '#000'}} />
			{active && active.kind === 'p' ? <Portrait p={PL[active.key]} x={0} y={0} w={1080} h={1920} from={active.at} tint={active.tint!} zoom={[1.15, 1.3]} /> : null}
			{active && active.kind === 'c' ? (
				<AbsoluteFill style={{background: active.key === 'fcb.svg' ? `linear-gradient(90deg, ${C.fcbBlue}, ${C.fcbGarnet})` : 'linear-gradient(180deg, #f3f0e8, #c9b886)'}}>
					<Crest src={active.key} size={620} style={{position: 'absolute', left: 230, top: 600, transform: `scale(${1.25 - 0.25 * pop(f, active.at, 12)})`}} />
					<div style={{position: 'absolute', top: 1380, width: '100%', textAlign: 'center'}}>
						<Big size={150} color={active.key === 'fcb.svg' ? C.fcbGold : '#111'}>{active.key === 'fcb.svg' ? 'BARCELONA' : 'REAL MADRID'}</Big>
					</div>
				</AbsoluteFill>
			) : null}
			{/* 47.6 s "ninety minutes": the match clock runs 0 → 90 */}
			{f >= 276 && f < 420 ? (
				<AbsoluteFill style={{background: f >= 330 ? '#000' : 'transparent'}}>
					<div style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
						<Big size={420} color={f >= 340 ? C.red : C.ink}>{`${minute}'`}</Big>
					</div>
					<div style={{position: 'absolute', top: 1150, width: '100%', textAlign: 'center'}}>
						<Scramble text="90 MINUTES." at={290} dur={18} size={60} font={display} />
					</div>
				</AbsoluteFill>
			) : null}
			{/* 49 s "eternal pride" */}
			{f >= 360 && f < 492 ? (
				<AbsoluteFill style={{background: '#000'}}>
					<div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
						<Big size={200}>90 MINUTES.</Big>
						<Big size={200} color={C.rmaGold} style={{opacity: tween(f, 372, 14)}}>
							ETERNAL PRIDE.
						</Big>
					</div>
				</AbsoluteFill>
			) : null}
			{/* 51.2 s "this is not just football" — sparks */}
			{f >= 492 ? (
				<AbsoluteFill style={{background: '#000'}}>
					<Full>
						{Array.from({length: 60}).map((_, i) => {
							const t = f - 492;
							const a = rand(i, 41) * Math.PI * 2;
							const v = 4 + rand(i, 42) * 10;
							return <circle key={i} cx={540 + Math.cos(a) * v * t} cy={960 + Math.sin(a) * v * t + 0.05 * t * t} r={2 + rand(i, 43) * 3} fill={i % 3 ? C.rmaGold : C.fcbGarnet} opacity={Math.max(0, 1 - t / 80)} />;
						})}
					</Full>
					<div style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center'}}>
						<Big size={120}>THIS IS NOT</Big>
						<Big size={120}>JUST FOOTBALL.</Big>
					</div>
				</AbsoluteFill>
			) : null}
			{[60, 156, 276, 360].map((h) => (f >= h && f < h + 6 ? <AbsoluteFill key={h} style={{background: '#fff', opacity: 1 - (f - h) / 6}} /> : null))}
		</Shake>
	);
};

// ---------------------------------------------------------------- S7 · 53–60 s · the title
const Metal: React.FC<{children: React.ReactNode; size: number; sweep: number}> = ({children, size, sweep}) => (
	<div
		style={{
			fontFamily: display,
			fontSize: size,
			lineHeight: 1.3,
			paddingTop: size * 0.12,
			letterSpacing: size * 0.01,
			backgroundImage: `linear-gradient(100deg, #6d6450 0%, #e9e2cf ${20 + sweep * 60}%, #fffaf0 ${25 + sweep * 60}%, #8a7a52 ${32 + sweep * 60}%, #3b3426 100%)`,
			WebkitBackgroundClip: 'text',
			backgroundClip: 'text',
			color: 'transparent',
			filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.8))',
		}}
	>
		{children}
	</div>
);

const S7: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = 53.0 s
	const inL = tween(f, 10, 50, 0, 1, EXPO);
	const inR = tween(f, 16, 50, 0, 1, EXPO);
	const HIT = s(57) - s(53); // title on the musical hit
	const flash = f >= HIT && f < HIT + 8 ? 1 - (f - HIT) / 8 : 0;
	const lightsOut = tween(f, 360, 60, 0, 1, IN_OUT);
	return (
		<AbsoluteFill style={{opacity: 1 - lightsOut * 0.85}}>
			<Stadium lights={1 - lightsOut} z={1.5} ty={260} pitch={0.6} />
			{/* frozen ball at the centre */}
			<div style={{position: 'absolute', left: 540, top: 1240, width: 80, height: 80, marginLeft: -40, marginTop: -40, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #ccc 55%, #444)', opacity: 1 - tween(f, HIT - 10, 20)}} />
			<Crest src="fcb.svg" size={300} style={{position: 'absolute', left: interpolate(inL, [0, 1], [-400, 150]), top: 480}} />
			<Crest src="rma.svg" size={300} style={{position: 'absolute', left: interpolate(inR, [0, 1], [1180, 630]), top: 480}} />
			<div style={{position: 'absolute', left: 540, top: 630, width: 260, height: 260, marginLeft: -130, marginTop: -130, background: 'radial-gradient(circle, rgba(255,250,235,0.9), transparent 65%)', opacity: tween(f, 50, 10) * (1 - tween(f, 70, 40))}} />
			{f >= HIT ? (
				<div style={{position: 'absolute', top: 900, width: '100%', textAlign: 'center', transform: `scale(${1.3 - 0.3 * pop(f, HIT, 13)})`}}>
					<Metal size={210} sweep={tween(f, HIT, 120, 0, 1, IN_OUT)}>EL CLÁSICO</Metal>
				</div>
			) : null}
			<div style={{position: 'absolute', top: 1140, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center'}}>
				{f >= HIT + 20 ? <Scramble text="25 OCTOBER 2026" at={HIT + 20} dur={20} size={58} font={display} color={C.ink} /> : null}
				{f >= HIT + 36 ? <Scramble text="SPOTIFY CAMP NOU · BARCELONA" at={HIT + 36} dur={20} size={26} /> : null}
				{f >= HIT + 56 ? <Scramble text="TWO GIANTS. ONE BATTLE." at={HIT + 56} dur={20} size={30} color={C.red} /> : null}
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- audio
// music: Another Side — duck to silence at 31 s (the script's sudden silence), dip under the VO
const musicVol = (f: number) => {
	const fadeIn = interpolate(f, [0, 30, 200], [0, 0.25, 0.6], clamp);
	const silence = interpolate(f, [s(30.9), s(31.0), s(31.8), s(32.3)], [1, 0, 0, 1], clamp);
	const duck = interpolate(f, [s(31.8), s(32.0), s(42.6), s(43.0)], [1, 0.55, 0.55, 1], clamp);
	const duck2 = interpolate(f, [s(43.6), s(44.0), s(56.6), s(57.0)], [1, 0.7, 0.7, 1], clamp);
	const end = interpolate(f, [s(58.5), s(60)], [1, 0], clamp);
	return fadeIn * silence * duck * duck2 * end;
};

const Sfx: React.FC<{at: number; src: string; v?: number}> = ({at, src, v = 0.4}) => (
	<Sequence from={Math.round(at)} layout="none">
		<Audio src={staticFile(`clasico/sfx/${src}`)} volume={v} />
	</Sequence>
);

// ---------------------------------------------------------------- timeline
export const Clasico: React.FC = () => {
	const f = useCurrentFrame();
	const blackStart = f < 30;
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			{blackStart ? null : (
				<>
					<Sequence from={0} durationInFrames={360}>
						<S1 />
					</Sequence>
					<Sequence from={360} durationInFrames={420}>
						<S2 />
					</Sequence>
					<Sequence from={780} durationInFrames={540}>
						<S3 />
					</Sequence>
					<Sequence from={1320} durationInFrames={540}>
						<S4 />
					</Sequence>
					<Sequence from={1860} durationInFrames={720}>
						<S5 />
					</Sequence>
					<Sequence from={2580} durationInFrames={600}>
						<S6 />
					</Sequence>
					<Sequence from={3180} durationInFrames={420}>
						<S7 />
					</Sequence>
				</>
			)}
			{/* whip pan streaks into Barça (12.8–13.1 s) */}
			{f >= 760 && f < 800 ? (
				<AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.0) 0 40px, rgba(255,255,255,0.18) 40px 44px)`, transform: `translateX(${interpolate(f, [760, 800], [-1080, 1080], {...clamp, easing: WHIP})}px)`}} />
			) : null}
			{f >= 1860 && f < 2580 ? (
				<Sequence from={1860} durationInFrames={720} layout="none">
					<VOCaption base={1860} />
				</Sequence>
			) : null}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65))', pointerEvents: 'none'}} />
			<Grain />
			<HUD />

			<Audio src={staticFile('clasico/music.mp3')} volume={musicVol} />
			{VO.map((v, i) => (
				<Sequence key={i} from={s(v.at)} durationInFrames={s(v.to - v.from) + 2} layout="none">
					<Audio src={staticFile('clasico/vo/vo.wav')} startFrom={s(v.from)} endAt={s(v.to)} volume={1} />
				</Sequence>
			))}
			<Sfx at={20} src="wind.wav" v={0.35} />
			<Sfx at={60} src="heartbeat.wav" v={0.6} />
			<Sfx at={348} src="boom.wav" v={0.5} />
			<Sfx at={380} src="crowd.wav" v={0.18} />
			<Sfx at={740} src="whoosh.wav" v={0.35} />
			<Sfx at={1290} src="riser.wav" v={0.3} />
			<Sfx at={1830} src="boom.wav" v={0.45} />
			<Sfx at={s(43) + 60} src="hit.wav" v={0.45} />
			<Sfx at={s(43) + 156} src="hit.wav" v={0.4} />
			<Sfx at={s(55.2)} src="riser.wav" v={0.25} />
			<Sfx at={s(57)} src="boom.wav" v={0.5} />
			<Sfx at={s(58)} src="crowd.wav" v={0.15} />
		</AbsoluteFill>
	);
};
