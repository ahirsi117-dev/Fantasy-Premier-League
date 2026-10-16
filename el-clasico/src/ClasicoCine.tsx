// EL CLÁSICO — cinematic cut · 32 s · 9:16 · 1080×1920 @ 60 fps
// Look follows the user's reference trailer: full-frame night city / stadium imagery in a teal–orange
// grade, small wide-tracked titles whose letters appear one by one, white flashes and blur whips
// between shots, short black gaps. Music: the user's "SOUND_DRAMATIC" track from 0:15, so its
// silence (0:38) falls under "this is not just football" and its hit (0:40) lands on the title.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, IN_OUT, michroma, orbitron, rand, tween} from './kit/theme';

export const CINE_TOTAL = 1920;
const s = (sec: number) => Math.round(sec * 60);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// the user's VO, phrase by phrase (file seconds → video second)
const VO: {from: number; to: number; at: number}[] = [
	{from: 0.15, to: 0.95, at: 0.4},
	{from: 1.3, to: 1.98, at: 1.4},
	{from: 2.82, to: 3.5, at: 2.8},
	{from: 4.11, to: 5.2, at: 3.9},
	{from: 6.23, to: 7.18, at: 5.6},
	{from: 7.5, to: 8.58, at: 6.9},
	{from: 9.07, to: 10.5, at: 8.3},
	{from: 11.24, to: 12.2, at: 10.4},
	{from: 12.5, to: 13.5, at: 15.3},
	{from: 14.36, to: 15.46, at: 20.4},
	{from: 15.91, to: 17.16, at: 21.9},
	{from: 17.72, to: 19.8, at: 23.2},
	{from: 20.18, to: 22.2, at: 25.05},
];

// ---------------------------------------------------------------- grade + text
const Grade: React.FC<{warm?: number}> = ({warm = 0.35}) => (
	<>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #0c3a44 0%, #10262f 55%, #0b1a20 100%)', mixBlendMode: 'soft-light', opacity: 0.95}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 85%, rgba(255,140,60,0.9), transparent 60%)', mixBlendMode: 'overlay', opacity: warm}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.8))'}} />
	</>
);

// a full-frame still that behaves like footage: slow push + drift, graded
const Shot: React.FC<{src: string; len: number; pos?: string; zoom?: [number, number]; pan?: [number, number]; warm?: number; tilt?: [number, number]}> = ({src, len, pos = '50% 50%', zoom = [1.08, 1.2], pan = [0, 0], warm, tilt = [0, 0]}) => {
	const f = useCurrentFrame();
	const t = interpolate(f, [0, len], [0, 1], clamp);
	const z = zoom[0] + (zoom[1] - zoom[0]) * t;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<Img
				src={staticFile(`clasico/${src}`)}
				style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${z}) translate(${pan[0] + (pan[1] - pan[0]) * t}px, ${tilt[0] + (tilt[1] - tilt[0]) * t}px)`, filter: 'contrast(1.18) saturate(0.75) brightness(0.82)'}}
			/>
			<Grade warm={warm} />
		</AbsoluteFill>
	);
};

// player portrait framed on the face, full frame
type P = {src: string; iw: number; ih: number; fx: number; fy: number; cw: number; name: string};
const PL: Record<string, P> = {
	yamal: {src: 'yamal.jpg', iw: 2228, ih: 3403, fx: 0.62, fy: 0.195, cw: 0.2, name: 'LAMINE YAMAL'},
	pedri: {src: 'pedri.jpg', iw: 3333, ih: 5000, fx: 0.47, fy: 0.27, cw: 0.3, name: 'PEDRI'},
	raphinha: {src: 'raphinha.jpg', iw: 3333, ih: 5000, fx: 0.54, fy: 0.25, cw: 0.24, name: 'RAPHINHA'},
	mbappe: {src: 'mbappe.jpeg', iw: 543, ih: 883, fx: 0.55, fy: 0.135, cw: 0.22, name: 'KYLIAN MBAPPÉ'},
	bellingham: {src: 'bellingham.jpg', iw: 1280, ih: 2530, fx: 0.5, fy: 0.11, cw: 0.22, name: 'JUDE BELLINGHAM'},
	valverde: {src: 'valverde.jpg', iw: 960, ih: 540, fx: 0.6, fy: 0.27, cw: 0.24, name: 'FEDE VALVERDE'},
};
const Face: React.FC<{p: P; len: number}> = ({p, len}) => {
	const f = useCurrentFrame();
	const z = interpolate(f, [0, len], [1, 1.08], clamp);
	const Wd = (1080 / p.cw) * z;
	const Hd = (Wd * p.ih) / p.iw;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<Img src={staticFile(`clasico/players/${p.src}`)} style={{position: 'absolute', left: 540 - p.fx * Wd, top: 1920 * 0.4 - p.fy * Hd, width: Wd, height: Hd, filter: 'contrast(1.2) saturate(0.7) brightness(0.9)'}} />
			<Grade warm={0.45} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 52%, rgba(0,0,0,0.92) 70%, #000 85%)'}} />
		</AbsoluteFill>
	);
};

// small, wide-tracked title; letters appear in random order (reference: "C NEMATIC T AILER")
const Title: React.FC<{text: string; at?: number; size?: number; y?: number; font?: string; weight?: number; color?: string; out?: number; spacing?: number}> = ({text, at = 0, size = 46, y = 900, font = orbitron, weight = 900, color = C.ink, out, spacing = 0.18}) => {
	const f = useCurrentFrame();
	const chars = Array.from(text);
	const exit = out !== undefined ? tween(f, out, 12, 0, 1, IN_OUT) : 0;
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, textAlign: 'center', fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: size * spacing, color, textShadow: '0 0 24px rgba(0,0,0,0.6)', opacity: 1 - exit, whiteSpace: 'pre-wrap', lineHeight: 1.3}}>
			{chars.map((ch, i) => {
				const d = at + Math.floor(rand(i, text.length) * 16);
				return (
					<span key={i} style={{opacity: f >= d ? Math.min(1, (f - d) / 4) : 0}}>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

const Flash: React.FC<{at: number; len?: number}> = ({at, len = 10}) => {
	const f = useCurrentFrame();
	if (f < at || f > at + len) return null;
	return <AbsoluteFill style={{background: '#F4EEDF', opacity: 1 - (f - at) / len}} />;
};

// blur whip: the outgoing shot smears sideways for a few frames (reference transition)
const Whip: React.FC<{children: React.ReactNode; at: number; dir?: 1 | -1}> = ({children, at, dir = 1}) => {
	const f = useCurrentFrame();
	const k = tween(f, at, 10, 0, 1, (x) => x * x);
	return <AbsoluteFill style={{transform: `translateX(${dir * k * 500}px) scaleX(${1 + k * 0.4})`, filter: k > 0 ? `blur(${k * 26}px)` : undefined}}>{children}</AbsoluteFill>;
};

const Crest: React.FC<{src: string; size: number; y: number; p: number}> = ({src, size, y, p}) => (
	<Img src={staticFile(`clasico/crest/${src}`)} style={{position: 'absolute', left: 540 - size / 2, top: y, width: size, height: size, objectFit: 'contain', opacity: p, transform: `scale(${0.9 + 0.1 * p})`, filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))'}} />
);

// ---------------------------------------------------------------- shots (global seconds)
type Cut = {a: number; b: number; el: React.ReactNode};
const L = (a: number, b: number) => s(b) - s(a);

const CUTS: Cut[] = [
	// 0–5.4 · the city wakes — "for some, it's a game / for them… it's everything"
	{a: 0, b: 2.75, el: <Whip at={L(0, 2.75) - 10}><Shot src="bg/bcn-storm.jpg" len={L(0, 2.75)} zoom={[1.15, 1.3]} tilt={[30, -20]} warm={0.5} /><Title text="FOR SOME," at={18} y={860} size={44} /><Title text="IT'S A GAME." at={80} y={930} size={44} /></Whip>},
	{a: 2.75, b: 5.4, el: <><Shot src="bg/bcn-stars.jpg" len={L(2.75, 5.4)} zoom={[1.05, 1.22]} warm={0.6} /><Title text="FOR THEM…" at={6} y={860} size={44} /><Title text="IT'S EVERYTHING." at={70} y={930} size={44} /></>},
	// 5.4–8.1 · two giants, two legacies
	{a: 5.4, b: 6.8, el: <><Shot src="bg/campnou-aerial.jpg" len={L(5.4, 6.8)} pos="50% 50%" zoom={[1.6, 1.8]} /><Title text="TWO GIANTS" at={6} y={900} size={56} /><Flash at={0} /></>},
	{a: 6.8, b: 8.1, el: <Whip at={L(6.8, 8.1) - 10} dir={-1}><Shot src="bg/bernabeu-inside.jpg" len={L(6.8, 8.1)} zoom={[1.5, 1.65]} pan={[40, -40]} /><Title text="TWO LEGACIES" at={4} y={900} size={56} /></Whip>},
	// 8.1–10.3 · one battlefield
	{a: 8.1, b: 10.3, el: <><Shot src="bg/centre-circle.jpg" len={L(8.1, 10.3)} pos="50% 50%" zoom={[1.7, 1.95]} /><Title text="ONE BATTLEFIELD" at={10} y={900} size={52} /></>},
	// 10.3–15.2 · Barcelona
	{a: 10.3, b: 11.6, el: <><Shot src="bg/campnou-mes.jpg" len={L(10.3, 11.6)} pos="45% 40%" zoom={[1.5, 1.62]} warm={0.25} /><Crest src="fcb.svg" size={220} y={600} p={1} /><Title text="BARCELONA" at={4} y={880} size={64} /><Flash at={0} len={8} /></>},
	{a: 11.6, b: 12.85, el: <><Face p={PL.yamal} len={L(11.6, 12.85)} /><Title text="LAMINE YAMAL" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></>},
	{a: 12.85, b: 14.05, el: <><Face p={PL.pedri} len={L(12.85, 14.05)} /><Title text="PEDRI" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></>},
	{a: 14.05, b: 15.2, el: <Whip at={L(14.05, 15.2) - 10}><Face p={PL.raphinha} len={L(14.05, 15.2)} /><Title text="RAPHINHA" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></Whip>},
	// 15.2–20.2 · Real Madrid
	{a: 15.2, b: 16.5, el: <><Shot src="bg/madrid-granvia.jpg" len={L(15.2, 16.5)} zoom={[1.1, 1.22]} warm={0.6} /><Crest src="rma.svg" size={220} y={600} p={1} /><Title text="REAL MADRID" at={4} y={880} size={60} /><Flash at={0} len={8} /></>},
	{a: 16.5, b: 17.75, el: <><Face p={PL.mbappe} len={L(16.5, 17.75)} /><Title text="KYLIAN MBAPPÉ" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></>},
	{a: 17.75, b: 18.95, el: <><Face p={PL.bellingham} len={L(17.75, 18.95)} /><Title text="JUDE BELLINGHAM" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></>},
	{a: 18.95, b: 20.2, el: <Whip at={L(18.95, 20.2) - 10} dir={-1}><Face p={PL.valverde} len={L(18.95, 20.2)} /><Title text="FEDE VALVERDE" at={6} y={1500} size={34} font={michroma} weight={400} spacing={0.3} /></Whip>},
	// 20.2–23.2 · ninety minutes, eternal pride
	{a: 20.2, b: 21.8, el: <><Shot src="bg/bernabeu-inside.jpg" len={L(20.2, 21.8)} zoom={[1.2, 1.35]} pan={[-60, 60]} /><Title text="90 MINUTES" at={8} y={900} size={60} /></>},
	{a: 21.8, b: 23.2, el: <><Shot src="bg/campnou-mes.jpg" len={L(21.8, 23.2)} pos="50% 50%" zoom={[1.25, 1.4]} warm={0.5} /><Title text="ETERNAL PRIDE" at={6} y={900} size={60} color="#F3D9A4" /><Flash at={0} len={8} /></>},
	// 23.2–25.0 · this is not just football — the music drops out; quick faces in the dark
	{a: 23.2, b: 25.0, el: <Quick />},
	// 25.0–32 · the tunnel: walk out towards the light, title on the hit
	{a: 25.0, b: 32, el: <Finale />},
];

function Quick() {
	const f = useCurrentFrame();
	const order = ['yamal', 'mbappe', 'pedri', 'bellingham', 'raphinha', 'valverde'];
	const k = Math.min(order.length - 1, Math.floor(f / 18));
	const on = f % 18 < 12; // short black gaps between the flashes
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{on ? (
				<Sequence from={k * 18} layout="none">
					<Face p={PL[order[k]]} len={18} />
				</Sequence>
			) : null}
			<AbsoluteFill style={{background: 'rgba(0,0,0,0.35)'}} />
			<Title text="THIS IS NOT" at={4} y={860} size={52} />
			<Title text="JUST FOOTBALL" at={44} y={940} size={52} />
		</AbsoluteFill>
	);
}

function Finale() {
	const f = useCurrentFrame();
	const len = L(25, 32);
	const push = interpolate(f, [0, len], [1.9, 2.8], {...clamp, easing: IN_OUT});
	const light = tween(f, 200, 160, 0, 1, IN_OUT); // walk into the light at the end of the tunnel
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
				<Img src={staticFile('clasico/bg/tunnel.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%', transformOrigin: '50% 74%', transform: `scale(${push})`, filter: 'contrast(1.2) saturate(0.7) brightness(0.8)'}} />
				<Grade warm={0.55} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(255,246,225,0.95), rgba(255,246,225,0) 60%)', opacity: light}} />
			<Img src={staticFile('clasico/crest/fcb.svg')} style={{position: 'absolute', left: 330, top: 600, width: 130, height: 130, objectFit: 'contain', opacity: tween(f, 40, 20)}} />
			<Img src={staticFile('clasico/crest/rma.svg')} style={{position: 'absolute', left: 620, top: 600, width: 130, height: 130, objectFit: 'contain', opacity: tween(f, 46, 20)}} />
			<Title text="EL CLÁSICO" at={0} y={850} size={92} spacing={0.12} />
			<Title text="25 OCTOBER 2026" at={40} y={1000} size={30} font={michroma} weight={400} spacing={0.32} />
			<Title text="SPOTIFY CAMP NOU · 21:00 CET" at={60} y={1060} size={22} font={michroma} weight={400} spacing={0.3} color="#cfe3e6" />
			<Flash at={0} len={12} />
			<AbsoluteFill style={{background: '#000', opacity: tween(f, len - 40, 40, 0, 1, IN_OUT)}} />
		</AbsoluteFill>
	);
}

// ---------------------------------------------------------------- audio
const MUSIC_FROM = 15; // 0:38 silence → video 23, 0:40 hit → video 25
const musicVol = (f: number) => interpolate(f, [0, 8, s(31), s(32)], [0, 0.55, 0.55, 0], clamp);

const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.12, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<filter id="g2">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 24} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter="url(#g2)" />
		</svg>
	);
};

export const ClasicoCine: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#000'}}>
		{CUTS.map((c, i) => (
			<Sequence key={i} from={s(c.a)} durationInFrames={L(c.a, c.b)}>
				{c.el}
			</Sequence>
		))}
		<Grain />
		<Audio src={staticFile('clasico/music-dramatic.mp3')} startFrom={s(MUSIC_FROM)} volume={musicVol} />
		{VO.map((v, i) => (
			<Sequence key={i} from={s(v.at)} durationInFrames={s(v.to - v.from) + 2} layout="none">
				<Audio src={staticFile('clasico/vo/vo.wav')} startFrom={s(v.from)} endAt={s(v.to)} volume={1} />
			</Sequence>
		))}
	</AbsoluteFill>
);

