// Notification Stack — ported from 21st.dev "notification-stack" by ppramanik62 (MIT,
// https://21st.dev/community/components/ppramanik62/notification-stack, source trovecn.dev).
// Kept: collapsed pile where each buried card peeks PEEK lower, smaller and dimmer; arrivals
// drop in from above and land with weight. Rewritten frame-driven, sized for a 1080-wide video,
// dark-themed, RTL.
import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {C, FPS, arabic, inter} from './theme';

const PEEK = 30; // web 12px × 2.5
const DEPTH_SCALE = 0.045;
const RADIUS = 30;
const MAX_DEPTH = 3;

export type Notif = {at: number; title: string; body: string; badge?: string; glyph?: string; meta?: string};

const Icon: React.FC<{n: Notif}> = ({n}) => (
	<div style={{width: 92, height: 92, borderRadius: 22, background: 'rgba(255,255,255,0.07)', display: 'grid', placeItems: 'center', flexShrink: 0}}>
		{n.badge ? (
			<Img src={staticFile(`gw7/badges/${n.badge}.svg`)} style={{width: 66, height: 66, objectFit: 'contain'}} />
		) : (
			<span style={{fontFamily: 'Anton', fontSize: 58, color: C.accent, lineHeight: 1}}>{n.glyph}</span>
		)}
	</div>
);

const Card: React.FC<{n: Notif; width: number}> = ({n, width}) => (
	<div
		style={{
			width,
			boxSizing: 'border-box',
			borderRadius: RADIUS,
			border: `2px solid ${C.border}`,
			background: 'linear-gradient(180deg, #1a1a1d 0%, #111113 100%)',
			boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
			padding: '30px 36px',
			display: 'flex',
			gap: 30,
			direction: 'rtl',
			alignItems: 'center',
		}}
	>
		<Icon n={n} />
		<div style={{flex: 1, minWidth: 0}}>
			<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20}}>
				<span style={{fontFamily: arabic, fontWeight: 700, fontSize: 44, color: C.ink, whiteSpace: 'nowrap'}}>{n.title}</span>
				<span style={{fontFamily: n.meta && /[0-9]/.test(n.meta) ? inter : arabic, fontWeight: 500, fontSize: 30, color: C.muted, direction: 'ltr', unicodeBidi: 'isolate'}}>{n.meta ?? 'الآن'}</span>
			</div>
			<div style={{fontFamily: arabic, fontWeight: 400, fontSize: 34, color: C.muted, marginTop: 4, direction: 'rtl'}}>{n.body}</div>
		</div>
	</div>
);

// items: newest last. The newest arrived card sits in front; older ones are buried behind it.
export const NotifStack: React.FC<{items: Notif[]; x: number; y: number; width?: number; dim?: number}> = ({items, x, y, width = 900, dim = 0}) => {
	const f = useCurrentFrame();
	const arrived = items.filter((n) => f >= n.at);
	return (
		<div style={{position: 'absolute', left: x - width / 2, top: y, width}}>
			{arrived.map((n, i) => {
				// depth = how many newer cards sit in front of this one (animated as newer cards land)
				let depth = 0;
				for (let j = i + 1; j < arrived.length; j++) depth += spring({frame: f - arrived[j].at, fps: FPS, config: {damping: 18, stiffness: 160, mass: 0.8}});
				if (depth > MAX_DEPTH + 0.9) return null;
				const land = spring({frame: f - n.at, fps: FPS, config: {damping: 15, stiffness: 150, mass: 0.8}});
				const drop = (1 - land) * -70; // arrives from above
				const fade = interpolate(f - n.at, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
				const scale = (1 - depth * DEPTH_SCALE) * interpolate(land, [0, 1], [0.96, 1]);
				const opacity = fade * interpolate(depth, [0, 1, MAX_DEPTH, MAX_DEPTH + 0.9], [1, 0.7, 0.35, 0], {extrapolateRight: 'clamp'}) * (1 - dim * 0.15);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							zIndex: 100 - Math.round(depth * 10),
							transformOrigin: '50% 100%',
							transform: `translateY(${drop + depth * PEEK}px) scale(${scale})`,
							opacity,
						}}
					>
						<Card n={n} width={width} />
						{dim > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS, background: '#050506', opacity: dim * 0.75}} /> : null}
					</div>
				);
			})}
		</div>
	);
};

export const BigCard: React.FC<{n: Notif; width: number}> = Card;
