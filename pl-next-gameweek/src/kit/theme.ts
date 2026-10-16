import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, spring, staticFile} from 'remotion';

export const FPS = 60;

// Fonts are bundled in public/fonts (Google Fonts, OFL) so renders never depend on the network
const face = (family: string, file: string, weight: string) => loadFont({family, url: staticFile(`fonts/${file}`), weight});
face('Cairo', 'Cairo-400.ttf', '400');
face('Cairo', 'Cairo-700.ttf', '700');
face('Cairo', 'Cairo-900.ttf', '900');
face('Anton', 'Anton-400.ttf', '400');
face('Inter', 'Inter-500.ttf', '500');
face('Inter', 'Inter-700.ttf', '700');
face('Inter', 'Inter-800.ttf', '800');

export const arabic = 'Cairo';
export const inter = 'Inter';
export const display = 'Anton';

// Palette — matchday night: black stage, white hairlines, one accent (Premier League green)
export const C = {
	bg: '#050506',
	ink: '#FFFFFF',
	muted: '#8E8E93',
	hair: 'rgba(255,255,255,0.55)',
	accent: '#00FF85',
	card: '#121214',
	border: 'rgba(255,255,255,0.12)',
	pitch: '#2E7D32',
};

// Easing presets
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1); // entrances: fast start, very soft landing
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1); // calm camera moves, exits
export const WHIP = Easing.bezier(0.83, 0, 0.17, 1); // energetic camera moves between boards

export const tween = (f: number, start: number, dur: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
	interpolate(f, [start, start + dur], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

// spring helpers
export const smooth = (f: number, delay = 0, dur = 24) => spring({frame: f - delay, fps: FPS, config: {damping: 200}, durationInFrames: dur});
export const pop = (f: number, delay = 0, damping = 14) => spring({frame: f - delay, fps: FPS, config: {damping, stiffness: 130, mass: 0.7}});

// seconds -> frame
export const T = (s: number) => Math.round(s * FPS);
