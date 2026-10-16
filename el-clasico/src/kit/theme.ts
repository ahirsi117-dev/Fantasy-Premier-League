import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, spring, staticFile} from 'remotion';

export const FPS = 60;

// bundled fonts (Google Fonts, OFL) so renders never depend on the network
const face = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
face('Anton', 'Anton-400.ttf', '400');
face('Inter', 'Inter-500.ttf', '500');
face('Inter', 'Inter-700.ttf', '700');
face('Inter', 'Inter-800.ttf', '800');
face('PlexMono', 'PlexMono-400.ttf', '400');
face('PlexMono', 'PlexMono-600.ttf', '600');
face('Cairo', 'Cairo-700.ttf', '700');
face('Orbitron', 'Orbitron-700.ttf', '700');
face('Orbitron', 'Orbitron-900.ttf', '900');
face('Michroma', 'Michroma-400.ttf', '400');

export const display = 'Anton';
export const mono = 'PlexMono';
export const inter = 'Inter';
export const arabic = 'Cairo';
export const orbitron = 'Orbitron';
export const michroma = 'Michroma';

export const C = {
	bg: '#030304',
	ink: '#F4F2EE',
	muted: '#8B8B90',
	hair: 'rgba(244,242,238,0.5)',
	red: '#E5402F', // HUD accent (reference: red tags / numbers)
	fcbBlue: '#004D98',
	fcbGarnet: '#A50044',
	fcbGold: '#EDBB00',
	rmaGold: '#D4AF37',
	rmaWhite: '#F7F5F0',
	rmaGreen: '#0E3B33',
	accent: '#E5402F',
	card: '#111113',
};

// legacy names used by kit.tsx
export const arabicFont = arabic;

export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const WHIP = Easing.bezier(0.83, 0, 0.17, 1);

export const tween = (f: number, start: number, dur: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
	interpolate(f, [start, start + dur], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

export const smooth = (f: number, delay = 0, dur = 24) => spring({frame: f - delay, fps: FPS, config: {damping: 200}, durationInFrames: dur});
export const pop = (f: number, delay = 0, damping = 14) => spring({frame: f - delay, fps: FPS, config: {damping, stiffness: 130, mass: 0.7}});

export const T = (s: number) => Math.round(s * FPS);

// deterministic pseudo-random in [0,1)
export const rand = (a: number, b = 0) => {
	const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
