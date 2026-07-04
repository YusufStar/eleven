"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Client-side meeting recorder: composites every tile (and the screen share)
 * onto a 1920×1080 canvas, mixes all audio through an AudioContext, and feeds
 * both into a MediaRecorder. Draws with setInterval so recording survives the
 * tab losing focus (rAF would throttle).
 */

export type RecorderTile = { stream: MediaStream | null; label: string; camOff?: boolean };
export type Composition = { tiles: RecorderTile[]; screen: RecorderTile | null };

const W = 1920;
const H = 1080;
const FPS = 30;
const GAP = 16;
const ASPECT = 16 / 9;
const INK = "#0a0a0a";
const TILE_BG = "#171717";

function bestGrid(n: number, w: number, h: number) {
  let best = { w: 0, h: 0, cols: 1 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const maxW = (w - GAP * (cols - 1)) / cols;
    const maxH = (h - GAP * (rows - 1)) / rows;
    const tw = Math.min(maxW, maxH * ASPECT);
    if (tw > best.w) best = { w: tw, h: tw / ASPECT, cols };
  }
  return best;
}

export function useMeetingRecorder(getComposition: () => Composition) {
  const [recording, setRecording] = useState(false);
  const startedAtRef = useRef<number>(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const videoElsRef = useRef(new Map<MediaStream, HTMLVideoElement>());
  const audioSourcesRef = useRef(new Map<MediaStream, MediaStreamAudioSourceNode>());

  const videoFor = (stream: MediaStream) => {
    let v = videoElsRef.current.get(stream);
    if (!v) {
      v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.srcObject = stream;
      v.play().catch(() => {});
      videoElsRef.current.set(stream, v);
    }
    return v;
  };

  const syncAudio = (streams: MediaStream[]) => {
    const ctx = audioCtxRef.current;
    const dest = destRef.current;
    if (!ctx || !dest) return;
    for (const s of streams) {
      if (s.getAudioTracks().length === 0 || audioSourcesRef.current.has(s)) continue;
      try {
        const src = ctx.createMediaStreamSource(s);
        src.connect(dest);
        audioSourcesRef.current.set(s, src);
      } catch {
        // stream may already be ended
      }
    }
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, h: number) => {
    ctx.font = "500 20px -apple-system, 'Segoe UI', sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x + 12, y + h - 44, tw + 24, 32);
    ctx.fillStyle = "#fafafa";
    ctx.fillText(label, x + 24, y + h - 22);
  };

  const drawTile = (
    ctx: CanvasRenderingContext2D,
    tile: RecorderTile,
    x: number,
    y: number,
    w: number,
    h: number,
    fit: "cover" | "contain",
  ) => {
    ctx.fillStyle = TILE_BG;
    ctx.fillRect(x, y, w, h);
    const v = tile.stream && !tile.camOff ? videoFor(tile.stream) : null;
    if (v && v.videoWidth && v.videoHeight) {
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (fit === "cover") {
        const scale = Math.max(w / vw, h / vh);
        const sw = w / scale;
        const sh = h / scale;
        ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, x, y, w, h);
      } else {
        const scale = Math.min(w / vw, h / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        ctx.drawImage(v, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      }
    } else {
      // camera off — initials medallion
      const initials = tile.label
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      ctx.fillStyle = "#27272a";
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fafafa";
      ctx.font = `400 ${Math.round(Math.min(w, h) / 8)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials, x + w / 2, y + h / 2);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    }
    drawLabel(ctx, tile.label, x, y, h);
  };

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const audioCtx = new AudioContext();
    await audioCtx.resume();
    audioCtxRef.current = audioCtx;
    destRef.current = audioCtx.createMediaStreamDestination();

    const draw = () => {
      const { tiles, screen } = getComposition();
      // audio joins the mix even when the camera is off
      const streams = [...tiles, screen].filter((t): t is RecorderTile => !!t?.stream).map((t) => t.stream!);
      syncAudio(streams);

      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);

      if (screen?.stream) {
        const stripH = 180;
        drawTile(ctx, screen, GAP, GAP, W - GAP * 2, H - stripH - GAP * 3, "contain");
        const stripY = H - stripH - GAP;
        const tileW = Math.min(stripH * ASPECT, (W - GAP * (tiles.length + 1)) / Math.max(tiles.length, 1));
        const totalW = tileW * tiles.length + GAP * (tiles.length - 1);
        let x = (W - totalW) / 2;
        for (const t of tiles) {
          drawTile(ctx, t, x, stripY, tileW, stripH, "cover");
          x += tileW + GAP;
        }
      } else if (tiles.length > 0) {
        const grid = bestGrid(tiles.length, W - GAP * 2, H - GAP * 2);
        const rows = Math.ceil(tiles.length / grid.cols);
        let i = 0;
        for (let r = 0; r < rows; r++) {
          const inRow = Math.min(grid.cols, tiles.length - i);
          const rowW = inRow * grid.w + (inRow - 1) * GAP;
          const y = (H - (rows * grid.h + (rows - 1) * GAP)) / 2 + r * (grid.h + GAP);
          let x = (W - rowW) / 2;
          for (let c = 0; c < inRow; c++) {
            drawTile(ctx, tiles[i++], x, y, grid.w, grid.h, "cover");
            x += grid.w + GAP;
          }
        }
      }
    };
    intervalRef.current = setInterval(draw, 1000 / FPS);

    const stream = canvas.captureStream(FPS);
    destRef.current.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

    const mimeType =
      ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
        MediaRecorder.isTypeSupported(m),
      ) ?? "video/webm";
    const rec = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6_000_000,
      audioBitsPerSecond: 128_000,
    });
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.start(1000);
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    setRecording(true);
  }, [getComposition]);

  /** Stops and resolves the finished recording (null if nothing was captured). */
  const stop = useCallback((): Promise<{ blob: Blob; durationSec: number } | null> => {
    const rec = recorderRef.current;
    if (!rec) return Promise.resolve(null);
    return new Promise((resolve) => {
      rec.onstop = () => {
        const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType.split(";")[0] });
        chunksRef.current = [];
        resolve(blob.size > 0 ? { blob, durationSec } : null);
      };
      rec.stop();
      recorderRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      audioSourcesRef.current.clear();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      destRef.current = null;
      videoElsRef.current.forEach((v) => {
        v.srcObject = null;
      });
      videoElsRef.current.clear();
      setRecording(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { recording, start, stop };
}
