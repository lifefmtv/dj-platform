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

interface AudioReactiveState {
  bassLevel: number;           // 0–255 average of low-frequency bins
  midLevel: number;            // 0–255 average of mid-frequency bins
  energy: number;              // 0–1 overall signal energy
  isActive: boolean;
  /** Fill `out` with current frequency byte data — call from rAF loops only */
  getFrequencyData: (out: Uint8Array<ArrayBuffer>) => void;
  startVisualiser: () => Promise<"granted" | "denied">;
  stopVisualiser: () => void;
}

const AudioReactiveContext = createContext<AudioReactiveState>({
  bassLevel: 0,
  midLevel: 0,
  energy: 0,
  isActive: false,
  getFrequencyData: () => {},
  startVisualiser: async () => "denied",
  stopVisualiser: () => {},
});

export function useAudioReactive() {
  return useContext(AudioReactiveContext);
}

export function AudioReactiveProvider({ children }: { children: React.ReactNode }) {
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const rafRef       = useRef<number>(0);
  const dataRef      = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(FREQ_BIN_COUNT) as Uint8Array<ArrayBuffer>);

  // Stable ref so canvas components can read raw frequency data directly
  // without subscribing to React state updates
  const getFrequencyData = useCallback((out: Uint8Array<ArrayBuffer>) => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(out);
    } else {
      out.fill(0);
    }
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser) return;

    analyser.getByteFrequencyData(data);

    const n = data.length;

    // Bass: first 15 % of bins (≈ 0–500 Hz at 44.1 kHz / fftSize 256)
    const bassEnd = Math.max(1, Math.floor(n * 0.15));
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += data[i];

    // Mid: 15–60 % of bins
    const midEnd = Math.floor(n * 0.6);
    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) midSum += data[i];

    // Overall energy (normalised 0–1)
    let total = 0;
    for (let i = 0; i < n; i++) total += data[i];

    // React 18 batches these three updates into one re-render per frame
    setBassLevel(bassSum / bassEnd);
    setMidLevel(midSum / (midEnd - bassEnd));
    setEnergy(total / n / 255);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startVisualiser = useCallback(async (): Promise<"granted" | "denied"> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      await audioCtx.resume();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      // Source → analyser only — NOT connected to destination (no echo)
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      setIsActive(true);
      rafRef.current = requestAnimationFrame(tick);
      return "granted";
    } catch {
      return "denied";
    }
  }, [tick]);

  const stopVisualiser = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current   = null;
    dataRef.current     = new Uint8Array(FREQ_BIN_COUNT) as Uint8Array<ArrayBuffer>;
    setIsActive(false);
    setBassLevel(0);
    setMidLevel(0);
    setEnergy(0);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const value = useMemo<AudioReactiveState>(
    () => ({ bassLevel, midLevel, energy, isActive, getFrequencyData, startVisualiser, stopVisualiser }),
    [bassLevel, midLevel, energy, isActive, getFrequencyData, startVisualiser, stopVisualiser],
  );

  return (
    <AudioReactiveContext.Provider value={value}>
      {children}
    </AudioReactiveContext.Provider>
  );
}
