// Custom trailer SFX synthesized from math (no licensing): heartbeat, wind, crowd, boom, hit, whoosh, riser.
import fs from 'node:fs';
const SR = 48000;
const out = process.argv[2] ?? 'public/clasico/sfx';
fs.mkdirSync(out, {recursive: true});
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const wav = (name, data) => {
	const n = data.length, b = Buffer.alloc(44 + n * 2);
	b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
	b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28);
	b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
	let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
	for (let i = 0; i < n; i++) b.writeInt16LE(Math.round((data[i] / (peak || 1)) * 0.9 * 32767), 44 + i * 2);
	fs.writeFileSync(`${out}/${name}`, b); console.log('wrote', name);
};
const make = (sec, fn) => { const a = new Float32Array(Math.round(sec * SR)); for (let i = 0; i < a.length; i++) a[i] = fn(i / SR, i); return a; };
// one-pole low-pass helper over a signal
const lp = (arr, a) => { let y = 0; for (let i = 0; i < arr.length; i++) { y += a * (arr[i] - y); arr[i] = y; } return arr; };

// heartbeat: lub-dub, 3 beats slowing
const beat = (t, t0) => { const x = t - t0; if (x < 0 || x > 0.35) return 0; return Math.sin(2 * Math.PI * (48 - x * 60) * x) * Math.exp(-x * 14); };
wav('heartbeat.wav', make(3.6, (t) => [0, 1.2, 2.4].reduce((s, b) => s + beat(t, b) + 0.6 * beat(t, b + 0.26), 0)));
// wind: band-ish noise with slow swell
wav('wind.wav', lp(make(6, (t) => rnd() * (0.4 + 0.6 * Math.sin(Math.PI * t / 6)) * (0.7 + 0.3 * Math.sin(t * 1.7))), 0.03));
// crowd: brighter noise swell + roar
wav('crowd.wav', lp(make(8, (t) => rnd() * Math.min(1, t / 3) * (1 - Math.max(0, t - 6.5) / 1.5) * (0.8 + 0.2 * Math.sin(t * 9))), 0.18));
// boom: sub drop with noise transient
wav('boom.wav', make(2.5, (t) => Math.sin(2 * Math.PI * (70 * Math.exp(-t * 1.6) + 28) * t) * Math.exp(-t * 1.8) + rnd() * Math.exp(-t * 30) * 0.5));
// hit: short punchy impact
wav('hit.wav', make(0.9, (t) => Math.sin(2 * Math.PI * (110 * Math.exp(-t * 8) + 45) * t) * Math.exp(-t * 6) + rnd() * Math.exp(-t * 45) * 0.6));
// whoosh: filtered noise sweep
{ let y = 0; wav('whoosh.wav', make(0.8, (t) => { const a = 0.02 + 0.25 * Math.sin(Math.PI * t / 0.8); y += a * (rnd() - y); return y * Math.sin(Math.PI * t / 0.8); })); }
// riser: noise + rising tone into a cut (2 s)
wav('riser.wav', make(2, (t) => (rnd() * 0.5 + Math.sin(2 * Math.PI * (120 + 500 * t * t) * t) * 0.5) * (t / 2) ** 2));
