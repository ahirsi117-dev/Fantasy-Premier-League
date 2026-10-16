// clock sounds for the teaser: a dry mechanical tick and a heavier "lock" click
import fs from 'node:fs';
const SR = 48000;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const wav = (name, a) => {
	const b = Buffer.alloc(44 + a.length * 2);
	b.write('RIFF', 0); b.writeUInt32LE(36 + a.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
	b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28);
	b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(a.length * 2, 40);
	let pk = 0; for (const v of a) pk = Math.max(pk, Math.abs(v));
	a.forEach((v, i) => b.writeInt16LE(Math.round((v / pk) * 0.9 * 32767), 44 + i * 2));
	fs.writeFileSync(`public/teaser/${name}`, b); console.log('wrote', name);
};
const make = (sec, fn) => Float32Array.from({length: Math.round(sec * SR)}, (_, i) => fn(i / SR));
wav('tick.wav', make(0.08, (t) => (rnd() * 0.6 + Math.sin(2 * Math.PI * 2800 * t) * 0.5) * Math.exp(-t * 90)));
wav('lock.wav', make(0.25, (t) => (rnd() * 0.5 + Math.sin(2 * Math.PI * 900 * t) * 0.6 + Math.sin(2 * Math.PI * 160 * t) * 0.8) * Math.exp(-t * 28)));
