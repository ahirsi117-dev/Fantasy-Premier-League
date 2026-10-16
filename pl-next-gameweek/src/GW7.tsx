// Premier League — Gameweek 7 (17–19 Oct 2026) · 9:16 reel, no voiceover.
// Style reference: "NFL Gametime on X" (whatships.com/videos/nfl-gametime-x) — black stage,
// white hairlines with travelling nodes, lines that tilt into a pitch, scoreboards with crests,
// a notification stack. Music: "Mechanolith" — power from 6 s, dip at 28 s, hit at 31 s.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Sfx} from './kit/kit';
import {BigCard, Notif, NotifStack} from './kit/NotifStack';
import {C, EXPO, IN_OUT, WHIP, arabic, display, pop, tween} from './kit/theme';

export const GW7_TOTAL = 1980; // 33 s @ 60 fps

const NAME: Record<string, string> = {
	EVE: 'إيفرتون', CHE: 'تشيلسي', BRE: 'برينتفورد', LIV: 'ليفربول', FUL: 'فولهام', HUL: 'هل سيتي', MCI: 'مان سيتي', IPS: 'إبسويتش',
	NEW: 'نيوكاسل', AVL: 'أستون فيلا', BOU: 'بورنموث', SUN: 'سندرلاند', BHA: 'برايتون', CRY: 'كريستال بالاس', LEE: 'ليدز', MUN: 'مان يونايتد',
	NFO: 'نوتنغهام فورست', ARS: 'آرسنال', TOT: 'توتنهام', COV: 'كوفنتري',
};

const FIXTURES: [string, string, string][] = [
	['EVE', 'CHE', '14:30'], ['BRE', 'LIV', '17:00'], ['FUL', 'HUL', '17:00'], ['MCI', 'IPS', '17:00'], ['NEW', 'AVL', '19:30'],
	['BOU', 'SUN', '16:00'], ['BHA', 'CRY', '16:00'], ['LEE', 'MUN', '16:00'], ['NFO', 'ARS', '18:30'], ['TOT', 'COV', '22:00'],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Badge: React.FC<{code: string; size: number; style?: React.CSSProperties}> = ({code, size, style}) => (
	<Img src={staticFile(`gw7/badges/${code}.svg`)} style={{width: size, height: size, objectFit: 'contain', ...style}} />
);

const Ar: React.FC<{children: React.ReactNode; size: number; weight?: number; color?: string; style?: React.CSSProperties}> = ({children, size, weight = 700, color = C.ink, style}) => (
	<div style={{fontFamily: arabic, fontSize: size, fontWeight: weight, color, direction: 'rtl', lineHeight: 1.25, ...style}}>{children}</div>
);

const Time: React.FC<{children: string; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = C.ink, style}) => (
	<span style={{fontFamily: display, fontSize: size, color, letterSpacing: size * 0.01, lineHeight: 1, direction: 'ltr', unicodeBidi: 'isolate', ...style}}>{children}</span>
);

// pill label like the reference's small chips
const Pill: React.FC<{children: React.ReactNode; y: number; p: number; color?: string}> = ({children, y, p, color = C.accent}) => (
	<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
		<div style={{border: `2px solid ${color}`, color, borderRadius: 999, padding: '10px 34px', fontFamily: arabic, fontWeight: 700, fontSize: 38, direction: 'rtl'}}>{children}</div>
	</div>
);

// words rise out of a mask one by one (whole words — Arabic letters must stay joined)
const Words: React.FC<{text: string; at: number; y: number; size: number; accent?: string[]; weight?: number; out?: number}> = ({text, at, y, size, accent = [], weight = 900, out}) => {
	const f = useCurrentFrame();
	const exit = out ? tween(f, out, 20, 0, 1, IN_OUT) : 0;
	return (
		<div style={{position: 'absolute', top: y, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.25, direction: 'rtl', opacity: 1 - exit, transform: `translateY(${-exit * 40}px)`}}>
			{text.split(' ').map((w, i) => {
				const p = tween(f, at + i * 7, 34);
				return (
					<span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.05em 0 0.25em'}}>
						<span style={{display: 'inline-block', fontFamily: arabic, fontWeight: weight, fontSize: size, lineHeight: 1.2, color: accent.includes(w) ? C.accent : C.ink, transform: `translateY(${(1 - p) * 110}%)`}}>{w}</span>
					</span>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------- pitch geometry (shared by S1 → S2)
const LINES_X = [130, 263, 396, 540, 684, 817, 950];
const HORIZON = 1040;
const BASE = 1760;
// vertical hairline i at "tilt" t: 0 = straight full-height line, 1 = converging pitch line
const lineAt = (x: number, t: number) => {
	const topX = interpolate(t, [0, 1], [x, 540 + (x - 540) * 0.42]);
	const botX = interpolate(t, [0, 1], [x, 540 + (x - 540) * 1.75]);
	const topY = interpolate(t, [0, 1], [0, HORIZON]);
	const botY = interpolate(t, [0, 1], [1920, BASE]);
	return {topX, botX, topY, botY};
};

const Hairlines: React.FC<{draw: number; tilt: number; nodes: number}> = ({draw, tilt, nodes}) => {
	const f = useCurrentFrame();
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			{LINES_X.map((x, i) => {
				const g = lineAt(x, tilt);
				const d = Math.max(0, Math.min(1, draw * 1.6 - i * 0.09));
				const y2 = g.topY + (g.botY - g.topY) * d;
				const x2 = g.topX + (g.botX - g.topX) * d;
				// a small square node travelling down each line (reference motif)
				const k = ((f * (2.2 + (i % 3) * 0.6) + i * 260) % 1920) / 1920;
				const nx = g.topX + (g.botX - g.topX) * k;
				const ny = g.topY + (g.botY - g.topY) * k;
				return (
					<g key={i}>
						<line x1={g.topX} y1={g.topY} x2={x2} y2={y2} stroke={C.hair} strokeWidth={2} />
						<rect x={nx - 6} y={ny - 6} width={12} height={12} fill={C.ink} opacity={nodes * (k < d ? 1 : 0)} />
					</g>
				);
			})}
		</svg>
	);
};

// perspective pitch: the converging lines + cross lines + green that floods from the centre
const Pitch: React.FC<{fill: number; cross: number; y?: number}> = ({fill, cross, y = 0}) => {
	const L = lineAt(LINES_X[0], 1);
	const R = lineAt(LINES_X[LINES_X.length - 1], 1);
	const rows = [0.18, 0.42, 0.7];
	const poly = `${L.topX},${HORIZON} ${R.topX},${HORIZON} ${R.botX},${BASE} ${L.botX},${BASE}`;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', transform: `translateY(${y}px)`}}>
			<defs>
				<radialGradient id="grass" cx="50%" cy="40%" r="60%">
					<stop offset="0%" stopColor="#3FA34D" />
					<stop offset="70%" stopColor="#1F6B2A" />
					<stop offset="100%" stopColor="#0E3A16" />
				</radialGradient>
				<clipPath id="pitchClip">
					<polygon points={poly} />
				</clipPath>
			</defs>
			<g clipPath="url(#pitchClip)">
				<circle cx={540} cy={1300} r={fill * 1100} fill="url(#grass)" />
				{/* mowing stripes */}
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<rect key={i} x={0} y={HORIZON + i * 120} width={1080} height={60} fill="rgba(255,255,255,0.05)" opacity={fill} />
				))}
			</g>
			{LINES_X.map((x, i) => {
				const g = lineAt(x, 1);
				return <line key={i} x1={g.topX} y1={g.topY} x2={g.botX} y2={g.botY} stroke={i === 0 || i === LINES_X.length - 1 ? 'rgba(255,255,255,0.9)' : C.hair} strokeWidth={i === 3 ? 3 : 2} />;
			})}
			{rows.map((r, i) => {
				const yy = HORIZON + (BASE - HORIZON) * r * r * 1.6;
				const t = (yy - HORIZON) / (BASE - HORIZON);
				const lx = L.topX + (L.botX - L.topX) * t;
				const rx = R.topX + (R.botX - R.topX) * t;
				const p = Math.max(0, Math.min(1, cross * 1.5 - i * 0.25));
				return <line key={i} x1={540 - (540 - lx) * p} y1={yy} x2={540 + (rx - 540) * p} y2={yy} stroke="rgba(255,255,255,0.75)" strokeWidth={2.5} />;
			})}
			<line x1={L.topX} y1={HORIZON} x2={L.topX + (R.topX - L.topX) * cross} y2={HORIZON} stroke="rgba(255,255,255,0.9)" strokeWidth={2.5} />
		</svg>
	);
};

// ---------------------------------------------------------------- S1 · hook (0–390)
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const items: Notif[] = [
		{at: 40, glyph: '7', title: 'الدوري الإنجليزي الممتاز', body: 'الجولة 7 · من 17 إلى 19 أكتوبر'},
		{at: 100, glyph: '10', title: '10 مباريات', body: 'عشرون نادي في الملعب'},
		{at: 160, glyph: '3', title: '3 ليالي', body: 'السبت · الأحد · الاثنين'},
	];
	const stackOut = tween(f, 228, 26, 0, 1, IN_OUT);
	const tilt = tween(f, 330, 50, 0, 1, IN_OUT);
	return (
		<AbsoluteFill>
			<Hairlines draw={tween(f, 0, 70, 0, 1, IN_OUT)} tilt={tilt} nodes={1 - tilt} />
			<div style={{opacity: 1 - stackOut, transform: `translateY(${-stackOut * 80}px)`}}>
				<NotifStack items={items} x={540} y={620} width={900} />
			</div>
			<Words text="جولة ممكن تقلب الترتيب" at={250} y={620} size={150} accent={['الترتيب']} out={322} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S2 · Saturday opener (390–690)
const FaceOff: React.FC<{home: string; away: string; time: string; at: number; y: number}> = ({home, away, time, at, y}) => {
	const f = useCurrentFrame();
	const h = pop(f, at, 13);
	const a = pop(f, at + 8, 13);
	const t = tween(f, at + 22, 30);
	const nm = tween(f, at + 34, 30);
	const side = (code: string, s: number, dir: 1 | -1) => (
		<div style={{width: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${(1 - s) * 260 * dir}px) scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5)}}>
			<Badge code={code} size={240} style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))'}} />
			<Ar size={46} style={{marginTop: 22, opacity: nm, whiteSpace: 'nowrap'}}>{NAME[code]}</Ar>
		</div>
	);
	return (
		<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', direction: 'rtl'}}>
			{side(home, h, 1)}
			<div style={{width: 300, height: 240, display: 'grid', placeItems: 'center', opacity: t, transform: `scale(${0.85 + 0.15 * t})`}}>
				<Time size={130}>{time}</Time>
			</div>
			{side(away, a, -1)}
		</div>
	);
};

// dotted "pass" arc on the pitch (reference: play arc between two players)
const PassArc: React.FC<{p: number}> = ({p}) => {
	const d = 'M300 1500 Q540 1150 780 1500';
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<path d={d} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 22" pathLength={1000} style={{strokeDasharray: '2 22'}} opacity={p > 0 ? 1 : 0} clipPath="url(#arcClip)" />
			<defs>
				<clipPath id="arcClip">
					<rect x={0} y={0} width={300 + 480 * p} height={1920} />
				</clipPath>
			</defs>
			<circle cx={300} cy={1500} r={14} fill={C.ink} opacity={p > 0 ? 1 : 0} />
			<circle cx={780} cy={1500} r={14} fill={C.ink} opacity={p > 0.98 ? 1 : 0} />
		</svg>
	);
};

const S2: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 390
	const push = interpolate(f, [0, 300], [1, 1.06], clamp);
	return (
		<AbsoluteFill style={{transform: `scale(${push})`}}>
			<Pitch fill={tween(f, 0, 60)} cross={tween(f, 10, 50)} />
			<PassArc p={tween(f, 110, 70, 0, 1, IN_OUT)} />
			<Pill y={260} p={tween(f, 20, 30)}>السبت · 17 أكتوبر</Pill>
			<Ar size={44} weight={400} color={C.muted} style={{position: 'absolute', top: 370, left: 0, right: 0, textAlign: 'center', opacity: tween(f, 34, 30)}}>
				ديربي يفتتح الجولة
			</Ar>
			<FaceOff home="EVE" away="CHE" time="14:30" at={40} y={520} />
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- shutter transition (4 strips)
const Shutter: React.FC<{at: number}> = ({at}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{[0, 1, 2, 3].map((i) => {
				const cover = tween(f, at + i * 3, 26, 0, 1, WHIP);
				const open = tween(f, at + 34 + i * 3, 30, 0, 1, WHIP);
				const dir = i % 2 ? 1 : -1;
				const x = dir * (1 - cover) * 1100 + -dir * open * 1100;
				return <div key={i} style={{position: 'absolute', left: 0, top: i * 480, width: 1080, height: 481, background: '#0b0b0c', borderTop: `2px solid ${C.border}`, transform: `translateX(${x}px)`}} />;
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S3 · 17:00 trio (690–990)
const Clock: React.FC<{p: number}> = ({p}) => {
	const ang = -90 + 150 * p; // 12 o'clock → 5 o'clock
	const r = 120;
	return (
		<svg width={1080} height={600} style={{position: 'absolute', top: 160, left: 0}}>
			<circle cx={540} cy={200} r={r} fill="none" stroke={C.hair} strokeWidth={2} />
			{Array.from({length: 12}).map((_, i) => {
				const a = (i / 12) * Math.PI * 2;
				return <line key={i} x1={540 + Math.cos(a) * (r - 18)} y1={200 + Math.sin(a) * (r - 18)} x2={540 + Math.cos(a) * (r - 6)} y2={200 + Math.sin(a) * (r - 6)} stroke={i === 5 ? C.accent : C.hair} strokeWidth={i === 5 ? 5 : 2} />;
			})}
			<line x1={540} y1={200} x2={540 + Math.cos((ang * Math.PI) / 180) * (r - 30)} y2={200 + Math.sin((ang * Math.PI) / 180) * (r - 30)} stroke={C.accent} strokeWidth={6} strokeLinecap="round" />
			<line x1={540} y1={200} x2={540} y2={200 - (r - 60)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
			<circle cx={540} cy={200} r={10} fill={C.ink} />
		</svg>
	);
};

// one fixture in a slot that swaps in place
const SlotRow: React.FC<{home: string; away: string; at: number; out: number}> = ({home, away, at, out}) => {
	const f = useCurrentFrame();
	if (f < at - 2 || f > out + 24) return null;
	const inp = tween(f, at, 34);
	const ex = tween(f, out, 22, 0, 1, IN_OUT);
	return (
		<div style={{position: 'absolute', top: 980, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 70, direction: 'rtl', opacity: inp * (1 - ex), transform: `translateY(${(1 - inp) * 120 - ex * 120}px)`}}>
			<div style={{width: 330, textAlign: 'center'}}>
				<Badge code={home} size={210} />
				<Ar size={44} style={{marginTop: 16, whiteSpace: 'nowrap'}}>{NAME[home]}</Ar>
			</div>
			<Ar size={60} weight={400} color={C.muted}>×</Ar>
			<div style={{width: 330, textAlign: 'center'}}>
				<Badge code={away} size={210} />
				<Ar size={44} style={{marginTop: 16, whiteSpace: 'nowrap'}}>{NAME[away]}</Ar>
			</div>
		</div>
	);
};

const S3: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 690
	const dots = [0, 1, 2].map((i) => (f >= 70 + i * 70 ? 1 : 0.25));
	return (
		<AbsoluteFill>
			<Clock p={tween(f, 20, 50, 0, 1, IN_OUT)} />
			<div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', opacity: tween(f, 50, 30)}}>
				<Time size={170}>17:00</Time>
			</div>
			<Ar size={40} weight={400} color={C.muted} style={{position: 'absolute', top: 780, left: 0, right: 0, textAlign: 'center', opacity: tween(f, 60, 30)}}>
				ثلاث مباريات بنفس الصافرة
			</Ar>
			<SlotRow home="BRE" away="LIV" at={70} out={136} />
			<SlotRow home="FUL" away="HUL" at={140} out={206} />
			<SlotRow home="MCI" away="IPS" at={210} out={400} />
			<div style={{position: 'absolute', top: 1420, width: '100%', display: 'flex', justifyContent: 'center', gap: 22}}>
				{dots.map((o, i) => (
					<div key={i} style={{width: o === 1 ? 46 : 16, height: 16, borderRadius: 8, background: o === 1 ? C.accent : C.hair, opacity: o}} />
				))}
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S4 · Newcastle v Villa split (990–1200)
const S4: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 990
	const inL = tween(f, 0, 40, 0, 1, WHIP);
	const inR = tween(f, 4, 40, 0, 1, WHIP);
	const line = tween(f, 30, 40);
	const b = pop(f, 40, 13);
	const t = tween(f, 60, 30);
	// diagonal divider from (700,0) to (380,1920)
	const leftPoly = 'polygon(0 0, 700px 0, 380px 1920px, 0 1920px)';
	const rightPoly = 'polygon(700px 0, 1080px 0, 1080px 1920px, 380px 1920px)';
	return (
		<AbsoluteFill>
			{/* Newcastle — black & white stripes */}
			<AbsoluteFill style={{clipPath: rightPoly, transform: `translateX(${(1 - inL) * 1100}px)`, background: 'repeating-linear-gradient(90deg, #111 0 90px, #e9e9e9 90px 180px)'}}>
				<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.75))'}} />
			</AbsoluteFill>
			{/* Aston Villa — claret & blue */}
			<AbsoluteFill style={{clipPath: leftPoly, transform: `translateX(${-(1 - inR) * 1100}px)`, background: 'linear-gradient(160deg, #7A1E45 0%, #4A0F2A 60%, #95BFE5 140%)'}} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<line x1={700} y1={0} x2={700 + (380 - 700) * line} y2={1920 * line} stroke={C.ink} strokeWidth={5} />
			</svg>
			<Pill y={240} p={tween(f, 40, 30)} color={C.ink}>قمة السبت</Pill>
			<div style={{position: 'absolute', left: 640, top: 560, width: 380, textAlign: 'center', transform: `scale(${b})`}}>
				<Badge code="NEW" size={260} style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))'}} />
				<Ar size={50} style={{marginTop: 18}}>{NAME.NEW}</Ar>
			</div>
			<div style={{position: 'absolute', left: 60, top: 1080, width: 380, textAlign: 'center', transform: `scale(${pop(f, 48, 13)})`}}>
				<Badge code="AVL" size={260} style={{filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))'}} />
				<Ar size={50} style={{marginTop: 18}}>{NAME.AVL}</Ar>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 940, display: 'flex', justifyContent: 'center', opacity: t, transform: `scale(${0.8 + 0.2 * t})`}}>
				<div style={{background: C.bg, border: `3px solid ${C.ink}`, borderRadius: 26, padding: '18px 40px'}}>
					<Time size={120}>19:30</Time>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- colour-block wipe
const BlockWipe: React.FC<{at: number}> = ({at}) => {
	const f = useCurrentFrame();
	const up = tween(f, at, 26, 0, 1, WHIP);
	const off = tween(f, at + 28, 28, 0, 1, WHIP);
	const top = 1920 * (1 - up) - 1920 * off;
	return <div style={{position: 'absolute', left: 0, width: 1080, top, height: 1920, background: C.accent}} />;
};

// ---------------------------------------------------------------- S5 · Sunday (1200–1530)
const S5: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 1200
	const big = tween(f, 0, 34);
	const carry = tween(f, 44, 40, 0, 1, IN_OUT);
	const size = interpolate(carry, [0, 1], [330, 120]);
	const y = interpolate(carry, [0, 1], [700, 230]);
	const items: Notif[] = [
		{at: 70, badge: 'BOU', title: 'بورنموث × سندرلاند', body: 'ملعب فايتاليتي', meta: '16:00'},
		{at: 112, badge: 'BHA', title: 'برايتون × كريستال بالاس', body: 'ديربي الطريق M23', meta: '16:00'},
		{at: 154, badge: 'LEE', title: 'ليدز × مان يونايتد', body: 'إيلاند رود يشتعل', meta: '16:00'},
	];
	// the big game lifts out of the stack and grows (pop out of the card)
	const lift = tween(f, 220, 50, 0, 1, EXPO);
	const arsCard: Notif = {at: 0, badge: 'NFO', title: 'فورست × آرسنال', body: 'قمة الأحد · سيتي غراوند', meta: '18:30'};
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center', opacity: big, transform: `scale(${0.9 + 0.1 * big})`}}>
				<span style={{fontFamily: arabic, fontWeight: 900, fontSize: size, color: C.ink, direction: 'rtl', lineHeight: 1.2}}>الأحد</span>
			</div>
			<NotifStack items={items} x={540} y={640} width={920} dim={lift} />
			{f >= 212 ? (
				<div style={{position: 'absolute', left: 540 - 460, top: interpolate(lift, [0, 1], [600, 1000]), width: 920, transformOrigin: '50% 50%', transform: `scale(${interpolate(lift, [0, 1], [0.9, 1.08])}) rotate(${interpolate(lift, [0, 0.5, 1], [0, -2, 0])}deg)`, opacity: tween(f, 212, 12)}}>
					<div style={{borderRadius: 34, boxShadow: `0 0 0 3px ${C.accent}, 0 40px 90px rgba(0,255,133,0.18)`}}>
						<BigCard n={arsCard} width={920} />
					</div>
					<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 60, marginTop: 50, direction: 'rtl', opacity: tween(f, 250, 30)}}>
						<Badge code="NFO" size={190} />
						<Time size={110} color={C.accent}>18:30</Time>
						<Badge code="ARS" size={190} />
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S6 · Monday night lights (1530–1700)
const Tower: React.FC<{x: number; on: number; flip?: boolean}> = ({x, on, flip}) => {
	const s = flip ? -1 : 1;
	return (
		<g transform={`translate(${x} 0) scale(${s} 1)`}>
			<line x1={0} y1={420} x2={0} y2={1920} stroke={C.hair} strokeWidth={4} />
			<rect x={-70} y={330} width={140} height={90} rx={8} fill="none" stroke={C.ink} strokeWidth={3} />
			{[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={-48 + c * 32} cy={352 + r * 24} r={9} fill={on > 0.5 ? '#FFF6D6' : '#222'} />))}
			<polygon points="60,420 820,1500 380,1700" fill="url(#beam)" opacity={on} />
		</g>
	);
};

const S6: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 1530
	const on1 = tween(f, 20, 10);
	const on2 = tween(f, 36, 10);
	const reveal = tween(f, 46, 40);
	return (
		<AbsoluteFill>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0%" stopColor="rgba(255,246,214,0.55)" />
						<stop offset="100%" stopColor="rgba(255,246,214,0)" />
					</linearGradient>
				</defs>
				<Tower x={70} on={on1} />
				<Tower x={1010} on={on2} flip />
			</svg>
			<Pill y={200} p={tween(f, 50, 30)} color={C.ink}>الاثنين تحت الأضواء</Pill>
			<div style={{position: 'absolute', top: 900, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 80, direction: 'rtl', opacity: reveal, filter: `brightness(${0.3 + 0.7 * reveal})`}}>
				<div style={{textAlign: 'center', width: 330}}>
					<Badge code="TOT" size={230} />
					<Ar size={46} style={{marginTop: 16}}>{NAME.TOT}</Ar>
				</div>
				<div style={{textAlign: 'center', width: 330}}>
					<Badge code="COV" size={230} />
					<Ar size={46} style={{marginTop: 16}}>{NAME.COV}</Ar>
				</div>
			</div>
			<div style={{position: 'absolute', top: 1380, width: '100%', textAlign: 'center', opacity: tween(f, 70, 30)}}>
				<Time size={150}>22:00</Time>
			</div>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- S7 · all ten, title on the hit (1700–1980)
const HIT = 1860 - 1700;
const Tile: React.FC<{fx: [string, string, string]; i: number}> = ({fx, i}) => {
	const f = useCurrentFrame();
	const col = i % 2;
	const row = Math.floor(i / 2);
	const tx = col === 0 ? 560 : 60; // RTL: first column on the right
	const ty = 560 + row * 200;
	const p = tween(f, 10 + i * 7, 46, 0, 1, EXPO);
	const sx = 540 + Math.cos(i * 2.4) * 900;
	const sy = 960 + Math.sin(i * 2.4) * 1300;
	const lit = tween(f, HIT - 4, 16);
	return (
		<div
			style={{
				position: 'absolute', left: interpolate(p, [0, 1], [sx - 230, tx]), top: interpolate(p, [0, 1], [sy - 85, ty]), width: 460, height: 170,
				borderRadius: 28, border: `2px solid ${lit > 0.5 ? 'rgba(0,255,133,0.45)' : C.border}`, background: '#101012',
				display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', boxSizing: 'border-box', direction: 'rtl',
				opacity: p * (0.45 + 0.55 * lit), transform: `rotate(${(1 - p) * (i % 2 ? 14 : -14)}deg)`,
			}}
		>
			<Badge code={fx[0]} size={100} />
			<Time size={56} color={lit > 0.5 ? C.ink : C.muted}>{fx[2]}</Time>
			<Badge code={fx[1]} size={100} />
		</div>
	);
};

const S7: React.FC = () => {
	const f = useCurrentFrame(); // local 0 = global 1700
	const slam = pop(f, HIT, 12);
	const q = tween(f, HIT + 40, 30);
	return (
		<AbsoluteFill>
			{FIXTURES.map((fx, i) => (
				<Tile key={i} fx={fx} i={i} />
			))}
			<div style={{position: 'absolute', top: 180, left: 0, right: 0, textAlign: 'center', opacity: f >= HIT ? 1 : 0, transform: `scale(${1.6 - 0.6 * slam})`}}>
				<span style={{fontFamily: arabic, fontWeight: 900, fontSize: 170, color: C.ink, direction: 'rtl', lineHeight: 1.2}}>
					الجولة <span style={{color: C.accent, fontFamily: display, fontWeight: 400}}>7</span>
				</span>
			</div>
			<Ar size={70} style={{position: 'absolute', top: 1600, left: 0, right: 0, textAlign: 'center', opacity: q, transform: `translateY(${(1 - q) * 30}px)`}}>
				مين يكسبها؟
			</Ar>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- timeline
const music = (f: number) => interpolate(f, [0, 20, GW7_TOTAL - 50, GW7_TOTAL], [0, 0.7, 0.7, 0], clamp);

export const GW7: React.FC = () => {
	const f = useCurrentFrame();
	const fadeS5 = tween(f, 1500, 30, 0, 1, IN_OUT); // blackout into Monday
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			<Sequence from={0} durationInFrames={400}>
				<S1 />
			</Sequence>
			<Sequence from={380} durationInFrames={330}>
				<AbsoluteFill style={{opacity: tween(f, 380, 20)}}>
					<S2 />
				</AbsoluteFill>
			</Sequence>
			<Sequence from={690} durationInFrames={320}>
				<S3 />
			</Sequence>
			<Shutter at={656} />
			<Sequence from={980} durationInFrames={230}>
				<S4 />
			</Sequence>
			<Sequence from={1200} durationInFrames={330}>
				<AbsoluteFill style={{opacity: 1 - fadeS5}}>
					<S5 />
				</AbsoluteFill>
			</Sequence>
			<BlockWipe at={1170} />
			<Sequence from={1530} durationInFrames={180}>
				<AbsoluteFill style={{opacity: 1 - tween(f, 1690, 20, 0, 1, IN_OUT)}}>
					<S6 />
				</AbsoluteFill>
			</Sequence>
			<Sequence from={1700} durationInFrames={GW7_TOTAL - 1700}>
				<S7 />
			</Sequence>

			<Audio src={staticFile('gw7/music.mp3')} volume={music} />
			<Sfx at={40} src="gw7/sfx/ding.wav" volume={0.3} />
			<Sfx at={100} src="gw7/sfx/pop.wav" volume={0.28} />
			<Sfx at={160} src="gw7/sfx/pop.wav" volume={0.22} />
			<Sfx at={270} src="gw7/sfx/riser.wav" volume={0.25} />
			<Sfx at={760} src="gw7/sfx/tick.wav" volume={0.3} />
			<Sfx at={958} src="gw7/sfx/swipe.wav" volume={0.3} />
			<Sfx at={1170} src="gw7/sfx/whoosh.wav" volume={0.3} />
			<Sfx at={1270} src="gw7/sfx/ding.wav" volume={0.25} />
			<Sfx at={1420} src="gw7/sfx/shimmer.wav" volume={0.28} />
			<Sfx at={1550} src="gw7/sfx/thud.wav" volume={0.3} />
			<Sfx at={1712} src="gw7/sfx/swipe.wav" volume={0.22} />
		</AbsoluteFill>
	);
};
