#!/usr/bin/env bash
# Render the El Clásico teaser and write the Instagram-ready copy (-14 LUFS, true peak under -1 dB).
# Run from el-clasico/:  bash scripts/render-teaser.sh
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=../instagram-ready/02-clasico-teaser.mp4
RAW=../instagram-ready/_raw/02.mp4
mkdir -p ../instagram-ready/_raw
npx remotion render Teaser "$RAW" --codec=h264 --crf=16 --audio-bitrate=320k
npx remotion ffmpeg -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -ar 48000 -c:a aac -b:a 256k -movflags +faststart "$OUT"
echo "wrote $OUT"
