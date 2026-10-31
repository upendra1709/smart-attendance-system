"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Clock, Loader2, ScanFace, ShieldCheck, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

type FaceStatus = {
  student_id: number;
  enrolled: boolean;
  samples: number;
  request_status: "pending" | "approved" | "rejected" | null;
  request_note: string | null;
  request_submitted_at: string | null;
};

const SAMPLES = 3;

/**
 * Student self-enrollment. The face embedding is sent to the backend as a *request*;
 * it only counts for attendance after a teacher or admin approves it.
 */
export default function StudentFaceEnrollment({ studentId }: { studentId: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<FaceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setStatus(await api<FaceStatus>(`/face/status/${studentId}`));
    } catch (e: any) {
      setError(e.message || "Could not load your face enrollment status");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }
  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access needs a compatible browser and HTTPS or localhost.");
      return;
    }
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
      setCameraOn(true);
    } catch {
      setError("Camera permission was denied or no camera is available.");
    }
  }

  function capture(): Promise<Blob> {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.reject(new Error("Start the camera and wait for the preview first."));
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not capture a camera frame."))), "image/jpeg", 0.9)
    );
  }

  async function submit() {
    if (!consent) { setError("Please tick the consent box before submitting."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("consent", "true");
      for (let i = 0; i < SAMPLES; i += 1) {
        form.append("files", await capture(), `enrollment-${i + 1}.jpg`);
        if (i < SAMPLES - 1) await new Promise((resolve) => setTimeout(resolve, 450));
      }
      const response = await api<{ message: string }>("/face/self-enroll", { method: "POST", body: form });
      setNotice(response.message);
      setConsent(false);
      stopCamera();
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e.message || "Face enrollment failed. Keep one face centred in good lighting.");
    } finally {
      setBusy(false);
    }
  }

  const state = status?.request_status;
  const pending = state === "pending";

  const header = (() => {
    if (loading) return { icon: <Loader2 size={20} className="animate-spin" />, tone: "text-zinc-400 bg-zinc-500/10", title: "Face attendance", text: "Checking your enrollment…" };
    if (pending) return { icon: <Clock size={20} />, tone: "text-amber-500 bg-amber-500/10", title: "Waiting for approval", text: `Submitted ${status?.request_submitted_at ? fmtDateTime(status.request_submitted_at) : "recently"}. A teacher or admin will review it. You can resubmit to replace it.` };
    if (status?.enrolled) return { icon: <ShieldCheck size={20} />, tone: "text-emerald-500 bg-emerald-500/10", title: "Face enrolled", text: `Approved with ${status.samples} sample(s). Camera attendance can recognise you.` };
    if (state === "rejected") return { icon: <XCircle size={20} />, tone: "text-red-400 bg-red-500/10", title: "Enrollment rejected", text: status?.request_note ? `Reason: ${status.request_note}. Please submit again in good lighting.` : "Please submit again in good lighting, facing the camera." };
    return { icon: <ScanFace size={20} />, tone: "text-violet-400 bg-violet-500/10", title: "Enroll your face", text: "Register your face so your teacher's camera can mark you present. A teacher or admin approves it before it is used." };
  })();

  return (
    <section className="glass-card rounded-3xl p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${header.tone}`}>{header.icon}</div>
        <div className="flex-1 min-w-[220px]">
          <h3 className="font-display font-bold">{header.title}</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{header.text}</p>
        </div>
        {!loading && !open && (
          <button
            onClick={() => { setOpen(true); setNotice(""); }}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 flex items-center gap-2"
          >
            <Camera size={14} />
            {status?.enrolled || state ? "Update my face" : "Enroll my face"}
          </button>
        )}
      </div>

      {notice && (
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={14} /> {notice}
        </p>
      )}

      {error && !open && (
        <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400">{error}</p>
      )}

      {open && (
        <div className="grid md:grid-cols-[1fr_280px] gap-5">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-[#0f1115] border border-border flex items-center justify-center">
            <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 w-full h-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`} />
            <div className="relative z-10 w-40 h-52 max-w-[50%] border-2 border-emerald-500/60 rounded-3xl pointer-events-none" />
            {!cameraOn && (
              <div className="absolute z-20 text-center px-6">
                <ScanFace size={46} className="mx-auto text-emerald-500/40" />
                <p className="mt-3 text-sm font-bold text-zinc-300">Camera is off</p>
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 z-30 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-emerald-400" size={30} />
                <p className="text-sm font-bold">Capturing {SAMPLES} samples…</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <ul className="text-xs text-zinc-500 space-y-1.5 leading-relaxed list-disc pl-4">
              <li>Only your face, centred, in good light.</li>
              <li>No hat, mask or sunglasses.</li>
              <li>Hold still. {SAMPLES} quick photos are taken.</li>
            </ul>
            <label className="flex items-start gap-3 rounded-2xl border border-border p-4 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="accent-emerald-500 w-4 h-4 mt-0.5" />
              <span className="text-xs text-zinc-400 leading-relaxed">
                I consent to storing a numerical face embedding for attendance. My photos are not stored.
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400 leading-relaxed">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={cameraOn ? stopCamera : startCamera} disabled={busy} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                {cameraOn ? <CameraOff size={14} /> : <Camera size={14} />}
                {cameraOn ? "Stop camera" : "Start camera"}
              </button>
              <button onClick={submit} disabled={!cameraOn || busy || !consent} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ScanFace size={14} />}
                Submit for approval
              </button>
              <button onClick={() => { stopCamera(); setOpen(false); setError(""); }} disabled={busy} className="rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
