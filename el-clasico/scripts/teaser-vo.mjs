// English trailer voiceover for the El Clásico teaser, generated with Gemini TTS (Google AI Studio).
// One API call per line, so each line lands exactly on its beat (no slicing).
// Usage (from el-clasico/):  GEMINI_API_KEY=... node scripts/teaser-vo.mjs
// Optional: VOICE=Algenib|Fenrir|Charon|Orus   TTS_MODEL=<model id>
// Writes public/teaser/vo/NN.wav and src/teaserVo.json (start time, length, playback rate per line).
import fs from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Set GEMINI_API_KEY (Google AI Studio → Get API key).'); process.exit(1); }
const VOICE = process.env.VOICE ?? 'Algenib';
const MODELS = process.env.TTS_MODEL ? [process.env.TTS_MODEL] : ['gemini-2.5-pro-preview-tts', 'gemini-2.5-pro-tts', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-tts'];
const STYLE = 'Say this like an epic Hollywood movie-trailer narrator: deep, gravelly, huge energy, intense and dramatic. No intro, just the line:';

// at = second the line starts in the teaser; max = seconds before the next beat (longer takes are sped up, up to 1.25x)
// Beats: hook 0–1.5 · each city clock locks at 2.23/3.48/4.73/5.98/7.23/8.48 · "SAME SECOND" grid 9.0 · freeze/silence 9.7–10.67 ·
// crests collide 10.67 · date 13.0–17.0 · title 17.0
const LINES = [
	{at: 0.05, max: 1.95, text: 'The world... will stop.'},
	{at: 2.0, max: 1.15, text: 'New York.'},
	{at: 3.25, max: 1.15, text: 'Rio.'},
	{at: 4.5, max: 1.15, text: 'London.'},
	{at: 5.75, max: 1.15, text: 'Riyadh.'},
	{at: 7.0, max: 1.15, text: 'Dubai.'},
	{at: 8.25, max: 0.8, text: 'Tokyo.'},
	{at: 9.05, max: 0.62, text: 'Same second.'},
	{at: 10.95, max: 1.9, text: 'One match.'},
	{at: 13.7, max: 3.1, text: 'Sunday. October twenty-fifth.'},
	{at: 17.15, max: 2.2, text: 'El Clásico.'},
];

const OUT = 'public/teaser/vo';
fs.mkdirSync(OUT, {recursive: true});

const wav = (pcm, sr = 24000) => {
	const b = Buffer.alloc(44);
	b.write('RIFF', 0); b.writeUInt32LE(36 + pcm.length, 4); b.write('WAVE', 8); b.write('fmt ', 12);
	b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28);
	b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(pcm.length, 40);
	return Buffer.concat([b, pcm]);
};

// trim leading/trailing near-silence so `at` is where the voice actually starts
const trim = (pcm) => {
	const n = pcm.length / 2, th = 600;
	let a = 0, z = n - 1;
	while (a < n && Math.abs(pcm.readInt16LE(a * 2)) < th) a++;
	while (z > a && Math.abs(pcm.readInt16LE(z * 2)) < th) z--;
	a = Math.max(0, a - 480); z = Math.min(n - 1, z + 2400); // 20 ms pre-roll, 100 ms tail
	return pcm.subarray(a * 2, (z + 1) * 2);
};

let model = null;
const tts = async (text) => {
	for (const m of model ? [model] : MODELS) {
		const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'x-goog-api-key': KEY},
			body: JSON.stringify({
				contents: [{parts: [{text: `${STYLE} ${text}`}]}],
				generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: VOICE}}}},
			}),
		});
		if (r.status === 404 || r.status === 400) { if (!model) { console.warn(`model ${m}: ${r.status}, trying next`); continue; } }
		if (!r.ok) throw new Error(`${m} ${r.status}: ${await r.text()}`);
		const j = await r.json();
		const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
		if (!part) throw new Error(`no audio in response: ${JSON.stringify(j).slice(0, 400)}`);
		model = m;
		return Buffer.from(part.inlineData.data, 'base64');
	}
	throw new Error('No TTS model worked. Check the model list in AI Studio and pass TTS_MODEL=<id>.');
};

const meta = [];
for (const [i, l] of LINES.entries()) {
	const pcm = trim(await tts(l.text));
	const dur = pcm.length / 2 / 24000;
	const rate = Math.min(1.25, Math.max(1, dur / l.max));
	const file = `${String(i + 1).padStart(2, '0')}.wav`;
	fs.writeFileSync(`${OUT}/${file}`, wav(pcm));
	meta.push({file: `teaser/vo/${file}`, at: l.at, len: +(dur / rate).toFixed(3), rate: +rate.toFixed(3), text: l.text});
	console.log(`${file}  ${dur.toFixed(2)}s${rate > 1 ? ` → x${rate.toFixed(2)}` : ''}  "${l.text}"${dur / rate > l.max + 0.05 ? '  ⚠ still long, may overlap next line' : ''}`);
}
fs.writeFileSync('src/teaserVo.json', JSON.stringify({voice: VOICE, model, lines: meta}, null, '\t') + '\n');
console.log(`\n${model} · voice ${VOICE} · wrote src/teaserVo.json`);
