"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
  Presentation01Icon,
  CallEnd01Icon,
  Message01Icon,
  UserGroupIcon,
  WavingHand01Icon,
  Link01Icon,
  Clock01Icon,
  RecordIcon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import ElevenLogo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { meetingsApi, useMeetingByCode } from "@/services/meetings";
import { SidePanel, type PanelTab, type PanelParticipant } from "./side-panel";
import { useWebrtcRoom } from "./use-webrtc";
import { useMeetingRecorder, type Composition } from "./use-recorder";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = `${m}`.padStart(2, "0");
  const ss = `${s}`.padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function ControlButton({
  icon,
  label,
  active = true,
  danger = false,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={`flex size-11 items-center justify-center rounded-full border transition-colors ${
            danger
              ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : active
                ? "bg-card hover:bg-muted"
                : "border-transparent bg-foreground text-background hover:bg-foreground/85"
          }`}
        >
          <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

type Tile = {
  key: string;
  stream: MediaStream | null;
  name: string;
  muted: boolean;
  camOff: boolean;
  handRaised: boolean;
  mirrored: boolean;
  isSelf: boolean;
};

function VideoTile({
  tile,
  fit = "cover",
  onClick,
  className = "",
}: {
  tile: Tile;
  fit?: "cover" | "contain";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border bg-card ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {tile.stream && (
        <video
          autoPlay
          playsInline
          muted={tile.isSelf}
          ref={(el) => {
            if (el && el.srcObject !== tile.stream) {
              el.srcObject = tile.stream;
              el.play().catch(() => {});
            }
          }}
          className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${
            tile.mirrored ? "-scale-x-100" : ""
          } ${tile.camOff ? "invisible" : ""}`}
        />
      )}
      {(!tile.stream || tile.camOff) && (
        <span className="absolute flex size-16 items-center justify-center rounded-full border bg-muted font-serif text-xl">
          {initials(tile.name)}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-6 text-white">
        <span className="truncate text-xs font-medium drop-shadow">
          {tile.name}
          {tile.isSelf && tile.key === "self" && " (you)"}
        </span>
        <span className="flex items-center gap-1.5">
          {tile.handRaised && <HugeiconsIcon icon={WavingHand01Icon} className="size-4 drop-shadow" strokeWidth={2} />}
          {tile.muted && <HugeiconsIcon icon={MicOff01Icon} className="size-4 drop-shadow" strokeWidth={2} />}
        </span>
      </div>
    </div>
  );
}

/** Meet-style auto layout: picks the column count that maximizes tile size. */
function AutoGrid({ tiles, onTileClick }: { tiles: Tile[]; onTileClick: (key: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const GAP = 12;
  const ASPECT = 16 / 9;
  let best = { w: 0, h: 0 };
  for (let cols = 1; cols <= tiles.length; cols++) {
    const rows = Math.ceil(tiles.length / cols);
    const maxW = (size.w - GAP * (cols - 1)) / cols;
    const maxH = (size.h - GAP * (rows - 1)) / rows;
    const w = Math.min(maxW, maxH * ASPECT);
    if (w > best.w) best = { w, h: w / ASPECT };
  }

  return (
    <div ref={ref} className="flex min-h-0 flex-1 flex-wrap content-center items-center justify-center gap-3">
      {size.w > 0 &&
        tiles.map((t) => (
          <div key={t.key} style={{ width: Math.floor(best.w), height: Math.floor(best.h) }}>
            <VideoTile tile={t} onClick={() => onTileClick(t.key)} />
          </div>
        ))}
    </div>
  );
}

export function MeetingRoom({ roomId }: { roomId: string }) {
  const { data: session } = authClient.useSession();
  const selfName = session?.user?.name || "You";
  const { data: meeting, error: meetingError } = useMeetingByCode(roomId);

  const [phase, setPhase] = useState<"lobby" | "call" | "left">("lobby");
  const [displayName, setDisplayName] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pinned, setPinned] = useState<string | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);

  const name = displayName.trim() || selfName;
  const title = meeting?.title ?? roomId;

  const {
    connected,
    failed,
    peers,
    messages,
    sendChat,
    sendState,
    replaceVideoTrack,
    addExtraAudioTrack,
    removeExtraAudioTrack,
  } = useWebrtcRoom({
    roomId,
    displayName: name,
    localStream: stream,
    enabled: phase === "call",
  });

  /* ---------- recording ---------- */
  const compositionRef = useRef<Composition>({ tiles: [], screen: null });
  const getComposition = useCallback(() => compositionRef.current, []);
  const recorder = useMeetingRecorder(getComposition);

  const uploadRecording = useCallback(
    async (result: { blob: Blob; durationSec: number } | null) => {
      if (!result) return;
      try {
        await meetingsApi.uploadRecording(roomId, result.blob, result.durationSec);
        toast.success("Recording saved to meeting history.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Recording upload failed");
      }
    },
    [roomId],
  );

  const toggleRecording = async () => {
    if (recorder.recording) {
      await uploadRecording(await recorder.stop());
    } else {
      try {
        await recorder.start();
        toast.info("Recording started — the full layout and audio are captured.");
      } catch {
        toast.error("Recording could not start in this browser.");
      }
    }
  };

  /* ---------- media ---------- */
  const acquireMedia = useCallback(async () => {
    try {
      // maximum quality: 1080p30 camera, processed audio
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      s.getVideoTracks().forEach((t) => (t.contentHint = "motion"));
      streamRef.current = s;
      setStream(s);
      setMediaError(false);
    } catch {
      setMediaError(true);
    }
  }, []);

  useEffect(() => {
    acquireMedia();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [acquireMedia]);

  useEffect(() => {
    if (phase !== "call") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const toggleTrack = (kind: "audio" | "video", on: boolean) => {
    streamRef.current?.getTracks().forEach((t) => {
      if (t.kind === kind) t.enabled = on;
    });
  };

  const toggleMic = () => {
    setMicOn((v) => {
      toggleTrack("audio", !v);
      sendState({ mic: !v });
      return !v;
    });
  };

  const toggleCam = () => {
    setCamOn((v) => {
      toggleTrack("video", !v);
      sendState({ cam: !v });
      return !v;
    });
  };

  const toggleHand = () => {
    setHandRaised((v) => {
      sendState({ hand: !v });
      return !v;
    });
  };

  const stopShare = useCallback(() => {
    const audio = screenRef.current?.getAudioTracks()[0];
    if (audio) removeExtraAudioTrack(audio);
    screenRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current = null;
    setScreenStream(null);
    void replaceVideoTrack(null); // back to the camera
  }, [replaceVideoTrack, removeExtraAudioTrack]);

  const toggleShare = async () => {
    if (screenStream) {
      stopShare();
      return;
    }
    try {
      // maximum quality: native resolution, 30fps, tab/system audio when offered
      const s = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });
      const track = s.getVideoTracks()[0];
      track.contentHint = "detail"; // keep text sharp over smooth motion
      track.onended = stopShare;
      screenRef.current = s;
      setScreenStream(s);
      await replaceVideoTrack(track);
      const audio = s.getAudioTracks()[0];
      if (audio) addExtraAudioTrack(audio, s);
    } catch {
      // user dismissed the picker — nothing to do
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Meeting link copied.");
  };

  const leave = async () => {
    if (recorder.recording) await uploadRecording(await recorder.stop());
    stopShare();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    setPhase("left");
  };

  const rejoin = async () => {
    setElapsed(0);
    setMicOn(true);
    setCamOn(true);
    setHandRaised(false);
    setPinned(null);
    await acquireMedia();
    setPhase("lobby");
  };

  const blockedMessage =
    failed ?? (meetingError?.message.includes("not invited") ? meetingError.message : null);

  /* ---------------- blocked ---------------- */
  if (blockedMessage) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{roomId}</p>
        <h1 className="mt-5 font-serif text-4xl tracking-tight md:text-5xl">
          This one is <em>invite only.</em>
        </h1>
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">{blockedMessage}</p>
        <Button asChild variant="outline" className="mt-8 rounded-full px-6">
          <Link href="/meet">Back to Meet</Link>
        </Button>
      </div>
    );
  }

  /* ---------------- lobby ---------------- */
  if (phase === "lobby") {
    const invitees = meeting?.participants ?? [];
    return (
      <div className="flex min-h-svh flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/meet" className="flex items-center gap-2.5">
            <ElevenLogo className="size-7" />
            <span className="text-[15px] font-medium tracking-tight">
              Eleven <span className="text-muted-foreground">Meet</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={Link01Icon} className="size-3.5" strokeWidth={2} />
            {roomId}
          </button>
        </header>

        <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-card shadow-lg">
            {stream && camOn ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && el.srcObject !== stream) el.srcObject = stream;
                }}
                className="h-full w-full -scale-x-100 object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="flex size-20 items-center justify-center rounded-full border bg-muted font-serif text-2xl">
                  {initials(name)}
                </span>
              </div>
            )}
            {mediaError && (
              <p className="absolute inset-x-0 top-0 bg-destructive/90 px-4 py-2 text-center text-xs text-destructive-foreground">
                Camera and microphone are blocked. You can still join and enable them from your browser settings.
              </p>
            )}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
              <ControlButton
                icon={micOn ? Mic01Icon : MicOff01Icon}
                label={micOn ? "Turn off microphone" : "Turn on microphone"}
                active={micOn}
                onClick={() => {
                  setMicOn((v) => {
                    toggleTrack("audio", !v);
                    return !v;
                  });
                }}
              />
              <ControlButton
                icon={camOn ? Video01Icon : VideoOffIcon}
                label={camOn ? "Turn off camera" : "Turn on camera"}
                active={camOn}
                onClick={() => {
                  setCamOn((v) => {
                    toggleTrack("video", !v);
                    return !v;
                  });
                }}
              />
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Ready to join?
            </p>
            <h1 className="mt-4 font-serif text-3xl tracking-tight md:text-4xl">{title}</h1>
            {meeting ? (
              meeting.isPublic ? (
                <p className="mt-3 text-sm text-muted-foreground">Open to everyone on your team.</p>
              ) : (
                <div className="mt-4 flex -space-x-1.5">
                  {invitees.map((p) => (
                    <span
                      key={p.id}
                      title={p.member.user.name}
                      className="flex size-7 items-center justify-center rounded-full border bg-muted font-serif text-[11px]"
                    >
                      {initials(p.member.user.name)}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Ad-hoc room — anyone on your team with the code can join.
              </p>
            )}

            <div className="mt-8 max-w-xs space-y-3">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={selfName}
                aria-label="Your name"
                className="h-10 rounded-full"
              />
              <div className="flex items-center gap-3">
                <Button size="lg" className="flex-1 rounded-full" onClick={() => setPhase("call")}>
                  Join now
                </Button>
                <Button asChild variant="ghost" size="lg" className="rounded-full">
                  <Link href="/meet">Back</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- left ---------------- */
  if (phase === "left") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{roomId}</p>
        <h1 className="mt-5 font-serif text-4xl tracking-tight md:text-5xl">
          You left the <em>meeting.</em>
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">{formatElapsed(elapsed)} well spent.</p>
        <div className="mt-8 flex items-center gap-3">
          <Button className="rounded-full px-6" onClick={rejoin}>
            Rejoin
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/meet">Back to Meet</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- call ---------------- */
  const selfTile: Tile = {
    key: "self",
    stream,
    name,
    muted: !micOn,
    camOff: !camOn,
    handRaised,
    mirrored: true,
    isSelf: true,
  };
  const peerTiles: Tile[] = peers.map((p) => ({
    key: p.id,
    stream: p.stream,
    name: p.name,
    muted: !p.mic,
    camOff: !p.cam,
    handRaised: p.hand,
    mirrored: false,
    isSelf: false,
  }));
  const tiles = [selfTile, ...peerTiles];

  const screenTile: Tile | null = screenStream
    ? {
        key: "screen",
        stream: screenStream,
        name: `${name} is presenting`,
        muted: !micOn,
        camOff: false,
        handRaised: false,
        mirrored: false,
        isSelf: true,
      }
    : null;

  const featured = screenTile ?? (pinned ? (tiles.find((t) => t.key === pinned) ?? null) : null);
  const stripTiles = featured ? tiles.filter((t) => t.key !== featured.key) : [];

  // keep the recorder's view of the call in sync with what's on screen
  compositionRef.current = {
    tiles: tiles.map((t) => ({ stream: t.stream, label: t.name, camOff: t.camOff })),
    screen: screenTile ? { stream: screenTile.stream, label: screenTile.name } : null,
  };

  const roster: PanelParticipant[] = [
    { id: "self", name, muted: !micOn, hand: handRaised, isSelf: true },
    ...peers.map((p) => ({ id: p.id, name: p.name, muted: !p.mic, hand: p.hand })),
  ];

  const togglePin = (key: string) => setPinned((prev) => (prev === key ? null : key));

  return (
    // the call stage is always dark, whatever the app theme
    <div className="dark flex h-svh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={Link01Icon} className="size-3.5" strokeWidth={2} />
            {roomId}
          </button>
          <span className="truncate text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          {recorder.recording && (
            <span className="flex items-center gap-1.5 text-destructive">
              <span className="size-2 animate-pulse rounded-full bg-destructive" />
              REC
            </span>
          )}
          {!connected && <span className="text-destructive">reconnecting…</span>}
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2} />
            {formatElapsed(elapsed)}
          </span>
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" strokeWidth={2} />
            {tiles.length}
          </span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {featured ? (
            <>
              <div className="min-h-0 flex-1">
                <VideoTile
                  tile={featured}
                  fit={featured.key === "screen" ? "contain" : "cover"}
                  onClick={featured.key === "screen" ? undefined : () => togglePin(featured.key)}
                />
              </div>
              <div className="flex h-28 shrink-0 justify-center gap-3 overflow-x-auto">
                {(featured.key === "screen" ? tiles : stripTiles).map((t) => (
                  <div key={t.key} className="aspect-video h-full shrink-0">
                    <VideoTile tile={t} onClick={() => togglePin(t.key)} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <AutoGrid tiles={tiles} onTileClick={togglePin} />
          )}
          {peers.length === 0 && (
            <p className="pb-1 text-center font-mono text-xs text-muted-foreground">
              Waiting for others — share the code <span className="text-foreground">{roomId}</span>
            </p>
          )}
        </div>

        {panel && (
          <SidePanel
            tab={panel}
            participants={roster}
            messages={messages}
            onSend={sendChat}
            onClose={() => setPanel(null)}
          />
        )}
      </main>

      <footer className="flex h-20 shrink-0 items-center justify-center gap-3 border-t px-4">
        <ControlButton
          icon={micOn ? Mic01Icon : MicOff01Icon}
          label={micOn ? "Turn off microphone" : "Turn on microphone"}
          active={micOn}
          onClick={toggleMic}
        />
        <ControlButton
          icon={camOn ? Video01Icon : VideoOffIcon}
          label={camOn ? "Turn off camera" : "Turn on camera"}
          active={camOn}
          onClick={toggleCam}
        />
        <ControlButton
          icon={Presentation01Icon}
          label={screenStream ? "Stop presenting" : "Present your screen"}
          active={!screenStream}
          onClick={toggleShare}
        />
        <ControlButton
          icon={RecordIcon}
          label={recorder.recording ? "Stop recording" : "Record the meeting"}
          active={!recorder.recording}
          danger={recorder.recording}
          onClick={toggleRecording}
        />
        <ControlButton
          icon={WavingHand01Icon}
          label={handRaised ? "Lower hand" : "Raise hand"}
          active={!handRaised}
          onClick={toggleHand}
        />
        <ControlButton
          icon={Message01Icon}
          label="In-call messages"
          active={panel !== "chat"}
          onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))}
        />
        <ControlButton
          icon={UserGroupIcon}
          label="People"
          active={panel !== "people"}
          onClick={() => setPanel((p) => (p === "people" ? null : "people"))}
        />
        <div className="mx-2 h-8 w-px bg-border" aria-hidden />
        <ControlButton icon={CallEnd01Icon} label="Leave call" danger onClick={leave} />
      </footer>
    </div>
  );
}
