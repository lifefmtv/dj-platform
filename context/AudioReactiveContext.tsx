"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// fftSize 256 → frequencyBinCount 128
const FFT_SIZE = 256;
export const FREQ_BIN_COUNT = FFT_SIZE / 2; // 128

export type AudioSource = "stream" | "mic";

interface AudioReactiveState {
  bassLevel: number;
  midLevel: number;
  energy: number;
  isActive: boolean;
  activeSource: AudioSource;
  sourceError: string;
  getFrequencyData: (out: Uint8Array<ArrayBuffer>) => void;
  startVisualiser: (source?: AudioSource) => Promise<"granted" | "denied">;
  stopVisualiser: () => void;
}

const AudioReactiveContext = createContext<AudioReactiveState>({
  bassLevel: 0,
  midLevel: 0,
  energy: 0,
  isActive: false,
  activeSource: "stream",
  sourceError: "",
  getFrequencyData: () => {},
  startVisualiser: async () => "denied",
  stopVisualiser: () => {},
});

export function useAudioReactive() {
  return useContext(AudioReactiveContext);
}

export function AudioReactiveProvider({ children }: { children: React.ReactNode }) {
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel,  setMidLevel]  = useState(0);
  const [energy,    setEnergy]    = useState(0);
  const [isActive,  setIsActive]  = useState(false);
  const [activeSource, setActiveSource] = useState<AudioSource>("stream");
  const [sourceError,  setSourceError]  = useState("");

  // Audio graph — persists for the provider lifetime; never closed mid-session
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const sourceNodeRef   = useRef<AudioNode | null>(null);
  const mediaStreamRef  = useRef<MediaStream | null>(null);

  // Stream-source helpers — created once, reused across enable/disable cycles
  const streamAudioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaElSrcRef    = useRef<MediaElementAudioSourceNode | null>(null);

  const rafRef  = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer>>(
    new Uint8Array(FREQ_BIN_COUNT) as Uint8Array<ArrayBuffer>,
  );

  const getFrequencyData = useCallback((out: Uint8Array<ArrayBuffer>) => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(out);
    } else {
      out.fill(0);
    }
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data     = dataRef.current;
    if (!analyser) return;

    analyser.getByteFrequencyData(data);

    const n       = data.length;
    const bassEnd = Math.max(1, Math.floor(n * 0.15));
    const midEnd  = Math.floor(n * 0.6);

    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++)         bassSum += data[i];
    let midSum  = 0;
    for (let i = bassEnd; i < midEnd; i++)    midSum  += data[i];
    let total   = 0;
    for (let i = 0; i < n; i++)              total   += data[i];

    setBassLevel(bassSum / bassEnd);
    setMidLevel(midSum  / (midEnd - bassEnd));
    setEnergy(total / n / 255);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Helpers ────────────────────────────────────────────────

  function tearDownSource() {
    cancelAnimationFrame(rafRef.current);
    try { sourceNodeRef.current?.disconnect(); } catch { /* already disconnected */ }
    sourceNodeRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    // Pause our hidden stream element so it stops consuming bandwidth
    if (streamAudioElRef.current && !streamAudioElRef.current.paused) {
      streamAudioElRef.current.pause();
    }
  }

  async function getOrCreateCtx(): Promise<[AudioContext, AnalyserNode]> {
    if (audioCtxRef.current && analyserRef.current) {
      await audioCtxRef.current.resume();
      return [audioCtxRef.current, analyserRef.current];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    const ctx      = new AudioCtx() as AudioContext;
    await ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize              = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82;
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current     = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    return [ctx, analyser];
  }

  // ── Stream source ──────────────────────────────────────────
  // Connects to the audio/video element already on the page (the live stream player).
  // Falls through to mic silently on CORS or any other error.

  async function connectStream(audioCtx: AudioContext, analyser: AnalyserNode): Promise<void> {
    if (!streamAudioElRef.current) {
      const el =
        document.querySelector<HTMLAudioElement>("audio") ??
        document.querySelector<HTMLVideoElement>("video") as unknown as HTMLAudioElement | null;
      if (!el) throw new Error("no-page-audio");
      streamAudioElRef.current = el;
    }

    const el = streamAudioElRef.current;

    // Create MediaElementAudioSourceNode once per element (Web Audio requires this)
    if (!mediaElSrcRef.current) {
      mediaElSrcRef.current = audioCtx.createMediaElementSource(el);
      // Keep the element audible — connect to destination as well as analyser
      mediaElSrcRef.current.connect(audioCtx.destination);
    }

    mediaElSrcRef.current.connect(analyser);
    sourceNodeRef.current = mediaElSrcRef.current;
  }

  // ── Mic source ─────────────────────────────────────────────

  async function connectMic(audioCtx: AudioContext, analyser: AnalyserNode): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
    mediaStreamRef.current = stream;
    const node = audioCtx.createMediaStreamSource(stream);
    node.connect(analyser);
    sourceNodeRef.current = node;
  }

  // ── Public API ─────────────────────────────────────────────

  const startVisualiser = useCallback(async (
    source: AudioSource = "mic",
  ): Promise<"granted" | "denied"> => {
    tearDownSource();

    const trySource = async (s: AudioSource): Promise<"granted" | "denied"> => {
      try {
        const [audioCtx, analyser] = await getOrCreateCtx();
        if (s === "stream") await connectStream(audioCtx, analyser);
        else                await connectMic(audioCtx, analyser);

        setActiveSource(s);
        setSourceError("");
        setIsActive(true);
        rafRef.current = requestAnimationFrame(tick);
        return "granted";
      } catch (e) {
        const err = e as Error;

        // ── Mic errors ──
        if (s === "mic") {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setSourceError("Microphone access denied");
          } else {
            setSourceError("Microphone connection failed");
          }
          return "denied";
        }

        // ── Stream errors — fall back to mic silently ──
        // CORS, no page audio element, or any other stream failure

        // Silent mic fallback
        try {
          const [audioCtx, analyser] = await getOrCreateCtx();
          await connectMic(audioCtx, analyser);
          setActiveSource("mic");
          setIsActive(true);
          rafRef.current = requestAnimationFrame(tick);
          return "granted";
        } catch {
          setSourceError("Microphone access denied");
          return "denied";
        }
      }
    };

    return trySource(source);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const stopVisualiser = useCallback(() => {
    tearDownSource();
    setIsActive(false);
    setBassLevel(0);
    setMidLevel(0);
    setEnergy(0);
    setSourceError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close AudioContext on unmount only
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      streamAudioElRef.current?.pause();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const value = useMemo<AudioReactiveState>(
    () => ({
      bassLevel, midLevel, energy,
      isActive, activeSource, sourceError,
      getFrequencyData, startVisualiser, stopVisualiser,
    }),
    [bassLevel, midLevel, energy, isActive, activeSource, sourceError,
     getFrequencyData, startVisualiser, stopVisualiser],
  );

  return (
    <AudioReactiveContext.Provider value={value}>
      {children}
    </AudioReactiveContext.Provider>
  );
}
