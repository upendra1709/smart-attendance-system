"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, HelpCircle, Loader2, ScanFace, Square, X } from "lucide-react";
import { api } from "@/lib/api";

type RecognitionResult = {
  matched: boolean;
  detected?: boolean;
  student_id?: number;
  name?: string;
  confidence?: number;
  message: string;
  status?: string | null;
  method?: string | null;
  needs_confirmation?: boolean;
  already_marked?: boolean;
};

type ScanMode = "auto" | "manual";

/** How often the automatic scanner sends a frame, and how long it ignores a face it just handled. */
const AUTO_INTERVAL_MS = 1500;
const COOLDOWN_MS = 8000;

export default function SessionFaceScanner({
  sessionId,
  closed,
  onMarked,
  onManual,
}: {
  sessionId: number;
  closed: boolean;
  onMarked: () => Promise<void>;
  onManual: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const onMarkedRef = useRef(onMarked);
  useEffect(() => { onMarkedRef.current = onMarked; }, [onMarked]);
  // studentId -> time until which the auto scanner will not react to that face again
  const cooldownRef = useRef<Map<number, number>>(new Map());

  const [mode, setMode] = useState<ScanMode>("auto");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [pending, setPending] = useState<RecognitionResult | null>(null); // low-confidence match awaiting teacher
  const [confirming, setConfirming] = useState(false);
  const [recent, setRecent] = useState<{ name: string; confidence?: number; confirmed?: boolean }[]>([]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => { if (closed) stopCamera(); }, [closed, stopCamera]);

  async function startCamera() {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setError("Camera access failed. Allow camera permission and use localhost or HTTPS.");
    }
  }

  async function grabFrame(): Promise<Blob | null> {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  }

  /** One recognition round trip. `auto` scans run quietly: no face in view is not an error. */
  const scanOnce = useCallback(
    async (auto: boolean) => {
      if (busyRef.current) return;
      const blob = await grabFrame();
      if (!blob) {
        if (!auto) setError("Start the camera and wait for the video feed before scanning.");
        return;
      }
      busyRef.current = true;
      setScanning(true);
      if (!auto) { setError(""); setResult(null); }
      try {
        const form = new FormData();
        form.append("session_id", String(sessionId));
        form.append("mark_attendance", "true");
        form.append("quiet", auto ? "true" : "false");
        form.append("file", blob, "camera.jpg");
        const response = await api<RecognitionResult>("/face/recognize", { method: "POST", body: form });

        if (auto) {
          if (response.detected === false) return; // nobody in front of the camera
          if (response.student_id) {
            const until = cooldownRef.current.get(response.student_id) ?? 0;
            if (Date.now() < until) return; // already handled this face a moment ago
          }
        }
        setError("");

        if (response.matched && response.needs_confirmation) {
          setPending(response); // pauses the automatic loop until the teacher decides
          setResult(null);
          return;
        }
        if (response.matched && response.student_id) {
          cooldownRef.current.set(response.student_id, Date.now() + COOLDOWN_MS);
          if (!response.already_marked) {
            setRecent((list) => [{ name: response.name || "Student", confidence: response.confidence }, ...list].slice(0, 5));
            await onMarkedRef.current();
          }
        }
        // In auto mode only surface real matches; unmatched faces show a soft hint
        setResult(response);
      } catch (e: any) {
        if (!auto) setError(e.message || "Face recognition failed. Center one face and try again.");
        else setError(e.message || "Automatic scanning hit a problem and will keep trying.");
      } finally {
        busyRef.current = false;
        setScanning(false);
      }
    },
    [sessionId]
  );

  // Automatic scanning loop. Pauses while the teacher is answering a confirmation prompt.
  useEffect(() => {
    if (mode !== "auto" || !cameraActive || closed || pending) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (cancelled) return;
      if (!document.hidden) await scanOnce(true);
      if (!cancelled) timer = setTimeout(tick, AUTO_INTERVAL_MS);
    };
    timer = setTimeout(tick, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mode, cameraActive, closed, pending, scanOnce]);

  async function confirmPending() {
    if (!pending?.student_id) return;
    setConfirming(true);
    setError("");
    try {
      const response = await api<RecognitionResult>("/face/confirm", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, student_id: pending.student_id, confidence: pending.confidence }),
      });
      cooldownRef.current.set(pending.student_id, Date.now() + COOLDOWN_MS);
      setRecent((list) => [{ name: pending.name || "Student", confidence: pending.confidence, confirmed: true }, ...list].slice(0, 5));
      setResult(response);
      setPending(null);
      await onMarkedRef.current();
    } catch (e: any) {
      setError(e.message || "Could not confirm this match.");
    } finally {
      setConfirming(false);
    }
  }

  function dismissPending() {
    if (pending?.student_id) cooldownRef.current.set(pending.student_id, Date.now() + COOLDOWN_MS);
    setPending(null);
  }

  function changeMode(next: ScanMode) {
    setMode(next);
    setResult(null);
    setError("");
  }

  const confidenceText = (value?: number) => (value !== undefined ? `${(value * 100).toFixed(1)}%` : "");

  return (
    <div className="rounded-[2rem] bg-[#0f1115] border border-border p-1.5 sticky top-4">
      <div className="relative aspect-[4/3] rounded-[1.6rem] overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`}
        />
        {!cameraActive && (
          <div className="text-center px-8">
            <ScanFace size={64} className="mx-auto text-violet-500/50" />
            <p className="mt-4 text-sm font-bold text-zinc-300">
              {closed ? "This session is closed" : "OpenCV face attendance"}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {closed
                ? "Camera marking is disabled."
                : mode === "auto"
                  ? "Start the camera. Students are marked automatically as they appear."
                  : "Start the camera, then scan one enrolled face at a time."}
            </p>
          </div>
        )}
        {cameraActive && (
          <div
            className={`absolute inset-8 pointer-events-none border-2 rounded-3xl transition-colors ${
              scanning ? "border-violet-400/80" : "border-violet-500/40"
            }`}
          />
        )}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-200 backdrop-blur-md">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? (mode === "auto" ? "bg-emerald-400 animate-pulse" : "bg-emerald-400") : "bg-zinc-500"}`} />
          {cameraActive ? (mode === "auto" ? "Auto scanning" : "Camera active") : "Camera off"}
        </div>
        <button
          onClick={onManual}
          className="absolute top-4 right-4 rounded-xl bg-black/60 border border-white/10 px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-black/80 backdrop-blur-md"
          title="Mark students by hand from the class roster"
        >
          Roster Mode
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="p-4 space-y-3">
        {/* Automatic / Manual toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
          {(["auto", "manual"] as const).map((value) => (
            <button
              key={value}
              onClick={() => changeMode(value)}
              className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                mode === value ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {value === "auto" ? "Automatic Scanning" : "Manual Scanning"}
            </button>
          ))}
        </div>

        {error && <p className="text-xs font-semibold text-red-400">{error}</p>}

        {/* Low-confidence match: teacher decides */}
        {pending && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300">Is this {pending.name}?</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Low-confidence match ({confidenceText(pending.confidence)} similarity). Confirm only if you can see it is them.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmPending}
                disabled={confirming}
                className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {confirming ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Yes, mark present
              </button>
              <button
                onClick={dismissPending}
                disabled={confirming}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X size={13} /> Not them
              </button>
            </div>
          </div>
        )}

        {result && !pending && (
          <div
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
              result.matched
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            }`}
          >
            {result.matched && <CheckCircle2 size={14} className="inline mr-1.5" />}
            {result.message}
            {result.confidence !== undefined && ` Similarity: ${confidenceText(result.confidence)}.`}
          </div>
        )}

        {!closed && (
          <div className="flex gap-2">
            {!cameraActive ? (
              <button onClick={startCamera} className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-xs font-bold text-white hover:bg-violet-600 flex items-center justify-center gap-2">
                <Camera size={15} /> Start Camera
              </button>
            ) : (
              <>
                {mode === "manual" ? (
                  <button
                    onClick={() => scanOnce(false)}
                    disabled={scanning || !!pending}
                    className="flex-1 rounded-xl bg-violet-500 px-4 py-3 text-xs font-bold text-white hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanFace size={15} />}
                    {scanning ? "Recognizing…" : "Scan & Mark Present"}
                  </button>
                ) : (
                  <div className="flex-1 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-xs font-bold text-violet-300 flex items-center justify-center gap-2">
                    {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanFace size={15} />}
                    {pending ? "Waiting for your confirmation…" : "Scanning continuously…"}
                  </div>
                )}
                <button onClick={stopCamera} className="rounded-xl bg-white/5 border border-white/10 px-3 text-zinc-300" title="Stop camera">
                  <Square size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {recent.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Marked this scan session</p>
            {recent.map((item, index) => (
              <p key={`${item.name}-${index}`} className="text-xs text-zinc-300 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                <span className="text-zinc-500">
                  {item.confirmed ? "confirmed" : confidenceText(item.confidence)}
                </span>
              </p>
            ))}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-zinc-500">
          Clear matches are marked automatically. Weaker matches ask you to confirm first. Only approved, face-enrolled students in this class are matched. Raw photos are discarded after processing. No liveness or anti-spoofing protection is claimed.
        </p>
      </div>
    </div>
  );
}
