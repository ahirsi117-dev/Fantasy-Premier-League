// EL CLÁSICO — THE WORLD STOPS · 32 s · 9:16 · 1080×1920 @ 60 fps
// Script: the user's 7-part trailer. Motion language from "Look 00" (whatships.com/videos/look-00):
// HUD brackets, mono labels that decode, tag cards with barcodes, red index numbers,
// condensed heavy type, tracking boxes, grain. Music: "Achilles" (Kevin MacLeod, CC BY 4.0) — opens on its 0:27 kick and re-cuts to it for the title.
// VO: the user's file, cut into its 13 phrases, running from the first second.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, EXPO, IN_OUT, WHIP, display, inter, mono, pop, rand, tween} from './kit/theme';

export const CLASICO_TOTAL = 1920; // 32 s
const s = (sec: number) => Math.round(sec * 60);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------------------------------------------------------------- VO placement (file phrase → video second)
// The voice runs from the first second; `cap` = also show the line as a caption (off where the scene already spells it)
const VO: {from: number; to: number; at: number; text: string; cap: boolean}[] = [
	{from: 0.15, to: 0.95, at: 0.4, text: 'FOR SOME,', cap: true},
	{from: 1.3, to: 1.98, at: 1.4, text: "IT'S A GAME.", cap: true},
	{from: 2.82, to: 3.5, at: 2.8, text: 'FOR THEM…', cap: true},
	{from: 4.11, to: 5.2, at: 3.9, text: "IT'S EVERYTHING.", cap: true},
	{from: 6.23, to: 7.18, at: 5.6, text: 'TWO GIANTS.', cap: true},
	{from: 7.5, to: 8.58, at: 6.9, text: 'TWO LEGACIES.', cap: true},
	{from: 9.07, to: 10.5, at: 8.3, text: 'ONE BATTLEFIELD.', cap: true},
	{from: 11.24, to: 12.2, at: 10.4, text: 'BARCELONA.', cap: false},
	{from: 12.5, to: 13.5, at: 15.3, text: 'REAL MADRID.', cap: false},
	{from: 14.36, to: 15.46, at: 20.4, text: 'NINETY MINUTES.', cap: false},
	{from: 15.91, to: 17.16, at: 21.9, text: 'ETERNAL PRIDE.', cap: false},
	{from: 17.72, to: 19.8, at: 23.2, text: 'THIS IS NOT JUST FOOTBALL.', cap: false},
	{from: 20.18, to: 22.2, at: 25.05, text: 'THIS IS EL CLÁSICO.', cap: false},
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
	const on = tween(f, 0, 20);
	const sec = Math.floor(f / 60);
	const fr = f % 60;
	const tc = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
	const ticker = '  FC BARCELONA  ·  REAL MADRID  ·  LALIGA MATCHDAY 10  ·  SUN 25.10.2026  ·  21:00 CET  ·  SPOTIFY CAMP NOU  ·  BARCELONA  ·';
	const fadeEnd = 1 - tween(f, 1830, 80, 0, 1, IN_OUT);
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


const Crest: React.FC<{src: string; size: number; style?: React.CSSProperties}> = ({src, size, style}) => <Img src={staticFile(`clasico/crest/${src}`)} style={{width: size, height: size, objectFit: 'contain', ...style}} />;


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


const Sfx: React.FC<{at: number; src: string; v?: number}> = ({at, src, v = 0.4}) => (
	<Sequence from={Math.round(at)} layout="none">
		<Audio src={staticFile(`clasico/sfx/${src}`)} volume={v} />
	</Sequence>
);

// ---------------------------------------------------------------- captions for the VO lines that the scene doesn't already spell
const VOCaption: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<>
			{VO.filter((v) => v.cap).map((v, i) => {
				const a = s(v.at);
				const end = a + s(v.to - v.from) + 24;
				if (f < a || f > end + 20) return null;
				const p = tween(f, a, 12);
				const out = tween(f, end, 18, 0, 1, IN_OUT);
				return (
					<div key={i} style={{position: 'absolute', left: 60, right: 60, top: 1560, textAlign: 'center', opacity: p * (1 - out), transform: `translateY(${(1 - p) * 20}px)`}}>
						<span style={{fontFamily: mono, fontSize: 58, color: C.ink, letterSpacing: 58 * 0.06, whiteSpace: 'pre'}}>{v.text}</span>
					</div>
				);
			})}
		</>
	);
};

// ---------------------------------------------------------------- A · 0–5.4 s · the stadium wakes (VO: for some / it's a game / for them / it's everything)
const A: React.FC = () => {
	const f = useCurrentFrame();
	const lights = tween(f, 0, 230, 0.15, 1, (x) => x);
	const z = interpolate(f, [0, 324], [0.7, 1.3], {...clamp, easing: IN_OUT});
	const ty = interpolate(f, [0, 324], [-180, 120], {...clamp, easing: IN_OUT});
	const pulse = 1 + 0.04 * Math.max(0, Math.sin((f / 72) * Math.PI * 2)) ** 8;
	return (
		<AbsoluteFill style={{transform: `scale(${pulse})`}}>
			<Stadium lights={lights} z={z} ty={ty} />
			<Fog o={0.8 + 0.2 * lights} />
			<div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center'}}>
				<Big size={150}>EL CLÁSICO</Big>
			</div>
			<div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center'}}>
				<Scramble text="FC BARCELONA × REAL MADRID · 25.10.2026" at={-60} dur={40} size={24} color={C.muted} />
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- B · 5.4–8.1 s · two giants, two legacies
const B: React.FC = () => {
	const f = useCurrentFrame();
	const split = tween(f, 0, 30, 0, 1, WHIP);
	const orbit = interpolate(f, [0, 162], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, transform: `translateX(${-(1 - split) * 540}px)`, background: `linear-gradient(180deg, ${C.fcbBlue}66, ${C.fcbGarnet}88)`}} />
			<div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, transform: `translateX(${(1 - split) * 540}px)`, background: 'linear-gradient(180deg, rgba(247,245,240,0.25), rgba(212,175,55,0.3))'}} />
			<div style={{position: 'absolute', left: 538, top: 0, width: 4, height: 1920 * split, background: C.ink}} />
			<Crest src="fcb.svg" size={360} style={{position: 'absolute', left: 90, top: 760, transform: `scale(${(0.9 + orbit * 0.12) * pop(f, 8, 13)})`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7))'}} />
			<Crest src="rma.svg" size={360} style={{position: 'absolute', left: 630, top: 760, transform: `scale(${(0.9 + orbit * 0.12) * pop(f, 16, 13)})`, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7))'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'space-around', opacity: tween(f, 20, 20)}}>
				<Mono size={20}>FC BARCELONA · EST. 1899</Mono>
				<Mono size={20}>REAL MADRID · EST. 1902</Mono>
			</div>
			{/* "two legacies": founding years count in */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'space-around', opacity: tween(f, 78, 16)}}>
				<Big size={110} color={C.fcbGold}>1899</Big>
				<Big size={110} color={C.rmaGold}>1902</Big>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- C · 8.1–10.3 s · one battlefield
const Cc: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity: tween(f, 0, 14)}}>
			<Stadium lights={1} z={interpolate(f, [0, 132], [1.0, 1.4], clamp)} ty={60} />
			<Fog />
			<Full>
				{Array.from({length: 18}).map((_, i) => {
					const x = 120 + i * 50;
					const rise = tween(f, 6 + i * 3, 30);
					const wave = Math.sin(f / 8 + i) * 8;
					const col = i % 2 ? C.fcbBlue : C.fcbGarnet;
					return <path key={i} d={`M${x} ${1420 - rise * 120} l0 120 M${x} ${1420 - rise * 120} q30 ${wave} 60 0 l0 40 q-30 ${-wave} -60 0z`} fill={col} stroke="rgba(244,242,238,0.5)" strokeWidth={1.5} opacity={rise} />;
				})}
			</Full>
			<div style={{position: 'absolute', left: 540, top: 1110, width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, #ccc 55%, #444)', transform: `translateY(${-(1 - tween(f, 40, 50, 0, 1, EXPO)) * 200}px) rotate(${f * 4}deg)`, opacity: tween(f, 40, 8)}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- crest slam (club name spoken)
const Slam: React.FC<{crest: string; name: string; bg: string; color: string}> = ({crest, name, bg, color}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: bg}}>
			<Crest src={crest} size={620} style={{position: 'absolute', left: 230, top: 560, transform: `scale(${1.3 - 0.3 * pop(f, 0, 12)})`}} />
			<div style={{position: 'absolute', top: 1320, width: '100%', textAlign: 'center'}}>
				<Big size={160} color={color}>{name}</Big>
			</div>
			{f < 6 ? <AbsoluteFill style={{background: '#fff', opacity: 1 - f / 6}} /> : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- D · 10.3–15.2 s · Barcelona
const D: React.FC = () => {
	const f = useCurrentFrame();
	const tint: [string, string] = [C.fcbBlue, '#0a0a1a'];
	return (
		<AbsoluteFill>
			{f < 54 ? (
				<Slam crest="fcb.svg" name="BARCELONA" bg={`linear-gradient(90deg, ${C.fcbBlue}, ${C.fcbGarnet})`} color={C.fcbGold} />
			) : (
				<AbsoluteFill>
					<Stripes f={f} o={1} />
					<PlayerBeat p={PL.yamal} at={54} dur={72} tint={tint} idx="01" club="FC BARCELONA" freeze={100} />
					<PlayerBeat p={PL.pedri} at={126} dur={60} tint={[C.fcbGarnet, '#120208']} idx="02" club="FC BARCELONA" />
					<PlayerBeat p={PL.raphinha} at={186} dur={54} tint={[C.fcbBlue, C.fcbGarnet]} idx="03" club="FC BARCELONA" />
					{f >= 240 ? <KitCard src="fcb-golf.jpg" at={240} title="BARÇA × GOLF WANG" rows={[['SEASON', '26/27'], ['EDITION', 'LIMITED · 1,899'], ['CHEST', 'GOLF']]} accent={C.fcbGarnet} bg="#0b1220" /> : null}
					<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', opacity: tween(f, 60, 14)}}>
						<Big size={124} color={C.fcbGold}>MÉS QUE UN CLUB.</Big>
					</div>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- E · 15.2–20.2 s · Real Madrid
const E: React.FC = () => {
	const f = useCurrentFrame();
	const tintRM: [string, string] = ['#E9E2CF', '#141006'];
	return (
		<AbsoluteFill>
			{f < 54 ? (
				<Slam crest="rma.svg" name="REAL MADRID" bg="linear-gradient(180deg, #f3f0e8, #c9b886)" color="#111" />
			) : (
				<AbsoluteFill>
					<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #1a160c, #030304 70%)'}} />
					<GoldStreaks f={f} o={1} />
					{f < 126 ? (
						<AbsoluteFill>
							<Portrait p={PL.mbappe} x={90} y={300} w={900} h={1240} from={54} tint={tintRM} zoom={[1.0, 1.1]} side={tween(f, 54, 50, 0.2, 1, IN_OUT)} />
							<Full>
								<Brackets x={90} y={300} w={900} h={1240} p={tween(f, 60, 16)} color="rgba(212,175,55,0.8)" />
							</Full>
							<div style={{position: 'absolute', left: 110, top: 1420}}>
								<span style={{background: C.rmaGold, color: '#000', fontFamily: mono, fontSize: 22, padding: '2px 10px', marginRight: 14}}>04</span>
								<Scramble text={PL.mbappe.name} at={64} dur={20} size={30} />
							</div>
							<div style={{position: 'absolute', left: 110, top: 1470, opacity: tween(f, 70, 16)}}>
								<Mono size={16} color={C.muted}>REAL MADRID · ST · PHOTO SdHb</Mono>
							</div>
						</AbsoluteFill>
					) : null}
					<PlayerBeat p={PL.bellingham} at={126} dur={60} tint={tintRM} idx="05" club="REAL MADRID" />
					<PlayerBeat p={PL.valverde} at={186} dur={54} tint={tintRM} idx="06" club="REAL MADRID" freeze={220} />
					{f >= 240 ? <KitCard src="rma-home.jpg" at={240} title="REAL MADRID HOME" rows={[['SEASON', '26/27'], ['COLLAR', 'DARK GREEN'], ['STRIPES', 'PINK']]} accent={C.rmaGold} bg="#ECEAE4" /> : null}
					<div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', opacity: tween(f, 60, 14)}}>
						<Big size={112} color={C.rmaGold}>HISTORY DOESN'T BOW.</Big>
					</div>
				</AbsoluteFill>
			)}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- F · 20.2–23.2 s · ninety minutes, eternal pride
const F_: React.FC = () => {
	const f = useCurrentFrame();
	const minute = Math.round(interpolate(f, [8, 80], [0, 90], {...clamp, easing: IN_OUT}));
	const pride = f >= 102;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Full>
				<circle cx={540} cy={840} r={300} fill="none" stroke="rgba(244,242,238,0.15)" strokeWidth={6} />
				<circle cx={540} cy={840} r={300} fill="none" stroke={C.red} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - minute / 90} transform="rotate(-90 540 840)" />
			</Full>
			<div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
				<Big size={360} color={minute === 90 ? C.red : C.ink}>{`${minute}'`}</Big>
			</div>
			<div style={{position: 'absolute', top: 1220, width: '100%', textAlign: 'center'}}>
				<Big size={150}>90 MINUTES.</Big>
				{pride ? (
					<Big size={150} color={C.rmaGold} style={{opacity: tween(f, 102, 12)}}>
						ETERNAL PRIDE.
					</Big>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- G · 23.2–25.0 s · this is not just football (rapid flashes)
const G: React.FC = () => {
	const f = useCurrentFrame();
	const order: [string, [string, string]][] = [
		['yamal', [C.fcbBlue, '#05050f']],
		['mbappe', ['#E9E2CF', '#141006']],
		['pedri', [C.fcbGarnet, '#120208']],
		['bellingham', ['#E9E2CF', '#141006']],
		['raphinha', [C.fcbBlue, '#05050f']],
		['valverde', ['#E9E2CF', '#141006']],
	];
	const k = Math.min(order.length - 1, Math.floor(f / 18));
	const [key, tint] = order[k];
	return (
		<Shake hits={[0, 36, 72]}>
			<Portrait p={PL[key]} x={0} y={0} w={1080} h={1920} from={k * 18} tint={tint} zoom={[1.2, 1.3]} />
			<AbsoluteFill style={{background: 'rgba(0,0,0,0.45)'}} />
			<div style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center'}}>
				<Big size={130}>THIS IS NOT</Big>
				<Big size={130} style={{opacity: tween(f, 40, 10)}}>
					JUST FOOTBALL.
				</Big>
			</div>
		</Shake>
	);
};

// ---------------------------------------------------------------- H · 25.0–32 s · the title, on the music's kick
const H: React.FC = () => {
	const f = useCurrentFrame();
	const inL = tween(f, 0, 30, 0, 1, EXPO);
	const inR = tween(f, 3, 30, 0, 1, EXPO);
	const flash = f < 8 ? 1 - f / 8 : 0;
	const lightsOut = tween(f, 340, 70, 0, 1, IN_OUT);
	return (
		<AbsoluteFill style={{opacity: 1 - lightsOut * 0.9}}>
			<Stadium lights={1 - lightsOut} z={1.5} ty={260} pitch={0.6} />
			<Crest src="fcb.svg" size={300} style={{position: 'absolute', left: interpolate(inL, [0, 1], [-400, 150]), top: 480}} />
			<Crest src="rma.svg" size={300} style={{position: 'absolute', left: interpolate(inR, [0, 1], [1180, 630]), top: 480}} />
			<div style={{position: 'absolute', top: 880, width: '100%', textAlign: 'center', transform: `scale(${1.3 - 0.3 * pop(f, 0, 13)})`}}>
				<Metal size={210} sweep={tween(f, 0, 140, 0, 1, IN_OUT)}>EL CLÁSICO</Metal>
			</div>
			<div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center'}}>
				{f >= 30 ? <Scramble text="25 OCTOBER 2026" at={30} dur={20} size={58} font={display} color={C.ink} /> : null}
				{f >= 46 ? <Scramble text="SPOTIFY CAMP NOU · 21:00 CET" at={46} dur={20} size={26} /> : null}
				{f >= 66 ? <Scramble text="TWO GIANTS. ONE BATTLE." at={66} dur={20} size={30} color={C.red} /> : null}
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- audio
// music: "Achilles" from its big kick (0:27) so the video opens at full energy;
// re-cut back to the same kick just before the title so "EL CLÁSICO" lands on it.
const OPEN_FROM = 26.6; // kick lands at ~0.4 s
const TITLE_CUT = 24.95; // second pass starts here…
const TITLE_FROM = 26.9; // …so the kick lands at ~25.05 s
const openVol = (f: number) => interpolate(f, [0, 6, s(24.55), s(TITLE_CUT)], [0, 0.5, 0.5, 0], clamp);
const titleVol = (f: number) => interpolate(f, [0, 3, s(30.6) - s(TITLE_CUT), s(32) - s(TITLE_CUT)], [0, 0.8, 0.8, 0], clamp);

// ---------------------------------------------------------------- timeline
const CUTS: [number, number, React.FC][] = [
	[0, 5.4, A],
	[5.4, 8.1, B],
	[8.1, 10.3, Cc],
	[10.3, 15.2, D],
	[15.2, 20.2, E],
	[20.2, 23.2, F_],
	[23.2, 25.0, G],
	[25.0, 32, H],
];

export const Clasico: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			{CUTS.map(([a, b, Scene], i) => (
				<Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
					<Scene />
				</Sequence>
			))}
			{/* whip streak between the giants and the battlefield */}
			{f >= s(8.0) && f < s(8.25) ? (
				<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0) 0 40px, rgba(255,255,255,0.18) 40px 44px)', transform: `translateX(${interpolate(f, [s(8.0), s(8.25)], [-1080, 1080], {...clamp, easing: WHIP})}px)`}} />
			) : null}
			<VOCaption />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65))', pointerEvents: 'none'}} />
			<Grain />
			<HUD />

			<Sequence from={0} durationInFrames={s(TITLE_CUT)} layout="none">
				<Audio src={staticFile('clasico/music.mp3')} startFrom={s(OPEN_FROM)} volume={openVol} />
			</Sequence>
			<Sequence from={s(TITLE_CUT)} layout="none">
				<Audio src={staticFile('clasico/music.mp3')} startFrom={s(TITLE_FROM)} volume={titleVol} />
			</Sequence>
			{VO.map((v, i) => (
				<Sequence key={i} from={s(v.at)} durationInFrames={s(v.to - v.from) + 2} layout="none">
					<Audio src={staticFile('clasico/vo/vo.wav')} startFrom={s(v.from)} endAt={s(v.to)} volume={1} />
				</Sequence>
			))}
			<Sfx at={s(5.3)} src="whoosh.wav" v={0.3} />
			<Sfx at={s(10.3)} src="boom.wav" v={0.4} />
			<Sfx at={s(15.2)} src="hit.wav" v={0.4} />
			<Sfx at={s(23.0)} src="riser.wav" v={0.25} />
			<Sfx at={s(25.6)} src="crowd.wav" v={0.14} />
		</AbsoluteFill>
	);
};
