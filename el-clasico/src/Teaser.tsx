// EL CLÁSICO teaser — "THE WORLD STOPS" · 22 s · 9:16 · no voiceover (built for muted reels)
// Idea: clocks around the world all land on the same second — kick-off (Sun 25 Oct 2026, 21:00 CET =
// 20:00 UTC). Ticking drives the cut, then everything stops: silence, then the two crests collide.
// Sound: generated cinematic bed (synth-audio, D minor, final chord at 17.2 s) + synthesized clock ticks.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, EXPO, IN_OUT, WHIP, display, mono, orbitron, pop, tween} from './kit/theme';

export const TEASER_TOTAL = 1180; // title holds ~2.5 s so the reel loops
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// kick-off in local time (checked with the IANA tz database; Spain leaves summer time that morning)
const CITIES = [
	{name: 'NEW YORK', h: 16, m: 0, day: 'SUN 25 OCT', lon: -74},
	{name: 'RIO DE JANEIRO', h: 17, m: 0, day: 'SUN 25 OCT', lon: -43},
	{name: 'LONDON', h: 20, m: 0, day: 'SUN 25 OCT', lon: 0},
	{name: 'RIYADH', h: 23, m: 0, day: 'SUN 25 OCT', lon: 47},
	{name: 'DUBAI', h: 0, m: 0, day: 'MON 26 OCT', lon: 55},
	{name: 'TOKYO', h: 5, m: 0, day: 'MON 26 OCT', lon: 140},
];
const CITY_START = 90;
const CITY_LEN = 75;
const GRID_START = CITY_START + CITY_LEN * CITIES.length; // 540
const FREEZE = 582; // every second hand stops here
const SILENCE_END = 640; // crests collide
const pad = (n: number) => String(n).padStart(2, '0');

const Big: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = C.ink, style}) => (
	<div style={{fontFamily: display, fontSize: size, lineHeight: 0.95, color, textTransform: 'uppercase', ...style}}>{children}</div>
);
const Mono: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 22, color = C.muted, style}) => (
	<span style={{fontFamily: mono, fontSize: size, color, letterSpacing: size * 0.12, whiteSpace: 'nowrap', ...style}}>{children}</span>
);

// ---------------------------------------------------------------- analog clock
const Clock: React.FC<{cx: number; cy: number; r: number; hourA: number; minA: number; secA: number; glow?: number; stroke?: number}> = ({cx, cy, r, hourA, minA, secA, glow = 0, stroke = 3}) => {
	const hand = (a: number, len: number, w: number, color: string) => (
		<line x1={cx} y1={cy} x2={cx + Math.sin((a * Math.PI) / 180) * len} y2={cy - Math.cos((a * Math.PI) / 180) * len} stroke={color} strokeWidth={w} strokeLinecap="round" />
	);
	return (
		<g>
			<circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(244,242,238,0.85)" strokeWidth={stroke} />
			<circle cx={cx} cy={cy} r={r + 18} fill="none" stroke="rgba(244,242,238,0.12)" strokeWidth={1.5} />
			{Array.from({length: 60}).map((_, i) => {
				const a = (i / 60) * Math.PI * 2;
				const big = i % 5 === 0;
				const r1 = r - (big ? r * 0.12 : r * 0.05);
				return <line key={i} x1={cx + Math.sin(a) * r1} y1={cy - Math.cos(a) * r1} x2={cx + Math.sin(a) * (r - r * 0.02)} y2={cy - Math.cos(a) * (r - r * 0.02)} stroke="rgba(244,242,238,0.8)" strokeWidth={big ? stroke * 1.4 : stroke * 0.5} />;
			})}
			{hand(hourA, r * 0.52, stroke * 3.2, C.ink)}
			{hand(minA, r * 0.8, stroke * 2.2, C.ink)}
			{hand(secA, r * 0.88, stroke * 0.9, C.red)}
			<circle cx={cx} cy={cy} r={stroke * 3} fill={C.red} />
			{glow > 0 ? <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.red} strokeWidth={stroke * 4} opacity={glow} /> : null}
		</g>
	);
};

// ---------------------------------------------------------------- 0–1.5 s · hook
const Hook: React.FC = () => {
	const f = useCurrentFrame();
	const words = ['THE WORLD', 'WILL', 'STOP.'];
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
			<div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
				<Mono size={34} color={C.ink}>25 · 10 · 2026</Mono>
			</div>
			<div style={{textAlign: 'center'}}>
				{words.map((w, i) => {
					const at = i * 30;
					const p = pop(f, at, 12);
					return f >= at ? (
						<Big key={i} size={i === 2 ? 300 : 190} color={i === 2 ? C.red : C.ink} style={{transform: `scale(${1.25 - 0.25 * p})`, opacity: Math.min(1, (f - at) / 3)}}>
							{w}
						</Big>
					) : (
						<div key={i} style={{height: i === 2 ? 285 : 180}} />
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 1380, width: '100%', textAlign: 'center', direction: 'rtl', opacity: tween(f, 62, 14)}}>
				<span style={{fontFamily: 'Cairo', fontWeight: 700, fontSize: 64, color: C.ink}}>العالم بيوقف.</span>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 1.5–9 s · six cities, one second
const lonX = (lon: number) => 540 + lon * 3.2;
const WorldBar: React.FC<{active: number; p: number}> = ({active, p}) => {
	const prev = CITIES[Math.max(0, active - 1)];
	const cur = CITIES[active];
	const x = active === 0 ? lonX(cur.lon) : interpolate(p, [0, 1], [lonX(prev.lon), lonX(cur.lon)]);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<line x1={60} y1={1700} x2={1020} y2={1700} stroke="rgba(244,242,238,0.25)" strokeWidth={2} />
			{CITIES.map((c, i) => (
				<g key={i}>
					<line x1={lonX(c.lon)} y1={1688} x2={lonX(c.lon)} y2={1712} stroke={i <= active ? C.ink : 'rgba(244,242,238,0.3)'} strokeWidth={2} />
				</g>
			))}
			<circle cx={x} cy={1700} r={10} fill={C.red} />
		</svg>
	);
};

const CityBeat: React.FC<{i: number}> = ({i}) => {
	const f = useCurrentFrame(); // local, 0..CITY_LEN
	const c = CITIES[i];
	const prev = i === 0 ? {h: 9, m: 41} : CITIES[i - 1];
	const spin = tween(f, 0, 44, 0, 1, WHIP);
	const startMin = prev.h * 60 + prev.m;
	let endMin = c.h * 60 + c.m;
	while (endMin <= startMin) endMin += 12 * 60;
	const mins = startMin + (endMin + 24 * 60 - startMin) * spin; // two extra laps for drama
	const hourA = (mins / 60) * 30;
	const minA = mins * 6;
	const secA = f * 6 * 4; // second hand races
	const lock = f >= 44;
	const glow = lock ? Math.max(0, 1 - (f - 44) / 14) : 0;
	const nameP = tween(f, 2, 18);
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<Clock cx={540} cy={820} r={330} hourA={hourA} minA={minA} secA={lock ? 0 : secA} glow={glow} />
			</svg>
			<div style={{position: 'absolute', top: 1220, width: '100%', textAlign: 'center', opacity: nameP, transform: `translateY(${(1 - nameP) * 30}px)`}}>
				<Big size={c.name.length > 10 ? 120 : 150}>{c.name}</Big>
			</div>
			<div style={{position: 'absolute', top: 1400, width: '100%', textAlign: 'center', opacity: lock ? 1 : 0.25}}>
				<span style={{fontFamily: orbitron, fontWeight: 900, fontSize: 96, color: lock ? C.red : C.ink, letterSpacing: 6}}>{lock ? `${pad(c.h)}:${pad(c.m)}` : `${pad(Math.floor(mins / 60) % 24)}:${pad(Math.floor(mins) % 60)}`}</span>
			</div>
			<div style={{position: 'absolute', top: 1530, width: '100%', textAlign: 'center', opacity: lock ? 1 : 0}}>
				<Mono size={24}>{c.day} · KICK-OFF</Mono>
			</div>
			<WorldBar active={i} p={tween(f, 0, 40, 0, 1, IN_OUT)} />
		</AbsoluteFill>
	);
};

const Grid: React.FC = () => {
	const f = useCurrentFrame() + GRID_START; // global
	const p = tween(f, GRID_START, 24);
	const frozen = f >= FREEZE;
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{CITIES.map((c, i) => {
					const col = i % 2;
					const row = Math.floor(i / 2);
					const cx = 300 + col * 480;
					const cy = 520 + row * 430;
					const secA = frozen ? 0 : (f - GRID_START) * 9;
					return (
						<g key={i} opacity={p} transform={`translate(${cx} ${cy}) scale(${0.85 + 0.15 * p}) translate(${-cx} ${-cy})`}>
							<Clock cx={cx} cy={cy} r={140} hourA={(c.h % 12) * 30} minA={0} secA={secA} stroke={2} glow={frozen ? Math.max(0, 1 - (f - FREEZE) / 20) : 0} />
						</g>
					);
				})}
			</svg>
			{CITIES.map((c, i) => {
				const col = i % 2;
				const row = Math.floor(i / 2);
				return (
					<div key={i} style={{position: 'absolute', left: 60 + col * 480, width: 480, top: 690 + row * 430, textAlign: 'center', opacity: p}}>
						<Mono size={24} color={C.ink}>
							{c.name} · {pad(c.h)}:{pad(c.m)}
						</Mono>
					</div>
				);
			})}
			<div style={{position: 'absolute', top: 200, width: '100%', textAlign: 'center', opacity: tween(f, GRID_START + 10, 16)}}>
				<Big size={110}>SAME SECOND.</Big>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 10–13 s · one match
const Collide: React.FC = () => {
	const f = useCurrentFrame() + 600; // global
	const hit = SILENCE_END;
	const inL = tween(f, hit - 14, 14, 0, 1, (x) => x * x);
	const back = tween(f, hit, 30, 0, 1, EXPO);
	const off = (1 - inL) * 700 + back * 60;
	const split = tween(f, hit, 20, 0, 1, EXPO);
	const flash = f >= hit && f < hit + 8 ? 1 - (f - hit) / 8 : 0;
	const shake = f >= hit && f < hit + 16 ? (1 - (f - hit) / 16) * 18 : 0;
	return (
		<AbsoluteFill style={{transform: `translate(${Math.sin(f * 3.1) * shake}px, ${Math.cos(f * 2.7) * shake}px)`}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, background: `repeating-linear-gradient(90deg, ${C.fcbBlue} 0 90px, ${C.fcbGarnet} 90px 180px)`, opacity: split * 0.55}} />
			<div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, background: 'linear-gradient(180deg, #f4f1ea, #cdb98a)', opacity: split * 0.35}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.85))'}} />
			<Img src={staticFile('clasico/crest/fcb.svg')} style={{position: 'absolute', left: 540 - 340 - off, top: 760, width: 340, height: 340, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))'}} />
			<Img src={staticFile('clasico/crest/rma.svg')} style={{position: 'absolute', left: 540 + off, top: 760, width: 340, height: 340, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))'}} />
			<div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', opacity: tween(f, hit + 10, 14)}}>
				<Big size={150}>ONE MATCH.</Big>
			</div>
			<div style={{position: 'absolute', top: 1260, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', opacity: tween(f, hit + 30, 16)}}>
				<Mono size={24} color={C.ink}>FC BARCELONA</Mono>
				<Mono size={24} color={C.ink}>REAL MADRID</Mono>
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 13–17 s · the date locks in like a slot reel
const Reel: React.FC<{digit: string; lockAt: number; f: number}> = ({digit, lockAt, f}) => {
	const locked = f >= lockAt;
	const n = locked ? digit : String(Math.floor((f * 0.9 + lockAt) % 10));
	const bump = locked ? pop(f, lockAt, 12) : 1;
	return (
		<div style={{width: 170, height: 260, overflow: 'hidden', display: 'grid', placeItems: 'center', borderBottom: `6px solid ${locked ? C.red : 'rgba(244,242,238,0.25)'}`}}>
			<span style={{fontFamily: orbitron, fontWeight: 900, fontSize: 210, color: locked ? C.ink : 'rgba(244,242,238,0.35)', transform: `translateY(${locked ? (1 - bump) * -40 : ((f * 37) % 60) - 30}px)`}}>{n}</span>
		</div>
	);
};

const DateLock: React.FC = () => {
	const f = useCurrentFrame() + 780; // global
	const locks = [800, 830, 880, 910];
	const digits = ['2', '5', '1', '0'];
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center', opacity: tween(f, 780, 14)}}>
				<Mono size={28} color={C.ink}>MARK THE DATE</Mono>
			</div>
			<div style={{position: 'absolute', top: 700, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18}}>
				<Reel digit={digits[0]} lockAt={locks[0]} f={f} />
				<Reel digit={digits[1]} lockAt={locks[1]} f={f} />
				<span style={{fontFamily: orbitron, fontWeight: 900, fontSize: 160, color: C.red, marginBottom: 30}}>.</span>
				<Reel digit={digits[2]} lockAt={locks[2]} f={f} />
				<Reel digit={digits[3]} lockAt={locks[3]} f={f} />
			</div>
			<div style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', opacity: tween(f, 925, 16)}}>
				<Big size={64} style={{direction: 'rtl', fontFamily: 'Cairo', fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap'}}>الأحد · 11 م بتوقيت السعودية</Big>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 17–22 s · title on the final chord
const Title: React.FC = () => {
	const f = useCurrentFrame() + 1020; // global
	const chord = 1032; // 17.2 s
	const p = pop(f, chord, 13);
	const flash = f >= chord && f < chord + 10 ? 1 - (f - chord) / 10 : 0;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 430, width: '100%', textAlign: 'center', opacity: f < chord ? tween(f, 1020, 8) : 1 - tween(f, chord, 6)}}>
				<Big size={120}>THE WORLD</Big>
				<Big size={180} color={C.red}>STOPS.</Big>
			</div>
			{f >= chord ? (
				<>
					<div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center', transform: `scale(${1.3 - 0.3 * p})`}}>
						<Big size={230} style={{lineHeight: 1.12}}>EL</Big>
						<Big size={230} style={{lineHeight: 1.12}}>CLÁSICO</Big>
					</div>
					<div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'center', opacity: tween(f, chord + 14, 16)}}>
						<Img src={staticFile('clasico/crest/fcb.svg')} style={{width: 120, height: 120, objectFit: 'contain'}} />
						<Mono size={30} color={C.ink}>VS</Mono>
						<Img src={staticFile('clasico/crest/rma.svg')} style={{width: 120, height: 120, objectFit: 'contain'}} />
					</div>
					<div style={{position: 'absolute', top: 1300, width: '100%', textAlign: 'center', opacity: tween(f, chord + 26, 16)}}>
						<Mono size={26} color={C.ink}>SUN 25.10.2026 · 23:00 KSA</Mono>
					</div>
					<div style={{position: 'absolute', top: 1350, width: '100%', textAlign: 'center', opacity: tween(f, chord + 36, 16)}}>
						<Mono size={22}>SPOTIFY CAMP NOU · BARCELONA</Mono>
					</div>
				</>
			) : null}
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- audio
const Sfx: React.FC<{at: number; src: string; v?: number}> = ({at, src, v = 0.4}) => (
	<Sequence from={Math.round(at)} layout="none">
		<Audio src={staticFile(src)} volume={v} />
	</Sequence>
);

// ticks: every half second in the hook, quicker through the cities, racing in the grid, then nothing
const TICKS: number[] = (() => {
	const t: number[] = [];
	for (let x = 0; x < CITY_START; x += 30) t.push(x);
	for (let i = 0; i < CITIES.length; i++) for (let x = 0; x < 40; x += 12) t.push(CITY_START + i * CITY_LEN + x);
	for (let x = GRID_START; x < FREEZE; x += 7) t.push(x);
	return t;
})();

const musicVol = (f: number) => {
	const base = interpolate(f, [0, 30, TEASER_TOTAL - 50, TEASER_TOTAL], [0.0, 0.6, 0.6, 0], clamp);
	const silence = interpolate(f, [FREEZE - 2, FREEZE, SILENCE_END - 1, SILENCE_END], [1, 0, 0, 1], clamp); // the world stops
	return base * silence;
};

// ---------------------------------------------------------------- timeline
export const Teaser: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			<Sequence from={0} durationInFrames={CITY_START}>
				<Hook />
			</Sequence>
			{CITIES.map((_, i) => (
				<Sequence key={i} from={CITY_START + i * CITY_LEN} durationInFrames={CITY_LEN}>
					<CityBeat i={i} />
				</Sequence>
			))}
			<Sequence from={GRID_START} durationInFrames={600 - GRID_START}>
				<Grid />
			</Sequence>
			<Sequence from={600} durationInFrames={180}>
				<Collide />
			</Sequence>
			<Sequence from={780} durationInFrames={240}>
				<DateLock />
			</Sequence>
			<Sequence from={1020} durationInFrames={TEASER_TOTAL - 1020}>
				<Title />
			</Sequence>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6))', pointerEvents: 'none'}} />
			{/* frozen world: the frame holds, desaturated, in silence */}
			{f >= FREEZE && f < 600 ? <AbsoluteFill style={{background: 'rgba(0,0,0,0.25)'}} /> : null}

			<Audio src={staticFile('teaser/music.wav')} volume={musicVol} />
			{TICKS.map((t, i) => (
				<Sfx key={i} at={t} src="teaser/tick.wav" v={0.25} />
			))}
			{CITIES.map((_, i) => (
				<Sfx key={`l${i}`} at={CITY_START + i * CITY_LEN + 44} src="teaser/lock.wav" v={0.4} />
			))}
			<Sfx at={FREEZE} src="teaser/lock.wav" v={0.55} />
			<Sfx at={SILENCE_END - 40} src="clasico/sfx/whoosh.wav" v={0.25} />
			<Sfx at={SILENCE_END} src="clasico/sfx/boom.wav" v={0.6} />
			{[800, 830, 880, 910].map((t) => (
				<Sfx key={t} at={t} src="teaser/lock.wav" v={0.35} />
			))}
			<Sfx at={1040} src="clasico/sfx/crowd.wav" v={0.18} />
		</AbsoluteFill>
	);
};
